// backend/models/Tracking.js
const mongoose = require('mongoose');

const trackingEventSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pendiente', 'en_preparacion', 'enviado', 'en_transito', 'en_reparto', 'entregado', 'incidencia', 'devuelto'],
    required: true
  },
  location: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const trackingSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    unique: true
  },
  trackingNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  carrier: {
    type: String,
    default: 'Correos España'
  },
  currentStatus: {
    type: String,
    enum: ['pendiente', 'en_preparacion', 'enviado', 'en_transito', 'en_reparto', 'entregado', 'incidencia', 'devuelto'],
    default: 'pendiente'
  },
  estimatedDelivery: {
    type: Date
  },
  events: [trackingEventSchema],
  
  // Etiqueta y costes
  labelData: {
    type: String, // PDF en Base64
    default: null
  },
  trackingUrl: {
    type: String,
    default: ''
  },
  shipmentCost: {
    type: Number,
    default: 0
  },
  
  // Info del paquete
  weight: {
    type: Number,
    default: 1
  },
  dimensions: {
    length: { type: Number, default: 30 },
    width: { type: Number, default: 20 },
    height: { type: Number, default: 10 }
  },
  
  // Control de impresión
  printed: {
    type: Boolean,
    default: false
  },
  printedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Método para marcar como impreso
trackingSchema.methods.markAsPrinted = function() {
  this.printed = true;
  this.printedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Tracking', trackingSchema);