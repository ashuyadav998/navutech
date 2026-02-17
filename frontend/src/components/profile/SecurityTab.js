import React, { useState } from 'react';
import axios from 'axios';
import { FaLock, FaShieldAlt } from 'react-icons/fa';
import '../../styles/Profile.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const SecurityTab = () => {
  const [passData, setPassData] = useState({ currentPassword: '', newPassword: '' });
  const [loading, setLoading] = useState(false);

  const handlePassChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/auth/change-password`, passData, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      alert('Contraseña actualizada correctamente');
      setPassData({ currentPassword: '', newPassword: '' });
    } catch (err) { 
      alert(err.response?.data?.message || 'Error al actualizar la contraseña'); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="security-tab">
      <div className="tab-header">
        <h2>Seguridad de la Cuenta</h2>
      </div>
      
      <div className="security-info-box">
        <FaShieldAlt />
        <p>Mantén tu cuenta protegida cambiando tu contraseña periódicamente.</p>
      </div>

      <form onSubmit={handlePassChange} className="password-form">
        <div className="form-group">
          <label>Contraseña Actual</label>
          <div className="input-with-icon">
            <FaLock className="input-icon" />
            <input 
              type="password" 
              required 
              placeholder="Introduce tu clave actual"
              value={passData.currentPassword} 
              onChange={e => setPassData({...passData, currentPassword: e.target.value})} 
            />
          </div>
        </div>

        <div className="form-group">
          <label>Nueva Contraseña</label>
          <div className="input-with-icon">
            <FaLock className="input-icon" />
            <input 
              type="password" 
              required 
              placeholder="Mínimo 6 caracteres"
              value={passData.newPassword} 
              onChange={e => setPassData({...passData, newPassword: e.target.value})} 
            />
          </div>
        </div>

        <button type="submit" className="btn-save" disabled={loading}>
          {loading ? 'Procesando...' : 'Actualizar Contraseña'}
        </button>
      </form>
    </div>
  );
};

export default SecurityTab;