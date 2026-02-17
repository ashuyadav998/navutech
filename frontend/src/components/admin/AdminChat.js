import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import '../../styles/AdminChat.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = API_URL.replace('/api', '');
const IS_DEV = process.env.NODE_ENV === 'development';

let socket = null;

const AdminChat = () => {
  const [openChats, setOpenChats] = useState([]);
  const [closedChats, setClosedChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const [view, setView] = useState('open');
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef(null);

  const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

  useEffect(() => {
    scrollToBottom();
  }, [selectedChat?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const token = getToken();
    if (!token) { setError('No hay sesión activa'); setLoading(false); return; }

    // ✅ Solo conectar socket en desarrollo — Vercel no soporta WebSockets
    if (IS_DEV) {
      initializeSocket(token);
    }

    loadAllChats();
    const interval = setInterval(loadAllChats, 5000);
    return () => clearInterval(interval);
  }, []);

  const initializeSocket = (token) => {
    if (socket) return;

    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => { setConnected(true); socket.emit('authenticate', token); });
    socket.on('disconnect', () => setConnected(false));
    socket.on('authenticated', (data) => console.log('✅ [ADMIN] Autenticado:', data));

    socket.on('new_user_message', (data) => {
      const chat = data?.chat || data;
      if (chat?._id) handleChatUpdate(chat);
    });

    socket.on('message_sent', (data) => {
      if (data?.success && data?.chat) handleChatUpdate(data.chat);
    });

    socket.on('chat_updated', (data) => {
      const chat = data?.chat || data;
      if (chat?._id) handleChatUpdate(chat);
    });

    socket.on('chat_closed', (data) => {
      const chat = data?.chat || data;
      if (chat?._id) handleChatClosed(chat);
    });

    socket.on('message_error', (data) => alert('Error: ' + (data?.message || 'Error desconocido')));
  };

  const handleChatUpdate = (updatedChat) => {
    if (!updatedChat?._id) return;
    if (updatedChat.status === 'open') {
      setOpenChats(prev => {
        const exists = prev.find(c => c._id === updatedChat._id);
        return exists ? prev.map(c => c._id === updatedChat._id ? updatedChat : c) : [updatedChat, ...prev];
      });
      setClosedChats(prev => prev.filter(c => c._id !== updatedChat._id));
    } else {
      setClosedChats(prev => {
        const exists = prev.find(c => c._id === updatedChat._id);
        return exists ? prev.map(c => c._id === updatedChat._id ? updatedChat : c) : [updatedChat, ...prev];
      });
      setOpenChats(prev => prev.filter(c => c._id !== updatedChat._id));
    }
    setSelectedChat(prev => prev?._id === updatedChat._id ? updatedChat : prev);
  };

  const handleChatClosed = (closedChat) => {
    if (!closedChat?._id) return;
    setOpenChats(prev => prev.filter(c => c._id !== closedChat._id));
    setClosedChats(prev => {
      const exists = prev.find(c => c._id === closedChat._id);
      return exists ? prev.map(c => c._id === closedChat._id ? closedChat : c) : [closedChat, ...prev];
    });
    setSelectedChat(prev => {
      if (prev?._id === closedChat._id) { alert('✅ Chat finalizado correctamente'); return null; }
      return prev;
    });
  };

  const loadAllChats = async () => {
    try {
      const token = getToken();
      if (!token) { setError('No hay sesión activa'); setLoading(false); return; }

      const response = await axios.get(`${API_URL}/chat/admin/chats`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const allChats = Array.isArray(response.data) ? response.data : [];
      setOpenChats(allChats.filter(c => c.status === 'open'));
      setClosedChats(allChats.filter(c => c.status === 'closed'));
      setError(null);
    } catch (err) {
      setError('Error al cargar chats');
      if (err.response?.status === 401) { alert('Sesión expirada'); window.location.href = '/login'; }
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedChat) return;

    if (!IS_DEV) {
      // En producción sin socket — usar API REST
      const token = getToken();
      axios.post(`${API_URL}/chat/admin/send`, {
        chatId: selectedChat._id,
        text: message
      }, { headers: { Authorization: `Bearer ${token}` } })
        .then(() => { setMessage(''); loadAllChats(); })
        .catch(err => alert('Error al enviar: ' + err.message));
      return;
    }

    if (!connected) return;
    socket.emit('admin_send_message', { chatId: selectedChat._id, text: message });
    setMessage('');
  };

  const closeChat = async (chatId) => {
    if (!window.confirm('¿Finalizar esta conversación?')) return;
    try {
      const token = getToken();
      await axios.put(`${API_URL}/chat/admin/close-chat/${chatId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await loadAllChats();
    } catch (err) {
      alert('Error al cerrar chat');
      if (err.response?.status === 401) window.location.href = '/login';
    }
  };

  const currentChats = view === 'open' ? openChats : closedChats;

  return (
    <div className="admin-chat-container" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div>
          <h1 style={{ margin: '0 0 5px 0' }}>💬 Panel de Soporte</h1>
          <small style={{ color: '#666' }}>
            Abiertos: {openChats.length} • Cerrados: {closedChats.length} • Total: {openChats.length + closedChats.length}
          </small>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 20px', background: IS_DEV ? (connected ? '#d4edda' : '#f8d7da') : '#fff3cd', borderRadius: '25px', fontSize: '14px', fontWeight: '600' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: IS_DEV ? (connected ? '#28a745' : '#dc3545') : '#ffc107', display: 'inline-block' }}></span>
          {IS_DEV ? (connected ? 'Conectado' : 'Desconectado') : 'Modo polling (5s)'}
        </div>
      </div>

      {/* ✅ Aviso en producción */}
      {!IS_DEV && (
        <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px', padding: '12px 20px', marginBottom: '20px', fontSize: '14px', color: '#856404' }}>
          ⚠️ El chat en tiempo real no está disponible en producción. Los mensajes se actualizan cada 5 segundos.
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => { setView('open'); setSelectedChat(null); }} style={{ padding: '12px 24px', borderRadius: '25px', border: 'none', background: view === 'open' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#e9ecef', color: view === 'open' ? 'white' : '#495057', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}>
          🔥 Chats Activos <span style={{ marginLeft: '8px', padding: '2px 8px', background: 'rgba(255,255,255,0.3)', borderRadius: '12px', fontSize: '13px' }}>{openChats.length}</span>
        </button>
        <button onClick={() => { setView('closed'); setSelectedChat(null); }} style={{ padding: '12px 24px', borderRadius: '25px', border: 'none', background: view === 'closed' ? '#2c3e50' : '#e9ecef', color: view === 'closed' ? 'white' : '#495057', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}>
          📁 Historial <span style={{ marginLeft: '8px', padding: '2px 8px', background: 'rgba(255,255,255,0.3)', borderRadius: '12px', fontSize: '13px' }}>{closedChats.length}</span>
        </button>
      </div>

      {error && <div style={{ background: '#f8d7da', color: '#721c24', padding: '15px 20px', borderRadius: '8px', marginBottom: '20px' }}>⚠️ {error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '20px' }}>
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #dee2e6', height: '70vh', overflowY: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ padding: '15px 20px', borderBottom: '1px solid #dee2e6', background: '#f8f9fa', position: 'sticky', top: 0, zIndex: 10 }}>
            <strong style={{ fontSize: '15px', color: '#495057' }}>
              {view === 'open' ? '🔥 En curso' : '📁 Finalizados'} ({currentChats.length})
            </strong>
          </div>

          {loading ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#adb5bd' }}><div style={{ fontSize: '40px' }}>⏳</div><p>Cargando...</p></div>
          ) : currentChats.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#adb5bd' }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>{view === 'open' ? '💬' : '📭'}</div>
              <p style={{ margin: 0 }}>{view === 'open' ? 'No hay chats activos' : 'No hay historial'}</p>
            </div>
          ) : currentChats.map(chat => {
            const lastMessage = chat.messages?.[chat.messages.length - 1];
            return (
              <div key={chat._id} onClick={() => setSelectedChat(chat)} style={{ padding: '15px 20px', borderBottom: '1px solid #f1f3f5', cursor: 'pointer', background: selectedChat?._id === chat._id ? '#e7f3ff' : 'white', borderLeft: selectedChat?._id === chat._id ? '4px solid #667eea' : '4px solid transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong>{chat.user?.name || 'Cliente'}</strong>
                  {view === 'closed' && <span style={{ padding: '2px 8px', background: '#d4edda', color: '#155724', fontSize: '10px', borderRadius: '10px' }}>✓ CERRADO</span>}
                </div>
                <div style={{ fontSize: '13px', color: '#6c757d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lastMessage?.text || 'Sin mensajes'}</div>
                {lastMessage?.timestamp && <div style={{ fontSize: '11px', color: '#adb5bd', marginTop: '4px' }}>{new Date(lastMessage.timestamp).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>}
              </div>
            );
          })}
        </div>

        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #dee2e6', display: 'flex', flexDirection: 'column', height: '70vh', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          {selectedChat ? (
            <>
              <div style={{ padding: '20px', borderBottom: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0' }}>{selectedChat.user?.name || 'Cliente'}{selectedChat.status === 'closed' && <span style={{ marginLeft: '12px', fontSize: '14px', color: '#28a745', fontWeight: 'normal' }}>✓ Cerrado</span>}</h3>
                  <small style={{ color: '#6c757d' }}>{selectedChat.user?.email || ''}</small>
                </div>
                {selectedChat.status === 'open' && (
                  <button onClick={() => closeChat(selectedChat._id)} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>✓ Finalizar Chat</button>
                )}
              </div>

              <div style={{ flex: 1, padding: '20px', overflowY: 'auto', background: '#f8f9fa' }}>
                {selectedChat.messages?.map((m, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: m.sender === 'admin' ? 'flex-end' : 'flex-start', marginBottom: '12px' }}>
                    <div style={{ background: m.sender === 'admin' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white', color: m.sender === 'admin' ? 'white' : '#212529', padding: '12px 16px', borderRadius: '12px', maxWidth: '70%', boxShadow: '0 2px 5px rgba(0,0,0,0.08)', border: m.sender === 'admin' ? 'none' : '1px solid #dee2e6' }}>
                      <p style={{ margin: '0 0 6px 0', wordWrap: 'break-word' }}>{m.text}</p>
                      <small style={{ fontSize: '10px', opacity: 0.7 }}>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {selectedChat.status === 'open' ? (
                <form onSubmit={sendMessage} style={{ padding: '20px', borderTop: '1px solid #dee2e6', display: 'flex', gap: '12px', background: 'white' }}>
                  <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Escribe tu respuesta..." style={{ flex: 1, padding: '12px 16px', borderRadius: '25px', border: '2px solid #dee2e6', outline: 'none', fontSize: '14px' }} />
                  <button type="submit" disabled={!message.trim()} style={{ background: message.trim() ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#e9ecef', color: message.trim() ? 'white' : '#adb5bd', border: 'none', padding: '12px 28px', borderRadius: '25px', cursor: message.trim() ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>Enviar ✈️</button>
                </form>
              ) : (
                <div style={{ padding: '20px', borderTop: '1px solid #dee2e6', textAlign: 'center', color: '#6c757d', background: '#f8f9fa' }}>✓ Esta conversación está finalizada</div>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#adb5bd' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>💬</div>
              <h3 style={{ margin: '0 0 8px 0', color: '#6c757d' }}>Selecciona una conversación</h3>
              <p style={{ margin: 0, fontSize: '14px' }}>Elige un chat de la lista para comenzar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChat;
