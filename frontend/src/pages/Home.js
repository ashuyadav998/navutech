import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { getProducts, getCategories } from '../services/api';
import '../styles/Home.css';
import SEO from '../components/SEO';
import { FaShieldAlt, FaTruck, FaHeadset, FaUndo } from 'react-icons/fa';

const TICKER_ITEMS = [
  'Envío gratis en pedidos +50 €',
  'Garantía oficial en todos los productos',
  '30 días para devoluciones',
  'Soporte especializado 24/7',
  'Pago seguro 100%',
  'Miles de clientes satisfechos',
];

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [offerProducts, setOfferProducts]       = useState([]);
  const [categories, setCategories]             = useState([]);
  const [loading, setLoading]                   = useState(true);

  useEffect(() => { loadData(); }, []);

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
    } catch (err) {
      console.error('Error al cargar datos:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="full-page-loader">
        <div className="spinner" />
        <p>Cargando</p>
      </div>
    );
  }

  /* duplicate ticker for seamless loop */
  const tickerAll = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div className="home">
      <SEO
        title="AszuTech — Tecnología Premium al Mejor Precio"
        description="AszuTech: tu tienda de electrónica y tecnología en España. iPhone, Samsung, laptops, accesorios y más. Envío rápido, garantía oficial y soporte 24/7."
        keywords="tienda tecnología online, electrónica España, AszuTech, comprar iPhone, Samsung, laptops, accesorios móvil"
        url="https://aszutech.es"
      />

      {/* ── Hero ── */}
      <section className="hero">
        <div className="container">
          {/* Left */}
          <div className="hero-content">
            <div className="hero-eyebrow">Nueva temporada · Tecnología 2025</div>
            <h1>
              Tu próximo<br />
              dispositivo,<br />
              <em>al mejor precio</em>
            </h1>
            <p>
              Electrónica premium con garantía oficial,
              envío en 24&nbsp;h y soporte especializado.
            </p>
            <Link to="/products" className="cta-button">
              Ver todos los productos
            </Link>
          </div>

          {/* Right — visual */}
          <div className="hero-visual">
            <div className="hero-badge-grid">
              <div className="hero-badge">
                <div className="hero-badge-icon">🚀</div>
                <div>
                  <div className="hero-badge-num">+10.000</div>
                  <div className="hero-badge-label">Clientes satisfechos</div>
                </div>
              </div>
              <div className="hero-badge">
                <div className="hero-badge-num">24h</div>
                <div className="hero-badge-label">Envío express</div>
              </div>
              <div className="hero-badge">
                <div className="hero-badge-num">100%</div>
                <div className="hero-badge-label">Garantía oficial</div>
              </div>
              <div className="hero-badge">
                <div className="hero-badge-num">30d</div>
                <div className="hero-badge-label">Devoluciones</div>
              </div>
              <div className="hero-badge">
                <div className="hero-badge-num">24/7</div>
                <div className="hero-badge-label">Soporte experto</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Ticker ── */}
      <div className="ticker" aria-hidden="true">
        <div className="ticker-inner">
          {tickerAll.map((item, i) => (
            <span key={i} className="ticker-item">
              <span className="ticker-dot" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── Categorías ── */}
      <section className="categories-section">
        <div className="container">
          <div className="section-header">
            <div className="section-header-left">
              <span className="section-label">Explorar</span>
              <h2>Categorías</h2>
            </div>
            <Link to="/products" className="view-all-btn">Ver todo</Link>
          </div>
          <div className="categories-grid">
            {categories.map(cat => (
              <Link
                key={cat._id}
                to={`/categoria/${cat.slug}`}
                className="category-card"
              >
                <div className="category-icon">
                  {cat.image
                    ? <img src={cat.image} alt={cat.name} />
                    : <div className="category-placeholder">{cat.name.charAt(0)}</div>
                  }
                </div>
                <h3>{cat.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Destacados ── */}
      {featuredProducts.length > 0 && (
        <section className="featured-section">
          <div className="container">
            <div className="section-header">
              <div className="section-header-left">
                <span className="section-label">Selección</span>
                <h2>Productos <span className="accent">Destacados</span></h2>
              </div>
              <Link to="/products" className="view-all-btn">Ver todos</Link>
            </div>
            <div className="products-grid">
              {featuredProducts.map(p => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Ofertas ── */}
      {offerProducts.length > 0 && (
        <section className="offers-section">
          <div className="container">
            <div className="section-header">
              <div className="section-header-left">
                <span className="section-label">Ahorra ahora</span>
                <h2>Ofertas <span className="accent">Especiales</span></h2>
              </div>
              <Link to="/products?ofertas=true" className="view-all-btn">Ver todas</Link>
            </div>
            <div className="products-grid">
              {offerProducts.map(p => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;