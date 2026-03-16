import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FaBox, FaTruck, FaExternalLinkAlt, FaMapMarkerAlt,
  FaClock, FaCheckCircle, FaShippingFast
} from 'react-icons/fa';
import '../../styles/Profile.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const OrdersTab = () => {
  const [orders,           setOrders]           = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState(null);
  const [expandedTracking, setExpandedTracking] = useState(null);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) { setError('No estás autenticado.'); setLoading(false); return; }
        const res = await axios.get(`${API_URL}/orders/my-orders`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(res.data);
      } catch (err) {
        setError(err.response?.status === 401
          ? 'Tu sesión ha expirado. Vuelve a iniciar sesión.'
          : 'Error al cargar tus pedidos.');
      } finally { setLoading(false); }
    };
    loadOrders();
  }, []);

  const fetchTrackingDetails = async (trackingNumber) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await axios.get(`${API_URL}/tracking/${trackingNumber}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    } catch { return null; }
  };

  const toggleTrackingDetails = async (orderId, trackingNumber) => {
    if (expandedTracking === orderId) { setExpandedTracking(null); return; }
    setExpandedTracking(orderId);
    const order = orders.find(o => o._id === orderId);
    if (order?.tracking && !order.tracking.events) {
      const details = await fetchTrackingDetails(trackingNumber);
      if (details) {
        setOrders(prev => prev.map(o =>
          o._id === orderId ? { ...o, tracking: { ...o.tracking, ...details } } : o
        ));
      }
    }
  };

  const getStatusIcon = (s) => ({ en_preparacion:'📦', enviado:'🚚', en_transito:'✈️', en_reparto:'🚴', entregado:'✅', pendiente:'⏳' }[s] || '📋');

  const formatPrice = (p) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(p);

  if (loading) return (
    <div className="tab-page">
      <div className="container">
        <div className="tab-loading">Cargando tus pedidos...</div>
      </div>
    </div>
  );

  if (error) return (
    <div className="tab-page">
      <div className="container">
        <div className="empty-state">
          <FaBox size={40} />
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="tab-page">
      <div className="container">
        {/* ── Header ── */}
        <div className="tab-page-header">
          <h1>Mis Pedidos</h1>
          <span className="tab-count">{orders.length} pedido{orders.length !== 1 ? 's' : ''}</span>
        </div>

        {orders.length === 0 ? (
          <div className="empty-state">
            <FaBox size={40} />
            <h3>Aún no tienes pedidos</h3>
            <p>Cuando realices tu primera compra, aparecerá aquí.</p>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map(order => (
              <div key={order._id} className="order-card">

                {/* ── Cabecera pedido ── */}
                <div className="order-header">
                  <div className="order-meta">
                    <span className="order-id">#{order._id.slice(-8).toUpperCase()}</span>
                    <span className="order-date">
                      {new Date(order.createdAt).toLocaleDateString('es-ES', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </span>
                  </div>
                  <span className={`status-badge ${order.orderStatus}`}>
                    {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                  </span>
                </div>

                {/* ── Tracking ── */}
                {order.tracking ? (
                  <div className="tracking-section">
                    <div className="tracking-summary">
                      <div className="tracking-info">
                        <div className="tracking-header-row">
                          <FaTruck className="tracking-icon" />
                          <div className="tracking-details">
                            <h4>Seguimiento de Envío</h4>
                            <p className="tracking-number">
                              <strong>Nº Seguimiento:</strong> {order.tracking.trackingNumber || '—'}
                            </p>
                            {order.tracking.carrier && (
                              <p className="carrier-name">
                                <FaShippingFast size={13} /> {order.tracking.carrier}
                              </p>
                            )}
                            {order.tracking.trackingUrl && (
                              <a
                                href={order.tracking.trackingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-external-tracking"
                              >
                                <FaExternalLinkAlt size={11} /> Rastrear en web oficial
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="current-status">
                          <span className="status-pill">
                            {getStatusIcon(order.tracking.currentStatus)}{' '}
                            {order.tracking.currentStatus?.replace(/_/g, ' ').toUpperCase() || 'PENDIENTE'}
                          </span>
                        </div>
                      </div>

                      <div className="tracking-actions">
                        <button
                          className="btn-tracking-details"
                          onClick={() => toggleTrackingDetails(order._id, order.tracking.trackingNumber)}
                        >
                          {expandedTracking === order._id ? '▲ Ocultar' : '▼ Ver Detalles'}
                        </button>
                      </div>
                    </div>

                    {/* Timeline */}
                    {expandedTracking === order._id && (
                      <div className="tracking-timeline">
                        <h5>Historial de Seguimiento</h5>
                        {order.tracking.events?.length > 0 ? (
                          <div className="timeline">
                            {order.tracking.events.map((ev, i) => (
                              <div key={i} className="timeline-item">
                                <div className={`timeline-marker ${i === 0 ? 'latest' : ''}`} />
                                <div className="timeline-content">
                                  <div className="event-header">
                                    <span className="event-status">
                                      {getStatusIcon(ev.status)} {ev.status?.replace(/_/g, ' ').toUpperCase()}
                                    </span>
                                    <span className="event-time">
                                      <FaClock size={11} /> {new Date(ev.timestamp).toLocaleString('es-ES')}
                                    </span>
                                  </div>
                                  <p className="event-description">{ev.description}</p>
                                  {ev.location && (
                                    <p className="event-location">
                                      <FaMapMarkerAlt size={11} /> {ev.location}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="no-events">
                            <p>Aún no hay eventos de seguimiento disponibles</p>
                          </div>
                        )}
                        {order.tracking.estimatedDelivery && (
                          <div className="delivery-estimate">
                            <FaCheckCircle />
                            <span>Entrega estimada: {new Date(order.tracking.estimatedDelivery).toLocaleDateString('es-ES')}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="tracking-pending">
                    <FaBox /> Pedido en preparación — el seguimiento aparecerá cuando se genere la etiqueta.
                  </div>
                )}

                {/* ── Productos ── */}
                <div className="order-items">
                  {order.items?.map((item, i) => (
                    <div key={i} className="order-item">
                      <img
                        src={item.product?.images?.[0] || 'https://via.placeholder.com/50'}
                        alt={item.product?.name || 'Producto'}
                      />
                      <div className="item-details">
                        <p>{item.product?.name || 'Producto'}</p>
                        <small>Cantidad: {item.quantity}</small>
                      </div>
                      <span className="item-price">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                {/* ── Footer pedido ── */}
                <div className="order-footer">
                  <span className={`payment-badge ${order.paymentStatus}`}>
                    {order.paymentStatus === 'pagado' ? '✓ Pagado' : 'Pendiente de pago'}
                  </span>
                  <span className="order-total">
                    Total: <strong>{formatPrice(order.totalAmount)}</strong>
                  </span>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersTab;