require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// =======================
// HTTP + SOCKET.IO
// =======================

const http = require('http').createServer(app);
const { Server } = require('socket.io');

// ✅ ORÍGENES EXACTOS (SIN / FINAL)
const allowedOrigins = [
  'https://navutech.netlify.app',
  'https://aszutech.store',
  'http://localhost:3000'
];

// =======================
// SOCKET.IO
// =======================

const io = new Server(http, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

app.set('io', io);

// =======================
// 🔥 CORS REAL (CORRECTO)
// =======================

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (Postman, navegador directo)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.log('❌ CORS bloqueado:', origin);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// ⚠️ IMPORTANTE: manejar preflight (OPTIONS)
app.options('*', cors({
  origin: allowedOrigins,
  credentials: true
}));

// =======================
// MIDDLEWARES
// =======================

// Stripe webhook (antes de json)
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DEBUG opcional
app.use((req, res, next) => {
  console.log('🌍 Origin:', req.headers.origin);
  next();
});

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
    socketAvailable: !!io
  });
});

// =======================
// SOCKETS
// =======================

require('./socket/chatSocket')(io);

// =======================
// START SERVER
// =======================

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB conectado');

    const PORT = process.env.PORT || 5000;

    http.listen(PORT, () => {
      console.log(`🚀 Servidor en puerto ${PORT}`);
      console.log('📡 Socket.IO activo');
    });
  })
  .catch(err => {
    console.error('❌ Error MongoDB:', err);
  });
