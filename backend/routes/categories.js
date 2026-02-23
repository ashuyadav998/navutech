const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { auth, isAdmin } = require('./auth');

// ==========================================
// OBTENER TODAS LAS CATEGORÍAS
// ==========================================
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ active: true }).sort({ order: 1, name: 1 });
    res.json(categories);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

// ==========================================
// CREAR CATEGORÍA (Admin)
// ==========================================
router.post('/', auth, isAdmin, async (req, res) => {
  try {
    const { name, description, image, icon, subcategories } = req.body;

    const category = new Category({
      name,
      description: description || '',
      image: image || '',
      icon: icon || '',
      subcategories: subcategories || []
    });

    await category.save();

    console.log('✅ Categoría creada:', category.name);

    res.status(201).json({
      message: 'Categoría creada exitosamente',
      category
    });
  } catch (error) {
    console.error('Error al crear categoría:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'Ya existe una categoría con ese nombre' 
      });
    }
    
    res.status(500).json({ 
      error: 'Error al crear categoría',
      message: error.message 
    });
  }
});

// ==========================================
// ACTUALIZAR CATEGORÍA (Admin)
// ==========================================
router.put('/:id', auth, isAdmin, async (req, res) => {
  try {
    const { name, description, image, icon, subcategories, active, order } = req.body;

    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = image;
    if (icon !== undefined) category.icon = icon;
    if (subcategories !== undefined) category.subcategories = subcategories;
    if (active !== undefined) category.active = active;
    if (order !== undefined) category.order = order;

    await category.save();

    console.log('✅ Categoría actualizada:', category.name);

    res.json({
      message: 'Categoría actualizada exitosamente',
      category
    });
  } catch (error) {
    console.error('Error al actualizar categoría:', error);
    res.status(500).json({ 
      error: 'Error al actualizar categoría',
      message: error.message 
    });
  }
});

// ==========================================
// ELIMINAR CATEGORÍA (Admin)
// ==========================================
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    // Verificar si hay productos en esta categoría
    const Product = require('../models/Product');
    const productsCount = await Product.countDocuments({ category: req.params.id });
    
    if (productsCount > 0) {
      return res.status(400).json({ 
        error: `No se puede eliminar. Hay ${productsCount} producto(s) en esta categoría.`,
        productsCount 
      });
    }

    await category.deleteOne();

    console.log('✅ Categoría eliminada:', category.name);

    res.json({ message: 'Categoría eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    res.status(500).json({ 
      error: 'Error al eliminar categoría',
      message: error.message 
    });
  }
});

// ==========================================
// AGREGAR SUBCATEGORÍA (Admin)
// ==========================================
router.post('/:id/subcategories', auth, isAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;

    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    // Generar slug para subcategoría
    const slug = name
      .toLowerCase()
      .replace(/[áäâà]/g, 'a')
      .replace(/[éëêè]/g, 'e')
      .replace(/[íïîì]/g, 'i')
      .replace(/[óöôò]/g, 'o')
      .replace(/[úüûù]/g, 'u')
      .replace(/ñ/g, 'n')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Verificar que no exista ya
    const exists = category.subcategories.some(sub => sub.slug === slug);
    if (exists) {
      return res.status(400).json({ error: 'Ya existe una subcategoría con ese nombre' });
    }

    category.subcategories.push({
      name,
      slug,
      description: description || '',
      active: true
    });

    await category.save();

    console.log('✅ Subcategoría agregada:', name);

    res.json({
      message: 'Subcategoría agregada exitosamente',
      category
    });
  } catch (error) {
    console.error('Error al agregar subcategoría:', error);
    res.status(500).json({ 
      error: 'Error al agregar subcategoría',
      message: error.message 
    });
  }
});

// ==========================================
// ELIMINAR SUBCATEGORÍA (Admin)
// ==========================================
router.delete('/:id/subcategories/:subId', auth, isAdmin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    const subcategory = category.subcategories.id(req.params.subId);
    if (!subcategory) {
      return res.status(404).json({ error: 'Subcategoría no encontrada' });
    }

    // Verificar si hay productos con esta subcategoría
    const Product = require('../models/Product');
    const productsCount = await Product.countDocuments({ 
      category: req.params.id,
      subcategory: subcategory.slug
    });
    
    if (productsCount > 0) {
      return res.status(400).json({ 
        error: `No se puede eliminar. Hay ${productsCount} producto(s) en esta subcategoría.`,
        productsCount 
      });
    }

    category.subcategories.pull(req.params.subId);
    await category.save();

    console.log('✅ Subcategoría eliminada:', subcategory.name);

    res.json({ 
      message: 'Subcategoría eliminada exitosamente',
      category 
    });
  } catch (error) {
    console.error('Error al eliminar subcategoría:', error);
    res.status(500).json({ 
      error: 'Error al eliminar subcategoría',
      message: error.message 
    });
  }
});

module.exports = router;