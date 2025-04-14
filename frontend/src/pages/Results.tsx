import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import "./Results.css";

console.log("Results page mounted");

function Results() {
  const location = useLocation();
  const artistName = location.state?.artist;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArtistData = async () => {
      try {
        console.log("Fetching data for artist:", artistName);
        const res = await axios.post("http://localhost:3001/api/search", {
          artistName,
        });
        
        if (!res.data || !res.data.artist) {
          throw new Error("Invalid response format");
        }
        
        setData(res.data);
      } catch (err: any) {
        console.error("Error details:", {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        });
        setError(err.response?.data?.error || err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (artistName) {
      fetchArtistData();
    } else {
      setError("No artist name provided");
      setLoading(false);
    }
  }, [artistName]);

  if (loading) return <p className="loading">Loading...</p>;
  if (error) return <p className="error">Error: {error}</p>;
  if (!data) return <p className="no-data">No data found.</p>;

  // Format monthly listeners
  const formatFollowers = (followers: number) => {
    if (followers >= 1000000) {
      return `${(followers / 1000000).toFixed(1)}M`;
    }
    if (followers >= 1000) {
      return `${(followers / 1000).toFixed(1)}K`;
    }
    return followers.toString();
  };

  return (
    <div className="results-container">
      <div className="artist-header">
        {data.artist.images && data.artist.images[0] && (
          <img 
            src={data.artist.images[0].url} 
            alt={data.artist.name}
            className="artist-image"
          />
        )}
        <div className="artist-info">
          <h2 className="artist-name">{data.artist.name}</h2>
          <p className="followers">
            {formatFollowers(data.artist.followers.total)} Followers
          </p>
        </div>
      </div>
      
      <section className="top-tracks-section">
        <h3 className="section-title">Top Songs</h3>
        {data.topTracks && data.topTracks.length > 0 ? (
          <ul className="track-list">
            {data.topTracks.map((track: any, index: number) => (
              <li key={track.id} className="track-item">
                <div className="track-info">
                  <span className="track-number">{index + 1}</span>
                  <span className="track-name">{track.name}</span>
                </div>
                <span className="track-artists">
                  {track.artists.map((a: any) => a.name).join(", ")}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-data">No top tracks available</p>
        )}
      </section>
    </div>
  );
}

export default Results;
