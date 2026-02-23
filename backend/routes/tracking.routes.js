// ==========================================
// AÑADIR TRACKING MANUALMENTE (Admin)
// ==========================================
router.post('/manual', auth, isAdmin, async (req, res) => {
  try {
    const { orderId, trackingNumber, carrier } = req.body;

    const order = await Order.findById(orderId).populate('user');
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });

    // Si ya tiene tracking, actualizar; si no, crear
    let tracking;
    if (order.tracking) {
      tracking = await Tracking.findById(order.tracking);
      tracking.trackingNumber = trackingNumber;
      tracking.carrier = carrier || 'Correos España';
      tracking.events.push({
        status: 'en_preparacion',
        location: 'Añadido manualmente',
        description: 'Tracking añadido por administrador',
        timestamp: new Date()
      });
    } else {
      tracking = new Tracking({
        order: orderId,
        trackingNumber,
        carrier: carrier || 'Correos España',
        currentStatus: 'en_preparacion',
        events: [{
          status: 'en_preparacion',
          location: 'Añadido manualmente',
          description: 'Tracking añadido por administrador',
          timestamp: new Date()
        }]
      });
    }

    await tracking.save();

    if (!order.tracking) {
      order.tracking = tracking._id;
      order.orderStatus = 'enviado';
      await order.save();
    }

    // Enviar email
    const emailService = require('../services/email-notification.service');
    if (order.user?.email) {
      await emailService.sendOrderStatusEmail(
        order.user.email,
        order.user.name,
        order._id.toString().slice(-8).toUpperCase(),
        'enviado',
        trackingNumber
      );
    }

    res.json({ message: 'Tracking añadido correctamente', tracking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});