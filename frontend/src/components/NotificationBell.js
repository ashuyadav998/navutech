import React, { useState, useEffect, useRef } from 'react';
import { FaBell } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/NotificationBell.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const NotificationBell = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) return;

      setLoading(true);

      const response = await axios.get(`${API_URL}/notifications/my-notifications`, { // ✅ Fix: ruta correcta
        headers: { Authorization: `Bearer ${token}` }
      });

      const notifs = Array.isArray(response.data) ? response.data : []; // ✅ Fix: el backend devuelve array directo
      setNotifications(notifs.slice(0, 5));
      setUnreadCount(notifs.filter(n => !n.read).length);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('⚠️ Token inválido o expirado');
      } else {
        console.error('Error al cargar notificaciones:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.put(
        `${API_URL}/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(prev =>
        prev.map(n => (n._id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error al marcar como leída:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) markAsRead(notification._id);
    setShowDropdown(false);
    if (notification.link) {
      navigate(notification.link);
    } else if (notification.type === 'order') {
      navigate('/notifications?tab=orders');
    }
  };

  const handleViewAll = () => {
    setShowDropdown(false);
    navigate('/notifications');
  };

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button
        className="bell-button"
        onClick={() => setShowDropdown(!showDropdown)}
        aria-label="Notificaciones"
      >
        <FaBell />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="dropdown-header">
            <h3>Notificaciones</h3>
            {unreadCount > 0 && (
              <span className="unread-count">{unreadCount} sin leer</span>
            )}
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="notification-loading">Cargando...</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <FaBell size={32} opacity={0.3} />
                <p>No tienes notificaciones</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif._id}
                  className={`notification-item ${notif.read ? 'read' : 'unread'}`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="notif-content">
                    <strong>{notif.title}</strong>
                    <p>{notif.message}</p>
                    <small>
                      {new Date(notif.createdAt).toLocaleString('es-ES', {
                        month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </small>
                  </div>
                  {!notif.read && <div className="unread-dot"></div>}
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="dropdown-footer">
              <button onClick={handleViewAll} className="view-all-btn">
                Ver todas las notificaciones
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
