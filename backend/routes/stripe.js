// backend/routes/stripe.js
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { auth } = require('./auth');
const Order = require('../models/Order');
const User = require('../models/User');
const { sendOrderConfirmation } = require('../services/email-notification.service');
const Notification = require('../models/Notification');
const { autoCreateShipment } = require('../middleware/shipping.automation');

// Crear intención de pago
router.post('/create-payment-intent', auth, async (req, res) => {
  try {
    const { items, totalAmount } = req.body;

    // Verificar que hay items
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'El carrito está vacío' });
    }

    // Obtener o crear customer de Stripe
    let user = await User.findById(req.userId);
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user._id.toString()
        }
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    // Crear PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convertir a centavos
      currency: 'eur',
      customer: customerId,
      metadata: {
        userId: user._id.toString(),
        itemsCount: items.length
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Error al crear PaymentIntent:', error);
    res.status(500).json({ 
      message: 'Error al procesar el pago', 
      error: error.message 
    });
  }
});

// Confirmar pago y crear pedido
router.post('/confirm-payment', auth, async (req, res) => {
  try {
    // ✅ EXTRAER PHONE DE MÚLTIPLES FUENTES POSIBLES
    const { 
      paymentIntentId, 
      items, 
      cartItems, // Soporte para ambos nombres
      totalAmount, 
      shippingAddress,
      shippingInfo, // Soporte alternativo
      phone, // ✅ CRÍTICO
      notes 
    } = req.body;

    console.log('📝 Datos recibidos:', {
      paymentIntentId,
      hasItems: !!(items || cartItems),
      hasShippingAddress: !!shippingAddress,
      hasShippingInfo: !!shippingInfo,
      hasPhone: !!phone,
      phoneFromShippingInfo: shippingInfo?.phone
    });

    // ✅ EXTRAER PHONE DE MÚLTIPLES UBICACIONES
    const userPhone = phone || 
                     shippingInfo?.phone || 
                     shippingAddress?.phone;

    // ✅ VALIDAR QUE EXISTE EL TELÉFONO
    if (!userPhone) {
      return res.status(400).json({ 
        error: 'El teléfono es requerido para procesar el pedido',
        message: 'El teléfono es requerido para procesar el pedido'
      });
    }

    // Verificar el estado del pago en Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ 
        message: 'El pago no fue exitoso',
        status: paymentIntent.status 
      });
    }

    // ✅ EXTRAER DIRECCIÓN (con soporte para múltiples formatos)
    const address = shippingInfo?.address || shippingAddress;
    
    if (!address) {
      return res.status(400).json({ 
        error: 'La dirección de envío es requerida',
        message: 'La dirección de envío es requerida'
      });
    }

    // ✅ PREPARAR ITEMS (soporte para ambos nombres)
    const orderItems = cartItems || items;
    
    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ 
        error: 'No hay items en el pedido',
        message: 'No hay items en el pedido'
      });
    }

    // ✅ CREAR PEDIDO CON TODOS LOS CAMPOS REQUERIDOS
    const order = new Order({
      user: req.userId,
      items: orderItems.map(item => ({
        product: item.product || item.productId || item._id,
        quantity: item.quantity || 1,
        price: item.price || 0
      })),
      totalAmount,
      shippingAddress: {
        street: address.street,
        city: address.city,
        province: address.province || '',
        postalCode: address.postalCode,
        country: address.country || 'España'
      },
      phone: userPhone, // ✅ AÑADIDO - CAMPO CRÍTICO
      paymentMethod: 'stripe',
      paymentStatus: 'pagado',
      orderStatus: 'procesando',
      notes: notes || '',
      stripePaymentIntentId: paymentIntentId
    });


    await order.save();
    await order.populate('items.product user');


    // 🚢 INTEGRACIÓN SHIPSTATION - CREAR ENVÍO AUTOMÁTICAMENTE
    try {
      
      const tracking = await autoCreateShipment(order._id.toString());
      
      if (tracking) {
        
        // Recargar orden para incluir tracking
        await order.populate('tracking');
        
        // Actualizar notificación con tracking
        try {
          await Notification.create({
            user: req.userId,
            type: 'shipping',
            title: '🚢 Envío Generado',
            message: `Tu pedido #${order._id.toString().slice(-8)} tiene número de seguimiento: ${tracking.trackingNumber}`,
            link: `/perfil/pedidos/${order._id}`,
            icon: 'truck'
          });
        } catch (notifError) {
          console.error('⚠️ Error creando notificación de envío:', notifError.message);
        }
      } else {
      }
    } catch (shipError) {
      // NO FALLAR LA ORDEN si falla el envío
      console.error('⚠️ Error al crear envío (no crítico):', shipError.message);
      console.error('📋 Detalles:', shipError);
      
      // El envío se creará manualmente desde el panel admin
    }

    // Enviar email de confirmación
    try {
      const user = await User.findById(req.userId);
      await sendOrderConfirmation(order, user);
    } catch (emailError) {
      console.error('⚠️ Error enviando email (no crítico):', emailError.message);
    }

    // Crear notificación de pedido
    try {
      await Notification.create({
        user: req.userId,
        type: 'order',
        title: '✅ Pedido Confirmado',
        message: `Tu pedido #${order._id.toString().slice(-8)} ha sido confirmado y está siendo procesado.`,
        link: `/perfil/pedidos/${order._id}`,
        icon: 'check-circle'
      });
    } catch (notifError) {
      console.error('⚠️ Error creando notificación (no crítico):', notifError.message);
    }

    // ✅ RESPUESTA CON TRACKING SI EXISTE
    res.status(201).json({
      message: 'Pedido creado exitosamente',
      order: {
        id: order._id,
        orderNumber: order._id.toString().slice(-8),
        totalAmount: order.totalAmount,
        status: order.orderStatus,
        phone: order.phone,
        trackingNumber: order.trackingNumber || null,
        hasTracking: !!order.tracking
      }
    });
  } catch (error) {
    console.error('❌ Error al confirmar pago:', error);
    
    // ✅ MANEJO ESPECÍFICO DE ERRORES DE VALIDACIÓN
    if (error.name === 'ValidationError') {
      const missingFields = Object.keys(error.errors);
      const messages = missingFields.map(field => 
        `${field}: ${error.errors[field].message}`
      );
      
      return res.status(400).json({ 
        error: 'Error de validación en el pedido',
        message: messages.join(', '),
        missingFields: missingFields,
        details: error.errors
      });
    }
    
    res.status(500).json({ 
      message: 'Error al confirmar el pago', 
      error: error.message 
    });
  }
});

// Webhook de Stripe (para eventos en tiempo real)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Error en webhook:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Manejar diferentes eventos
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      
      // Actualizar orden si existe
      try {
        const order = await Order.findOneAndUpdate(
          { stripePaymentIntentId: paymentIntent.id },
          { 
            paymentStatus: 'pagado',
            orderStatus: 'procesando'
          },
          { new: true }
        ).populate('items.product user');

        // 🚢 INTENTAR CREAR ENVÍO SI NO EXISTE
        if (order && !order.tracking) {
          try {
            await autoCreateShipment(order._id.toString());
          } catch (shipError) {
            console.error('⚠️ Error creando envío desde webhook:', shipError.message);
          }
        }
      } catch (err) {
        console.error('Error actualizando orden:', err);
      }
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      
      try {
        await Order.findOneAndUpdate(
          { stripePaymentIntentId: failedPayment.id },
          { 
            paymentStatus: 'fallido',
            orderStatus: 'cancelado'
          }
        );
      } catch (err) {
        console.error('Error actualizando orden fallida:', err);
      }
      break;

    default:
  }

  res.json({ received: true });
});

module.exports = router;