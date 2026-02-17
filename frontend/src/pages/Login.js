import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user } = useAuth(); // ✅ Añadir user
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Si ya está autenticado, redirigir
  useEffect(() => {
    if (isAuthenticated()) {
      console.log('✅ Ya autenticado, redirigiendo...'); // ✅ DEBUG
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('🔵 [LOGIN COMPONENT] Iniciando login...'); // ✅ DEBUG

    try {
      // ✅ USAR LA FUNCIÓN LOGIN DEL AUTHCONTEXT
      const result = await login(formData.email, formData.password);
      
      console.log('🔵 [LOGIN COMPONENT] Resultado:', result); // ✅ DEBUG

      if (result.success) {
        console.log('✅ [LOGIN COMPONENT] Login exitoso'); // ✅ DEBUG
        
        // Esperar un momento para que el estado se actualice
        setTimeout(() => {
          // Redirigir según el rol
          if (result.user?.role === 'admin') {
            console.log('🔵 [LOGIN COMPONENT] Redirigiendo a /admin'); // ✅ DEBUG
            navigate('/admin', { replace: true });
          } else {
            const from = location.state?.from?.pathname || '/';
            console.log('🔵 [LOGIN COMPONENT] Redirigiendo a:', from); // ✅ DEBUG
            navigate(from, { replace: true });
          }
        }, 100);
      } else {
        setError(result.message || 'Error al iniciar sesión');
      }
    } catch (err) {
      console.error('❌ [LOGIN COMPONENT] Error:', err); // ✅ DEBUG
      setError('Error inesperado al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-card">
          <h1>Iniciar Sesión</h1>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <p className="auth-link">
            ¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link>
          </p>
          <div className="forgot-password-link">
       <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
  </div>
          
        </div>
      </div>
    </div>
  );
};

export default Login;