// models/Coupon.js
const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed', 'free_shipping'],
    required: true
  },
  value: {
    // Para percentage: 0-100. Para fixed: euros. Para free_shipping: ignorado
    type: Number,
    default: 0,
    min: 0
  },
  minOrderAmount: {
    // Importe mínimo del carrito para poder aplicar el cupón
    type: Number,
    default: 0,
    min: 0
  },
  maxUses: {
    // null = ilimitado
    type: Number,
    default: null
  },
  usedCount: {
    type: Number,
    default: 0
  },
  expiresAt: {
    // null = no expira
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Método para comprobar si el cupón es válido dado un total de carrito
couponSchema.methods.validate = function(cartTotal) {
  const now = new Date();

  if (!this.isActive)
    return { valid: false, error: 'Este cupón no está activo' };

  if (this.expiresAt && this.expiresAt < now)
    return { valid: false, error: 'Este cupón ha expirado' };

  if (this.maxUses !== null && this.usedCount >= this.maxUses)
    return { valid: false, error: 'Este cupón ha alcanzado el límite de usos' };

  if (cartTotal < this.minOrderAmount)
    return {
      valid: false,
      error: `El pedido mínimo para este cupón es ${this.minOrderAmount.toFixed(2)} €`
    };

  return { valid: true };
};

// Calcula el descuento aplicado sobre un total
couponSchema.methods.calculateDiscount = function(cartTotal) {
  switch (this.type) {
    case 'percentage':
      return parseFloat(((cartTotal * this.value) / 100).toFixed(2));
    case 'fixed':
      return Math.min(this.value, cartTotal); // no puede ser mayor que el total
    case 'free_shipping':
      return 0; // el descuento de envío se gestiona aparte
    default:
      return 0;
  }
};

module.exports = mongoose.model('Coupon', couponSchema);