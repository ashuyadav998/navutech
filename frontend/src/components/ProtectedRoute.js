import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth();

  // Mostrar loading mientras verifica autenticación
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Verificando acceso...</p>
      </div>
    );
  }

  // Si no está autenticado, redirigir a login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si requiere admin pero el usuario no es admin
  if (requireAdmin && user.role !== 'admin') {
    return (
      <div className="access-denied">
        <h2>⛔ Acceso Denegado</h2>
        <p>No tienes permisos para acceder a esta sección.</p>
        <a href="/">Volver al inicio</a>
      </div>
    );
  }

  // Si todo está bien, mostrar el contenido
  return children;
};

export default ProtectedRoute;