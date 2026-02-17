require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// HTTP server para usar con Socket.IO
const http = require('http').createServer(app);

// SOCKET.IO SERVER
const { Server } = require('socket.io');
const io = new Server(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// ✅ CRÍTICO: Hacer io accesible en todas las rutas
app.set('io', io);

// Middleware
app.use(cors());
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
const { router: authRouter } = require('./routes/auth');
app.use('/api/auth', authRouter);

app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/users', require('./routes/users'));
app.use('/api/stripe', require('./routes/stripe'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/tracking', require('./routes/tracking'));

app.get('/', (req, res) => {
  res.json({ message: "API SimShop OK" });
});

// ✅ RUTA DE PRUEBA PARA VERIFICAR SOCKET.IO
app.get('/api/test-socket', (req, res) => {
  const io = req.app.get('io');
  res.json({ 
    socketAvailable: !!io,
    message: io ? 'Socket.IO disponible en rutas' : 'Socket.IO NO disponible'
  });
});

// Cargar sockets
require('./socket/chatSocket')(io);

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB conectado");

    const PORT = process.env.PORT || 5000;
    http.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log("📡 Socket.IO ACTIVADO");
    });
  })
  .catch(err => console.error('❌ Error MongoDB:', err));