import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { getProducts, getCategories } from '../services/api';
import '../styles/Home.css';
import SEO from '../components/SEO';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [offerProducts, setOfferProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [productsRes, categoriesRes] = await Promise.all([
        getProducts({}),
        getCategories()
      ]);

      const products = productsRes.data;
      setFeaturedProducts(products.filter(p => p.isFeatured).slice(0, 4));
      setOfferProducts(products.filter(p => p.isOffer).slice(0, 8));
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    
    <div className="home">

      <SEO 
  title="SimShop - Tienda Online de Electrónica y Tecnología"
  description="Encuentra los mejores productos electrónicos al mejor precio. iPhone, Samsung, laptops, accesorios y más. Envío gratis en pedidos superiores a 50€."
  keywords="tienda online, electrónica, móviles, iPhone, Samsung, laptops, accesorios, tecnología, comprar online España"
  url="https://navutech.netlify.app"
/>
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1>Bienvenido a SimShop</h1>
<h1>Tienda Online de Electrónica y Tecnología - Los Mejores Precios</h1>            <Link to="/productos" className="cta-button">Ver Todos los Productos</Link>
          </div>
        </div>
      </section>

      {/* Categorías */}
      <section className="categories-section">
        <div className="container">
          <h2>Explora por Categorías</h2>
          <div className="categories-grid">
            {categories.map(category => (
              <Link 
                key={category._id} 
                to={`/categoria/${category.slug}`} 
                className="category-card"
              >
                <div className="category-icon">
                  {category.image ? (
                    <img src={category.image} alt={category.name} />
                  ) : (
                    <div className="category-placeholder">{category.name.charAt(0)}</div>
                  )}
                </div>
                <h3>{category.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Productos Destacados */}
      {featuredProducts.length > 0 && (
        <section className="featured-section">
          <div className="container">
            <h2>Productos Destacados</h2>
            <div className="products-grid">
              {featuredProducts.map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Ofertas */}
      {offerProducts.length > 0 && (
        <section className="offers-section">
          <div className="container">
            <h2>Ofertas Especiales</h2>
            <div className="products-grid">
              {offerProducts.map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
            <div className="view-all">
              <Link to="/productos?ofertas=true" className="view-all-btn">Ver Todas las Ofertas</Link>
            </div>
          </div>
        </section>
      )}
      <section style={{ padding: '40px 20px', background: 'var(--bg-white)' }}>
  <div className="container">
    <h2>¿Por qué comprar en SimShop?</h2>
    <p style={{ lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: '20px' }}>
      SimShop es tu tienda online de confianza para comprar productos electrónicos y tecnología 
      en España. Ofrecemos una amplia selección de móviles, laptops, tablets, accesorios y más, 
      con los mejores precios del mercado y envío gratis en pedidos superiores a 50€.
    </p>
    
    <h3>Nuestros productos más populares</h3>
    <p style={{ lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: '20px' }}>
      Encuentra las últimas novedades en smartphones como iPhone 15, Samsung Galaxy S24, 
      laptops de las mejores marcas, auriculares inalámbricos, cargadores rápidos y mucho más. 
      Todos nuestros productos cuentan con garantía oficial y atención al cliente personalizada.
    </p>

    <h3>Compra segura y envío rápido</h3>
    <p style={{ lineHeight: 1.8, color: 'var(--text-secondary)' }}>
      Realizamos envíos a toda España con seguimiento incluido. Pago 100% seguro con tarjeta, 
      Bizum, transferencia o contrareembolso. Devoluciones fáciles en 30 días. 
      Soporte al cliente disponible para resolver todas tus dudas.
    </p>
  </div>
</section>
    </div>
  );
};

export default Home;
