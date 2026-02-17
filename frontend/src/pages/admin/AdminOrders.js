import React, { useState, useEffect, useRef } from 'react';
import { FaEye, FaEdit, FaPhone, FaDownload } from 'react-icons/fa';
import axios from 'axios';
import '../../styles/AdminOrders.css';
import { toast } from 'react-toastify';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({ orderStatus: '', paymentStatus: '' });
  const [error, setError] = useState(null);

  const notifiedOrders = useRef(new Set());
  const isFirstLoad = useRef(true);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    loadOrders(true);
    if (Notification.permission === 'default') Notification.requestPermission();
    const interval = setInterval(() => loadOrders(false), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const newOrders = orders.filter(
      o => !notifiedOrders.current.has(o._id) && o.orderStatus === 'pendiente'
    );
    if (newOrders.length > 0 && !isFirstLoad.current) {
      newOrders.forEach(o => notifiedOrders.current.add(o._id));
      handleNewOrderNotification(newOrders);
    }
  }, [orders]);

  const handleNewOrderNotification = (newOrders) => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(() => {});
    newOrders.forEach(order => {
      toast.success(
        `🔔 ¡NUEVO PEDIDO! #${order._id.slice(-6).toUpperCase()}\nCliente: ${order.user?.name || 'Desconocido'}\nTotal: ${formatPrice(order.totalAmount)}`,
        { position: 'top-right', autoClose: 8000 }
      );
    });
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    if (Notification.permission === 'granted') {
      new Notification('🛒 Nuevo pedido recibido', { body: `${newOrders.length} pedido(s) nuevo(s)`, icon: '/logo192.png' });
    }
  };

  const loadOrders = async (initial = false) => {
    try {
      if (initial) setLoading(true);
      setRefreshing(true);
      setError(null);
      const token = sessionStorage.getItem('token');
      if (!token) { setError('No estás autenticado.'); setLoading(false); return; }

      const response = await axios.get(`${API_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const ordersData = Array.isArray(response.data) ? response.data : [];
      setOrders(ordersData);

      if (initial) {
        ordersData.forEach(o => notifiedOrders.current.add(o._id));
        isFirstLoad.current = false;
      }
    } catch (error) {
      if (initial) setError(error.response?.data?.message || 'Error al cargar los pedidos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const downloadLabel = async (order) => {
    try {
      // ✅ Comprobar trackingNumber en el objeto populado o directamente
      const trackingNumber = order.tracking?.trackingNumber;
      if (!trackingNumber) {
        toast.error('Etiqueta aún no disponible, pulsa Actualizar en unos segundos');
        return;
      }

      const token = sessionStorage.getItem('token');
      if (!token) { toast.error('Sesión expirada'); return; }

      const loadingToast = toast.loading('Descargando etiqueta...');

      const response = await axios({
        method: 'GET',
        url: `${API_URL}/tracking/${trackingNumber}/label`,
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      toast.update(loadingToast, { render: '✅ Descargando...', type: 'success', isLoading: false, autoClose: 1000 });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `etiqueta-${trackingNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const msg = err.response?.status === 404 ? 'Etiqueta aún no disponible'
        : err.response?.status === 401 ? 'Sesión expirada'
        : 'Error al descargar la etiqueta';
      toast.error(msg);
    }
  };

  const viewLabel = (order) => {
    const trackingNumber = order.tracking?.trackingNumber;
    if (!trackingNumber) { toast.error('Sin etiqueta disponible'); return; }
    const token = sessionStorage.getItem('token');
    window.open(`${API_URL}/tracking/${trackingNumber}/label/preview?token=${token}`, '_blank');
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(price);

  const getStatusBadge = (status) => ({
    pendiente: 'badge-warning', procesando: 'badge-info', enviado: 'badge-primary',
    entregado: 'badge-success', cancelado: 'badge-danger', pagado: 'badge-success', fallido: 'badge-danger'
  }[status] || 'badge-secondary');

  const getStatusLabel = (status) => ({
    pendiente: 'Pendiente', procesando: 'Procesando', enviado: 'Enviado',
    entregado: 'Entregado', cancelado: 'Cancelado', pagado: 'Pagado', fallido: 'Fallido'
  }[status] || status);

  const openDetailModal = (order) => {
    setSelectedOrder(order);
    setStatusUpdate({ orderStatus: order.orderStatus, paymentStatus: order.paymentStatus });
    setShowDetailModal(true);
  };

  const closeDetailModal = () => { setShowDetailModal(false); setSelectedOrder(null); };

  const updateOrderStatus = async () => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.put(`${API_URL}/orders/${selectedOrder._id}/status`, statusUpdate, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('✅ Estado actualizado y notificación enviada al cliente');
      closeDetailModal();
      loadOrders(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al actualizar');
    }
  };

  // ✅ Función para forzar generación de etiqueta en pedidos viejos sin tracking
  const forceGenerateLabel = async (orderId) => {
    try {
      const token = sessionStorage.getItem('token');
      const loadingToast = toast.loading('Generando etiqueta...');
      await axios.post(`${API_URL}/tracking/create`, { orderId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.update(loadingToast, { render: '✅ Etiqueta generada', type: 'success', isLoading: false, autoClose: 2000 });
      loadOrders(false);
    } catch (err) {
      toast.error('Error al generar etiqueta');
    }
  };

  if (loading) return <div className="admin-orders"><div className="loading-container"><div className="spinner-large"></div><p>Cargando pedidos...</p></div></div>;
  if (error) return <div className="admin-orders"><div className="error-container"><h3>Error</h3><p>{error}</p><button className="btn btn-primary" onClick={() => loadOrders(true)}>🔄 Reintentar</button></div></div>;

  return (
    <div className="admin-orders">
      <div className="page-header">
        <h2>Gestión de Pedidos {refreshing && <small style={{ fontSize: '12px', marginLeft: '10px' }}>🔄 Actualizando...</small>}</h2>
        <div className="orders-stats">
          <span className="stat-item">Total: <strong>{orders.length}</strong></span>
          <span className="stat-item">Pendientes: <strong>{orders.filter(o => o.orderStatus === 'pendiente').length}</strong></span>
          <span className="stat-item">Con etiqueta: <strong>{orders.filter(o => o.tracking?.trackingNumber).length}</strong></span>
        </div>
        <button className="btn btn-secondary" onClick={() => loadOrders(true)}>🔄 Actualizar</button>
      </div>

      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID Pedido</th>
              <th>Cliente</th>
              <th>Total</th>
              <th>Estado Pago</th>
              <th>Estado Pedido</th>
              <th>Etiqueta</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order._id} className={order.orderStatus === 'pendiente' ? 'row-urgent' : ''}>
                <td><strong>#{order._id.slice(-8)}</strong></td>
                <td>
                  <div className="customer-cell">
                    <strong>{order.user?.name || 'Usuario'}</strong>
                    <small><FaPhone /> {order.phone || 'S/T'}</small>
                  </div>
                </td>
                <td><strong>{formatPrice(order.totalAmount)}</strong></td>
                <td><span className={`badge ${getStatusBadge(order.paymentStatus)}`}>{getStatusLabel(order.paymentStatus)}</span></td>
                <td><span className={`badge ${getStatusBadge(order.orderStatus)}`}>{getStatusLabel(order.orderStatus)}</span></td>
                <td>
                  {/* ✅ Comprueba trackingNumber específicamente, no solo order.tracking */}
                  {order.tracking?.trackingNumber ? (
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button className="btn-table btn-pdf" onClick={() => downloadLabel(order)} title="Descargar etiqueta PDF">
                        <FaDownload /> Descargar
                      </button>
                      <button className="btn-table btn-view" onClick={() => viewLabel(order)} title="Ver etiqueta" style={{ background: '#3498db' }}>
                        <FaEye />
                      </button>
                    </div>
                  ) : (
                    // Pedidos viejos sin tracking — botón para forzar generación
                    <button
                      className="btn-table"
                      style={{ fontSize: '0.75rem', background: '#f39c12', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}
                      onClick={() => forceGenerateLabel(order._id)}
                    >
                      📄 Generar
                    </button>
                  )}
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon btn-view" onClick={() => openDetailModal(order)} title="Ver detalles">
                      <FaEye />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showDetailModal && selectedOrder && (
        <div className="modal-overlay" onClick={closeDetailModal}>
          <div className="modal-content large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Gestión de Pedido #{selectedOrder._id.slice(-8).toUpperCase()}</h3>
              <button className="modal-close" onClick={closeDetailModal}>&times;</button>
            </div>

            <div className="order-detail-container">
              <div className="detail-grid-top">
                <div className="detail-card">
                  <h4>📍 Dirección de Envío</h4>
                  <div className="address-box">
                    <p><strong>{selectedOrder.user?.name || 'Cliente'}</strong></p>
                    <p>{selectedOrder.shippingAddress?.street}</p>
                    <p>{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.postalCode}</p>
                    <p>{selectedOrder.shippingAddress?.country}</p>
                    <p style={{ marginTop: '10px', fontSize: '0.85rem', color: '#666' }}>
                      📞 {selectedOrder.phone || 'Sin teléfono'}
                    </p>
                  </div>
                </div>

                <div className="detail-card">
                  <h4>⚙️ Estado del Pedido</h4>
                  <div className="status-update-form">
                    <div className="form-group">
                      <label style={{ fontSize: '0.8rem', color: '#7f8c8d', display: 'block', marginBottom: '5px' }}>
                        Cambiar Estado (se enviará email al cliente)
                      </label>
                      <select name="orderStatus" value={statusUpdate.orderStatus}
                        onChange={e => setStatusUpdate({ ...statusUpdate, [e.target.name]: e.target.value })}
                        className="form-select">
                        <option value="pendiente">Pendiente</option>
                        <option value="procesando">Procesando</option>
                        <option value="enviado">Enviado</option>
                        <option value="entregado">Entregado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </div>
                    <button className="btn-update-status" onClick={updateOrderStatus}>
                      <FaEdit /> Guardar y Notificar
                    </button>
                  </div>
                </div>
              </div>

              {selectedOrder.tracking?.trackingNumber && (
                <div className="detail-card">
                  <h4>🚚 Información de Envío</h4>
                  <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
                    <p><strong>Tracking:</strong> {selectedOrder.tracking.trackingNumber}</p>
                    <p><strong>Transportista:</strong> {selectedOrder.tracking.carrier || 'Correos Express (Simulado)'}</p>
                    <p><strong>Estado:</strong> {selectedOrder.tracking.currentStatus || 'en_preparacion'}</p>
                    <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                      <button className="btn-update-status" onClick={() => downloadLabel(selectedOrder)} style={{ flex: 1 }}>
                        <FaDownload /> Descargar Etiqueta
                      </button>
                      <button className="btn-update-status" onClick={() => viewLabel(selectedOrder)} style={{ flex: 1, background: '#3498db' }}>
                        <FaEye /> Ver Etiqueta
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="detail-card full-width">
                <h4>📦 Productos ({selectedOrder.items?.length || 0})</h4>
                <div className="order-items-list">
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="item-row">
                      <div className="item-main">
                        <span className="item-qty">{item.quantity}x</span>
                        <span className="item-name">{item.product?.name || 'Producto'}</span>
                      </div>
                      <span className="item-subtotal">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="order-total-display">
                  <span>Total Pedido:</span>
                  <strong>{formatPrice(selectedOrder.totalAmount)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;