import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { FaComments, FaTimes, FaPaperPlane } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const SOCKET_URL = API_URL.replace("/api", "");

const socket = io(SOCKET_URL); // ✅ socket definido

const ChatWidget = () => {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);

  // Obtenemos userId desde localStorage
  const userId = JSON.parse(localStorage.getItem("user"))?._id;

  // Socket: autenticación y recepción de mensajes
  useEffect(() => {
    if (!isAuthenticated()) return;

    const token = localStorage.getItem("token");
    if (!token || !userId) return;

    socket.emit("auth", token);

    // Escucha actualizaciones del chat de este usuario
    socket.on("chat_update_" + userId, (data) => {
      setMessages(data.messages);  // actualizamos messages correctamente
    });

    return () => socket.off("chat_update_" + userId);
  }, [isOpen, isAuthenticated, userId]);

  // Scroll automático al final del chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Carga inicial del chat y conteo de mensajes no leídos
  const loadChat = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !userId) return;

      const response = await axios.get(`${API_URL}/chat/my-chat`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessages(response.data.messages);

      const unread = response.data.messages.filter(
        m => m.sender === 'admin' && !m.read
      ).length;
      setUnreadCount(unread);

      // Marcar mensajes como leídos si el chat está abierto
      if (isOpen && unread > 0) {
        await axios.put(`${API_URL}/chat/mark-read`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Error al cargar chat:', error);
    }
  };

  // Envío de mensaje
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      await axios.post(
        `${API_URL}/chat/send-message`,
        { text: inputMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setInputMessage('');
      await loadChat(); // recargamos mensajes
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      alert('Error al enviar mensaje');
    } finally {
      setLoading(false);
    }
  };

  const toggleChat = () => {
    if (!isAuthenticated()) {
      alert('Debes iniciar sesión para usar el chat');
      return;
    }
    setIsOpen(!isOpen);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="chat-widget">
      {/* Botón flotante */}
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

      {/* Ventana de chat */}
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <h3>💬 Atención al Cliente</h3>
            <button onClick={toggleChat} aria-label="Cerrar chat">
              <FaTimes />
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`message ${message.sender === 'user' ? 'user-message' : 'admin-message'}`}
              >
                <div className="message-content">
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
              disabled={loading}
            />
            <button type="submit" disabled={loading || !inputMessage.trim()}>
              <FaPaperPlane />
            </button>
          </form>

          <div className="chat-footer">
            <small>Responderemos lo antes posible</small>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
