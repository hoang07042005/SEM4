import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/tour/TourDetailDashboard.css';

export default function TourDetailDashboard() {
  const { tourId } = useParams();
  const navigate = useNavigate();
  const [tour, setTour] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTour = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = token
          ? { headers: { Authorization: `Bearer ${token}` } }
          : {};

        const res = await axios.get(`http://localhost:8080/api/tours/${tourId}`, config);
        if (!res.data) throw new Error('Tour not found');
        setTour(res.data);
      } catch (err) {
        if (err.response?.status === 401) {
          setError('Please login to view tour details');
          navigate('/login');
        } else {
          setError(err.response?.data?.message || 'Failed to load tour details.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (tourId) fetchTour();
    else {
      setError('Invalid tour ID');
      setLoading(false);
    }
  }, [tourId, navigate]);

  if (loading) return <div className="loading">Loading tour details...</div>;
  if (error) return <div className="error-box">{error}</div>;
  if (!tour) return <div className="error-box">Tour not found</div>;

  return (
    <div className="tour-detail-client">
      <div className="tour-detail-top">
        {tour.imageUrl && (
          <img
            src={`http://localhost:8080${tour.imageUrl}`}
            alt={tour.name}
            className="tour-detail-banner"
          />
        )}

        <div className="tour-detail-info">
          <h2>{tour.name}</h2>
          <div className="info-row">
            <label>Price:</label>
            <span>${tour.price}</span>
          </div>
          <div className="info-row">
            <label>Duration:</label>
            <span>{tour.duration} days</span>
          </div>
          <div className="info-row">
            <label>Max Participants:</label>
            <span>{tour.maxParticipants}</span>
          </div>
        </div>
      </div>

      <div className="tour-detail-body">
        <div className="info-row description">
          <label>Description:</label>
          <p>{tour.description || 'No description provided.'}</p>
        </div>

        <div className="info-row">
          <label>Destinations:</label>
          <span>{tour.destinations.map(dest => dest.name).join(', ')}</span>
        </div>

        <div className="info-row">
          <label>Events:</label>
          <span>
            {tour.events.map(ev =>
              `${ev.name} (${new Date(ev.startDate).toLocaleDateString()})`
            ).join(', ')}
          </span>
        </div>

        <button
          className="btn book-btn"
          onClick={() => navigate(`/booking/${tour.tourId}`)}
        >
          🧳 Book This Tour
        </button>
      </div>
    </div>
  );
}
