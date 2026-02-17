const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { auth, isAdmin } = require('./auth');

// ==========================================
// OBTENER MIS NOTIFICACIONES (Usuario)
// ==========================================
router.get('/my-notifications', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id }) // ✅ Fix
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
});

// ==========================================
// MARCAR TODAS COMO LEÍDAS
// ⚠️ IMPORTANTE: Esta ruta debe ir ANTES de /:id/read
// Si va después, Express interpreta "mark-all-read" como un :id
// ==========================================
router.put('/mark-all-read', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, read: false }, // ✅ Fix
      { read: true }
    );

    res.json({ message: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar notificaciones' });
  }
});

// ==========================================
// MARCAR NOTIFICACIÓN COMO LEÍDA
// ==========================================
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }

    if (notification.user.toString() !== req.user.id) { // ✅ Fix
      return res.status(403).json({ error: 'No autorizado' });
    }

    notification.read = true;
    await notification.save();

    res.json({ message: 'Notificación marcada como leída', notification });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar notificación' });
  }
});

// ==========================================
// ELIMINAR NOTIFICACIÓN
// ==========================================
router.delete('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }

    if (notification.user.toString() !== req.user.id) { // ✅ Fix
      return res.status(403).json({ error: 'No autorizado' });
    }

    await notification.deleteOne();

    res.json({ message: 'Notificación eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar notificación' });
  }
});

// ==========================================
// CREAR NOTIFICACIÓN (Admin o Sistema)
// ==========================================
router.post('/', auth, async (req, res) => {
  try {
    const { userId, title, message, type, link } = req.body;

    if (req.user.role !== 'admin' && userId !== req.user.id) { // ✅ Fix
      return res.status(403).json({ error: 'No autorizado' });
    }

    const notification = new Notification({
      user: userId || req.user.id, // ✅ Fix
      title,
      message,
      type: type || 'info',
      link: link || null,
      read: false
    });

    await notification.save();

    res.status(201).json({ message: 'Notificación creada', notification });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear notificación' });
  }
});

// ==========================================
// OBTENER TODAS LAS NOTIFICACIONES (Admin)
// ==========================================
router.get('/admin/all', auth, isAdmin, async (req, res) => {
  try {
    const notifications = await Notification.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
});

module.exports = router;