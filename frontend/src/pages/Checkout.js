import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import '../styles/Checkout.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const stripeKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

const validarCodigoPostal = (cp) => {
  const regex = /^(?:0[1-9]|[1-4]\d|5[0-2])\d{3}$/;
  return regex.test(cp);
};

const provinciasEspana = [
  'Álava', 'Albacete', 'Alicante', 'Almería', 'Asturias', 'Ávila', 'Badajoz', 
  'Barcelona', 'Burgos', 'Cáceres', 'Cádiz', 'Cantabria', 'Castellón', 'Ciudad Real',
  'Córdoba', 'Cuenca', 'Girona', 'Granada', 'Guadalajara', 'Guipúzcoa', 'Huelva',
  'Huesca', 'Islas Baleares', 'Jaén', 'La Coruña', 'La Rioja', 'Las Palmas', 'León',
  'Lleida', 'Lugo', 'Madrid', 'Málaga', 'Murcia', 'Navarra', 'Ourense', 'Palencia',
  'Pontevedra', 'Salamanca', 'Segovia', 'Sevilla', 'Soria', 'Tarragona', 
  'Santa Cruz de Tenerife', 'Teruel', 'Toledo', 'Valencia', 'Valladolid', 
  'Vizcaya', 'Zamora', 'Zaragoza'
];

