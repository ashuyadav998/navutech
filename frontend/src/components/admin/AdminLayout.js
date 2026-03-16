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
  FaComments
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import '../../styles/AdminLayout.css';

const AdminLayout = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { path: '/admin',            icon: FaChartBar,  label: 'Dashboard' },
    { path: '/admin/productos',  icon: FaBox,       label: 'Productos' },
    { path: '/admin/categorias', icon: FaTags,      label: 'Categorías' },
    { path: '/admin/pedidos',    icon: FaShoppingBag, label: 'Pedidos' },
    { path: '/admin/usuarios',   icon: FaUsers,     label: 'Usuarios' },
    { path: '/admin/chat',       icon: FaComments,  label: 'Chat Clientes' },
  ];

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="admin-layout">

      {/* ── Sidebar ── */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>

        <div className="sidebar-logo">
          {sidebarOpen && (
            <>
              <h2>AszuTech</h2>
              <span>Panel Admin</span>
            </>
          )}
          {/* UN SOLO botón toggle, solo en el sidebar */}
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
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
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <item.icon className="nav-icon" />
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <Link to="/" className="back-to-store" title="Volver a la tienda">
            <FaHome />
            {sidebarOpen && <span>Volver a la tienda</span>}
          </Link>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="admin-main">
        <header className="admin-topbar">
          <h1>Panel de Administración</h1>
          <div className="topbar-user">
            <span>Hola, <strong>{user?.name}</strong></span>
            <button onClick={logout} className="btn-admin-secondary">
              <FaSignOutAlt />
              Cerrar sesión
            </button>
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