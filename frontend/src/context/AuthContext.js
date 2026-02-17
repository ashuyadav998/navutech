import React, { createContext, useState, useContext, useEffect, useRef } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null); // Referencia para el temporizador de inactividad

  // --- FUNCIÓN LOGOUT ---
  const logout = () => {
    sessionStorage.clear(); // Limpia token de sesión
    localStorage.clear();   // Limpia datos de usuario
    setUser(null);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  // --- LÓGICA DE INACTIVIDAD (15 MINUTOS) ---
  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    
    // Solo activamos el temporizador si hay un usuario logueado
    if (user) {
      timerRef.current = setTimeout(() => {
        console.log("Sesión cerrada por inactividad");
        logout();
      }, 900000); // 900,000ms = 15 minutos
    }
  };

  useEffect(() => {
    // Si hay usuario, escuchamos eventos para resetear el timer
    if (user) {
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      
      resetTimer(); // Iniciar al montar/loguear
      events.forEach(event => window.addEventListener(event, resetTimer));

      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        events.forEach(event => window.removeEventListener(event, resetTimer));
      };
    }
  }, [user]);

  // --- PERSISTENCIA AL CARGAR ---
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = sessionStorage.getItem('token');

    // Si hay usuario en local pero NO hay token en session, significa que cerró el navegador
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    } else {
      // Si falta el token, aseguramos limpieza
      logout();
    }
    setLoading(false);
  }, []);

  // --- FUNCIONES DE AUTH ---
  const login = async (email, password) => {
    const res = await fetch('https://navutech.vercel.app/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    
    if (res.ok) {
      // Guardamos el USER en local para persistir nombre/avatar
      localStorage.setItem('user', JSON.stringify(data.user));
      // Guardamos el TOKEN en session para que muera al cerrar la pestaña
      sessionStorage.setItem('token', data.token);
      setUser(data.user);
    }
    return { success: res.ok, ...data };
  };

  const sendPasswordResetCode = async (email) => {
    const res = await fetch('https://navutech-backend.onrender.com/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return await res.json();
  };

  const resetPassword = async (email, code, newPassword) => {
    const res = await fetch('https://navutech-backend.onrender.com/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, newPassword }),
    });
    return await res.json();
  };

  

  const isAuthenticated = () => !!user;

  

  return (
    <AuthContext.Provider value={{ 
      user, loading, login, logout, 
      sendPasswordResetCode, resetPassword, isAuthenticated 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};



export const useAuth = () => useContext(AuthContext);
