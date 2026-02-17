import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import '../../styles/AdminChat.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = API_URL.replace('/api', '');

let socket = null;

const AdminChat = () => {
  // ✅ SEPARAR LOS CHATS POR ESTADO
  const [openChats, setOpenChats] = useState([]);
  const [closedChats, setClosedChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const [view, setView] = useState('open'); // 'open' o 'closed'
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef(null);

  const getToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedChat?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setError('No hay sesión activa');
      setLoading(false);
      return;
    }

    initializeSocket(token);
    loadAllChats(); // ✅ Cargar TODOS los chats al inicio

    // ✅ Recargar cada 5 segundos
    const interval = setInterval(loadAllChats, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []); // ✅ Solo una vez al montar

  const initializeSocket = (token) => {
    if (socket) return;

    console.log('🔌 [ADMIN] Conectando socket...');
    
    socket = io(SOCKET_URL, { 
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('✅ [ADMIN] Socket conectado:', socket.id);
      setConnected(true);
      socket.emit('authenticate', token);
    });

    socket.on('disconnect', () => {
      console.log('❌ [ADMIN] Socket desconectado');
      setConnected(false);
    });

    socket.on('authenticated', (data) => {
      console.log('✅ [ADMIN] Autenticado:', data);
    });

    // ✅ NUEVO MENSAJE DE USUARIO
    socket.on('new_user_message', (data) => {
      console.log('📨 [ADMIN] Nuevo mensaje de usuario:', data);
      const chat = data?.chat || data;
      if (chat?._id) {
        handleChatUpdate(chat);
      }
    });

    // ✅ MENSAJE ENVIADO POR ADMIN
    socket.on('message_sent', (data) => {
      console.log('✅ [ADMIN] Mensaje enviado:', data);
      if (data?.success && data?.chat) {
        handleChatUpdate(data.chat);
      }
    });

    // ✅ CHAT ACTUALIZADO
    socket.on('chat_updated', (data) => {
      console.log('🔄 [ADMIN] Chat actualizado:', data);
      const chat = data?.chat || data;
      if (chat?._id) {
        handleChatUpdate(chat);
      }
    });

    // ✅ CHAT CERRADO
    socket.on('chat_closed', (data) => {
      console.log('🔒 [ADMIN] Chat cerrado:', data);
      const chat = data?.chat || data;
      if (chat?._id) {
        handleChatClosed(chat);
      }
    });

    socket.on('message_error', (data) => {
      console.error('❌ [ADMIN] Error:', data);
      alert('Error: ' + (data?.message || 'Error desconocido'));
    });
  };

  // ✅ MANEJAR ACTUALIZACIÓN DE CHAT
  const handleChatUpdate = (updatedChat) => {
    if (!updatedChat?._id) return;

    console.log(`🔄 Actualizando chat ${updatedChat._id}, status: ${updatedChat.status}`);

    if (updatedChat.status === 'open') {
      // Actualizar en chats abiertos
      setOpenChats(prev => {
        const exists = prev.find(c => c._id === updatedChat._id);
        if (exists) {
          return prev.map(c => c._id === updatedChat._id ? updatedChat : c);
        } else {
          return [updatedChat, ...prev];
        }
      });
      
      // Quitar de cerrados si estaba ahí
      setClosedChats(prev => prev.filter(c => c._id !== updatedChat._id));
      
    } else if (updatedChat.status === 'closed') {
      // Mover a cerrados
      setClosedChats(prev => {
        const exists = prev.find(c => c._id === updatedChat._id);
        if (exists) {
          return prev.map(c => c._id === updatedChat._id ? updatedChat : c);
        } else {
          return [updatedChat, ...prev];
        }
      });
      
      // Quitar de abiertos
      setOpenChats(prev => prev.filter(c => c._id !== updatedChat._id));
    }

    // Actualizar chat seleccionado si es el mismo
    setSelectedChat(prev => {
      if (prev?._id === updatedChat._id) {
        return updatedChat;
      }
      return prev;
    });
  };

  // ✅ MANEJAR CIERRE DE CHAT
  const handleChatClosed = (closedChat) => {
    if (!closedChat?._id) return;

    console.log(`🔒 Cerrando chat ${closedChat._id}`);

    // Mover de abiertos a cerrados
    setOpenChats(prev => prev.filter(c => c._id !== closedChat._id));
    
    setClosedChats(prev => {
      const exists = prev.find(c => c._id === closedChat._id);
      if (!exists) {
        return [closedChat, ...prev];
      }
      return prev.map(c => c._id === closedChat._id ? closedChat : c);
    });

    // Deseleccionar si es el chat actual
    setSelectedChat(prev => {
      if (prev?._id === closedChat._id) {
        alert('✅ Chat finalizado correctamente');
        return null;
      }
      return prev;
    });
  };

  // ✅ CARGAR TODOS LOS CHATS (abiertos Y cerrados)
  const loadAllChats = async () => {
    try {
      const token = getToken();
      if (!token) {
        setError('No hay sesión activa');
        setLoading(false);
        return;
      }

      console.log('📥 [ADMIN] Cargando TODOS los chats...');

      // Cargar sin filtro para obtener todos
      const response = await axios.get(`${API_URL}/chat/admin/chats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const allChats = Array.isArray(response.data) ? response.data : [];
      
      // ✅ SEPARAR POR ESTADO
      const open = allChats.filter(c => c.status === 'open');
      const closed = allChats.filter(c => c.status === 'closed');
      
      console.log(`✅ [ADMIN] Chats cargados:`, {
        total: allChats.length,
        abiertos: open.length,
        cerrados: closed.length
      });
      
      setOpenChats(open);
      setClosedChats(closed);
      setError(null);
      
    } catch (err) {
      console.error('❌ [ADMIN] Error al cargar chats:', err);
      setError('Error al cargar chats');
      
      if (err.response?.status === 401) {
        alert('Sesión expirada');
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    
    if (!message.trim() || !selectedChat || !connected) return;

    console.log('📤 [ADMIN] Enviando mensaje...');

    socket.emit('admin_send_message', {
      chatId: selectedChat._id,
      text: message
    });

    setMessage('');
  };

  const closeChat = async (chatId) => {
    if (!window.confirm('¿Finalizar esta conversación?')) return;
    
    try {
      const token = getToken();
      
      console.log('🔒 [ADMIN] Cerrando chat:', chatId);

      await axios.put(
        `${API_URL}/chat/admin/close-chat/${chatId}`, 
        {}, 
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      console.log('✅ [ADMIN] Chat cerrado correctamente');
      
      // ✅ Recargar para sincronizar
      await loadAllChats();
      
    } catch (err) {
      console.error('❌ [ADMIN] Error al cerrar chat:', err);
      alert('Error al cerrar chat');
      
      if (err.response?.status === 401) {
        window.location.href = '/login';
      }
    }
  };

  // ✅ OBTENER CHATS SEGÚN LA VISTA ACTUAL
  const currentChats = view === 'open' ? openChats : closedChats;

  return (
    <div className="admin-chat-container" style={{ padding: '20px' }}>
      {/* HEADER */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        background: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div>
          <h1 style={{ margin: '0 0 5px 0' }}>💬 Panel de Soporte</h1>
          <small style={{ color: '#666' }}>
            Abiertos: {openChats.length} • Cerrados: {closedChats.length} • Total: {openChats.length + closedChats.length}
          </small>
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px',
          padding: '10px 20px',
          background: connected ? '#d4edda' : '#f8d7da',
          borderRadius: '25px',
          fontSize: '14px',
          fontWeight: '600'
        }}>
          <span style={{ 
            width: '12px', 
            height: '12px', 
            borderRadius: '50%', 
            background: connected ? '#28a745' : '#dc3545',
            display: 'inline-block',
            animation: connected ? 'pulse 2s infinite' : 'none'
          }}></span>
          {connected ? 'Conectado' : 'Desconectado'}
        </div>
      </div>

      {/* FILTROS */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={() => {
            setView('open');
            setSelectedChat(null);
          }}
          style={{
            padding: '12px 24px', 
            borderRadius: '25px', 
            border: 'none',
            background: view === 'open' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#e9ecef',
            color: view === 'open' ? 'white' : '#495057',
            cursor: 'pointer', 
            fontWeight: 'bold',
            fontSize: '15px',
            transition: 'all 0.3s',
            boxShadow: view === 'open' ? '0 4px 12px rgba(102,126,234,0.4)' : 'none'
          }}
        >
          🔥 Chats Activos <span style={{ 
            marginLeft: '8px',
            padding: '2px 8px',
            background: 'rgba(255,255,255,0.3)',
            borderRadius: '12px',
            fontSize: '13px'
          }}>{openChats.length}</span>
        </button>
        
        <button 
          onClick={() => {
            setView('closed');
            setSelectedChat(null);
          }}
          style={{
            padding: '12px 24px', 
            borderRadius: '25px', 
            border: 'none',
            background: view === 'closed' ? '#2c3e50' : '#e9ecef',
            color: view === 'closed' ? 'white' : '#495057',
            cursor: 'pointer', 
            fontWeight: 'bold',
            fontSize: '15px',
            transition: 'all 0.3s',
            boxShadow: view === 'closed' ? '0 4px 12px rgba(44,62,80,0.4)' : 'none'
          }}
        >
          📁 Historial <span style={{ 
            marginLeft: '8px',
            padding: '2px 8px',
            background: 'rgba(255,255,255,0.3)',
            borderRadius: '12px',
            fontSize: '13px'
          }}>{closedChats.length}</span>
        </button>
      </div>

      {error && (
        <div style={{ 
          background: '#f8d7da', 
          color: '#721c24', 
          padding: '15px 20px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          border: '1px solid #f5c6cb'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* LAYOUT */}
      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '20px' }}>
        {/* LISTA DE CHATS */}
        <div style={{ 
          background: 'white', 
          borderRadius: '12px', 
          border: '1px solid #dee2e6', 
          height: '70vh', 
          overflowY: 'auto',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ 
            padding: '15px 20px', 
            borderBottom: '1px solid #dee2e6', 
            background: '#f8f9fa',
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}>
            <strong style={{ fontSize: '15px', color: '#495057' }}>
              {view === 'open' ? '🔥 En curso' : '📁 Finalizados'} ({currentChats.length})
            </strong>
          </div>
          
          {loading ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#adb5bd' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>⏳</div>
              <p>Cargando...</p>
            </div>
          ) : currentChats.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#adb5bd' }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>
                {view === 'open' ? '💬' : '📭'}
              </div>
              <p style={{ margin: 0, fontSize: '15px', fontWeight: '500' }}>
                {view === 'open' ? 'No hay chats activos' : 'No hay historial'}
              </p>
              <small style={{ color: '#ced4da' }}>
                {view === 'open' ? 'Las conversaciones aparecerán aquí' : 'Los chats finalizados aparecerán aquí'}
              </small>
            </div>
          ) : (
            currentChats.map(chat => {
              const lastMessage = chat.messages?.[chat.messages.length - 1];

              return (
                <div 
                  key={chat._id}
                  onClick={() => setSelectedChat(chat)}
                  style={{
                    padding: '15px 20px', 
                    borderBottom: '1px solid #f1f3f5', 
                    cursor: 'pointer',
                    background: selectedChat?._id === chat._id ? '#e7f3ff' : 'white',
                    borderLeft: selectedChat?._id === chat._id ? '4px solid #667eea' : '4px solid transparent',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '6px'
                  }}>
                    <strong style={{ color: '#212529' }}>
                      {chat.user?.name || 'Cliente'}
                    </strong>
                    {view === 'closed' && (
                      <span style={{ 
                        padding: '2px 8px', 
                        background: '#d4edda', 
                        color: '#155724', 
                        fontSize: '10px', 
                        borderRadius: '10px',
                        fontWeight: '600'
                      }}>
                        ✓ CERRADO
                      </span>
                    )}
                  </div>
                  <div style={{ 
                    fontSize: '13px', 
                    color: '#6c757d', 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    marginBottom: '4px'
                  }}>
                    {lastMessage?.text || 'Sin mensajes'}
                  </div>
                  {lastMessage?.timestamp && (
                    <div style={{ fontSize: '11px', color: '#adb5bd' }}>
                      {new Date(lastMessage.timestamp).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* CONVERSACIÓN */}
        <div style={{ 
          background: 'white', 
          borderRadius: '12px', 
          border: '1px solid #dee2e6', 
          display: 'flex', 
          flexDirection: 'column', 
          height: '70vh',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          {selectedChat ? (
            <>
              {/* Header */}
              <div style={{ 
                padding: '20px', 
                borderBottom: '1px solid #dee2e6', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                background: '#f8f9fa'
              }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', color: '#212529' }}>
                    {selectedChat.user?.name || 'Cliente'}
                    {selectedChat.status === 'closed' && (
                      <span style={{ 
                        marginLeft: '12px', 
                        fontSize: '14px', 
                        color: '#28a745',
                        fontWeight: 'normal'
                      }}>
                        ✓ Cerrado
                      </span>
                    )}
                  </h3>
                  <small style={{ color: '#6c757d' }}>{selectedChat.user?.email || ''}</small>
                </div>
                {selectedChat.status === 'open' && (
                  <button 
                    onClick={() => closeChat(selectedChat._id)} 
                    style={{ 
                      background: '#dc3545', 
                      color: 'white', 
                      border: 'none', 
                      padding: '10px 20px', 
                      borderRadius: '8px', 
                      cursor: 'pointer', 
                      fontWeight: '600',
                      fontSize: '14px',
                      transition: 'all 0.3s',
                      boxShadow: '0 2px 8px rgba(220,53,69,0.3)'
                    }}
                  >
                    ✓ Finalizar Chat
                  </button>
                )}
              </div>
              
              {/* Mensajes */}
              <div style={{ 
                flex: 1, 
                padding: '20px', 
                overflowY: 'auto', 
                background: '#f8f9fa' 
              }}>
                {selectedChat.messages?.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#adb5bd', marginTop: '50px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '10px' }}>💬</div>
                    <p>No hay mensajes</p>
                  </div>
                ) : (
                  selectedChat.messages?.map((m, i) => (
                    <div 
                      key={i} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: m.sender === 'admin' ? 'flex-end' : 'flex-start', 
                        marginBottom: '12px'
                      }}
                    >
                      <div style={{ 
                        background: m.sender === 'admin' 
                          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                          : 'white', 
                        color: m.sender === 'admin' ? 'white' : '#212529',
                        padding: '12px 16px', 
                        borderRadius: '12px', 
                        maxWidth: '70%',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
                        border: m.sender === 'admin' ? 'none' : '1px solid #dee2e6'
                      }}>
                        <p style={{ margin: '0 0 6px 0', wordWrap: 'break-word', lineHeight: '1.4' }}>
                          {m.text}
                        </p>
                        <small style={{ fontSize: '10px', opacity: 0.7 }}>
                          {new Date(m.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </small>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              {selectedChat.status === 'open' ? (
                <form 
                  onSubmit={sendMessage} 
                  style={{ 
                    padding: '20px', 
                    borderTop: '1px solid #dee2e6', 
                    display: 'flex', 
                    gap: '12px',
                    background: 'white'
                  }}
                >
                  <input 
                    type="text" 
                    value={message} 
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Escribe tu respuesta..."
                    disabled={!connected}
                    style={{ 
                      flex: 1, 
                      padding: '12px 16px', 
                      borderRadius: '25px', 
                      border: '2px solid #dee2e6', 
                      outline: 'none',
                      fontSize: '14px',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                  />
                  <button 
                    type="submit" 
                    disabled={!connected || !message.trim()}
                    style={{ 
                      background: connected && message.trim() 
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        : '#e9ecef', 
                      color: connected && message.trim() ? 'white' : '#adb5bd', 
                      border: 'none', 
                      padding: '12px 28px', 
                      borderRadius: '25px', 
                      cursor: connected && message.trim() ? 'pointer' : 'not-allowed', 
                      fontWeight: 'bold',
                      fontSize: '14px',
                      transition: 'all 0.3s',
                      boxShadow: connected && message.trim() ? '0 4px 12px rgba(102,126,234,0.3)' : 'none'
                    }}
                  >
                    Enviar ✈️
                  </button>
                </form>
              ) : (
                <div style={{
                  padding: '20px',
                  borderTop: '1px solid #dee2e6',
                  textAlign: 'center',
                  color: '#6c757d',
                  background: '#f8f9fa',
                  fontSize: '14px'
                }}>
                  ✓ Esta conversación está finalizada
                </div>
              )}
            </>
          ) : (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%', 
              color: '#adb5bd' 
            }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>💬</div>
              <h3 style={{ margin: '0 0 8px 0', color: '#6c757d' }}>
                Selecciona una conversación
              </h3>
              <p style={{ margin: 0, fontSize: '14px' }}>
                Elige un chat de la lista para comenzar
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChat;