const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');

const DOMAIN = 'https://aszutech.store';

// Escapar caracteres especiales XML
const escapeXml = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const safeDate = (date) => {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
    return d.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
};

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

    const urlEntries = [
      ...staticPages.map(p => `
  <url>
    <loc>${DOMAIN}${p.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`),

      ...categories
        .filter(cat => cat.slug)
        .map(cat => `
  <url>
    <loc>${DOMAIN}/categoria/${escapeXml(cat.slug)}</loc>
    <lastmod>${safeDate(cat.updatedAt)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`),

      ...products
        .filter(p => p.slug)
        .map(p => `
  <url>
    <loc>${DOMAIN}/productos/${escapeXml(p.slug)}</loc>
    <lastmod>${safeDate(p.updatedAt)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`)
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.join('')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(xml);

  } catch (error) {
    console.error('Error generando sitemap:', error);
    res.status(500).send('Error generando sitemap');
  }
});

module.exports = router;