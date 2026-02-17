import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaBell, FaRegEnvelope, FaRegEnvelopeOpen } from 'react-icons/fa';
import '../../styles/Profile.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const NotificationsTab = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadNotifs = async () => {
      try {
        const token = sessionStorage.getItem('token');
        if (!token) {
          setError('No estás autenticado. Por favor, inicia sesión.');
          setLoading(false);
          return;
        }

        const res = await axios.get(`${API_URL}/notifications/my-notifications`, { // ✅ Fix: ruta correcta
          headers: { Authorization: `Bearer ${token}` }
        });

        const notifs = Array.isArray(res.data) ? res.data : []; // ✅ Fix: array directo
        setNotifications(notifs);
      } catch (err) {
        if (err.response?.status === 401) {
          setError('Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.');
        } else if (err.response?.status === 404) {
          setNotifications([]);
        } else {
          setError('Error al cargar notificaciones. Intenta recargar la página.');
        }
      } finally {
        setLoading(false);
      }
    };
    loadNotifs();
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.put(
        `${API_URL}/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      );
    } catch (err) {
      console.error('Error al marcar como leída:', err);
    }
  };

  if (loading) return <div className="tab-loading">Buscando nuevos mensajes...</div>;

  if (error) return (
    <div className="empty-state">
      <FaBell size={40} />
      <h3>Error</h3>
      <p>{error}</p>
    </div>
  );

  return (
    <div className="notifications-tab">
      <div className="tab-header">
        <h2>Notificaciones</h2>
        {notifications.length > 0 && (
          <span className="notif-count">
            {notifications.filter(n => !n.read).length} sin leer
          </span>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <FaBell size={40} />
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
                <small>{new Date(n.createdAt).toLocaleString('es-ES', {
                  year: 'numeric', month: 'short', day: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsTab;