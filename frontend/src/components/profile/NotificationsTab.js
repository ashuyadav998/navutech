import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaBell, FaRegEnvelope, FaRegEnvelopeOpen } from 'react-icons/fa';
import '../../styles/Profile.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const NotificationsTab = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) { setError('No estás autenticado.'); setLoading(false); return; }
        const res = await axios.get(`${API_URL}/notifications/my-notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        if (err.response?.status === 401) setError('Tu sesión ha expirado.');
        else if (err.response?.status === 404) setNotifications([]);
        else setError('Error al cargar notificaciones.');
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await axios.put(`${API_URL}/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) { console.error('Error al marcar como leída:', err); }
  };

  if (loading) return (
    <div className="tab-page">
      <div className="container">
        <div className="tab-loading">Buscando mensajes...</div>
      </div>
    </div>
  );

  if (error) return (
    <div className="tab-page">
      <div className="container">
        <div className="empty-state">
          <FaBell size={40} />
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      </div>
    </div>
  );

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="tab-page">
      <div className="container">

        {/* ── Header ── */}
        <div className="tab-page-header">
          <h1>Notificaciones</h1>
          {unread > 0 && (
            <span className="tab-count tab-count-orange">{unread} sin leer</span>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="empty-state">
            <FaBell size={40} />
            <h3>Sin notificaciones</h3>
            <p>No tienes mensajes nuevos por ahora.</p>
          </div>
        ) : (
          <div className="notif-list">
            {notifications.map(n => (
              <div
                key={n._id}
                className={`notif-card ${n.read ? 'read' : 'unread'}`}
                onClick={() => !n.read && markAsRead(n._id)}
                style={{ cursor: !n.read ? 'pointer' : 'default' }}
              >
                <div className="notif-icon">
                  {n.read ? <FaRegEnvelopeOpen /> : <FaRegEnvelope />}
                </div>
                <div className="notif-info">
                  <h4>{n.title}</h4>
                  <p>{n.message}</p>
                  <small>
                    {new Date(n.createdAt).toLocaleString('es-ES', {
                      year: 'numeric', month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </small>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default NotificationsTab;