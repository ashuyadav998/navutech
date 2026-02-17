import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  FaHome, 
  FaBox, 
  FaTags, 
  FaShoppingBag, 
  FaUsers, 
  FaChartBar, 
  FaBars, 
  FaTimes, 
  FaSignOutAlt,
  FaComments // ✅ AÑADIDO - Icono de chat
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import '../../styles/AdminLayout.css';




const AdminLayout = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ✅ AÑADIDO - Item de chat en el menú
  const menuItems = [
    { path: '/admin', icon: FaChartBar, label: 'Dashboard' },
    { path: '/admin/productos', icon: FaBox, label: 'Productos' },
    { path: '/admin/categorias', icon: FaTags, label: 'Categorías' },
    { path: '/admin/pedidos', icon: FaShoppingBag, label: 'Pedidos' },
    { path: '/admin/usuarios', icon: FaUsers, label: 'Usuarios' },
    { path: '/admin/chat', icon: FaComments, label: 'Chat Clientes' }, // ✅ NUEVA LÍNEA
  ];

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>SimShop Admin</h2>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={isActive(item.path) ? 'active' : ''}
                >
                  <item.icon />
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <Link to="/" className="back-to-store">
            <FaHome />
            {sidebarOpen && <span>Volver a la tienda</span>}
          </Link>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <button 
            className="mobile-sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <FaBars />
          </button>

          <div className="header-content">
            <h1>Panel de Administración</h1>
            <div className="header-user">
              <span>Hola, {user?.name}</span>
              <button onClick={logout} className="logout-btn">
                <FaSignOutAlt />
                Cerrar sesión
              </button>
            </div>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;