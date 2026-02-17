import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { getProducts, getCategories, getCategory } from '../services/api';
import '../styles/Products.css';

const Products = () => {
  const { categorySlug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate(); // Para navegar sin recargar la página completa
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  // Extraemos el término de búsqueda de la URL (?search=...)
  const searchQuery = searchParams.get('search') || '';

  const [filters, setFilters] = useState({
    category: '',
    search: searchQuery, // Inicializamos con lo que venga en la URL
    isOffer: searchParams.get('ofertas') === 'true',
    sort: 'newest'
  });

  // Sincronizar el estado de filtros cuando cambie la búsqueda en la URL
  useEffect(() => {
    setFilters(prev => ({ 
      ...prev, 
      search: searchQuery,
      isOffer: searchParams.get('ofertas') === 'true'
    }));
  }, [searchQuery, searchParams]);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (categorySlug) {
      loadCategoryAndProducts();
    } else {
      loadProducts();
    }
    // Añadimos searchQuery a las dependencias para que recargue al buscar
  }, [categorySlug, filters, searchQuery]);

  const loadCategories = async () => {
    try {
      const response = await getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  const loadCategoryAndProducts = async () => {
    try {
      setLoading(true);
      const categoryRes = await getCategory(categorySlug);
      setCurrentCategory(categoryRes.data);
      
      const productsRes = await getProducts({ 
        category: categoryRes.data._id,
        ...filters 
      });
      setProducts(productsRes.data);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      // Enviamos los filtros (incluyendo search) a la API
      const response = await getProducts(filters);
      setProducts(response.data);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  if (loading) {
    return <div className="loading">Cargando productos...</div>;
  }

  return (
    <div className="products-page">
      <div className="container">
        <div className="page-header">
          <h1>
            {searchQuery 
              ? `Resultados para "${searchQuery}"` 
              : (currentCategory ? currentCategory.name : 'Todos los Productos')}
          </h1>
          {currentCategory && currentCategory.description && !searchQuery && (
            <p>{currentCategory.description}</p>
          )}
        </div>

        <div className="products-layout">
          <aside className="filters-sidebar">
            <div className="filter-group">
              <h3>Categorías</h3>
              <ul className="category-list">
                <li>
                  <button 
                    className={!categorySlug ? 'active' : ''}
                    onClick={() => navigate('/products')} // Usar navigate en lugar de href
                  >
                    Todas
                  </button>
                </li>
                {categories.map(cat => (
                  <li key={cat._id}>
                    <button
                      className={categorySlug === cat.slug ? 'active' : ''}
                      onClick={() => navigate(`/categoria/${cat.slug}`)} // Usar navigate
                    >
                      {cat.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="filter-group">
              <h3>Filtros</h3>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.isOffer}
                  onChange={(e) => handleFilterChange('isOffer', e.target.checked)}
                />
                Solo ofertas
              </label>
            </div>

            <div className="filter-group">
              <h3>Ordenar por</h3>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
              >
                <option value="newest">Más recientes</option>
                <option value="price-asc">Precio: menor a mayor</option>
                <option value="price-desc">Precio: mayor a menor</option>
              </select>
            </div>
          </aside>

          <div className="products-content">
            <div className="products-info">
              <p>{products.length} productos encontrados</p>
              {searchQuery && (
                <button className="clear-search" onClick={() => navigate('/products')}>
                  Limpiar búsqueda
                </button>
              )}
            </div>

            {products.length > 0 ? (
              <div className="products-grid">
                {products.map(product => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            ) : (
              <div className="no-products">
                <p>No se encontraron productos que coincidan con tu búsqueda.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;