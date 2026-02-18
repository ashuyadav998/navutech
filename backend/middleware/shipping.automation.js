// backend/middleware/shipping.automation.js
const Tracking = require('../models/Tracking');
const Order = require('../models/Order');
const trackingMoreService = require('../services/trackingmore.service');
const emailService = require('../services/email-notification.service');

// ==========================================
// GENERAR NÚMERO DE TRACKING REALISTA
// ==========================================
function generateTrackingNumber() {
  // Formato similar a Correos España: PQ123456789ES
  const prefix = 'PQ';
  const suffix = 'ES';
  const digits = Math.floor(100000000 + Math.random() * 900000000);
  return `${prefix}${digits}${suffix}`;
}

// ==========================================
// CREAR ENVÍO CON TRACKINGMORE
// ==========================================
async function autoCreateShipment(orderId) {
  try {
    const order = await Order.findById(orderId).populate('user');
    if (!order) {
      console.error(`❌ Pedido ${orderId} no encontrado`);
      return;
    }

    // Verificar si ya tiene tracking
    if (order.tracking) {
      const existingTracking = await Tracking.findById(order.tracking);
      if (existingTracking) {
        console.log(`✅ Pedido ${orderId} ya tiene tracking: ${existingTracking.trackingNumber}`);
        return;
      }
    }

    // Generar tracking number
    const trackingNumber = generateTrackingNumber();
    const carrier = 'correos-es';

    // Registrar en Trackingmore
    const tmResult = await trackingMoreService.createTracking(
      trackingNumber,
      carrier,
      order._id.toString().slice(-8).toUpperCase()
    );

    if (!tmResult.success) {
      console.error(`❌ Error registrar en Trackingmore:`, tmResult.error);
      // Continuar de todos modos — guardamos el tracking localmente
    }

    // Crear documento de Tracking local
    const tracking = new Tracking({
      trackingNumber,
      carrier: 'Correos Express',
      order: order._id,
      status: 'pendiente',
      events: [{
        date: new Date(),
        location: 'Centro de distribución',
        description: 'Etiqueta creada - En espera de recogida',
        status: 'Pendiente'
      }],
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 días
      labelData: null // Trackingmore no genera PDFs, usar mock o ShipEngine
    });

    await tracking.save();

    // Asignar tracking al pedido
    order.tracking = tracking._id;
    order.status = 'enviado';
    await order.save();

    console.log(`✅ Tracking creado: ${trackingNumber} para pedido ${orderId}`);

    // Enviar email de confirmación
    if (order.user?.email) {
      await emailService.sendOrderStatusEmail(
        order.user.email,
        order.user.name,
        order._id.toString().slice(-8).toUpperCase(),
        'enviado',
        trackingNumber
      ).catch(err => console.error('Error email:', err));
    }

  } catch (error) {
    console.error(`❌ Error en autoCreateShipment:`, error);
  }
}

// ==========================================
// ACTUALIZAR ESTADO DESDE TRACKINGMORE
// ==========================================
async function updateTrackingStatus(trackingNumber) {
  try {
    const tmResult = await trackingMoreService.getTracking(trackingNumber);
    
    if (!tmResult.success) {
      console.error(`❌ Error obtener tracking ${trackingNumber}:`, tmResult.error);
      return;
    }

    // Actualizar en BD local
    const tracking = await Tracking.findOne({ trackingNumber });
    if (!tracking) {
      console.error(`❌ Tracking ${trackingNumber} no encontrado en BD local`);
      return;
    }

    tracking.status = tmResult.status;
    tracking.events = tmResult.events;
    tracking.lastUpdate = new Date();
    await tracking.save();

    // Actualizar estado del pedido
    const order = await Order.findById(tracking.order).populate('user');
    if (order && order.status !== tmResult.status) {
      order.status = tmResult.status;
      await order.save();

      // Enviar email de cambio de estado
      if (order.user?.email) {
        await emailService.sendOrderStatusEmail(
          order.user.email,
          order.user.name,
          order._id.toString().slice(-8).toUpperCase(),
          tmResult.status,
          trackingNumber
        ).catch(err => console.error('Error email:', err));
      }
    }

    console.log(`✅ Tracking ${trackingNumber} actualizado: ${tmResult.status}`);
  } catch (error) {
    console.error(`❌ Error actualizar tracking:`, error);
  }
}

// ==========================================
// CRON: ACTUALIZAR TODOS LOS ENVÍOS ACTIVOS
// ==========================================
async function syncAllActiveShipments() {
  try {
    // Obtener todos los trackings activos de la BD
    const activeTrackings = await Tracking.find({
      status: { $in: ['pendiente', 'enviado'] }
    });

    console.log(`🔄 Sincronizando ${activeTrackings.length} envíos activos...`);

    for (const tracking of activeTrackings) {
      await updateTrackingStatus(tracking.trackingNumber);
      // Delay entre peticiones para no saturar API
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
