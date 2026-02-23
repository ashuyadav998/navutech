// MODIFICACIÓN COMPLETA del CartContext para controlar MiniCart

import React, { createContext, useState, useContext, useEffect } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [miniCartOpen, setMiniCartOpen] = useState(false); // ✅ NUEVO

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item._id === product._id);

      let newCart;
      if (existingItem) {
        newCart = prevCart.map((item) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        
        toast.success(
          `${product.name} (${existingItem.quantity + 1})`,
          { icon: '🛒', duration: 2000 }
        );
      } else {
        newCart = [...prevCart, { ...product, quantity: 1 }];
        
        toast.success(
          `✅ ${product.name} añadido`,
          {
            duration: 2000,
            style: {
              background: '#067D62',
              color: '#fff',
            }
          }
        );
      }

      localStorage.setItem('cart', JSON.stringify(newCart));
      
      // ✅ ABRIR MINI CARRITO AUTOMÁTICAMENTE
      setMiniCartOpen(true);
      
      return newCart;
    });
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => {
      const removedItem = prevCart.find(item => item._id === productId);
      const newCart = prevCart.filter((item) => item._id !== productId);
      localStorage.setItem('cart', JSON.stringify(newCart));
      
      if (removedItem) {
        toast.error(`${removedItem.name} eliminado`, { duration: 2000 });
      }
      
      return newCart;
    });
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setCart((prevCart) => {
      const newCart = prevCart.map((item) =>
        item._id === productId ? { ...item, quantity: newQuantity } : item
      );
      localStorage.setItem('cart', JSON.stringify(newCart));
      return newCart;
    });
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('cart');
    toast.success('Carrito vaciado', { icon: '🗑️', duration: 2000 });
  };

  const getCartCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartCount,
        getCartTotal,
        miniCartOpen,        // ✅ NUEVO
        setMiniCartOpen      // ✅ NUEVO
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);