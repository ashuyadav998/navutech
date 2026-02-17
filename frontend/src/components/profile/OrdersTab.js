import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaBox, FaTruck, FaExternalLinkAlt, FaMapMarkerAlt, 
  FaClock, FaCheckCircle, FaShippingFast 
} from 'react-icons/fa';
import '../../styles/Profile.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const OrdersTab = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedTracking, setExpandedTracking] = useState(null);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const token = sessionStorage.getItem('token');
        if (!token) {
          setError('No estás autenticado. Por favor, inicia sesión.');
          setLoading(false);
          return;
        }
        const response = await axios.get(`${API_URL}/orders/my-orders`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(response.data);
      } catch (error) {
        if (error.response?.status === 401) {
          setError('Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.');
        } else {
          setError('Error al cargar tus pedidos. Intenta recargar la página.');
        }
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, []);

  const fetchTrackingDetails = async (trackingNumber) => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${API_URL}/tracking/${trackingNumber}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo tracking:', error);
      return null;
    }
  };

  const toggleTrackingDetails = async (orderId, trackingNumber) => {
    if (expandedTracking === orderId) {
      setExpandedTracking(null);
    } else {
      setExpandedTracking(orderId);
      const order = orders.find(o => o._id === orderId);
      if (order.tracking && !order.tracking.events) {
        const trackingDetails = await fetchTrackingDetails(trackingNumber);
        if (trackingDetails) {
          setOrders(prev => prev.map(o =>
            o._id === orderId
              ? { ...o, tracking: { ...o.tracking, ...trackingDetails } }
              : o
          ));
        }
      }
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      en_preparacion: '📦', enviado: '🚚', en_transito: '✈️',
      en_reparto: '🚴', entregado: '✅', pendiente: '⏳'
    };
    return icons[status] || '📋';
  };

  const getStatusColor = (status) => {
    const colors = {
      en_preparacion: '#f39c12', enviado: '#3498db', en_transito: '#9b59b6',
      en_reparto: '#e67e22', entregado: '#27ae60', pendiente: '#95a5a6'
    };
    return colors[status] || '#95a5a6';
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(price);

  if (loading) return <div className="tab-loading">Cargando tus pedidos...</div>;

  if (error) return (
    <div className="empty-state">
      <FaBox size={48} />
      <h3>Error</h3>
      <p>{error}</p>
    </div>
  );

  if (orders.length === 0) return (
    <div className="empty-state">
      <FaBox size={48} />
      <h3>Aún no tienes pedidos</h3>
      <p>Cuando realices tu primera compra, aparecerá aquí.</p>
    </div>
  );

  return (
    <div className="orders-tab">
      <h2>Historial de Pedidos</h2>
      <div className="orders-list">
        {orders.map(order => (
          <div key={order._id} className="order-card">
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

            {/* ✅ SECCIÓN DE TRACKING — muestra número, transportista y URL */}
            {order.tracking ? (
              <div className="tracking-section">
                <div className="tracking-summary">
                  <div className="tracking-info">
                    <div className="tracking-header-row">
                      <FaTruck className="tracking-icon" />
                      <div className="tracking-details">
                        <h4>Seguimiento de Envío</h4>

                        {/* Número de tracking */}
                        <p className="tracking-number">
                          <strong>Nº Seguimiento:</strong> {order.tracking.trackingNumber || '—'}
                        </p>

                        {/* Transportista */}
                        {order.tracking.carrier && (
                          <p className="carrier-name">
                            <FaShippingFast size={14} /> {order.tracking.carrier}
                          </p>
                        )}

                        {/* URL de tracking externo */}
                        {order.tracking.trackingUrl && (
                          <a
                            href={order.tracking.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-external-tracking"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '6px' }}
                          >
                            <FaExternalLinkAlt size={12} /> Rastrear en web oficial
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Estado actual */}
                    <div className="current-status" style={{ marginTop: '10px' }}>
                      <span
                        className="status-pill"
                        style={{ backgroundColor: getStatusColor(order.tracking.currentStatus) }}
                      >
                        {getStatusIcon(order.tracking.currentStatus)}{' '}
                        {order.tracking.currentStatus?.replace(/_/g, ' ').toUpperCase() || 'PENDIENTE'}
                      </span>
                    </div>
                  </div>

                  {/* Botón expandir historial */}
                  <div className="tracking-actions">
                    <button
                      className="btn-tracking-details"
                      onClick={() => toggleTrackingDetails(order._id, order.tracking.trackingNumber)}
                    >
                      {expandedTracking === order._id ? '▲ Ocultar Detalles' : '▼ Ver Detalles'}
                    </button>
                  </div>
                </div>

                {/* Timeline expandible */}
                {expandedTracking === order._id && (
                  <div className="tracking-timeline">
                    <h5>📍 Historial de Seguimiento</h5>

                    {order.tracking.events && order.tracking.events.length > 0 ? (
                      <div className="timeline">
                        {order.tracking.events.map((event, index) => (
                          <div key={index} className="timeline-item">
                            <div
                              className="timeline-marker"
                              style={{
                                backgroundColor: index === order.tracking.events.length - 1
                                  ? getStatusColor(event.status)
                                  : '#ddd'
                              }}
                            >
                              {index === order.tracking.events.length - 1 && '●'}
                            </div>
                            <div className="timeline-content">
                              <div className="event-header">
                                <span className="event-status">
                                  {getStatusIcon(event.status)} {event.status?.replace(/_/g, ' ').toUpperCase()}
                                </span>
                                <span className="event-time">
                                  <FaClock size={12} /> {new Date(event.timestamp).toLocaleString('es-ES')}
                                </span>
                              </div>
                              <p className="event-description">{event.description}</p>
                              {event.location && (
                                <p className="event-location">
                                  <FaMapMarkerAlt size={12} /> {event.location}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-events">
                        <p>📦 Aún no hay eventos de seguimiento disponibles</p>
                      </div>
                    )}

                    {order.tracking.estimatedDelivery && (
                      <div className="delivery-estimate">
                        <FaCheckCircle />
                        <span>
                          Entrega estimada: {new Date(order.tracking.estimatedDelivery).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              // Sin tracking aún
              <div className="tracking-section" style={{ padding: '12px 16px', color: '#999', fontSize: '0.9rem' }}>
                <FaBox style={{ marginRight: '8px' }} />
                Pedido en preparación — el seguimiento aparecerá aquí cuando se genere la etiqueta.
              </div>
            )}

            {/* Productos */}
            <div className="order-items">
              {order.items && order.items.length > 0 ? (
                order.items.map((item, i) => (
                  <div key={i} className="order-item">
                    <img
                      src={item.product?.images?.[0] || 'https://via.placeholder.com/50'}
                      alt={item.product?.name || 'Producto'}
                    />
                    <div className="item-details">
                      <p>{item.product?.name || 'Producto'}</p>
                      <small>Cantidad: {item.quantity}</small>
                    </div>
                    <span className="item-price">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))
              ) : (
                <p style={{ padding: '10px', color: '#999', fontSize: '0.9rem' }}>Sin productos</p>
              )}
            </div>

            <div className="order-footer">
              <div className="order-payment-info">
                <span className={`payment-badge ${order.paymentStatus}`}>
                  {order.paymentStatus === 'pagado' ? '✓ Pagado' : 'Pendiente de pago'}
                </span>
              </div>
              <span className="order-total">
                Total: <strong>{formatPrice(order.totalAmount)}</strong>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrdersTab;