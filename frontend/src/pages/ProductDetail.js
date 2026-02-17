import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaMinus, FaPlus } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import { getProduct } from '../services/api';
import '../styles/ProductDetail.css';

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    loadProduct();
  }, [slug]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await getProduct(slug);
      setProduct(response.data);
    } catch (error) {
      console.error('Error al cargar producto:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
    alert('Producto añadido al carrito');
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    navigate('/carrito');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  if (loading) {
    return <div className="loading">Cargando producto...</div>;
  }

  if (!product) {
    return <div className="error">Producto no encontrado</div>;
  }

  return (
    <div className="product-detail">
      <div className="container">
        <div className="product-layout">
          {/* Galería de imágenes */}
          <div className="product-gallery">
            <div className="main-image">
              <img 
                src={product.images[selectedImage] || 'https://via.placeholder.com/500'} 
                alt={product.name} 
              />
              {product.isOffer && (
                <span className="discount-badge">-{product.discount}%</span>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="thumbnail-list">
                {product.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className={selectedImage === index ? 'active' : ''}
                    onClick={() => setSelectedImage(index)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Información del producto */}
          <div className="product-info-detail">
            {product.brand && <p className="product-brand">{product.brand}</p>}
            <h1>{product.name}</h1>
            
            {product.category && (
              <p className="product-category">
                Categoría: {product.category.name}
              </p>
            )}

            <div className="product-price-detail">
              {product.originalPrice > 0 ? (
                <>
                  <span className="price-original">{formatPrice(product.originalPrice)}</span>
                  <span className="price-current">{formatPrice(product.price)}</span>
                  <span className="savings">
                    Ahorras {formatPrice(product.originalPrice - product.price)}
                  </span>
                </>
              ) : (
                <span className="price-current">{formatPrice(product.price)}</span>
              )}
            </div>

            <div className="product-stock-detail">
              {product.stock > 0 ? (
                <span className="in-stock">✓ En stock ({product.stock} disponibles)</span>
              ) : (
                <span className="out-stock">✗ Agotado</span>
              )}
            </div>

            <div className="product-description">
              <h3>Descripción</h3>
              <p>{product.description}</p>
            </div>

            {product.specifications && product.specifications.size > 0 && (
              <div className="product-specs">
                <h3>Especificaciones</h3>
                <ul>
                  {Array.from(product.specifications).map(([key, value]) => (
                    <li key={key}>
                      <strong>{key}:</strong> {value}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {product.stock > 0 && (
              <div className="product-actions">
                <div className="quantity-selector">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <FaMinus />
                  </button>
                  <span>{quantity}</span>
                  <button 
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                  >
                    <FaPlus />
                  </button>
                </div>

                <button className="add-to-cart-btn" onClick={handleAddToCart}>
                  <FaShoppingCart />
                  Añadir al carrito
                </button>

                <button className="buy-now-btn" onClick={handleBuyNow}>
                  Comprar ahora
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
