const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const VerificationCode = require('../models/VerificationCode');

const emailService = require('../services/email-notification.service');

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

router.post('/register/send-code', async (req, res) => {
  try {
    const { email, name } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'El email ya está registrado' });

    const code = generateCode();
    await VerificationCode.findOneAndUpdate(
      { email },
      { email, code, expiresAt: new Date(Date.now() + 10 * 60 * 1000), verified: false },
      { upsert: true, new: true }
    );

    await emailService.sendVerificationCode(email, code, name);
    res.json({ message: 'Código de verificación enviado a tu email', email });
  } catch (error) {
    console.error('Error en send-code:', error);
    res.status(500).json({ message: 'Error al enviar código de verificación', error: error.message });
  }
});

router.post('/register/verify-code', async (req, res) => {
  try {
    const { email, code, name, password } = req.body;

    const verification = await VerificationCode.findOne({
      email, code, verified: false, expiresAt: { $gt: new Date() }
    });
    if (!verification) return res.status(400).json({ message: 'Código inválido o expirado' });

    verification.verified = true;
    await verification.save();

    const user = new User({ name, email, password, emailVerified: true });
    await user.save();

    await emailService.sendWelcomeEmail(user);

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, emailVerified: user.emailVerified }
    });
  } catch (error) {
    console.error('Error en verify-code:', error);
    res.status(400).json({ message: 'Error al verificar código', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, active: true });
    if (!user) return res.status(401).json({ message: 'Credenciales inválidas' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Credenciales inválidas' });

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, emailVerified: user.emailVerified, avatar: user.avatar }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al iniciar sesión', error: error.message });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email, active: true });
    if (!user) {
      // Por seguridad no revelamos si existe
      return res.json({ message: 'Si el email existe, recibirás un código de verificación', email });
    }

    const code = generateCode();
    await VerificationCode.findOneAndUpdate(
      { email },
      { email, code, expiresAt: new Date(Date.now() + 10 * 60 * 1000), verified: false },
      { upsert: true, new: true }
    );

    await emailService.sendVerificationCode(email, code, user.name);
    res.json({ message: 'Código de verificación enviado a tu email', email });
  } catch (error) {
    res.status(500).json({ message: 'Error al enviar código de recuperación', error: error.message });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    // ✅ Validar longitud mínima
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const verification = await VerificationCode.findOne({
      email, code, verified: false, expiresAt: { $gt: new Date() }
    });
    if (!verification) return res.status(400).json({ message: 'Código inválido o expirado' });

    const user = await User.findOne({ email, active: true });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    verification.verified = true;
    await verification.save();

    user.password = newPassword;
    await user.save();

    // ✅ Email de confirmación de cambio de contraseña
    emailService.sendPasswordChanged(user)
      .catch(err => console.error('❌ Error email confirmación contraseña:', err));

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al resetear contraseña', error: error.message });
  }
});

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.query.token;
    if (!token) throw new Error('Token no proporcionado');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) throw new Error('Usuario no encontrado');

    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Por favor autentícate' });
  }
};

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json({
      _id: user._id, name: user.name, email: user.email, role: user.role,
      emailVerified: user.emailVerified, avatar: user.avatar, phone: user.phone, address: user.address
    });
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener perfil', error: error.message });
  }
});

router.put('/profile', auth, async (req, res) => {
  try {
    const { name, phone, address, avatar } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (address) updateData.address = address;
    if (avatar) updateData.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.userId, updateData, { new: true }).select('-password');
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar perfil', error: error.message });
  }
});

router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // ✅ Validaciones explícitas
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Debes proporcionar la contraseña actual y la nueva' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    const user = await User.findById(req.userId);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ message: 'Contraseña actual incorrecta' });

    user.password = newPassword;
    await user.save();

    // ✅ Email de confirmación
    emailService.sendPasswordChanged(user)
      .catch(err => console.error('❌ Error email confirmación contraseña:', err));

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al cambiar contraseña', error: error.message });
  }
});

router.delete('/profile', auth, async (req, res) => {
  try {
    const Order = require('../models/Order');
    const Chat = require('../models/Chat');
    await Order.deleteMany({ user: req.userId });
    await Chat.deleteMany({ user: req.userId });
    await User.findByIdAndDelete(req.userId);
    res.json({ message: 'Cuenta eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar la cuenta', error: error.message });
  }
});

const isAdmin = async (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Acceso denegado: Se requieren permisos de administrador' });
  }
};

module.exports = { router, auth, isAdmin };