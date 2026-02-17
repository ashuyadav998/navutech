import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaEdit } from 'react-icons/fa';
import '../../styles/Profile.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ProfileTab = ({ user, login }) => {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    postalCode: '',
    country: 'España'
  });

  // 1. CORRECCIÓN CRÍTICA: Sincronizar cuando 'user' deje de ser null/undefined
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        street: user.address?.street || '',
        city: user.address?.city || '',
        postalCode: user.address?.postalCode || '',
        country: user.address?.country || 'España'
      });
    }
  }, [user]); // Este trigger es vital

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/auth/profile`, {
        name: formData.name, 
        phone: formData.phone,
        address: { 
          street: formData.street, 
          city: formData.city, 
          postalCode: formData.postalCode, 
          country: formData.country 
        }
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      login({ ...user, ...response.data }, token);
      setEditing(false);
      alert('Perfil actualizado correctamente');
    } catch (err) { 
      alert('Error al guardar los cambios'); 
    }
  };

  // 2. CORRECCIÓN: Si el usuario aún no existe, mostramos un cargando
  if (!user) return <div className="loading">Cargando datos de usuario...</div>;

  return (
    <div className="profile-tab">
      <div className="tab-header">
        <h2>Mis Datos</h2>
        {!editing ? (
          <button className="btn-edit" onClick={() => setEditing(true)}>
            <FaEdit /> Editar Perfil
          </button>
        ) : (
          <div className="edit-actions">
            <button className="btn-save" onClick={handleSave}>Guardar</button>
            <button className="btn-cancel" onClick={() => setEditing(false)}>Cancelar</button>
          </div>
        )}
      </div>

      <div className="profile-form">
        <div className="form-grid">
          <div className="form-group">
            <label>Correo Electrónico</label>
            <input 
              name="email" 
              value={formData.email} 
              disabled 
              className="input-readonly"
            />
          </div>

          <div className="form-group">
            <label>Nombre Completo</label>
            <input 
              name="name" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              disabled={!editing} 
            />
          </div>

          <div className="form-group">
            <label>Teléfono</label>
            <input 
              name="phone" 
              value={formData.phone} 
              onChange={e => setFormData({...formData, phone: e.target.value})} 
              disabled={!editing} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;