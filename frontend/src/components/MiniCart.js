import React from 'react';
import { Link } from 'react-router-dom';
import { FaTimes, FaShoppingCart, FaTrash } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import '../styles/MiniCart.css';

const MiniCart = ({ isOpen, onClose }) => {
  const { cart, removeFromCart, updateQuantity, getCartTotal } = useCart();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  return (
    <>
      {/* Overlay oscuro */}
      {isOpen && <div className="mini-cart-overlay" onClick={onClose} />}
      
      {/* Panel lateral */}
      <div className={`mini-cart ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="mini-cart-header">
          <div className="header-title">
            <FaShoppingCart />
            <h3>Carrito ({cart.length})</h3>
          </div>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* Body */}
        <div className="mini-cart-body">
          {cart.length === 0 ? (
            <div className="empty-cart">
              <FaShoppingCart className="empty-icon" />
              <p>Tu carrito está vacío</p>
              <button className="btn-continue" onClick={onClose}>
                Continuar Comprando
              </button>
            </div>
          ) : (
            <div className="cart-items">
              {cart.map((item) => (
                <div key={item._id} className="mini-cart-item">
                  <img 
                    src={item.images?.[0] || '/placeholder.jpg'} 
                    alt={item.name}
                  />
                  
                  <div className="item-details">
                    <h4>{item.name}</h4>
                    <p className="item-price">{formatPrice(item.price)}</p>
                    
                    {/* Controles cantidad */}
                    <div className="quantity-controls">
                      <button 
                        onClick={() => updateQuantity(item._id, Math.max(1, item.quantity - 1))}
                        className="qty-btn"
                      >
                        -
                      </button>
                      <span className="qty-value">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item._id, item.quantity + 1)}
                        className="qty-btn"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button 
                    className="remove-btn"
                    onClick={() => removeFromCart(item._id)}
                    title="Eliminar"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="mini-cart-footer">
            <div className="subtotal">
              <span>Subtotal:</span>
              <strong>{formatPrice(getCartTotal())}</strong>
            </div>
            
            <div className="footer-actions">
              <Link 
                to="/cart" 
                className="btn-view-cart"
                onClick={onClose}
              >
                Ver Carrito
              </Link>
              <Link 
                to="/checkout" 
                className="btn-checkout"
                onClick={onClose}
              >
                Finalizar Compra
              </Link>
            </div>

            <p className="free-shipping">
              {getCartTotal() >= 50 
                ? '🎉 ¡Envío gratis!' 
                : `Añade ${formatPrice(50 - getCartTotal())} para envío gratis`
              }
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default MiniCart;