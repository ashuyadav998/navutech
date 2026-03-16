// routes/coupons.js
const express = require('express');
const router  = express.Router();
const Coupon  = require('../models/Coupon');
const { auth, isAdmin } = require('./auth');

/* ─────────────────────────────────────────
   PUBLIC — Validar un cupón (requiere auth)
   POST /api/coupons/validate
   Body: { code, cartTotal }
───────────────────────────────────────── */
router.post('/validate', auth, async (req, res) => {
  try {
    const { code, cartTotal } = req.body;

    if (!code)
      return res.status(400).json({ error: 'Introduce un código de cupón' });

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });

    if (!coupon)
      return res.status(404).json({ error: 'Cupón no válido o inexistente' });

    const check = coupon.validate(cartTotal || 0);
    if (!check.valid)
      return res.status(400).json({ error: check.error });

    const discount = coupon.calculateDiscount(cartTotal || 0);

    return res.json({
      valid: true,
      coupon: {
        _id:            coupon._id,
        code:           coupon.code,
        description:    coupon.description,
        type:           coupon.type,
        value:          coupon.value,
        freeShipping:   coupon.type === 'free_shipping',
        minOrderAmount: coupon.minOrderAmount,
        expiresAt:      coupon.expiresAt
      },
      discount,
      newTotal: parseFloat(Math.max(0, (cartTotal || 0) - discount).toFixed(2))
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al validar el cupón', message: err.message });
  }
});

/* ─────────────────────────────────────────
   ADMIN — Listar todos
   GET /api/coupons
───────────────────────────────────────── */
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener cupones', message: err.message });
  }
});

/* ─────────────────────────────────────────
   ADMIN — Crear cupón
   POST /api/coupons
───────────────────────────────────────── */
router.post('/', auth, isAdmin, async (req, res) => {
  try {
    const { code, description, type, value, minOrderAmount, maxUses, expiresAt, isActive } = req.body;

    if (!code || !type)
      return res.status(400).json({ error: 'Código y tipo son obligatorios' });

    if (type === 'percentage' && (value <= 0 || value > 100))
      return res.status(400).json({ error: 'El porcentaje debe ser entre 1 y 100' });

    if (type === 'fixed' && value <= 0)
      return res.status(400).json({ error: 'El valor fijo debe ser mayor que 0' });

    const exists = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (exists)
      return res.status(400).json({ error: 'Ya existe un cupón con ese código' });

    const coupon = new Coupon({
      code:           code.toUpperCase().trim(),
      description:    description || '',
      type,
      value:          value || 0,
      minOrderAmount: minOrderAmount || 0,
      maxUses:        maxUses || null,
      expiresAt:      expiresAt || null,
      isActive:       isActive !== undefined ? isActive : true
    });

    await coupon.save();
    res.status(201).json({ message: 'Cupón creado correctamente', coupon });
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ error: 'Ya existe un cupón con ese código' });
    res.status(500).json({ error: 'Error al crear el cupón', message: err.message });
  }
});

/* ─────────────────────────────────────────
   ADMIN — Actualizar cupón
   PUT /api/coupons/:id
───────────────────────────────────────── */
router.put('/:id', auth, isAdmin, async (req, res) => {
  try {
    const { code, description, type, value, minOrderAmount, maxUses, expiresAt, isActive } = req.body;

    const coupon = await Coupon.findById(req.params.id);
    if (!coupon)
      return res.status(404).json({ error: 'Cupón no encontrado' });

    if (code) coupon.code = code.toUpperCase().trim();
    if (description !== undefined) coupon.description    = description;
    if (type)                      coupon.type           = type;
    if (value !== undefined)       coupon.value          = value;
    if (minOrderAmount !== undefined) coupon.minOrderAmount = minOrderAmount;
    if (maxUses !== undefined)     coupon.maxUses        = maxUses || null;
    if (expiresAt !== undefined)   coupon.expiresAt      = expiresAt || null;
    if (isActive !== undefined)    coupon.isActive       = isActive;

    await coupon.save();
    res.json({ message: 'Cupón actualizado', coupon });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar el cupón', message: err.message });
  }
});

/* ─────────────────────────────────────────
   ADMIN — Eliminar cupón
   DELETE /api/coupons/:id
───────────────────────────────────────── */
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon)
      return res.status(404).json({ error: 'Cupón no encontrado' });
    res.json({ message: 'Cupón eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar el cupón', message: err.message });
  }
});

module.exports = router;