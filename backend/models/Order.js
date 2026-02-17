const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  shippingAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    province: { type: String },
    postalCode: { type: String, required: true },
    country: { type: String, required: true, default: 'España' }
  },
  phone: {
    type: String,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'bizum', 'transferencia', 'contrareembolso'],
    required: true,
    default: 'stripe'
  },
  paymentStatus: {
    type: String,
    enum: ['pendiente', 'pagado', 'fallido'],
    default: 'pendiente'
  },
  orderStatus: {
    type: String,
    enum: ['pendiente', 'procesando', 'enviado', 'entregado', 'cancelado'],
    default: 'pendiente'
  },
  stripePaymentIntentId: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    default: ''
  },
  // --- CAMBIOS PARA LOGÍSTICA ---
  tracking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tracking', // Asegúrate de que tu modelo de tracking se llame 'Tracking'
    default: null
  },
  trackingNumber: { // Mantenemos este por si guardas el string directamente
    type: String,
    default: ''
  },
  needsPrinting: { // Para el aviso visual de "Pendiente de imprimir"
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);