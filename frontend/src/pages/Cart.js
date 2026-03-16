import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaTrash, FaMinus, FaPlus, FaTag, FaTimes, FaCheckCircle } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import { validateCoupon } from '../services/api';
import '../styles/Cart.css';

const Cart = () => {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();

  const [couponCode,    setCouponCode]    = useState('');
  const [couponData,    setCouponData]    = useState(null); // cupón aplicado
  const [couponError,   setCouponError]   = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const formatPrice = (price) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(price);

  const subtotal     = getCartTotal();
  const discount     = couponData?.discount || 0;
  const freeShipping = couponData?.coupon?.freeShipping || false;
  const total        = Math.max(0, subtotal - discount);

  /* ── Aplicar cupón ── */
  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponError('');

    try {
      const res = await validateCoupon(couponCode.trim(), subtotal);
      setCouponData(res.data);
      setCouponCode('');
    } catch (err) {
      setCouponError(err.response?.data?.error || 'Cupón no válido');
      setCouponData(null);
    } finally {
      setCouponLoading(false);
    }
  };

  /* ── Quitar cupón ── */
  const handleRemoveCoupon = () => {
    setCouponData(null);
    setCouponError('');
    setCouponCode('');
  };

  const handleCheckout = () => {
    // Pasamos el cupón al checkout via sessionStorage para que lo use al crear el pedido
    if (couponData) {
      sessionStorage.setItem('appliedCoupon', JSON.stringify(couponData));
    } else {
      sessionStorage.removeItem('appliedCoupon');
    }
    navigate('/checkout');
  };

  if (cart.length === 0) {
    return (
      <div className="cart-empty">
        <div className="container">
          <h2>Tu carrito está vacío</h2>
          <p>No has añadido ningún producto todavía</p>
          <Link to="/products" className="continue-shopping-btn">
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

          {/* ── Lista de productos ── */}
          <div className="cart-items">
            {cart.map(item => (
              <div key={item._id} className="cart-item">
                <div className="item-image">
                  <img
                    src={item.images?.[0] || 'https://via.placeholder.com/150'}
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
                    aria-label="Reducir cantidad"
                  >
                    <FaMinus />
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item._id, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                    aria-label="Aumentar cantidad"
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

          {/* ── Resumen ── */}
          <div className="cart-summary">
            <h2>Resumen del Pedido</h2>

            {/* Subtotal */}
            <div className="summary-row">
              <span>Subtotal ({cart.reduce((a, i) => a + i.quantity, 0)} productos)</span>
              <span>{formatPrice(subtotal)}</span>
            </div>

            {/* Envío */}
            <div className="summary-row">
              <span>Envío</span>
              <span className={freeShipping ? 'free-shipping-tag' : ''}>
                {freeShipping ? '¡Gratis!' : 'Gratis'}
              </span>
            </div>

            {/* Descuento aplicado */}
            {discount > 0 && (
              <div className="summary-row discount-row">
                <span>
                  Descuento
                  <span className="coupon-code-tag">
                    <FaTag /> {couponData.coupon.code}
                  </span>
                </span>
                <span className="discount-amount">−{formatPrice(discount)}</span>
              </div>
            )}

            {/* ── Sección cupón ── */}
            <div className="coupon-section">
              {couponData ? (
                /* Cupón aplicado */
                <div className="coupon-applied">
                  <div className="coupon-applied-info">
                    <FaCheckCircle className="coupon-ok-icon" />
                    <div>
                      <p className="coupon-applied-code">{couponData.coupon.code}</p>
                      <p className="coupon-applied-desc">
                        {couponData.coupon.description || (
                          couponData.coupon.type === 'percentage'
                            ? `${couponData.coupon.value}% de descuento`
                            : couponData.coupon.type === 'fixed'
                            ? `${couponData.coupon.value} € de descuento`
                            : 'Envío gratis'
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    className="coupon-remove-btn"
                    onClick={handleRemoveCoupon}
                    aria-label="Quitar cupón"
                  >
                    <FaTimes />
                  </button>
                </div>
              ) : (
                /* Input para introducir cupón */
                <form onSubmit={handleApplyCoupon} className="coupon-form">
                  <label className="coupon-label">
                    <FaTag /> ¿Tienes un cupón?
                  </label>
                  <div className="coupon-input-row">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponError('');
                      }}
                      placeholder="CÓDIGO"
                      maxLength={30}
                      aria-label="Código de cupón"
                    />
                    <button
                      type="submit"
                      disabled={couponLoading || !couponCode.trim()}
                      className="coupon-apply-btn"
                    >
                      {couponLoading ? '...' : 'Aplicar'}
                    </button>
                  </div>
                  {couponError && (
                    <p className="coupon-error">{couponError}</p>
                  )}
                </form>
              )}
            </div>

            {/* Total */}
            <div className="summary-row total">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>

            <button className="checkout-btn" onClick={handleCheckout}>
              Proceder al Pago
            </button>

            <Link to="/products" className="continue-shopping">
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