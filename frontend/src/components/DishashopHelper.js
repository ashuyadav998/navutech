import React from 'react';
import { FaCopy } from 'react-icons/fa';
import toast from 'react-hot-toast';

const DishashopHelper = ({ order }) => {
  const copyForDishashop = () => {
    const dishashopData = `
PEDIDO: #${order._id.slice(-8).toUpperCase()}

PRODUCTOS:
${order.items.map(item => 
  `- ${item.product?.name || 'Producto'} x${item.quantity}`
).join('\n')}

ENVÍO A:
${order.user?.name || ''}
${order.shippingAddress?.street || ''}
${order.shippingAddress?.city || ''}, ${order.shippingAddress?.postalCode || ''}
Teléfono: ${order.phone || ''}
Email: ${order.user?.email || ''}

TOTAL: ${order.totalAmount.toFixed(2)}€
    `.trim();

    navigator.clipboard.writeText(dishashopData);
    toast.success('📋 Datos copiados para Dishashop');
  };

  return (
    <button 
      onClick={copyForDishashop}
      className="btn btn-secondary"
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        fontSize: '14px'
      }}
    >
      <FaCopy /> Copiar para Dishashop
    </button>
  );
};

export default DishashopHelper;