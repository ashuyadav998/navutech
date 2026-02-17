import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { getProducts, getCategories } from '../services/api';
import '../styles/Home.css';

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
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1>Bienvenido a SimShop</h1>
            <p>Las mejores ofertas en tarjetas SIM y productos electrónicos</p>
            <Link to="/productos" className="cta-button">Ver Todos los Productos</Link>
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
    </div>
  );
};

export default Home;
