const express = require('express');
const router = express.Router();
const Tracking = require('../models/Tracking');
const Order = require('../models/Order');
const { auth, isAdmin } = require('./auth');
const mockShipping = require('../services/mock-shipping.service');
const emailService = require('../services/email-notification.service');

router.post('/create', auth, isAdmin, async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId).populate('user', 'name email');

    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });

    const existing = await Tracking.findOne({ order: orderId });
    if (existing) {
      if (!order.tracking) {
        order.tracking = existing._id;
        await order.save();
      }
      return res.status(200).json({ message: 'Ya tenía tracking', tracking: existing });
    }

    const orderData = {
      customer: { name: order.user?.name || 'Cliente' },
      shippingAddress: {
        street:     order.shippingAddress?.street     || '',
        city:       order.shippingAddress?.city       || '',
        postalCode: order.shippingAddress?.postalCode || '',
        province:   order.shippingAddress?.province   || '',
        country:    order.shippingAddress?.country    || 'España'
      },
      phone:       order.phone || '',
      orderNumber: order._id.toString().slice(-8).toUpperCase(),
      weight:      0.5
    };

    const shipment = await mockShipping.createShipment({ carrier: 'correos' });
    const label    = await mockShipping.createLabel(orderData, shipment.trackingNumber);

    const tracking = new Tracking({
      order:             orderId,
      trackingNumber:    shipment.trackingNumber,
      carrier:           shipment.carrier || 'Correos Express (Simulado)',
      currentStatus:     'en_preparacion',
      labelData:         label.labelData,
      estimatedDelivery: shipment.estimatedDelivery,
      events: [{
        status:      'en_preparacion',
        description: 'Etiqueta generada manualmente por el administrador',
        timestamp:   new Date()
      }]
    });

    await tracking.save();

    order.tracking    = tracking._id;
    order.orderStatus = 'enviado';
    await order.save();

    // ✅ Corregido: sendOrderStatusEmail con parámetros correctos
    if (order.user?.email) {
      emailService.sendOrderStatusEmail(
        order.user.email,
        order.user.name,
        order._id.toString().slice(-8).toUpperCase(),
        'enviado',
        shipment.trackingNumber
      ).catch(err => console.error('❌ Error email:', err));
    }

    res.status(201).json({ message: 'Envío creado y email enviado', tracking });
  } catch (error) {
    console.error('❌ Error en POST /tracking/create:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:trackingNumber/label', auth, async (req, res) => {
  try {
    const tracking = await Tracking.findOne({ trackingNumber: req.params.trackingNumber });

    if (!tracking || !tracking.labelData) {
      return res.status(404).json({ error: 'Etiqueta no encontrada' });
    }

    const pdfBuffer = Buffer.from(tracking.labelData, 'base64');
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=etiqueta-${tracking.trackingNumber}.pdf`,
      'Content-Length': pdfBuffer.length
    });
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: 'Error al procesar PDF' });
  }
});

router.get('/:trackingNumber/label/preview', async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) return res.status(401).json({ error: 'Token requerido' });

    const jwt = require('jsonwebtoken');
    jwt.verify(token, process.env.JWT_SECRET);

    const tracking = await Tracking.findOne({ trackingNumber: req.params.trackingNumber });

    if (!tracking || !tracking.labelData) {
      return res.status(404).send('Etiqueta no encontrada');
    }

    const pdfBuffer = Buffer.from(tracking.labelData, 'base64');
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename=etiqueta-${tracking.trackingNumber}.pdf`,
      'Content-Length': pdfBuffer.length
    });
    res.send(pdfBuffer);
  } catch (error) {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
});

router.put('/:trackingId/status', auth, isAdmin, async (req, res) => {
  try {
    const { status, description } = req.body;
    const tracking = await Tracking.findById(req.params.trackingId).populate({
      path: 'order', populate: { path: 'user' }
    });

    if (!tracking) return res.status(404).json({ error: 'Tracking no encontrado' });

    const oldStatus = tracking.currentStatus;
    tracking.currentStatus = status;
    tracking.events.push({ status, description, timestamp: new Date() });
    await tracking.save();

    if (['entregado', 'en_reparto'].includes(status)) {
      tracking.order.orderStatus = status;
      await tracking.order.save();
    }

    // ✅ Corregido: sendOrderStatusEmail con parámetros correctos
    if (tracking.order.user?.email) {
      await emailService.sendOrderStatusEmail(
        tracking.order.user.email,
        tracking.order.user.name,
        tracking.order._id.toString().slice(-8).toUpperCase(),
        status,
        tracking.trackingNumber
      ).catch(err => console.error('❌ Error email:', err));
    }

    res.json(tracking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
