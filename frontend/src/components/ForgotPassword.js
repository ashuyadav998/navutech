import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { sendPasswordResetCode, resetPassword } = useAuth();
  
  // Estados
  const [step, setStep] = useState(1); // 1 = solicitar código, 2 = resetear contraseña
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ✅ PASO 1: Solicitar código
  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!email.trim()) {
      setError('Por favor ingresa tu email');
      return;
    }

    setLoading(true);

    try {
      await sendPasswordResetCode(email);
      setSuccess('Código enviado a tu email. Revisa tu bandeja de entrada.');
      
      // ✅ PASAR AUTOMÁTICAMENTE AL PASO 2 después de 2 segundos
      setTimeout(() => {
        setStep(2);
        setSuccess('');
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Error al enviar código');
    } finally {
      setLoading(false);
    }
  };

  // ✅ PASO 2: Resetear contraseña
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validaciones
    if (!code.trim()) {
      setError('Por favor ingresa el código de verificación');
      return;
    }

    if (!newPassword) {
      setError('Por favor ingresa una nueva contraseña');
      return;
    }

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      await resetPassword(email, code, newPassword);
      setSuccess('¡Contraseña actualizada correctamente!');
      
      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Error al resetear contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>🔒 Recuperar Contraseña</h2>
          <p>
            {step === 1 
              ? 'Ingresa tu email para recibir un código de verificación' 
              : 'Ingresa el código que recibiste y tu nueva contraseña'}
          </p>
        </div>

        {/* INDICADOR DE PASOS */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '10px', 
          marginBottom: '20px' 
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: step >= 1 ? '#667eea' : '#e0e0e0',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold'
          }}>
            1
          </div>
          <div style={{
            width: '40px',
            height: '2px',
            background: '#e0e0e0',
            alignSelf: 'center'
          }} />
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: step >= 2 ? '#667eea' : '#e0e0e0',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold'
          }}>
            2
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            ✅ {success}
          </div>
        )}

        {/* ✅ PASO 1: SOLICITAR CÓDIGO */}
        {step === 1 && (
          <form onSubmit={handleRequestCode} className="auth-form">
            <div className="form-group">
              <label>📧 Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                disabled={loading}
                required
              />
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar Código'}
            </button>

            <div className="auth-footer">
              <button 
                type="button"
                onClick={() => navigate('/login')}
                className="link-button"
              >
                ← Volver al login
              </button>
            </div>
          </form>
        )}

        {/* ✅ PASO 2: RESETEAR CONTRASEÑA */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="auth-form">
            <div className="form-group">
              <label>📧 Email</label>
              <input
                type="email"
                value={email}
                disabled
                style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
              />
            </div>

            <div className="form-group">
              <label>🔢 Código de Verificación</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                maxLength="6"
                disabled={loading}
                required
                style={{ 
                  fontSize: '20px', 
                  letterSpacing: '5px', 
                  textAlign: 'center' 
                }}
              />
            </div>

            <div className="form-group">
              <label>🔒 Nueva Contraseña</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label>🔒 Confirmar Contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu contraseña"
                disabled={loading}
                required
              />
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
            </button>

            <div className="auth-footer">
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="link-button"
                disabled={loading}
              >
                ← Volver a solicitar código
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;