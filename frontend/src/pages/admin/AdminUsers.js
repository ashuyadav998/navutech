import React, { useState, useEffect } from 'react';
import { FaUserShield, FaUser } from 'react-icons/fa';
import axios from 'axios';
import '../../styles/AdminUsers.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      // Nota: Necesitarás crear este endpoint en el backend
      const response = await axios.get(`${API_URL}/users`).catch(() => ({ data: [] }));
      setUsers(response.data);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const toggleUserRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    if (window.confirm(`¿Cambiar rol de usuario a ${newRole}?`)) {
      try {
        await axios.put(`${API_URL}/users/${userId}`, { role: newRole });
        alert('Rol actualizado correctamente');
        loadUsers();
      } catch (error) {
        console.error('Error al actualizar rol:', error);
        alert('Error al actualizar el rol');
      }
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    const newStatus = !currentStatus;
    
    if (window.confirm(`¿${newStatus ? 'Activar' : 'Desactivar'} este usuario?`)) {
      try {
        await axios.put(`${API_URL}/users/${userId}`, { active: newStatus });
        alert('Estado actualizado correctamente');
        loadUsers();
      } catch (error) {
        console.error('Error al actualizar estado:', error);
        alert('Error al actualizar el estado');
      }
    }
  };

  if (loading) {
    return <div className="loading">Cargando usuarios...</div>;
  }

  return (
    <div className="admin-users">
      <div className="page-header">
        <h2>Gestión de Usuarios</h2>
        <div className="users-stats">
          <span className="stat-item">
            Total: <strong>{users.length}</strong>
          </span>
          <span className="stat-item">
            Admins: <strong>{users.filter(u => u.role === 'admin').length}</strong>
          </span>
          <span className="stat-item">
            Usuarios: <strong>{users.filter(u => u.role === 'user').length}</strong>
          </span>
        </div>
      </div>

      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Registro</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td>
                  <div className="user-cell">
                    {user.role === 'admin' ? <FaUserShield /> : <FaUser />}
                    <strong>{user.name}</strong>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>{user.phone || '-'}</td>
                <td>
                  <span className={`badge ${user.role === 'admin' ? 'badge-primary' : 'badge-secondary'}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${user.active ? 'active' : 'inactive'}`}>
                    {user.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>{formatDate(user.createdAt)}</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn btn-small btn-secondary"
                      onClick={() => toggleUserRole(user._id, user.role)}
                    >
                      Cambiar rol
                    </button>
                    <button 
                      className={`btn btn-small ${user.active ? 'btn-danger' : 'btn-success'}`}
                      onClick={() => toggleUserStatus(user._id, user.active)}
                    >
                      {user.active ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="no-data">No hay usuarios registrados</div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
