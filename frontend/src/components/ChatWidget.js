import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { FaComments, FaTimes, FaPaperPlane, FaHeadset, FaCheckCircle, FaRedo } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import '../styles/ChatWidget.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = API_URL.replace('/api', '');

let socket = null;

const ChatWidget = () => {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef(null);

  const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

  // Interceptor para sesión expirada
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          const msg = error.response?.data?.message || error.response?.data?.error || '';
          if (msg.toLowerCase().includes('token') || msg.toLowerCase().includes('expir') || msg.toLowerCase().includes('inválid')) {
            sessionStorage.removeItem('token');
            localStorage.removeItem('token');
            if (!sessionStorage.getItem('session_expired_shown')) {
              alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
              sessionStorage.setItem('session_expired_shown', 'true');
            }
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeSocket = () => {
    if (socket) {
      // Socket ya existe — solo re-autenticar si no está autenticado
      if (socket.connected) {
        const token = getToken();
        if (token) socket.emit('authenticate', token);
      }
      return;
    }

    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      setConnected(true);
      const token = getToken();
      if (token) socket.emit('authenticate', token);
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('authenticated', () => {
      loadChat();
    });

    socket.on('new_admin_message', (data) => {
      const chat = data?.chat || data;
      if (chat && Array.isArray(chat.messages)) {
        setMessages(chat.messages);
        if (!isOpen) {
          const unread = chat.messages.filter(m => m.sender === 'admin' && !m.read).length;
          setUnreadCount(unread);
        }
      }
    });

    socket.on('chat_updated', (data) => {
      const chat = data?.chat || data;
      if (chat && Array.isArray(chat.messages)) {
        setMessages(chat.messages);
      }
    });

    // Cuando admin cierra -> reset completo
    socket.on('chat_closed', () => {
      setMessages([]);
      setUnreadCount(0);
    });

    socket.on('message_sent', (data) => {
      if (data.success && data.chat) {
        setMessages(data.chat.messages);
      }
      setLoading(false);
    });

    socket.on('message_error', (data) => {
      alert('Error al enviar mensaje: ' + data.message);
      setLoading(false);
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChat = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const response = await axios.get(`${API_URL}/chat/my-chat`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setMessages(response.data.messages || []);
      const unread = (response.data.messages || []).filter(m => m.sender === 'admin' && !m.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error al cargar chat:', error);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading || !connected) return;

    const token = getToken();
    if (!token) {
      alert('No hay sesión activa. Por favor, inicia sesión.');
      window.location.href = '/login';
      return;
    }

    setLoading(true);
    socket.emit('user_send_message', { text: inputMessage });
    setInputMessage('');
  };

  const handleFinalizar = async () => {
    if (!window.confirm('¿Quieres finalizar y borrar esta conversación?')) return;
    try {
      const token = getToken();
      await axios.put(`${API_URL}/chat/close-my-chat`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // Reset local inmediato
      setMessages([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error al finalizar chat:', error);
    }
  };

  const toggleChat = () => {
    if (!isAuthenticated()) {
      alert('Debes iniciar sesión para usar el chat de soporte');
      return;
    }

    const opening = !isOpen;
    setIsOpen(opening);

    if (opening) {
      // Conectar socket solo cuando el usuario abre el chat
      initializeSocket();

      if (unreadCount > 0) {
        setUnreadCount(0);
        const token = getToken();
        if (token) {
          axios.put(`${API_URL}/chat/mark-read`, {}, {
            headers: { 'Authorization': `Bearer ${token}` }
          }).catch(() => {});
        }
      }
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-widget">
      <button className="chat-button" onClick={toggleChat} aria-label="Chat de soporte">
        {isOpen ? <FaTimes /> : <FaComments />}
        {!isOpen && unreadCount > 0 && (
          <span className="chat-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="chat-header-info">
              <FaHeadset size={24} />
              <div>
                <h3>💬 Atención al Cliente</h3>
                <p className="status-indicator">
                  <span className={`status-dot ${connected ? 'online' : 'offline'}`}></span>
                  {connected ? 'En línea' : 'Desconectado'}
                </p>
              </div>
            </div>
            <div className="chat-header-actions">
              {messages.length > 0 && (
                <button
                  className="btn-close-conversation"
                  onClick={handleFinalizar}
                  title="Finalizar y borrar conversación"
                >
                  <FaCheckCircle /> Finalizar
                </button>
              )}
              <button onClick={toggleChat} aria-label="Cerrar chat">
                <FaTimes />
              </button>
            </div>
          </div>

          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="chat-empty-state">
                <FaHeadset size={48} color="#cbd5e1" />
                <p>¡Hola! ¿En qué podemos ayudarte?</p>
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={index}
                className={`message ${message.sender === 'user' ? 'user-message' : 'admin-message'}`}
              >
                {message.sender === 'admin' && (
                  <div className="message-avatar"><FaHeadset /></div>
                )}
                <div className="message-content">
                  {message.sender === 'admin' && (
                    <span className="message-sender">Soporte</span>
                  )}
                  <p>{message.text}</p>
                  <span className="message-time">{formatTime(message.timestamp)}</span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="chat-input-form">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Escribe tu mensaje..."
              disabled={loading || !connected}
            />
            <button type="submit" disabled={loading || !inputMessage.trim() || !connected}>
              <FaPaperPlane />
            </button>
          </form>

          <div className="chat-footer">
            <small>🔒 {connected ? 'Conectado y seguro' : 'Reconectando...'}</small>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;