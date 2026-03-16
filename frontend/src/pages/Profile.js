import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSignOutAlt, FaUser, FaTrashAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import ProfileTab from '../components/profile/ProfileTab';
import axios from 'axios';
import '../styles/Profile.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Profile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, login, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated()) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate, loading]);

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      '¿Estás completamente seguro? Esta acción eliminará todos tus datos permanentemente y no se puede deshacer.'
    );
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) { alert('No se encontró sesión activa'); return; }

      await axios.delete(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      logout();
    } catch (err) {
      console.error('Error al eliminar cuenta:', err);
      alert('Error al eliminar la cuenta. Inténtalo de nuevo.');
    }
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" />
      <p>Cargando tu cuenta...</p>
    </div>
  );

  if (!user) return null;

  return (
    <div className="profile-page-luxury">
      <div className="profile-bg-accent" />
      <div className="container profile-container">

        <div className="profile-card-main">

          {/* ── Header ── */}
          <div className="profile-card-header">
            <div className="user-avatar-wrapper">
              {/* ✅ FaUser en lugar de FaUserCircle (que no existe en fa) */}
              <FaUser className="user-avatar-icon" />
            </div>
            <div className="user-welcome-text">
              <h1>Hola, {user.name?.split(' ')[0]}</h1>
              <p>{user.email}</p>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="profile-card-body">
            <div className="section-title">
              <h3>Información Personal</h3>
              <div className="title-underline" />
            </div>
            <ProfileTab user={user} login={login} />
          </div>

          {/* ── Footer ── */}
          <div className="profile-card-footer">
            <button className="btn-logout-luxury" onClick={logout}>
              <FaSignOutAlt /> <span>Cerrar sesión</span>
            </button>

            <div className="danger-zone-separator">
              <span>Zona de Peligro</span>
            </div>

            <button className="btn-delete-account" onClick={handleDeleteAccount}>
              <FaTrashAlt /> <span>Eliminar mi cuenta permanentemente</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;