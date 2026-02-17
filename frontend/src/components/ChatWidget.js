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
  const [chatStatus, setChatStatus] = useState('open');
  const messagesEndRef = useRef(null);

  const getToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          const errorMsg = error.response?.data?.message || error.response?.data?.error || '';
          
          if (errorMsg.toLowerCase().includes('token') || 
              errorMsg.toLowerCase().includes('expirado') || 
              errorMsg.toLowerCase().includes('expired') ||
              errorMsg.toLowerCase().includes('inválido') || 
              errorMsg.toLowerCase().includes('invalid')) {
            
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

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  useEffect(() => {
  if (!isAuthenticated()) return;
  if (process.env.NODE_ENV === 'development') {
    initializeSocket();
  }
  return () => {};
}, [isAuthenticated]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeSocket = () => {
    if (socket) return;

    console.log('🔌 [CLIENT] Conectando socket...');

    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('✅ [CLIENT] Socket conectado:', socket.id);
      setConnected(true);
      
      const token = getToken();
      if (token) {
        socket.emit('authenticate', token);
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ [CLIENT] Socket desconectado');
      setConnected(false);
    });

    socket.on('authenticated', () => {
      console.log('✅ [CLIENT] Autenticado');
      loadChat();
    });

    // ✅ MENSAJE DEL ADMIN
    socket.on('new_admin_message', (data) => {
      console.log('📨 [CLIENT] Nuevo mensaje del admin:', data);
      
      const chat = data?.chat || data;
      
      if (chat && Array.isArray(chat.messages)) {
        setMessages(chat.messages);
        setChatStatus(chat.status || 'open');
        
        // Incrementar no leídos si el chat está cerrado
        if (!isOpen) {
          const unread = chat.messages.filter(m => m.sender === 'admin' && !m.read).length;
          setUnreadCount(unread);
        }
      }
    });

    socket.on('chat_updated', (data) => {
      console.log('🔄 [CLIENT] Chat actualizado:', data);
      
      const chat = data?.chat || data;
      
      if (chat && Array.isArray(chat.messages)) {
        setMessages(chat.messages);
        setChatStatus(chat.status || 'open');
      }
    });

    // ✅ CHAT CERRADO POR ADMIN - CORREGIDO
    socket.on('chat_closed', (data) => {
      console.log('🔒 [CLIENT] Chat cerrado por admin:', data);
      
      const chat = data?.chat || data;
      
      if (chat && Array.isArray(chat.messages)) {
        setMessages(chat.messages);
        setChatStatus('closed');
        
        // ✅ MOSTRAR NOTIFICACIÓN SIEMPRE (no solo si isOpen)
        alert('🔔 El administrador ha finalizado esta conversación.\n\nPuedes iniciar una nueva conversación cuando lo necesites.');
        
        // Si el chat está abierto, mantenerlo abierto para que vea el mensaje
        if (isOpen) {
          // Ya está abierto, solo actualizar
        } else {
          // Si está cerrado, incrementar contador
          setUnreadCount(prev => prev + 1);
        }
      }
    });

    socket.on('message_sent', (data) => {
      console.log('✅ [CLIENT] Mensaje enviado:', data);
      if (data.success && data.chat) {
        setMessages(data.chat.messages);
        setChatStatus(data.chat.status);
      }
      setLoading(false);
    });

    socket.on('message_error', (data) => {
      console.error('❌ [CLIENT] Error:', data.message);
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
      if (!token) {
        console.warn('⚠️ [CLIENT] No hay token disponible');
        return;
      }

      console.log('📥 [CLIENT] Cargando chat...');

      const response = await axios.get(`${API_URL}/chat/my-chat`, {
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('✅ [CLIENT] Chat cargado:', response.data);
      setMessages(response.data.messages || []);
      setChatStatus(response.data.status || 'open');
      
      const unread = (response.data.messages || []).filter(
        m => m.sender === 'admin' && !m.read
      ).length;
      setUnreadCount(unread);

    } catch (error) {
      console.error('❌ [CLIENT] Error al cargar chat:', error);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || loading || !connected || chatStatus === 'closed') {
      return;
    }

    const token = getToken();
    if (!token) {
      alert('No hay sesión activa. Por favor, inicia sesión.');
      window.location.href = '/login';
      return;
    }

    console.log('📤 [CLIENT] Enviando mensaje:', inputMessage.substring(0, 30) + '...');

    setLoading(true);
    socket.emit('user_send_message', { text: inputMessage });
    setInputMessage('');
  };

  const closeChat = async () => {
    if (!window.confirm('¿Estás seguro de que quieres finalizar el chat?')) {
      return;
    }

    try {
      const token = getToken();
      
      if (!token) {
        alert('No hay sesión activa. Por favor, inicia sesión.');
        window.location.href = '/login';
        return;
      }

      console.log('🔄 [CLIENT] Cerrando chat...');
      
      const response = await axios.put(
        `${API_URL}/chat/close-my-chat`,
        {},
        { 
          headers: { 
            'Authorization': `Bearer ${token}`
          } 
        }
      );

      setMessages(response.data.chat.messages);
      setChatStatus('closed');
      
      console.log('✅ [CLIENT] Chat cerrado correctamente');
      alert('✅ Conversación finalizada correctamente.');
      
    } catch (error) {
      console.error('❌ [CLIENT] Error al cerrar chat:', error);
      
      if (error.response?.status === 401) {
        console.error('❌ Error de autenticación al cerrar chat');
      } else {
        const errorMsg = error.response?.data?.message || 
                        error.response?.data?.error || 
                        'Error al cerrar chat';
        alert(errorMsg);
      }
    }
  };

  const startNewChat = async () => {
    try {
      setLoading(true);
      const token = getToken();

      if (!token) {
        alert('No hay sesión activa. Por favor, inicia sesión.');
        window.location.href = '/login';
        return;
      }

      console.log('🔄 [CLIENT] Iniciando nuevo chat...');

      const response = await axios.post(
        `${API_URL}/chat/start-new-chat`,
        {},
        { 
          headers: { 
            'Authorization': `Bearer ${token}`
          } 
        }
      );

      console.log('✅ [CLIENT] Nuevo chat creado');

      setMessages(response.data.messages);
      setChatStatus(response.data.status);
      setUnreadCount(0);
      
      if (socket && socket.connected) {
        socket.emit('authenticate', token);
      }
      
    } catch (error) {
      console.error('❌ [CLIENT] Error al iniciar nuevo chat:', error);
      
      if (error.response?.status !== 401) {
        const errorMsg = error.response?.data?.message || 
                        error.response?.data?.error || 
                        'Error al iniciar nuevo chat';
        alert(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleChat = () => {
    if (!isAuthenticated()) {
      alert('Debes iniciar sesión para usar el chat de soporte');
      return;
    }
    
    setIsOpen(!isOpen);

    if (!isOpen && unreadCount > 0) {
      setUnreadCount(0);
      const token = getToken();
      
      if (token) {
        axios.put(
          `${API_URL}/chat/mark-read`, 
          {}, 
          {
            headers: { 
              'Authorization': `Bearer ${token}`
            }
          }
        ).catch(err => {
          console.error('Error al marcar como leído:', err);
        });
      }
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="chat-widget">
      <button 
        className="chat-button" 
        onClick={toggleChat}
        aria-label="Chat de soporte"
      >
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
              {chatStatus === 'open' && (
                <button 
                  className="btn-close-conversation" 
                  onClick={closeChat}
                  title="Finalizar conversación"
                >
                  <FaCheckCircle /> Finalizar
                </button>
              )}
              <button onClick={toggleChat} aria-label="Cerrar chat">
                <FaTimes />
              </button>
            </div>
          </div>

          {chatStatus === 'closed' && (
            <div className="chat-closed-notice">
              <FaCheckCircle size={48} color="#4ade80" />
              <h4>Conversación finalizada</h4>
              <p>Esta conversación ha sido cerrada.</p>
              <button 
                className="btn-new-chat"
                onClick={startNewChat}
                disabled={loading}
              >
                <FaRedo /> {loading ? 'Iniciando...' : 'Iniciar nueva conversación'}
              </button>
            </div>
          )}

          <div className="chat-messages">
            {messages.length === 0 && chatStatus === 'open' && (
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
                  <div className="message-avatar">
                    <FaHeadset />
                  </div>
                )}
                <div className="message-content">
                  {message.sender === 'admin' && (
                    <span className="message-sender">Soporte SimShop</span>
                  )}
                  <p>{message.text}</p>
                  <span className="message-time">{formatTime(message.timestamp)}</span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {chatStatus === 'open' ? (
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
          ) : (
            <div className="chat-input-disabled">
              <p>💬 Chat finalizado - Puedes iniciar uno nuevo arriba</p>
            </div>
          )}

          <div className="chat-footer">
            <small>🔒 {connected ? 'Conectado y seguro' : 'Reconectando...'}</small>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
