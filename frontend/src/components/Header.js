import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaShoppingCart, FaUser, FaBars, FaTimes, 
  FaBoxOpen, FaBell, FaCog, FaSignOutAlt, FaSearch 
} from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import { getCategories } from '../services/api';
import '../styles/Header.css';

const Header = () => {
  const navigate = useNavigate();
  const { getCartCount } = useCart();
  const { user, logout, isAuthenticated } = useAuth();
  
  // Estados para búsqueda y menús
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Cargar categorías al iniciar
  useEffect(() => {
    loadCategories();
  }, []);

  // Cerrar el menú de usuario al hacer clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
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

  // Lógica de búsqueda funcional
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Redirige a la página de productos con el parámetro search
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
          {/* LOGO */}
          <Link to="/" className="logo">
            <h1>SimShop</h1>
          </Link>

          {/* BARRA DE BÚSQUEDA (FORMULARIO ACTIVO) */}
          <form className="search-bar" onSubmit={handleSearch}>
            <input 
              type="text" 
              placeholder="Buscar productos..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" aria-label="Buscar">
              <FaSearch />
            </button>
          </form>

          {/* ACCIONES (NOTIFICACIONES, USUARIO, CARRITO) */}
          <div className="header-actions">
            {isAuthenticated() ? (
              <>
                <NotificationBell />
                
                <div className="user-dropdown" ref={userMenuRef}>
                  <button 
                    className="user-button"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
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
                          <button onClick={() => handleMenuItemClick('/admin')} className="admin-link">
                            🎛️ Panel Admin
                          </button>
                        )}

                        <div className="dropdown-divider"></div>

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

            <Link to="/cart" className="cart-link">
              <FaShoppingCart />
              {getCartCount() > 0 && (
                <span className="cart-badge">{getCartCount()}</span>
              )}
            </Link>
          </div>

          {/* BOTÓN MENÚ MÓVIL */}
          <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      {/* NAVEGACIÓN DE CATEGORÍAS */}
      <nav className={`main-nav ${menuOpen ? 'open' : ''}`}>
        <div className="container">
          <ul>
            <li><Link to="/" onClick={() => setMenuOpen(false)}>Inicio</Link></li>
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
    </header>
  );
};

export default Header;