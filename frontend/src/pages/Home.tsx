import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

function Home() {
  const [artist, setArtist] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (artist.trim()) {
      navigate("/results", { state: { artist } });
    } else {
      alert("Please enter an artist name.");
    }
  };

  return (
    <div className="home-container">
      <h1 className="home-title">Spotify Artist Explorer</h1>
      <form onSubmit={handleSubmit} className="search-form">
        <input
          className="search-input"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          placeholder="Enter your favorite artist's name..."
        />
        <button className="search-button" type="submit">
          Search
        </button>
      </form>
    </div>
  );
}

export default Home;
