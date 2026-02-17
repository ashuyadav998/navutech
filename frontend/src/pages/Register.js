import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import '../styles/Auth.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [step, setStep] = useState(1); // 1: formulario, 2: verificación, 3: éxito
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Paso 1: Enviar código
  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API_URL}/auth/register/send-code`, {
        email: formData.email,
        name: formData.name
      });

      setMessage('✅ Código enviado a tu email');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al enviar código');
    } finally {
      setLoading(false);
    }
  };

  // Paso 2: Verificar código y registrar
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/register/verify-code`, {
        email: formData.email,
        code: verificationCode,
        name: formData.name,
        password: formData.password
      });

      // ✅ CAMBIO: Mostrar paso de éxito primero
      setStep(3);
      
      // ✅ Guardar sesión
      login(response.data.user, response.data.token);
      
      // ✅ Redirigir después de 3 segundos
      setTimeout(() => {
        navigate('/');
      }, 3000);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await axios.post(`${API_URL}/auth/register/send-code`, {
        email: formData.email,
        name: formData.name
      });

      setMessage('✅ Nuevo código enviado');
    } catch (err) {
      setError('Error al reenviar código');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-card">
          <h1>Crear Cuenta</h1>

          {step === 1 && (
            /* PASO 1: Formulario de registro */
            <>
              {error && <div className="error-message">{error}</div>}
              {message && <div className="success-message">{message}</div>}

              <form onSubmit={handleSendCode}>
                <div className="form-group">
                  <label htmlFor="name">Nombre completo</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

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
                    minLength="6"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirmar contraseña</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>

                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Enviando...' : 'Continuar'}
                </button>
              </form>
            </>
          )}

          {step === 2 && (
            /* PASO 2: Verificación de código */
            <>
              <div className="verification-step">
                <div className="verification-icon">📧</div>
                <p>Hemos enviado un código de verificación a:</p>
                <strong>{formData.email}</strong>
                <p className="small-text">El código expira en 10 minutos</p>
              </div>

              {error && <div className="error-message">{error}</div>}
              {message && <div className="success-message">{message}</div>}

              <form onSubmit={handleVerifyCode}>
                <div className="form-group">
                  <label htmlFor="code">Código de verificación</label>
                  <input
                    type="text"
                    id="code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Ingresa el código de 6 dígitos"
                    maxLength="6"
                    required
                    className="code-input"
                  />
                </div>

                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Verificando...' : 'Verificar y Registrarse'}
                </button>
              </form>

              <div className="resend-code">
                <p>¿No recibiste el código?</p>
                <button 
                  type="button" 
                  className="link-button" 
                  onClick={handleResendCode}
                  disabled={loading}
                >
                  Reenviar código
                </button>
              </div>

              <button 
                type="button" 
                className="back-button" 
                onClick={() => setStep(1)}
              >
                ← Volver
              </button>
            </>
          )}

          {step === 3 && (
            /* PASO 3: Éxito - ✅ NUEVO */
            <div className="success-container">
              <div className="success-icon">🎉</div>
              <h2>¡Cuenta creada con éxito!</h2>
              <p>Bienvenido/a, <strong>{formData.name}</strong></p>
              <p className="success-message">
                Tu cuenta ha sido verificada correctamente.
              </p>
              <div className="redirect-message">
                <div className="spinner-small"></div>
                <p>Redirigiendo a la tienda en 3 segundos...</p>
              </div>
              <button 
                className="submit-btn"
                onClick={() => navigate('/')}
              >
                Ir a la tienda ahora
              </button>
            </div>
          )}

          {step !== 3 && (
            <p className="auth-link">
              ¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;