// Componente de pago Stripe
const StripePaymentForm = ({ onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError('');

    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required'
      });

      if (stripeError) {
        setError(stripeError.message);
        setLoading(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent.id);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error al procesar el pago');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <PaymentElement />
      {error && <div className="error-message">{error}</div>}
      <button 
        type="submit" 
        className="btn-finalizar-compra" 
        disabled={!stripe || loading}
      >
        {loading ? 'Procesando...' : '💳 Pagar Ahora'}
      </button>
      <div className="secure-payment">🔒 Pago 100% seguro con Stripe</div>
    </form>
  );
};

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, getCartTotal, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    street: '',
    city: '',
    province: '',
    postalCode: '',
    phone: '',
    notes: ''
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
      return;
    }

    if (!cart || cart.length === 0) {
      navigate('/carrito');
      return;
    }
  }, [isAuthenticated, cart, navigate]);

  // ✅ NUEVO: Crear PaymentIntent automáticamente cuando se elige Stripe y el formulario es válido
  useEffect(() => {
    if (paymentMethod === 'stripe' && !clientSecret) {
      // Validar que los campos principales estén llenos antes de crear PaymentIntent
      if (formData.street && formData.city && formData.province && formData.postalCode && formData.phone) {
        if (validateForm()) {
          createPaymentIntent();
        }
      }
    }
  }, [paymentMethod, formData]);

  const createPaymentIntent = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');

      console.log('🔄 Creando PaymentIntent automáticamente');

      const response = await axios.post(
        `${API_URL}/stripe/create-payment-intent`,
        {
          items: cart.map(item => ({
            product: item._id,
            quantity: item.quantity,
            price: item.price,
            name: item.name
          })),
          totalAmount: getCartTotal(),
          shippingInfo: {
            name: user?.name || 'Cliente',
            email: user?.email || '',
            phone: formData.phone,
            address: {
              street: formData.street,
              city: formData.city,
              province: formData.province,
              postalCode: formData.postalCode,
              country: 'España'
            }
          }
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('✅ PaymentIntent creado:', response.data.clientSecret);
      setClientSecret(response.data.clientSecret);
    } catch (error) {
      console.error('❌ Error al crear PaymentIntent:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.street.trim()) newErrors.street = 'Dirección obligatoria';
    if (!formData.city.trim()) newErrors.city = 'Ciudad obligatoria';
    if (!formData.province) newErrors.province = 'Selecciona provincia';
    
    if (!formData.postalCode) {
      newErrors.postalCode = 'Código postal obligatorio';
    } else if (!validarCodigoPostal(formData.postalCode)) {
      newErrors.postalCode = 'Código postal inválido';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Teléfono obligatorio';
    } else {
      const phoneRegex = /^[6-9]\d{8}$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = 'Teléfono inválido (9 dígitos, ej: 612345678)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    setClientSecret(''); // Limpiar clientSecret anterior
  };

  const handleStripeSuccess = async (paymentIntentId) => {
    try {
      const token = sessionStorage.getItem('token');
      
      console.log('✅ Confirmando pago con PaymentIntent:', paymentIntentId);

      const response = await axios.post(
        `${API_URL}/stripe/confirm-payment`,
        {
          paymentIntentId,
          cartItems: cart.map(item => ({
            product: item._id,
            productId: item._id,
            quantity: item.quantity,
            price: item.price,
            name: item.name
          })),
          totalAmount: getCartTotal(),
          shippingInfo: {
            name: user?.name || 'Cliente',
            email: user?.email || '',
            phone: formData.phone,
            address: {
              street: formData.street,
              city: formData.city,
              province: formData.province,
              postalCode: formData.postalCode,
              country: 'España'
            }
          },
          shippingAddress: {
            street: formData.street,
            city: formData.city,
            province: formData.province,
            postalCode: formData.postalCode,
            country: 'España'
          },
          phone: formData.phone,
          notes: formData.notes
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('✅ Pedido confirmado:', response.data);

      clearCart();
      alert('¡Pago realizado con éxito!');
      navigate('/');
    } catch (error) {
      console.error('❌ Error al confirmar pedido:', error);
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.details || 
                          'Error al confirmar pedido';
      
      alert(errorMessage);
      
      if (errorMessage.includes('phone')) {
        setErrors(prev => ({ ...prev, phone: 'El teléfono es requerido' }));
      }
    }
  };

  const handleOtherPaymentMethod = async () => {
    if (!validateForm()) {
      alert('Por favor, completa todos los campos correctamente');
      return;
    }

    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');

      const orderData = {
        items: cart.map(item => ({
          product: item._id,
          quantity: item.quantity,
          price: item.price,
          name: item.name
        })),
        totalAmount: paymentMethod === 'contrareembolso' ? getCartTotal() + 3 : getCartTotal(),
        shippingAddress: {
          street: formData.street,
          city: formData.city,
          province: formData.province,
          postalCode: formData.postalCode,
          country: 'España'
        },
        name: user?.name || 'Cliente',
        email: user?.email || '',
        phone: formData.phone,
        paymentMethod,
        notes: formData.notes
      };

      console.log('📦 Creando pedido:', orderData);

      const response = await axios.post(
        `${API_URL}/orders`,
        orderData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('✅ Pedido creado:', response.data);

      clearCart();
      alert('¡Pedido realizado con éxito!');
      navigate('/perfil');
    } catch (error) {
      console.error('❌ Error al crear pedido:', error);
      alert(error.response?.data?.error || error.response?.data?.message || 'Error al crear pedido');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  if (!cart || cart.length === 0) {
    return null;
  }

  return (
    <div className="checkout-page">
      <div className="container">
        <h1>Finalizar Compra</h1>

        <div className="checkout-layout">
          <div className="checkout-main">
            {/* Dirección */}
            <div className="checkout-section">
              <h2>📍 Dirección de Envío</h2>
              
              <div className="form-group">
                <label>Dirección *</label>
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  placeholder="Calle, número, piso..."
                  className={errors.street ? 'error' : ''}
                />
                {errors.street && <span className="error-text">{errors.street}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Ciudad *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={errors.city ? 'error' : ''}
                  />
                  {errors.city && <span className="error-text">{errors.city}</span>}
                </div>

                <div className="form-group">
                  <label>Código Postal *</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    placeholder="28001"
                    maxLength="5"
                    className={errors.postalCode ? 'error' : ''}
                  />
                  {errors.postalCode && <span className="error-text">{errors.postalCode}</span>}
                </div>
              </div>

              <div className="form-group">
                <label>Provincia *</label>
                <select
                  name="province"
                  value={formData.province}
                  onChange={handleInputChange}
                  className={errors.province ? 'error' : ''}
                >
                  <option value="">Selecciona provincia</option>
                  {provinciasEspana.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                {errors.province && <span className="error-text">{errors.province}</span>}
              </div>

              <div className="form-group">
                <label>Teléfono * <small>(Necesario para la entrega)</small></label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="612345678"
                  maxLength="9"
                  className={errors.phone ? 'error' : ''}
                />
                {errors.phone && <span className="error-text">{errors.phone}</span>}
                <small className="help-text">
                  📱 9 dígitos comenzando por 6, 7, 8 o 9 (sin espacios ni guiones)
                </small>
              </div>

              <div className="form-group">
                <label>Notas (opcional)</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Instrucciones especiales..."
                />
              </div>
            </div>

            {/* Métodos de pago */}
            <div className="checkout-section">
              <h2>💳 Método de Pago</h2>

              <div className="payment-methods">
                {stripePromise && (
                  <button
                    className={`payment-method-btn ${paymentMethod === 'stripe' ? 'active' : ''}`}
                    onClick={() => handlePaymentMethodChange('stripe')}
                    type="button"
                  >
                    <span className="payment-icon">💳</span>
                    <span>Tarjeta</span>
                  </button>
                )}

                <button
                  className={`payment-method-btn ${paymentMethod === 'bizum' ? 'active' : ''}`}
                  onClick={() => handlePaymentMethodChange('bizum')}
                  type="button"
                >
                  <span className="payment-icon">📱</span>
                  <span>Bizum</span>
                </button>

                <button
                  className={`payment-method-btn ${paymentMethod === 'transferencia' ? 'active' : ''}`}
                  onClick={() => handlePaymentMethodChange('transferencia')}
                  type="button"
                >
                  <span className="payment-icon">🏦</span>
                  <span>Transferencia</span>
                </button>

                <button
                  className={`payment-method-btn ${paymentMethod === 'contrareembolso' ? 'active' : ''}`}
                  onClick={() => handlePaymentMethodChange('contrareembolso')}
                  type="button"
                >
                  <span className="payment-icon">💵</span>
                  <span>Contrareembolso (+3€)</span>
                </button>
              </div>

              {/* ✅ STRIPE: Mostrar formulario directamente sin botón intermedio */}
              {paymentMethod === 'stripe' && (
                <div className="stripe-form-container" style={{ marginTop: '20px' }}>
                  {loading && (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                      Preparando pago seguro...
                    </p>
                  )}
                  {!clientSecret && !loading && (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                      Completa tu dirección de envío para continuar
                    </p>
                  )}
                  {clientSecret && stripePromise && !loading && (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <StripePaymentForm onSuccess={handleStripeSuccess} />
                    </Elements>
                  )}
                </div>
              )}

              {/* Otros métodos */}
              {paymentMethod !== 'stripe' && (
                <div className="other-payment-section">
                  {paymentMethod === 'bizum' && (
                    <p className="payment-info">📱 Recibirás instrucciones de pago por email</p>
                  )}
                  {paymentMethod === 'transferencia' && (
                    <p className="payment-info">🏦 Recibirás los datos bancarios por email</p>
                  )}
                  {paymentMethod === 'contrareembolso' && (
                    <p className="payment-info">💵 Pagarás al recibir el pedido (+3€ de coste)</p>
                  )}
                  <button 
                    className="btn-finalizar-compra"
                    onClick={handleOtherPaymentMethod}
                    disabled={loading}
                  >
                    {loading ? 'Procesando...' : '✅ Confirmar Pedido'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Resumen */}
          <div className="order-summary">
            <h2>Resumen</h2>
            <div className="order-items">
              {cart.map(item => (
                <div key={item._id} className="order-item">
                  <img src={item.images?.[0] || '/placeholder.jpg'} alt={item.name} />
                  <div className="item-details">
                    <p className="item-name">{item.name}</p>
                    <p className="item-qty">Cantidad: {item.quantity}</p>
                  </div>
                  <p className="item-price">{formatPrice(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="summary-totals">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>{formatPrice(getCartTotal())}</span>
              </div>
              <div className="summary-row">
                <span>Envío</span>
                <span>Gratis</span>
              </div>
              {paymentMethod === 'contrareembolso' && (
                <div className="summary-row">
                  <span>Contrareembolso</span>
                  <span>3,00 €</span>
                </div>
              )}
              <div className="summary-row total">
                <span>Total</span>
                <span>{formatPrice(paymentMethod === 'contrareembolso' ? getCartTotal() + 3 : getCartTotal())}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;