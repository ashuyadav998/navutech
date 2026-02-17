// frontend/src/services/socketService.js
import { io } from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = API_URL.replace('/api', '');

class SocketService {
  constructor() {
    this.socket = null;
    this.isInitialized = false;
    this.eventListeners = new Map();
  }

  initialize() {
    if (this.isInitialized && this.socket) {
      console.log('⚠️ Socket ya inicializado');
      return this.socket;
    }

    console.log('🔌 Inicializando socket service...');

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      autoConnect: true
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket conectado:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket desconectado:', reason);
    });

    this.isInitialized = true;
    return this.socket;
  }

  authenticate(token) {
    if (!this.socket) {
      console.error('❌ Socket no inicializado');
      return;
    }

    console.log('🔑 Autenticando socket...');
    this.socket.emit('authenticate', token);
  }

  on(event, callback) {
    if (!this.socket) {
      console.error('❌ Socket no inicializado');
      return;
    }

    // Remover listener anterior si existe
    if (this.eventListeners.has(event)) {
      this.socket.off(event, this.eventListeners.get(event));
    }

    this.socket.on(event, callback);
    this.eventListeners.set(event, callback);
  }

  emit(event, data) {
    if (!this.socket) {
      console.error('❌ Socket no inicializado');
      return;
    }

    this.socket.emit(event, data);
  }

  removeListener(event) {
    if (!this.socket) return;

    const callback = this.eventListeners.get(event);
    if (callback) {
      this.socket.off(event, callback);
      this.eventListeners.delete(event);
    }
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Desconectando socket...');
      this.socket.disconnect();
      this.socket = null;
      this.isInitialized = false;
      this.eventListeners.clear();
    }
  }

  getSocket() {
    return this.socket;
  }

  isConnected() {
    return this.socket && this.socket.connected;
  }
}

// Exportar una única instancia
const socketService = new SocketService();
export default socketService;