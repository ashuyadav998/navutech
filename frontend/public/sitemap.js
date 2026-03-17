const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');

const DOMAIN = 'https://aszutech.store';

router.get('/', async (req, res) => {
  try {
    const [products, categories] = await Promise.all([
      Product.find({ active: true }).select('slug updatedAt').lean(),
      Category.find().select('slug updatedAt').lean()
    ]);

    const today = new Date().toISOString().split('T')[0];

    const staticPages = [
      { url: '/',         priority: '1.0', changefreq: 'daily' },
      { url: '/products', priority: '0.9', changefreq: 'daily' },
      { url: '/login',    priority: '0.3', changefreq: 'monthly' },
      { url: '/register', priority: '0.3', changefreq: 'monthly' },
    ];

    const urls = [
      ...staticPages.map(p => `
  <url>
    <loc>${DOMAIN}${p.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`),

      ...categories.map(cat => `
  <url>
    <loc>${DOMAIN}/categoria/${cat.slug}</loc>
    <lastmod>${cat.updatedAt ? new Date(cat.updatedAt).toISOString().split('T')[0] : today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`),

      ...products.map(p => `
  <url>
    <loc>${DOMAIN}/productos/${p.slug}</loc>
    <lastmod>${p.updatedAt ? new Date(p.updatedAt).toISOString().split('T')[0] : today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`)
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(xml);

  } catch (error) {
    res.status(500).send('Error generando sitemap');
  }
});

module.exports = router;
