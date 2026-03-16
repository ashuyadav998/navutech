// backend/routes/sitemap.js
// Genera el sitemap dinámico con productos y categorías de la BD
// Añadir en server.js: app.use('/sitemap.xml', require('./routes/sitemap'));

const express  = require('express');
const router   = express.Router();
const Product  = require('../models/Product');
const Category = require('../models/Category');

const BASE_URL = 'https://aszutech.es';

// Páginas estáticas con su prioridad y frecuencia
const STATIC_PAGES = [
  { path: '/',            priority: '1.0', changefreq: 'daily'   },
  { path: '/products',    priority: '0.9', changefreq: 'daily'   },
  { path: '/contacto',    priority: '0.5', changefreq: 'monthly' },
  { path: '/envios',      priority: '0.4', changefreq: 'monthly' },
  { path: '/devoluciones',priority: '0.4', changefreq: 'monthly' },
  { path: '/faq',         priority: '0.5', changefreq: 'monthly' },
  { path: '/terminos',    priority: '0.3', changefreq: 'yearly'  },
  { path: '/privacidad',  priority: '0.3', changefreq: 'yearly'  },
  { path: '/cookies',     priority: '0.3', changefreq: 'yearly'  },
];

router.get('/', async (req, res) => {
  try {
    // Obtener productos y categorías activos
    const [products, categories] = await Promise.all([
      Product.find({ active: true }, 'slug updatedAt').lean(),
      Category.find({}, 'slug updatedAt').lean()
    ]);

    const today = new Date().toISOString().split('T')[0];

    // Construir URLs
    const urls = [];

    // 1. Páginas estáticas
    STATIC_PAGES.forEach(page => {
      urls.push(`
  <url>
    <loc>${BASE_URL}${page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`);
    });

    // 2. Categorías
    categories.forEach(cat => {
      const lastmod = cat.updatedAt
        ? new Date(cat.updatedAt).toISOString().split('T')[0]
        : today;
      urls.push(`
  <url>
    <loc>${BASE_URL}/categoria/${cat.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
    });

    // 3. Productos
    products.forEach(product => {
      const lastmod = product.updatedAt
        ? new Date(product.updatedAt).toISOString().split('T')[0]
        : today;
      urls.push(`
  <url>
    <loc>${BASE_URL}/product/${product.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
    });

    // Generar XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=3600'); // cache 1 hora
    res.send(xml);

  } catch (error) {
    console.error('Error generando sitemap:', error);
    res.status(500).send('Error generando sitemap');
  }
});

module.exports = router;
