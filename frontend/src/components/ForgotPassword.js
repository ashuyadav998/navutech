import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { sendPasswordResetCode, resetPassword } = useAuth();

  const [step,            setStep]            = useState(1);
  const [email,           setEmail]           = useState('');
  const [code,            setCode]            = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState('');
  const [success,         setSuccess]         = useState('');

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!email.trim()) { setError('Por favor ingresa tu email'); return; }
    setLoading(true);
    try {
      await sendPasswordResetCode(email);
      setSuccess('Código enviado. Revisa tu bandeja de entrada.');
      setTimeout(() => { setStep(2); setSuccess(''); }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al enviar código');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!code.trim())          { setError('Introduce el código de verificación'); return; }
    if (!newPassword)          { setError('Introduce una nueva contraseña'); return; }
    if (newPassword.length < 6){ setError('La contraseña debe tener al menos 6 caracteres'); return; }
    if (newPassword !== confirmPassword) { setError('Las contraseñas no coinciden'); return; }
    setLoading(true);
    try {
      await resetPassword(email, code, newPassword);
      setSuccess('¡Contraseña actualizada correctamente!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* ✅ auth-page centra directamente, sin div.container */}
      <div className="auth-card">

        <h1>Recuperar Contraseña</h1>
        <p className="auth-subtitle">
          {step === 1
            ? 'Te enviaremos un código a tu email'
            : 'Introduce el código y tu nueva contraseña'}
        </p>

        {/* ── Indicador de pasos ── */}
        <div className="steps-indicator">
          <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className="step-line" />
          <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
        </div>

        {error   && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {/* ── Paso 1: solicitar código ── */}
        {step === 1 && (
          <form onSubmit={handleRequestCode}>
            <div className="form-group">
              <label htmlFor="fp-email">Email</label>
              <input
                type="email"
                id="fp-email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar Código'}
            </button>

            <p className="auth-link">
              <button
                type="button"
                className="link-button"
                onClick={() => navigate('/login')}
              >
                ← Volver al login
              </button>
            </p>
          </form>
        )}

        {/* ── Paso 2: nueva contraseña ── */}
        {step === 2 && (
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                disabled
                style={{ opacity: 0.5, cursor: 'not-allowed' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="fp-code">Código de verificación</label>
              <input
                type="text"
                id="fp-code"
                className="code-input"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="fp-pass">Nueva contraseña</label>
              <input
                type="password"
                id="fp-pass"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="fp-confirm">Confirmar contraseña</label>
              <input
                type="password"
                id="fp-confirm"
                placeholder="Repite tu contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
            </button>

            <p className="auth-link">
              <button
                type="button"
                className="link-button"
                onClick={() => setStep(1)}
                disabled={loading}
              >
                ← Volver a solicitar código
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;