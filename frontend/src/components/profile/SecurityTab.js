import React, { useState } from 'react';
import axios from 'axios';
import { FaLock, FaShieldAlt, FaCheckCircle } from 'react-icons/fa';
import '../../styles/Profile.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const SecurityTab = () => {
  const [passData, setPassData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  const handlePassChange = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (passData.newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres'); return;
    }
    if (passData.newPassword !== passData.confirmPassword) {
      setError('Las contraseñas nuevas no coinciden'); return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await axios.post(`${API_URL}/auth/change-password`,
        { currentPassword: passData.currentPassword, newPassword: passData.newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Contraseña actualizada correctamente');
      setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar la contraseña');
    } finally { setLoading(false); }
  };

  return (
    <div className="tab-page">
      <div className="container">

        {/* ── Header ── */}
        <div className="tab-page-header">
          <h1>Seguridad</h1>
        </div>

        <div className="tab-content-narrow">

          {/* Info box */}
          <div className="security-info-box">
            <FaShieldAlt />
            <p>Mantén tu cuenta protegida cambiando tu contraseña periódicamente.</p>
          </div>

          {/* Mensajes */}
          {error   && <div className="tab-msg tab-msg-error">{error}</div>}
          {success && (
            <div className="tab-msg tab-msg-success">
              <FaCheckCircle /> {success}
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handlePassChange} className="password-form">
            <div className="form-group">
              <label>Contraseña actual</label>
              <div className="input-with-icon">
                <FaLock className="input-icon" />
                <input
                  type="password"
                  required
                  placeholder="Tu contraseña actual"
                  value={passData.currentPassword}
                  onChange={e => setPassData({ ...passData, currentPassword: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Nueva contraseña</label>
              <div className="input-with-icon">
                <FaLock className="input-icon" />
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={passData.newPassword}
                  onChange={e => setPassData({ ...passData, newPassword: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Confirmar nueva contraseña</label>
              <div className="input-with-icon">
                <FaLock className="input-icon" />
                <input
                  type="password"
                  required
                  placeholder="Repite la nueva contraseña"
                  value={passData.confirmPassword}
                  onChange={e => setPassData({ ...passData, confirmPassword: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default SecurityTab;