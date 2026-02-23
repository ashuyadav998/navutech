import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const ManualTrackingModal = ({ order, onClose, onSuccess }) => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('Correos España');
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = sessionStorage.getItem('token');
      await axios.post(
        `${API_URL}/tracking/manual`,
        {
          orderId: order._id,
          trackingNumber,
          carrier
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('✅ Tracking añadido y email enviado al cliente');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Error al añadir tracking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h3>Añadir Tracking Manualmente</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div style={{ padding: '20px' }}>
          <p style={{ marginBottom: '20px', color: 'var(--text-secondary)' }}>
            Pedido: <strong>#{order._id.slice(-8).toUpperCase()}</strong>
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Número de Tracking</label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="PQ123456789ES"
                required
                style={{ 
                  width: '100%',
                  padding: '10px',
                  fontSize: '16px',
                  letterSpacing: '2px'
                }}
              />
            </div>

            <div className="form-group">
              <label>Transportista</label>
              <select 
                value={carrier} 
                onChange={(e) => setCarrier(e.target.value)}
                style={{ width: '100%', padding: '10px' }}
              >
                <option value="Correos España">Correos España</option>
                <option value="SEUR">SEUR</option>
                <option value="MRW">MRW</option>
                <option value="DHL">DHL</option>
                <option value="UPS">UPS</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={loading}
                style={{ flex: 1 }}
              >
                {loading ? 'Guardando...' : 'Guardar Tracking'}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={onClose}
                style={{ flex: 1 }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ManualTrackingModal;