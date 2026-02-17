import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBox, FaShoppingBag, FaUsers, FaEuroSign, FaSync } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { getProducts, getCategories } from '../../services/api';
import axios from 'axios';
import '../../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth(); // ✅ USAR EL CONTEXTO

  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    lowStock: 0,
    pendingOrders: 0,
    paidOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ VERIFICAR AUTENTICACIÓN AL MONTAR
  useEffect(() => {
    console.log('🔍 Verificando autenticación...');
    console.log('isAuthenticated:', isAuthenticated());
    console.log('user completo:', JSON.stringify(user, null, 2));
    console.log('user.role:', user?.role);
    console.log('token en sessionStorage:', !!sessionStorage.getItem('token'));
    console.log('token en localStorage:', !!localStorage.getItem('token'));

    if (!isAuthenticated()) {
      console.log('❌ No autenticado, redirigiendo al login en 2 segundos...');
      const timer = setTimeout(() => navigate('/login'), 2000);
      return () => clearTimeout(timer);
    }

    // ✅ ESPERAR A QUE EL USUARIO ESTÉ CARGADO
    if (!user) {
      console.log('⏳ Esperando a que se cargue el usuario...');
      return;
    }

    // ✅ VERIFICAR SI ES ADMIN (MODO PERMISIVO)
    console.log('👤 Usuario cargado, verificando rol...');
    if (user.role !== 'admin') {
      console.log('❌ Usuario no es admin. Rol actual:', user.role);
      console.log('⚠️ Si eres admin, verifica que tu cuenta tenga role: "admin" en la base de datos');
      // NO redirigir inmediatamente, dar tiempo para ver el error
      setError(`Acceso denegado. Tu rol es: "${user.role}". Necesitas rol "admin".`);
      setLoading(false);
      return;
    }

    console.log('✅ Usuario es admin, cargando datos...');
    loadDashboardData();
  }, [isAuthenticated, user, navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      
      // ✅ OBTENER TOKEN DE SESSIONSTORAGE (como está en tu AuthContext)
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      
      console.log('🔑 Token en sessionStorage:', !!sessionStorage.getItem('token'));
      console.log('🔑 Token en localStorage:', !!localStorage.getItem('token'));
      console.log('🔑 Token final encontrado:', token ? 'SÍ' : 'NO');
      console.log('🔑 Primeros caracteres:', token ? token.substring(0, 20) + '...' : 'N/A');
      
      if (!token) {
        console.log('❌ No hay token en sessionStorage ni localStorage');
        setError('No estás autenticado. Por favor, inicia sesión.');
        setLoading(false);
        navigate('/login');
        return;
      }

      // ✅ CONFIGURACIÓN DE HEADERS CON TOKEN
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      console.log('🔄 Cargando datos del dashboard...');

      // Cargar datos en paralelo CON TOKEN
      const [productsRes, ordersRes, usersRes] = await Promise.all([
        getProducts({}).catch(err => {
          console.error('❌ Error cargando productos:', err.response?.status, err.message);
          return { data: [] };
        }),
        axios.get(`${API_URL}/orders`, config).catch(err => {
          console.error('❌ Error cargando pedidos:', err.response?.status, err.message);
          if (err.response?.status === 401) {
            console.log('⚠️ Token inválido o expirado');
          }
          return { data: [] };
        }),
        axios.get(`${API_URL}/users`, config).catch(err => {
          console.error('❌ Error cargando usuarios:', err.response?.status, err.message);
          return { data: [] };
        })
      ]);

      // Extraer datos (manejar diferentes formatos de respuesta)
      const products = Array.isArray(productsRes.data) 
        ? productsRes.data 
        : (productsRes.data?.products || []);
      
      const orders = Array.isArray(ordersRes.data) 
        ? ordersRes.data 
        : (ordersRes.data?.orders || []);
      
      const users = Array.isArray(usersRes.data) 
        ? usersRes.data 
        : (usersRes.data?.users || []);

      console.log('✅ Datos cargados:', {
        productos: products.length,
        pedidos: orders.length,
        usuarios: users.length
      });

      // Calcular estadísticas
      const totalRevenue = orders
        .filter(o => o.paymentStatus === 'pagado')
        .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

      const lowStock = products.filter(p => (p.stock || 0) < 10).length;
      const pendingOrders = orders.filter(o => o.orderStatus === 'pendiente').length;
      const paidOrders = orders.filter(o => o.paymentStatus === 'pagado').length;

      setStats({
        totalProducts: products.length,
        totalOrders: orders.length,
        totalUsers: users.length,
        totalRevenue,
        lowStock,
        pendingOrders,
        paidOrders
      });

      // Últimos 5 pedidos (ordenados por fecha)
      const sortedOrders = orders.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      setRecentOrders(sortedOrders.slice(0, 5));

    } catch (error) {
      console.error('❌ Error al cargar datos del dashboard:', error);
      console.error('❌ Status:', error.response?.status);
      console.error('❌ Data:', error.response?.data);
      
      if (error.response?.status === 401) {
        setError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        // Limpiar token y redirigir
        sessionStorage.removeItem('token');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 403) {
        setError('No tienes permisos para ver el dashboard de administrador.');
        setTimeout(() => navigate('/'), 2000);
      } else {
        setError('Error al cargar los datos. Por favor, intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pendiente: 'badge-warning',
      procesando: 'badge-info',
      enviado: 'badge-primary',
      entregado: 'badge-success',
      cancelado: 'badge-danger',
      pagado: 'badge-success',
      fallido: 'badge-danger'
    };
    return statusMap[status] || 'badge-secondary';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pendiente: 'Pendiente',
      procesando: 'Procesando',
      enviado: 'Enviado',
      entregado: 'Entregado',
      cancelado: 'Cancelado',
      pagado: 'Pagado',
      fallido: 'Fallido'
    };
    return labels[status] || status;
  };

  // ✅ CALCULAR PEDIDOS DE HOY
  const getOrdersToday = () => {
    const today = new Date().toDateString();
    return recentOrders.filter(o => {
      return new Date(o.createdAt).toDateString() === today;
    }).length;
  };

  // ✅ CALCULAR TASA DE PAGO
  const getPaymentRate = () => {
    if (stats.totalOrders === 0) return 0;
    return Math.round((stats.paidOrders / stats.totalOrders) * 100);
  };

  // ✅ CALCULAR TICKET PROMEDIO
  const getAverageTicket = () => {
    if (stats.paidOrders === 0) return 0;
    return stats.totalRevenue / stats.paidOrders;
  };

  // Estado de carga
  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-container">
          <div className="spinner-large"></div>
          <p>Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Error al cargar el dashboard</h3>
          <p>{error}</p>
          
          {/* ✅ MOSTRAR INFO DE DEBUG SI ES PROBLEMA DE ROL */}
          {error.includes('rol') && user && (
            <div style={{
              marginTop: '20px',
              padding: '15px',
              background: '#f8f9fa',
              borderRadius: '8px',
              textAlign: 'left'
            }}>
              <strong>🔍 Información de Debug:</strong>
              <pre style={{
                marginTop: '10px',
                padding: '10px',
                background: '#fff',
                borderRadius: '4px',
                fontSize: '12px',
                overflow: 'auto'
              }}>
{`Usuario: ${user.name || 'N/A'}
Email: ${user.email || 'N/A'}
Rol actual: ${user.role || 'sin rol'}
ID: ${user._id || user.id || 'N/A'}`}
              </pre>
              <p style={{marginTop: '10px', fontSize: '14px', color: '#666'}}>
                ℹ️ Para acceder al dashboard de administrador, tu cuenta debe tener <code>role: "admin"</code> en la base de datos.
              </p>
            </div>
          )}
          
          <div className="error-actions">
            <button className="btn btn-primary" onClick={loadDashboardData}>
              <FaSync /> Reintentar
            </button>
            {error.includes('sesión') && (
              <button className="btn btn-secondary" onClick={() => navigate('/login')}>
                Ir al Login
              </button>
            )}
            {error.includes('rol') && (
              <button className="btn btn-secondary" onClick={() => navigate('/')}>
                Volver a la tienda
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div>
          <h2>📊 Resumen General</h2>
          {user && <p className="dashboard-subtitle">Bienvenido, {user.name}</p>}
        </div>
        <button className="btn btn-secondary btn-refresh" onClick={loadDashboardData}>
          <FaSync /> Actualizar
        </button>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon">
            <FaBox />
          </div>
          <div className="stat-content">
            <h3>Productos</h3>
            <p className="stat-number">{stats.totalProducts}</p>
            {stats.lowStock > 0 ? (
              <span className="stat-alert">⚠️ {stats.lowStock} con stock bajo</span>
            ) : (
              <span className="stat-subtitle">Stock saludable</span>
            )}
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon">
            <FaShoppingBag />
          </div>
          <div className="stat-content">
            <h3>Pedidos</h3>
            <p className="stat-number">{stats.totalOrders}</p>
            {stats.pendingOrders > 0 ? (
              <span className="stat-alert">📦 {stats.pendingOrders} pendientes</span>
            ) : (
              <span className="stat-subtitle">Todo procesado</span>
            )}
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-icon">
            <FaUsers />
          </div>
          <div className="stat-content">
            <h3>Usuarios</h3>
            <p className="stat-number">{stats.totalUsers}</p>
            <span className="stat-subtitle">Registrados</span>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-icon">
            <FaEuroSign />
          </div>
          <div className="stat-content">
            <h3>Ingresos</h3>
            <p className="stat-number">{formatPrice(stats.totalRevenue)}</p>
            <span className="stat-subtitle">Total facturado</span>
          </div>
        </div>
      </div>

      {/* Alertas rápidas */}
      {(stats.pendingOrders > 0 || stats.lowStock > 0) && (
        <div className="alerts-section">
          <h3>⚡ Alertas</h3>
          <div className="alerts-grid">
            {stats.pendingOrders > 0 && (
              <div className="alert-card warning">
                <span className="alert-icon">📦</span>
                <div className="alert-content">
                  <strong>Pedidos Pendientes</strong>
                  <p>Tienes {stats.pendingOrders} pedido(s) pendiente(s) de procesar</p>
                </div>
              </div>
            )}
            {stats.lowStock > 0 && (
              <div className="alert-card danger">
                <span className="alert-icon">⚠️</span>
                <div className="alert-content">
                  <strong>Stock Bajo</strong>
                  <p>{stats.lowStock} producto(s) con menos de 10 unidades</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pedidos recientes */}
      <div className="recent-orders">
        <h3>📋 Pedidos Recientes</h3>
        {recentOrders.length > 0 ? (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Teléfono</th>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>Estado Pago</th>
                  <th>Estado Pedido</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order._id}>
                    <td>
                      <strong>#{order._id.slice(-6)}</strong>
                    </td>
                    <td>
                      <div className="customer-info">
                        <strong>{order.user?.name || 'Usuario'}</strong>
                        <small>{order.user?.email || ''}</small>
                      </div>
                    </td>
                    <td>
                      <span className="phone-text">
                        {order.phone || 'N/A'}
                      </span>
                    </td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td><strong>{formatPrice(order.totalAmount)}</strong></td>
                    <td>
                      <span className={`badge ${getStatusBadge(order.paymentStatus)}`}>
                        {getStatusLabel(order.paymentStatus)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(order.orderStatus)}`}>
                        {getStatusLabel(order.orderStatus)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-data">
            <p>📭 No hay pedidos recientes</p>
          </div>
        )}
      </div>

      {/* Resumen rápido */}
      <div className="quick-summary">
        <h3>📈 Resumen Rápido</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">Pedidos Hoy:</span>
            <span className="summary-value">{getOrdersToday()}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Tasa de Pago:</span>
            <span className="summary-value">{getPaymentRate()}%</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Ticket Promedio:</span>
            <span className="summary-value">{formatPrice(getAverageTicket())}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;