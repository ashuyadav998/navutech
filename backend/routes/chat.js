const express = require('express');
const router = express.Router();
const { auth } = require('./auth');
const Chat = require('../models/Chat');

// Obtener o crear chat del usuario
router.get('/my-chat', auth, async (req, res) => {
  try {
    let chat = await Chat.findOne({ user: req.userId }).populate('user', 'name email avatar');

    if (!chat) {
      // Crear nuevo chat
      chat = new Chat({
        user: req.userId,
        messages: [{
          sender: 'admin',
          text: '¡Hola! Bienvenido a nuestro chat de soporte. ¿En qué podemos ayudarte hoy?',
          timestamp: new Date()
        }],
        status: 'open'
      });
      await chat.save();
      await chat.populate('user', 'name email avatar');
    }

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener chat', error: error.message });
  }
});

// ✅ NUEVA RUTA: Iniciar nuevo chat (después de haber cerrado uno)
router.post('/start-new-chat', auth, async (req, res) => {
  try {
    // Buscar si hay un chat existente
    const existingChat = await Chat.findOne({ user: req.userId });

    if (existingChat) {
      // Si existe un chat cerrado, crear uno nuevo
      if (existingChat.status === 'closed') {
        // Eliminar el chat anterior o archivarlo
        await Chat.findByIdAndDelete(existingChat._id);
        
        // Crear nuevo chat
        const newChat = new Chat({
          user: req.userId,
          messages: [{
            sender: 'admin',
            text: '¡Hola! Bienvenido de nuevo. ¿En qué podemos ayudarte?',
            timestamp: new Date()
          }],
          status: 'open'
        });
        
        await newChat.save();
        await newChat.populate('user', 'name email avatar');
        
        return res.json(newChat);
      }
      
      // Si el chat está abierto, devolver el existente
      await existingChat.populate('user', 'name email avatar');
      return res.json(existingChat);
    }

    // Si no existe ningún chat, crear uno nuevo
    const newChat = new Chat({
      user: req.userId,
      messages: [{
        sender: 'admin',
        text: '¡Hola! Bienvenido a nuestro chat de soporte. ¿En qué podemos ayudarte hoy?',
        timestamp: new Date()
      }],
      status: 'open'
    });
    
    await newChat.save();
    await newChat.populate('user', 'name email avatar');
    
    res.json(newChat);
    
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al iniciar nuevo chat', 
      error: error.message 
    });
  }
});

// Enviar mensaje
router.post('/send-message', auth, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'El mensaje no puede estar vacío' });
    }

    let chat = await Chat.findOne({ user: req.userId });

    if (!chat) {
      chat = new Chat({ 
        user: req.userId, 
        messages: [],
        status: 'open'
      });
    }

    // No permitir enviar mensajes si el chat está cerrado
    if (chat.status === 'closed') {
      return res.status(400).json({ 
        message: 'Este chat está cerrado. Inicia una nueva conversación.' 
      });
    }

    chat.messages.push({
      sender: 'user',
      text: text.trim(),
      timestamp: new Date()
    });

    chat.lastActivity = new Date();
    chat.status = 'open';
    await chat.save();

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Error al enviar mensaje', error: error.message });
  }
});

// Marcar mensajes como leídos
router.put('/mark-read', auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({ user: req.userId });

    if (!chat) {
      return res.status(404).json({ message: 'Chat no encontrado' });
    }

    chat.messages.forEach(msg => {
      if (msg.sender === 'admin') {
        msg.read = true;
      }
    });

    await chat.save();
    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Error al marcar mensajes', error: error.message });
  }
});

// Cerrar chat desde el cliente
router.put('/close-my-chat', auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({ user: req.userId });

    if (!chat) {
      return res.status(404).json({ message: 'Chat no encontrado' });
    }

    // Cambiar estado a cerrado
    chat.status = 'closed';
    
    // Añadir mensaje automático de cierre
    chat.messages.push({
      sender: 'admin',
      text: '✅ Conversación finalizada. ¡Gracias por contactarnos! Si necesitas más ayuda, puedes iniciar una nueva conversación.',
      timestamp: new Date(),
      read: true
    });

    await chat.save();

    res.json({ 
      message: 'Chat cerrado correctamente',
      chat 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al cerrar chat', 
      error: error.message 
    });
  }
});

// RUTAS DE ADMIN

// Obtener todos los chats (admin)
router.get('/admin/chats', auth, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.userId);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado. Solo administradores.' });
    }

    const { status } = req.query;
    const query = status ? { status } : {};

    const chats = await Chat.find(query)
      .populate('user', 'name email avatar')
      .sort({ lastActivity: -1 });

    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener chats', error: error.message });
  }
});

// Responder en chat (admin)
router.post('/admin/send-message/:chatId', auth, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.userId);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado. Solo administradores.' });
    }

    const { text } = req.body;
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({ message: 'Chat no encontrado' });
    }

    chat.messages.push({
      sender: 'admin',
      text: text.trim(),
      timestamp: new Date()
    });

    chat.lastActivity = new Date();
    await chat.save();

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Error al enviar mensaje', error: error.message });
  }
});

// Cerrar chat (admin)
router.put('/admin/close-chat/:chatId', auth, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.userId);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado. Solo administradores.' });
    }

    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({ message: 'Chat no encontrado' });
    }

    chat.status = 'closed';
    
    chat.messages.push({
      sender: 'admin',
      text: `✅ Conversación finalizada por ${user.name || 'el administrador'}. Si necesitas más ayuda, puedes iniciar un nuevo chat.`,
      timestamp: new Date(),
      read: true
    });

    await chat.save();

    res.json({
      message: 'Chat cerrado correctamente',
      chat
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al cerrar chat', error: error.message });
  }
});

module.exports = router;