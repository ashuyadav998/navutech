// backend/middleware/shipping.automation.js
const Tracking = require('../models/Tracking');
const Order = require('../models/Order');
const trackingMoreService = require('../services/trackingmore.service');
const emailService = require('../services/email-notification.service');

function generateTrackingNumber() {
  const prefix = 'PQ';
  const suffix = 'ES';
  const digits = Math.floor(100000000 + Math.random() * 900000000);
  return `${prefix}${digits}${suffix}`;
}

async function autoCreateShipment(orderId) {
  try {
    const order = await Order.findById(orderId).populate('user');
    if (!order) {
      console.error(`❌ Pedido ${orderId} no encontrado`);
      return;
    }

    if (order.tracking) {
      const existingTracking = await Tracking.findById(order.tracking);
      if (existingTracking) {
        console.log(`✅ Pedido ${orderId} ya tiene tracking: ${existingTracking.trackingNumber}`);
        return;
      }
    }

    const trackingNumber = generateTrackingNumber();
    const carrier = 'correos-spain';

    // Registrar en Trackingmore
    const tmResult = await trackingMoreService.createTracking(
      trackingNumber,
      carrier,
      order._id.toString().slice(-8).toUpperCase()
    );

    if (!tmResult.success) {
      console.error(`❌ Error registrar en Trackingmore:`, tmResult.error);
    }

    // Crear documento de Tracking local
    const tracking = new Tracking({
      trackingNumber,
      carrier: 'Correos España',
      order: order._id,
      currentStatus: 'pendiente',
      events: [{
        status: 'pendiente', // ✅ minúscula para match con enum
        location: 'Centro de distribución',
        description: 'Etiqueta creada - En espera de recogida',
        timestamp: new Date()
      }],
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      labelData: null
    });

    await tracking.save();

    order.tracking = tracking._id;
    order.status = 'enviado';
    await order.save();

    console.log(`✅ Tracking creado: ${trackingNumber} para pedido ${orderId}`);

    // Enviar email
    if (order.user?.email) {
      await emailService.sendOrderStatusEmail(
        order.user.email,
        order.user.name,
        order._id.toString().slice(-8).toUpperCase(),
        'enviado',
        trackingNumber
      ).catch(err => console.error('❌ Error email:', err));
    }

  } catch (error) {
    console.error(`❌ Error en autoCreateShipment:`, error);
  }
}

async function updateTrackingStatus(trackingNumber) {
  try {
    const tmResult = await trackingMoreService.getTracking(trackingNumber);
    
    if (!tmResult.success) {
      console.error(`❌ Error obtener tracking ${trackingNumber}:`, tmResult.error);
      return;
    }

    const tracking = await Tracking.findOne({ trackingNumber });
    if (!tracking) {
      console.error(`❌ Tracking ${trackingNumber} no encontrado en BD local`);
      return;
    }

    // Mapear eventos de Trackingmore a nuestro enum
    const mappedEvents = tmResult.events.map(event => ({
      status: mapStatus(tmResult.status),
      location: event.location || '',
      description: event.description || '',
      timestamp: new Date(event.date || event.time)
    }));

    tracking.currentStatus = mapStatus(tmResult.status);
    tracking.events = mappedEvents;
    await tracking.save();

    // Actualizar pedido
    const order = await Order.findById(tracking.order).populate('user');
    if (order && order.status !== tracking.currentStatus) {
      order.status = tracking.currentStatus;
      await order.save();

      if (order.user?.email) {
        await emailService.sendOrderStatusEmail(
          order.user.email,
          order.user.name,
          order._id.toString().slice(-8).toUpperCase(),
          tracking.currentStatus,
          trackingNumber
        ).catch(err => console.error('❌ Error email:', err));
      }
    }

    console.log(`✅ Tracking ${trackingNumber} actualizado: ${tracking.currentStatus}`);
  } catch (error) {
    console.error(`❌ Error actualizar tracking:`, error);
  }
}

// Mapear estados de Trackingmore a nuestro enum
function mapStatus(tmStatus) {
  const map = {
    'pending': 'pendiente',
    'notfound': 'pendiente',
    'transit': 'en_transito',
    'pickup': 'en_preparacion',
    'delivered': 'entregado',
    'undelivered': 'en_reparto',
    'exception': 'incidencia',
    'expired': 'devuelto'
  };
  return map[tmStatus] || 'en_transito';
}

async function syncAllActiveShipments() {
  try {
    const activeTrackings = await Tracking.find({
      currentStatus: { $in: ['pendiente', 'en_preparacion', 'enviado', 'en_transito', 'en_reparto'] }
    });

    console.log(`🔄 Sincronizando ${activeTrackings.length} envíos activos...`);

    for (const tracking of activeTrackings) {
      await updateTrackingStatus(tracking.trackingNumber);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`✅ Sincronización completada`);
  } catch (error) {
    console.error(`❌ Error en sincronización:`, error);
  }
}

module.exports = {
  autoCreateShipment,
  updateTrackingStatus,
  syncAllActiveShipments
};
