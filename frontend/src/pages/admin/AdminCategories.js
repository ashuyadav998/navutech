import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaPlus, FaTimes, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import axios from 'axios';
import '../../styles/AdminCategories.css';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false); // ✅ NUEVO
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedCategoryForSub, setSelectedCategoryForSub] = useState(null); // ✅ NUEVO
  const [expandedCategories, setExpandedCategories] = useState(new Set()); // ✅ NUEVO
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
    active: true
  });

  const [subFormData, setSubFormData] = useState({ // ✅ NUEVO
    name: '',
    description: ''
  });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      alert('Error al cargar las categorías');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });

    if (name === 'name') {
      const slug = value.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleSubInputChange = (e) => { // ✅ NUEVO
    const { name, value } = e.target;
    setSubFormData({
      ...subFormData,
      [name]: value
    });
  };

  const openModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        image: category.image || '',
        active: category.active
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        image: '',
        active: true
      });
    }
    setShowModal(true);
  };

  // ✅ NUEVO: Modal para subcategorías
  const openSubModal = (category) => {
    setSelectedCategoryForSub(category);
    setSubFormData({ name: '', description: '' });
    setShowSubModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
  };

  const closeSubModal = () => { // ✅ NUEVO
    setShowSubModal(false);
    setSelectedCategoryForSub(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      
      if (editingCategory) {
        await axios.put(
          `${API_URL}/categories/${editingCategory._id}`, 
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Categoría actualizada correctamente');
      } else {
        await axios.post(
          `${API_URL}/categories`, 
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Categoría creada correctamente');
      }

      closeModal();
      loadCategories();
    } catch (error) {
      console.error('Error al guardar categoría:', error);
      alert('Error al guardar la categoría: ' + (error.response?.data?.error || error.message));
    }
  };

  // ✅ NUEVO: Agregar subcategoría
  const handleSubSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      
      await axios.post(
        `${API_URL}/categories/${selectedCategoryForSub._id}/subcategories`,
        subFormData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Subcategoría agregada correctamente');
      closeSubModal();
      loadCategories();
      
      // Expandir automáticamente la categoría
      setExpandedCategories(prev => new Set([...prev, selectedCategoryForSub._id]));
    } catch (error) {
      console.error('Error al agregar subcategoría:', error);
      alert('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta categoría? Esto podría afectar a los productos asociados.')) {
      try {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        await axios.delete(
          `${API_URL}/categories/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Categoría eliminada correctamente');
        loadCategories();
      } catch (error) {
        console.error('Error al eliminar categoría:', error);
        alert('Error: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  // ✅ NUEVO: Eliminar subcategoría
  const handleDeleteSubcategory = async (categoryId, subId) => {
    if (window.confirm('¿Estás seguro de eliminar esta subcategoría?')) {
      try {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        await axios.delete(
          `${API_URL}/categories/${categoryId}/subcategories/${subId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Subcategoría eliminada correctamente');
        loadCategories();
      } catch (error) {
        console.error('Error al eliminar subcategoría:', error);
        alert('Error: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  // ✅ NUEVO: Toggle expandir categoría
  const toggleExpand = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  if (loading) {
    return <div className="loading">Cargando categorías...</div>;
  }

  return (
    <div className="admin-categories">
      <div className="page-header">
        <h2>Gestión de Categorías</h2>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <FaPlus /> Nueva Categoría
        </button>
      </div>

      <div className="categories-grid">
        {categories.map(category => (
          <div key={category._id} className="category-card-admin">
            <div className="category-image">
              {category.image ? (
                <img src={category.image} alt={category.name} />
              ) : (
                <div className="category-placeholder">{category.name.charAt(0)}</div>
              )}
            </div>

            <div className="category-info">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* ✅ NUEVO: Botón para expandir/colapsar */}
                {category.subcategories && category.subcategories.length > 0 && (
                  <button 
                    className="expand-toggle"
                    onClick={() => toggleExpand(category._id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      color: '#667eea'
                    }}
                  >
                    {expandedCategories.has(category._id) ? <FaChevronDown /> : <FaChevronRight />}
                  </button>
                )}
                <h3 style={{ margin: 0 }}>{category.name}</h3>
              </div>
              
              <p className="category-slug">{category.slug}</p>
              
              {category.description && (
                <p className="category-description">{category.description}</p>
              )}
              
              {/* ✅ NUEVO: Mostrar cantidad de subcategorías */}
              {category.subcategories && category.subcategories.length > 0 && (
                <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  📁 {category.subcategories.length} subcategoría{category.subcategories.length !== 1 ? 's' : ''}
                </p>
              )}
              
              <span className={`status-badge ${category.active ? 'active' : 'inactive'}`}>
                {category.active ? 'Activa' : 'Inactiva'}
              </span>
            </div>

            <div className="category-actions">
              {/* ✅ NUEVO: Botón para agregar subcategoría */}
              <button 
                className="btn-icon btn-success"
                onClick={() => openSubModal(category)}
                title="Agregar subcategoría"
                style={{
                  background: '#48bb78',
                  color: 'white',
                  border: 'none',
                  padding: '8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <FaPlus />
              </button>
              
              <button 
                className="btn-icon btn-edit"
                onClick={() => openModal(category)}
                title="Editar"
              >
                <FaEdit />
              </button>
              <button 
                className="btn-icon btn-delete"
                onClick={() => handleDelete(category._id)}
                title="Eliminar"
              >
                <FaTrash />
              </button>
            </div>

            {/* ✅ NUEVO: Lista de subcategorías (expandible) */}
            {expandedCategories.has(category._id) && category.subcategories && category.subcategories.length > 0 && (
              <div style={{
                marginTop: '15px',
                paddingTop: '15px',
                borderTop: '1px solid #e0e0e0'
              }}>
                <h4 style={{ fontSize: '14px', marginBottom: '10px', color: '#666' }}>
                  Subcategorías:
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {category.subcategories.map(sub => (
                    <div 
                      key={sub._id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        background: '#f8f9fa',
                        borderRadius: '4px',
                        fontSize: '13px'
                      }}
                    >
                      <span>{sub.name}</span>
                      <button
                        onClick={() => handleDeleteSubcategory(category._id, sub._id)}
                        style={{
                          background: '#e53e3e',
                          color: 'white',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '11px'
                        }}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="no-data">No hay categorías registradas</div>
      )}

      {/* Modal de categoría */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
              <button className="modal-close" onClick={closeModal}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="category-form">
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Slug *</label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  required
                />
                <small>URL amigable (generado automáticamente)</small>
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Imagen (URL)</label>
                <input
                  type="url"
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </div>

              <div className="form-checkboxes">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="active"
                    checked={formData.active}
                    onChange={handleInputChange}
                  />
                  <span>Categoría activa</span>
                </label>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCategory ? 'Actualizar' : 'Crear'} Categoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ NUEVO: Modal de subcategoría */}
      {showSubModal && (
        <div className="modal-overlay" onClick={closeSubModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Nueva Subcategoría en "{selectedCategoryForSub?.name}"</h3>
              <button className="modal-close" onClick={closeSubModal}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubSubmit} className="category-form">
              <div className="form-group">
                <label>Nombre de la Subcategoría *</label>
                <input
                  type="text"
                  name="name"
                  value={subFormData.name}
                  onChange={handleSubInputChange}
                  required
                  placeholder="Ej: Smartphones, Laptops, etc."
                />
              </div>

              <div className="form-group">
                <label>Descripción (opcional)</label>
                <textarea
                  name="description"
                  value={subFormData.description}
                  onChange={handleSubInputChange}
                  rows="2"
                  placeholder="Descripción breve de la subcategoría"
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={closeSubModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Agregar Subcategoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;