import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import mongoose from "mongoose";
import SearchHistory from "./models/SearchHistory.js";

dotenv.config();
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// MongoDB connection options
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  retryWrites: true,
  w: "majority"
};

mongoose.connect(process.env.MONGODB_URI, mongoOptions)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => {
    console.error('MongoDB connection error details:', {
      name: err.name,
      message: err.message,
      code: err.code,
      codeName: err.codeName,
      errorResponse: err.errorResponse
    });
    
    if (err.message.includes('bad auth')) {
      console.log('Authentication failed. Please check:');
      console.log('1. Your IP address is whitelisted in MongoDB Atlas');
      console.log('2. Username and password are correct');
      console.log('3. Database user has correct permissions');
    }
  });

let accessToken = "";

const getAccessToken = async () => {
  const authOptions = {
    method: "post",
    url: "https://accounts.spotify.com/api/token",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(
          process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET
        ).toString("base64"),
    },
    data: "grant_type=client_credentials",
  };

  try {
    const res = await axios(authOptions);
    accessToken = res.data.access_token;
    console.log("Access token retrieved:", accessToken); // Log the access token
  } catch (err) {
    console.error("Error getting Spotify access token:", err.message);
  }
};

await getAccessToken();
setInterval(getAccessToken, 1000 * 60 * 60);

app.post("/api/search", async (req, res) => {
  const { artistName } = req.body;
  console.log("Received search request for artist:", artistName);
  console.log("Current access token:", accessToken ? "Token exists" : "No token");

  try {
    // Search for artist
    const searchRes = await axios.get(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(
        artistName
      )}&type=artist&limit=1`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    console.log("Search result status:", searchRes.status);

    const artist = searchRes.data.artists.items[0];
    if (!artist) {
      console.error("Artist not found in search results");
      return res.status(404).json({ message: "Artist not found" });
    }

    console.log("Found artist ID:", artist.id);

    // Store search in history
    try {
      await SearchHistory.create({
        artistName: artist.name,
        artistId: artist.id
      });
      console.log("Search history stored");
    } catch (err) {
      console.error("Error storing search history:", err);
    }

    // Initialize response object
    const responseData = {
      artist,
      topTracks: []
    };

    // Get top tracks
    try {
      const topTracksRes = await axios.get(
        `https://api.spotify.com/v1/artists/${artist.id}/top-tracks?market=US`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      console.log("Top tracks response status:", topTracksRes.status);
      responseData.topTracks = topTracksRes.data.tracks.slice(0, 5);
    } catch (err) {
      console.error("Error fetching top tracks:", err.message);
    }

    res.json(responseData);
  } catch (err) {
    console.error("Spotify API error details:");
    console.error("Error message:", err.message);
    if (err.response) {
      console.error("Status code:", err.response.status);
      console.error("Response data:", JSON.stringify(err.response.data, null, 2));
    }
    res.status(500).json({ 
      error: "Spotify API error",
      details: err.response?.data || err.message 
    });
  }
});

// Add endpoint to get search history
app.get("/api/search-history", async (req, res) => {
  try {
    const history = await SearchHistory.find()
      .sort({ searchedAt: -1 })
      .limit(10);
    res.json(history);
  } catch (err) {
    console.error("Error fetching search history:", err);
    res.status(500).json({ error: "Error fetching search history" });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
