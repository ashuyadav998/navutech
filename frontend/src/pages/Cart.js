import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaTrash, FaMinus, FaPlus } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import '../styles/Cart.css';

const Cart = () => {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (cart.length === 0) {
    return (
      <div className="cart-empty">
        <div className="container">
          <h2>Tu carrito está vacío</h2>
          <p>No has añadido ningún producto todavía</p>
          <Link to="/productos" className="continue-shopping-btn">
            Continuar comprando
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <h1>Carrito de Compras</h1>

        <div className="cart-layout">
          <div className="cart-items">
            {cart.map(item => (
              <div key={item._id} className="cart-item">
                <div className="item-image">
                  <img 
                    src={item.images[0] || 'https://via.placeholder.com/150'} 
                    alt={item.name} 
                  />
                </div>

                <div className="item-details">
                  <h3>{item.name}</h3>
                  {item.brand && <p className="item-brand">{item.brand}</p>}
                  <p className="item-price">{formatPrice(item.price)}</p>
                </div>

                <div className="item-quantity">
                  <button 
                    onClick={() => updateQuantity(item._id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    <FaMinus />
                  </button>
                  <span>{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item._id, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                  >
                    <FaPlus />
                  </button>
                </div>

                <div className="item-total">
                  <p className="item-subtotal">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>

                <button 
                  className="remove-item-btn"
                  onClick={() => removeFromCart(item._id)}
                  aria-label="Eliminar producto"
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h2>Resumen del Pedido</h2>
            
            <div className="summary-row">
              <span>Subtotal ({cart.reduce((acc, item) => acc + item.quantity, 0)} productos)</span>
              <span>{formatPrice(getCartTotal())}</span>
            </div>

            <div className="summary-row">
              <span>Envío</span>
              <span>Gratis</span>
            </div>

            <div className="summary-row total">
              <span>Total</span>
              <span>{formatPrice(getCartTotal())}</span>
            </div>

            <button className="checkout-btn" onClick={handleCheckout}>
              Proceder al Pago
            </button>

            <Link to="/productos" className="continue-shopping">
              Continuar comprando
            </Link>

            <button className="clear-cart-btn" onClick={clearCart}>
              Vaciar carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
