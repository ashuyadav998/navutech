// backend/routes/orders.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Tracking = require('../models/Tracking');
const { auth, isAdmin } = require('./auth');
const { autoCreateShipment } = require('../middleware/shipping.automation');
const emailNotificationService = require('../services/email-notification.service');

// ==========================================
// CREAR PEDIDO (Usuario) — genera tracking automáticamente
// ==========================================
router.post('/', auth, async (req, res) => {
  try {
    const { items, totalAmount, shippingAddress, phone, paymentMethod, notes } = req.body;

    if (!items || items.length === 0)
      return res.status(400).json({ error: 'El pedido debe tener al menos un producto' });
    if (!phone)
      return res.status(400).json({ error: 'El teléfono es obligatorio' });
    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city)
      return res.status(400).json({ error: 'La dirección de envío es obligatoria' });

    const order = new Order({
      user: req.user.id,
      items,
      totalAmount,
      shippingAddress,
      phone,
      paymentMethod: paymentMethod || 'pendiente',
      paymentStatus: 'pendiente',
      orderStatus: 'pendiente',
      notes: notes || '',
      needsPrinting: false
    });

    await order.save();

    // ✅ Generar tracking automáticamente en background
    autoCreateShipment(order._id).catch(err =>
      console.error('❌ Error generando tracking automático:', err)
    );

    res.status(201).json({ message: 'Pedido creado exitosamente', order });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear pedido', message: error.message });
  }
});

// ==========================================
// ACTUALIZAR ESTADO DEL PEDIDO CON EMAIL (Admin)
// ==========================================
router.put('/:id/status', auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, paymentStatus } = req.body;

    const order = await Order.findById(id)
      .populate('user', 'name email')
      .populate('tracking');

    if (!order)
      return res.status(404).json({ success: false, message: 'Pedido no encontrado' });

    const oldOrderStatus = order.orderStatus;

    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    await order.save();

    if (orderStatus && orderStatus !== oldOrderStatus) {
      if (!order.user?.email) {
        console.warn('⚠️ Sin email para notificar. Order:', order._id);
      } else {
        emailNotificationService.sendOrderStatusUpdate(order, oldOrderStatus, orderStatus)
          .then(() => console.log('✅ Email enviado'))
          .catch(err => console.error('❌ Error email:', err));
      }
    }

    res.json({
      success: true,
      message: 'Estado actualizado y notificación enviada',
      order: { _id: order._id, orderStatus: order.orderStatus, paymentStatus: order.paymentStatus }
    });
  } catch (error) {
    console.error('Error actualizando estado:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar el estado', error: error.message });
  }
});

// ==========================================
// OBTENER MIS PEDIDOS (Usuario autenticado)
// ==========================================
router.get('/my-orders', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate('items.product')
      .populate({ path: 'tracking', select: 'trackingNumber carrier currentStatus estimatedDelivery trackingUrl events' })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener pedidos', message: error.message });
  }
});

// ==========================================
// OBTENER TODOS LOS PEDIDOS (Admin)
// ==========================================
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('items.product')
      .populate('tracking')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener pedidos', message: error.message });
  }
});

// ==========================================
// OBTENER UN PEDIDO POR ID
// ==========================================
router.get('/:orderId', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('items.product')
      .populate('tracking')
      .populate('user', 'name email');

    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });

    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ error: 'No tienes permiso para ver este pedido' });

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener pedido' });
  }
});

// ==========================================
// MARCAR COMO IMPRESO (Admin)
// ==========================================
router.put('/:orderId/printed', auth, isAdmin, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.orderId, { needsPrinting: false }, { new: true }
    );
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });

    if (order.tracking) {
      const tracking = await Tracking.findById(order.tracking);
      if (tracking) await tracking.markAsPrinted();
    }

    res.json({ message: 'Pedido marcado como impreso', order });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar pedido' });
  }
});

// ==========================================
// CANCELAR PEDIDO
// ==========================================
router.put('/:orderId/cancel', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });

    if (order.user.toString() !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ error: 'No tienes permiso para cancelar este pedido' });

    if (['enviado', 'entregado'].includes(order.orderStatus))
      return res.status(400).json({ error: 'No se puede cancelar un pedido ya enviado' });

    order.orderStatus = 'cancelado';
    await order.save();

    res.json({ message: 'Pedido cancelado', order });
  } catch (error) {
    res.status(500).json({ error: 'Error al cancelar pedido' });
  }
});

// ==========================================
// WEBHOOK: Confirmar pago de Stripe
// ==========================================
router.post('/webhook/payment-confirmed', async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });

    order.paymentStatus = 'pagado';
    order.orderStatus = 'procesando';
    await order.save();

    autoCreateShipment(orderId).catch(err => console.error('Error en automatización:', err));

    res.json({ message: 'Pago confirmado y envío en proceso' });
  } catch (error) {
    res.status(500).json({ error: 'Error al procesar webhook' });
  }
});

module.exports = router;