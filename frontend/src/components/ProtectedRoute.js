import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Protectedroute.css';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth();

  // Loading state con animación moderna
  if (loading) {
    return (
      <div className="protected-loading">
        <div className="loading-container">
          <div className="loading-spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
          <h3>Verificando acceso...</h3>
          <p>Un momento por favor</p>
        </div>
      </div>
    );
  }

  // No autenticado
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Acceso denegado para no-admins
  if (requireAdmin && user.role !== 'admin') {
    return (
      <div className="access-denied-page">
        <div className="access-denied-content">
          <div className="denied-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          
          <h1>Acceso Denegado</h1>
          <p className="denied-message">
            No tienes los permisos necesarios para acceder a esta sección.
          </p>
          
          <div className="denied-details">
            <div className="detail-item">
              <span className="detail-label">Usuario:</span>
              <span className="detail-value">{user.name}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Rol:</span>
              <span className="detail-value">{user.role}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Requiere:</span>
              <span className="detail-value">Administrador</span>
            </div>
          </div>

          <div className="denied-actions">
            <button 
              className="btn-primary"
              onClick={() => window.location.href = '/'}
            >
              🏠 Volver al Inicio
            </button>
            <button 
              className="btn-secondary"
              onClick={() => window.history.back()}
            >
              ← Ir Atrás
            </button>
          </div>

          <p className="contact-admin">
            ¿Crees que deberías tener acceso? <a href="mailto:soporte@simshop.com">Contacta con soporte</a>
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;