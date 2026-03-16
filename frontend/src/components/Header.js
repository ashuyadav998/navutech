import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaShoppingCart, FaUser, FaBars, FaTimes,
  FaBoxOpen, FaBell, FaCog, FaSignOutAlt, FaSearch
} from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import MiniCart from './MiniCart';
import { getCategories } from '../services/api';
import '../styles/Header.css';
import LanguageSwitcher from './LanguageSwitcher';

const Header = () => {
  const navigate = useNavigate();
  const { getCartCount, miniCartOpen, setMiniCartOpen } = useCart();
  const { user, logout, isAuthenticated } = useAuth();

  const [searchTerm,   setSearchTerm]   = useState('');
  const [categories,   setCategories]   = useState([]);
  const [menuOpen,     setMenuOpen]      = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => { loadCategories(); }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadCategories = async () => {
    try {
      const response = await getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
      setMenuOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    setMenuOpen(false);
    navigate('/');
  };

  const handleMenuItemClick = (path) => {
    navigate(path);
    setUserMenuOpen(false);
    setMenuOpen(false);
  };

  return (
    <header className="header">
      <div className="header-top">
        <div className="container">

          {/* ── Logo ── */}
          <Link to="/" className="logo">
            <h1>AsZuTech</h1>
          </Link>

          {/* ── Buscador ── */}
          <form className="search-bar" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Buscar productos"
            />
            <button type="submit" aria-label="Buscar">
              <FaSearch />
            </button>
          </form>

          {/* ── Acciones ── */}
          <div className="header-actions">

           

            {isAuthenticated() ? (
              <>
                <NotificationBell />

                <div className="user-dropdown" ref={userMenuRef}>
                  <button
                    className="user-button"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    aria-expanded={userMenuOpen}
                    aria-label="Menú de usuario"
                  >
                    <FaUser />
                    <span className="user-name-text">{user?.name}</span>
                  </button>

                  {userMenuOpen && (
                    <div className="user-dropdown-menu">
                      <div className="dropdown-header">
                        <strong>{user?.name}</strong>
                        <small>{user?.email}</small>
                      </div>

                      <div className="dropdown-items">
                        <button onClick={() => handleMenuItemClick('/perfil')}>
                          <FaUser /> <span>Mi Perfil</span>
                        </button>
                        <button onClick={() => handleMenuItemClick('/orders')}>
                          <FaBoxOpen /> <span>Mis Pedidos</span>
                        </button>
                        <button onClick={() => handleMenuItemClick('/notifications')}>
                          <FaBell /> <span>Notificaciones</span>
                        </button>
                        <button onClick={() => handleMenuItemClick('/security')}>
                          <FaCog /> <span>Configuración</span>
                        </button>

                        {user?.role === 'admin' && (
                          <button
                            onClick={() => handleMenuItemClick('/admin')}
                            className="admin-link"
                          >
                            🎛️ Panel Admin
                          </button>
                        )}

                        <div className="dropdown-divider" />

                        <button onClick={handleLogout} className="logout-btn-dropdown">
                          <FaSignOutAlt /> <span>Cerrar Sesión</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link to="/login" className="login-link">
                <FaUser />
                <span>Iniciar Sesión</span>
              </Link>
            )}

            {/* ── Carrito ── */}
            <button
              onClick={() => setMiniCartOpen(true)}
              className="cart-link"
              aria-label="Abrir carrito"
            >
              <FaShoppingCart />
              {getCartCount() > 0 && (
                <span className="cart-badge">{getCartCount()}</span>
              )}
            </button>
          </div>

          {/* ── Hamburger mobile ── */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      {/* ── Nav secundaria ── */}
      <nav className={`main-nav ${menuOpen ? 'open' : ''}`} aria-label="Navegación principal">
        <div className="container">
          <ul>
            <li><Link to="/"        onClick={() => setMenuOpen(false)}>Inicio</Link></li>
            <li><Link to="/products" onClick={() => setMenuOpen(false)}>Todos los Productos</Link></li>
            {categories.slice(0, 6).map(category => (
              <li key={category._id}>
                <Link
                  to={`/categoria/${category.slug}`}
                  onClick={() => setMenuOpen(false)}
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <MiniCart
        isOpen={miniCartOpen}
        onClose={() => setMiniCartOpen(false)}
      />
    </header>
  );
};

export default Header;