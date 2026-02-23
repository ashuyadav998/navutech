// backend/middleware/shipping.automation.js
const Tracking = require('../models/Tracking');
const Order = require('../models/Order');
const mockShipping = require('../services/mock-shipping.service');
const emailService = require('../services/email-notification.service');

async function autoCreateShipment(orderId) {
  try {
    const order = await Order.findById(orderId).populate('user', 'name email');
    if (!order) {
      console.warn('⚠️ autoCreateShipment: Pedido no encontrado:', orderId);
      return null;
    }

    // Evitar duplicados
    const existing = await Tracking.findOne({ order: orderId });
    if (existing) {
      if (!order.tracking) {
        order.tracking = existing._id;
        await order.save();
      }
      return existing;
    }

    // ✅ Mapear los campos de Order al formato que espera el mock
    const orderData = {
      customer: {
        name: order.user?.name || 'Cliente'
      },
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

    // 1. Crear envío y etiqueta
    const shipment = await mockShipping.createShipment({ carrier: 'correos' });
    const label    = await mockShipping.createLabel(orderData, shipment.trackingNumber);

    // 2. Guardar tracking en DB
    const tracking = new Tracking({
      order:           orderId,
      trackingNumber:  shipment.trackingNumber,
      carrier:         shipment.carrier || 'Correos Express (Simulado)',
      currentStatus:   'en_preparacion',
      labelData:       label.labelData,
      estimatedDelivery: shipment.estimatedDelivery,
      events: [{
        status:      'en_preparacion',
        description: 'Etiqueta generada automáticamente',
        timestamp:   new Date()
      }]
    });

    await tracking.save();

    // 3. ✅ Guardar referencia en el pedido
    order.tracking    = tracking._id;
    order.orderStatus = 'enviado';
    await order.save();

    // 4. Email al cliente
    emailService.sendOrderStatusUpdate(order, 'procesando', 'enviado')
      .catch(err => console.error('❌ Error enviando email:', err));

    console.log(`✅ Tracking creado: ${shipment.trackingNumber}`);
    return tracking;

  } catch (error) {
    console.error('❌ Error en autoCreateShipment:', error.message);
    return null;
  }
}

module.exports = { autoCreateShipment };