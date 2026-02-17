import React from 'react';
import { Link } from 'react-router-dom';
import { FaShoppingCart } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import '../styles/ProductCard.css';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  const handleAddToCart = (e) => {
    e.preventDefault();
    addToCart(product);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  return (
    <Link to={`/productos/${product.slug}`} className="product-card">
      <div className="product-image">
        {product.isOffer && (
          <span className="discount-badge">-{product.discount}%</span>
        )}
        <img 
          src={product.images[0] || 'https://via.placeholder.com/300'} 
          alt={product.name} 
        />
      </div>

      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        
        {product.brand && (
          <p className="product-brand">{product.brand}</p>
        )}

        <div className="product-price">
          {product.originalPrice > 0 ? (
            <>
              <span className="price-original">{formatPrice(product.originalPrice)}</span>
              <span className="price-current">{formatPrice(product.price)}</span>
            </>
          ) : (
            <span className="price-current">{formatPrice(product.price)}</span>
          )}
        </div>

        <div className="product-stock">
          {product.stock > 0 ? (
            <span className="in-stock">En stock</span>
          ) : (
            <span className="out-stock">Agotado</span>
          )}
        </div>

        <button 
          className="add-to-cart-btn"
          onClick={handleAddToCart}
          disabled={product.stock === 0}
        >
          <FaShoppingCart />
          Añadir al carrito
        </button>
      </div>
    </Link>
  );
};

export default ProductCard;
