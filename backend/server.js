require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// HTTP server para Socket.IO
const http = require('http').createServer(app);

// SOCKET.IO
const { Server } = require('socket.io');

// ✅ ORÍGENES PERMITIDOS (SIN SLASH FINAL)
const allowedOrigins = [
  'https://navutech.netlify.app',
  'https://aszutech.store',
  'http://localhost:3000'
];

const io = new Server(http, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('❌ CORS Socket bloqueado: ' + origin));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// ✅ Hacer io accesible globalmente
app.set('io', io);

// 🔍 DEBUG (opcional pero recomendado en Render)
app.use((req, res, next) => {
  console.log('🌍 Origin:', req.headers.origin);
  next();
});

// ✅ CORS middleware correcto
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('❌ CORS bloqueado: ' + origin));
    }
  },
  credentials: true
}));

// ⚠️ Stripe webhook (ANTES de express.json)
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =======================
// RUTAS
// =======================

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
app.use('/sitemap.xml', require('./routes/sitemap'));

// =======================
// TEST
// =======================

app.get('/', (req, res) => {
  res.json({ message: 'API SimShop OK' });
});

app.get('/api/test-socket', (req, res) => {
  const io = req.app.get('io');
  res.json({
    socketAvailable: !!io,
    message: io ? 'Socket.IO disponible en rutas' : 'Socket.IO NO disponible'
  });
});

// =======================
// SOCKETS
// =======================

require('./socket/chatSocket')(io);

// =======================
// MONGODB + SERVER START
// =======================

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB conectado');

  const PORT = process.env.PORT || 5000;

  http.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log('📡 Socket.IO ACTIVADO');
  });
})
.catch(err => {
  console.error('❌ Error MongoDB:', err);
});
