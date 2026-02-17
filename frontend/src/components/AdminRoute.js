import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem',
        color: '#666'
      }}>
        Verificando acceso...
      </div>
    );
  }

  // Si no está autenticado, redirigir a login
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // Si no es admin, redirigir a home
  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Si es admin, renderizar el componente hijo o el Outlet
  return children ? children : <Outlet />;
};

export default AdminRoute;