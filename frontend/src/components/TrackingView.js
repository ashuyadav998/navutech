import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaTruck, FaBox, FaCheckCircle, FaClock, FaMapMarkerAlt, FaExternalLinkAlt } from 'react-icons/fa';
import '../styles/Tracking.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const TrackingView = ({ orderId }) => {
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTracking = async () => {
      try {
        const token = sessionStorage.getItem('token'); // ✅ Fix: sessionStorage en vez de localStorage
        const res = await axios.get(`${API_URL}/tracking/order/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTracking(res.data);
      } catch (err) {
        setTracking(null);
      } finally {
        setLoading(false);
      }
    };
    if (orderId) fetchTracking();
  }, [orderId]);

  if (loading) return <p className="loading-text">Cargando seguimiento...</p>;
  if (!tracking) return <p className="no-tracking">El pedido se está preparando para el envío.</p>;

  const steps = ['pendiente', 'en_preparacion', 'enviado', 'en_reparto', 'entregado'];
  const currentIdx = steps.indexOf(tracking.currentStatus);

  return (
    <div className="tracking-container">
      <div className="tracking-header">
        <span>Nº Seguimiento: <strong>{tracking.trackingNumber}</strong></span>
        <span className="carrier-tag">{tracking.carrier}</span>
      </div>

      <div className="progress-bar-container">
        {steps.map((step, i) => (
          <div key={step} className={`progress-step ${i <= currentIdx ? 'completed' : ''}`}>
            <div className="step-circle">{i + 1}</div>
            <span className="step-label">{step.replace(/_/g, ' ')}</span>
          </div>
        ))}
      </div>

      <div className="latest-event">
        <h4><FaMapMarkerAlt /> Último estado: {tracking.currentStatus.toUpperCase()}</h4>
        <p>{tracking.events?.[tracking.events.length - 1]?.description || '—'}</p>
        {tracking.estimatedDelivery && (
          <small>Estimado: {new Date(tracking.estimatedDelivery).toLocaleDateString('es-ES')}</small>
        )}
      </div>

      {/* ✅ Usa trackingUrl real si existe, si no fallback a búsqueda */}
      <a
        href={tracking.trackingUrl || `https://www.google.com/search?q=tracking+${tracking.trackingNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-external"
      >
        <FaExternalLinkAlt /> Rastrear en web oficial
      </a>
    </div>
  );
};

export default TrackingView;