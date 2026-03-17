const Chat = require('../models/Chat');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

module.exports = (io) => {
  const connectedUsers = new Map();
  const adminSockets = new Set();

  io.on("connection", (socket) => {
    console.log(`🟢 Cliente conectado: ${socket.id}`);

    socket.on("authenticate", async (token) => {
      try {
        if (!token) {
          console.log("❌ Token no proporcionado");
          socket.emit("auth_error", { message: "Token no proporcionado" });
          return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (!user) {
          console.log("❌ Usuario no encontrado");
          socket.emit("auth_error", { message: "Usuario no encontrado" });
          return;
        }

        socket.userId = user._id.toString();
        socket.userName = user.name;
        socket.userRole = user.role;

        connectedUsers.set(socket.userId, socket.id);

        if (user.role === 'admin') {
          adminSockets.add(socket.id);
          socket.join('admins');
          console.log(`✅ Admin autenticado: ${user.name} (Socket: ${socket.id})`);
          console.log(`📊 Total admins conectados: ${adminSockets.size}`);
          console.log(`📊 Rooms del admin:`, Array.from(socket.rooms));
        } else {
          socket.join(`user_${socket.userId}`);
          console.log(`✅ Usuario autenticado: ${user.name} (Socket: ${socket.id})`);
          console.log(`📊 Rooms del usuario:`, Array.from(socket.rooms));
        }

        socket.emit("authenticated", { 
          success: true, 
          user: { id: user._id, name: user.name, role: user.role }
        });

      } catch (error) {
        console.log("❌ Error en autenticación:", error.message);
        socket.emit("auth_error", { message: "Token inválido" });
      }
    });

    socket.on("user_send_message", async ({ text }) => {
      if (!socket.userId || socket.userRole === 'admin') {
        console.log("❌ Usuario no autenticado o es admin intentando enviar como user");
        socket.emit("message_error", { message: "No autorizado" });
        return;
      }

      try {
        if (!text || !text.trim()) {
          socket.emit("message_error", { message: "Mensaje vacío" });
          return;
        }

        // Buscar solo el chat open del usuario
        let chat = await Chat.findOne({ user: socket.userId, status: 'open' });

        if (!chat) {
          // Crear si no existe (primera vez o tras finalizar)
          chat = new Chat({ user: socket.userId, messages: [], status: 'open' });
        }

        chat.messages.push({
          sender: "user",
          text: text.trim(),
          timestamp: new Date(),
          read: false
        });

        chat.lastActivity = new Date();
        chat.status = "open";
        
        await chat.save();
        await chat.populate("user", "name email avatar");

        console.log(`📨 [USER→ADMIN] ${socket.userName}: "${text.substring(0, 40)}..."`);

        // Confirmar al cliente que envió
        socket.emit("message_sent", { success: true, chat });

        // Actualizar TODAS las sesiones del usuario (si tiene múltiples tabs)
        io.to(`user_${socket.userId}`).emit("chat_updated", chat);

        // ✅ Enviar a TODOS los admins conectados
        console.log(`📢 Emitiendo "new_user_message" a ${adminSockets.size} admin(s)`);
        io.to('admins').emit("new_user_message", chat);
        
        // Log de verificación
        adminSockets.forEach(adminSocketId => {
          console.log(`   ✓ Enviado a admin socket: ${adminSocketId}`);
        });

      } catch (error) {
        console.error("❌ Error en user_send_message:", error);
        socket.emit("message_error", { message: error.message });
      }
    });

    socket.on("admin_send_message", async ({ chatId, text }) => {
      if (!socket.userId || socket.userRole !== 'admin') {
        console.log("❌ No es admin o no autenticado");
        socket.emit("message_error", { message: "No autorizado" });
        return;
      }

      try {
        if (!text || !text.trim()) {
          socket.emit("message_error", { message: "Mensaje vacío" });
          return;
        }

        const chat = await Chat.findById(chatId).populate("user", "name email avatar");

        if (!chat) {
          socket.emit("message_error", { message: "Chat no encontrado" });
          return;
        }

        chat.messages.push({
          sender: "admin",
          text: text.trim(),
          timestamp: new Date(),
          read: false
        });

        chat.lastActivity = new Date();
        await chat.save();

        console.log(`📨 [ADMIN→USER] ${socket.userName} → ${chat.user.name}: "${text.substring(0, 40)}..."`);

        // Confirmar al admin que envió
        socket.emit("message_sent", { success: true, chat });

        // Enviar al cliente
        const clientUserId = chat.user._id.toString();
        console.log(`📢 Emitiendo "new_admin_message" a user_${clientUserId}`);
        io.to(`user_${clientUserId}`).emit("new_admin_message", chat);
        
        // Actualizar otros admins
        io.to('admins').emit("chat_updated", chat);

      } catch (error) {
        console.error("❌ Error en admin_send_message:", error);
        socket.emit("message_error", { message: error.message });
      }
    });

    socket.on("disconnect", () => {
      if (socket.userId) {
        connectedUsers.delete(socket.userId);
        
        if (socket.userRole === 'admin') {
          adminSockets.delete(socket.id);
          console.log(`🔴 Admin desconectado: ${socket.userName} (${socket.id})`);
          console.log(`📊 Admins restantes: ${adminSockets.size}`);
        } else {
          console.log(`🔴 Usuario desconectado: ${socket.userName || socket.userId}`);
        }
      } else {
        console.log(`🔴 Cliente desconectado: ${socket.id} (no autenticado)`);
      }
    });
  });

  console.log("📡 Socket.IO Chat System iniciado");
};