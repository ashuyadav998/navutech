// backend/routes/orders.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Tracking = require('../models/Tracking');
const Notification = require('../models/Notification');
const { auth, isAdmin } = require('./auth');
const { autoCreateShipment } = require('../middleware/shipping.automation');
const emailNotificationService = require('../services/email-notification.service');

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
    autoCreateShipment(order._id).catch(err => console.error('❌ Error generando tracking automático:', err));
    res.status(201).json({ message: 'Pedido creado exitosamente', order });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear pedido', message: error.message });
  }
});

router.put('/:id/status', auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, paymentStatus } = req.body;

    const order = await Order.findById(id).populate('user', 'name email').populate('tracking');
    if (!order) return res.status(404).json({ success: false, message: 'Pedido no encontrado' });

    const oldOrderStatus = order.orderStatus;
    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    await order.save();

    // Sincronizar tracking
    if (orderStatus && order.tracking) {
      const tracking = await Tracking.findById(order.tracking);
      if (tracking) {
        const statusMap = { 'pendiente': 'pendiente', 'procesando': 'en_preparacion', 'enviado': 'en_transito', 'entregado': 'entregado', 'cancelado': 'devuelto' };
        const newTrackingStatus = statusMap[orderStatus] || 'en_transito';
        if (tracking.currentStatus !== newTrackingStatus) {
          tracking.currentStatus = newTrackingStatus;
          tracking.events.push({ status: newTrackingStatus, location: 'Actualizado por administrador', description: `Estado cambiado a: ${orderStatus}`, timestamp: new Date() });
          await tracking.save();
          console.log(`✅ Tracking actualizado: ${newTrackingStatus}`);
        }
      }
    }

    // Email
    if (orderStatus && orderStatus !== oldOrderStatus && order.user?.email) {
      emailNotificationService.sendOrderStatusEmail(order.user.email, order.user.name, order._id.toString().slice(-8).toUpperCase(), orderStatus, order.tracking?.trackingNumber || '')
        .then(() => console.log('✅ Email enviado')).catch(err => console.error('❌ Error email:', err));
    }

    // Notificación
    if (orderStatus && orderStatus !== oldOrderStatus) {
      const statusMessages = {
        'procesando': { emoji: '⚙️', title: 'Pedido en Proceso', msg: 'Tu pedido está siendo preparado' },
        'enviado': { emoji: '🚚', title: 'Pedido Enviado', msg: `Tu pedido está en camino. Tracking: ${order.tracking?.trackingNumber || 'Pendiente'}` },
        'entregado': { emoji: '✅', title: 'Pedido Entregado', msg: '¡Tu pedido ha sido entregado!' },
        'cancelado': { emoji: '❌', title: 'Pedido Cancelado', msg: 'Tu pedido ha sido cancelado' }
      };
      const notification = statusMessages[orderStatus];
      if (notification) {
        try {
          await Notification.create({ user: order.user._id, type: 'order', title: `${notification.emoji} ${notification.title}`, message: notification.msg, link: `/perfil`, icon: 'truck' });
          console.log('✅ Notificación creada');
        } catch (notifError) { console.error('⚠️ Error creando notificación:', notifError); }
      }
    }

    res.json({ success: true, message: 'Estado actualizado y notificación enviada', order: { _id: order._id, orderStatus: order.orderStatus, paymentStatus: order.paymentStatus } });
  } catch (error) {
    console.error('Error actualizando estado:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar el estado', error: error.message });
  }
});

router.get('/my-orders', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).populate('items.product').populate({ path: 'tracking', select: 'trackingNumber carrier currentStatus estimatedDelivery trackingUrl events' }).populate('user', 'name email').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener pedidos', message: error.message });
  }
});

router.get('/', auth, isAdmin, async (req, res) => {
  try {
    const orders = await Order.find().populate('items.product').populate('tracking').populate('user', 'name email').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener pedidos', message: error.message });
  }
});

router.get('/:orderId', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate('items.product').populate('tracking').populate('user', 'name email');
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'No tienes permiso para ver este pedido' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener pedido' });
  }
});

router.put('/:orderId/printed', auth, isAdmin, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.orderId, { needsPrinting: false }, { new: true });
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

router.put('/:orderId/cancel', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'No tienes permiso para cancelar este pedido' });
    if (['enviado', 'entregado'].includes(order.orderStatus)) return res.status(400).json({ error: 'No se puede cancelar un pedido ya enviado' });
    order.orderStatus = 'cancelado';
    await order.save();
    res.json({ message: 'Pedido cancelado', order });
  } catch (error) {
    res.status(500).json({ error: 'Error al cancelar pedido' });
  }
});

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
