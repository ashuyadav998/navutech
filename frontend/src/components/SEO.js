// src/components/SEO.js — AszuTech
import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({
  title = 'AszuTech — Tecnología Premium para ti',
  description = 'AszuTech: tu tienda de electrónica y tecnología de confianza. iPhone, Samsung, laptops, accesorios y más a precios imbatibles. Envío rápido · Garantía oficial · Soporte 24/7.',
  keywords = 'tienda tecnología online, electrónica España, comprar iPhone, Samsung Galaxy, laptops baratos, accesorios móvil, AszuTech, tienda tech, gadgets, comprar online España',
  image = 'https://aszutech.es/og-image.jpg',
  url = 'https://aszutech.es',
  type = 'website',
  product = null, // pass product object for product pages
  breadcrumb = null, // array of {name, url}
}) => {
  const SITE_NAME = 'AszuTech';
  const SITE_URL  = 'https://aszutech.es';

  const fullTitle = title.includes(SITE_NAME)
    ? title
    : `${title} | ${SITE_NAME}`;

  // ── JSON-LD Structured Data ──
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    sameAs: [
      'https://twitter.com/aszutech',
      'https://instagram.com/aszutech',
      'https://facebook.com/aszutech',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['Spanish', 'English'],
      email: 'hola@aszutech.es',
    },
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/products?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  const productSchema = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description,
        image: product.image,
        brand: { '@type': 'Brand', name: product.brand || SITE_NAME },
        sku: product.sku || product._id,
        offers: {
          '@type': 'Offer',
          url: url,
          priceCurrency: 'EUR',
          price: product.price,
          availability: product.stock > 0
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
          seller: { '@type': 'Organization', name: SITE_NAME },
        },
      }
    : null;

  const breadcrumbSchema = breadcrumb
    ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumb.map((item, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: item.name,
          item: `${SITE_URL}${item.url}`,
        })),
      }
    : null;

  return (
    <Helmet>
      {/* ── Basic ── */}
      <html lang="es" />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords"    content={keywords} />
      <link rel="canonical"    href={url} />

      {/* ── Robots & Crawl ── */}
      <meta name="robots"        content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="googlebot"     content="index, follow" />
      <meta name="language"      content="Spanish" />
      <meta name="author"        content={SITE_NAME} />
      <meta name="publisher"     content={SITE_NAME} />
      <meta name="copyright"     content={`© ${new Date().getFullYear()} ${SITE_NAME}`} />
      <meta name="theme-color"   content="#00C8FF" />
      <meta name="viewport"      content="width=device-width, initial-scale=1.0" />

      {/* ── Open Graph ── */}
      <meta property="og:type"        content={type} />
      <meta property="og:url"         content={url} />
      <meta property="og:title"       content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image"       content={image} />
      <meta property="og:image:width"  content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt"    content={`${SITE_NAME} - ${title}`} />
      <meta property="og:site_name"   content={SITE_NAME} />
      <meta property="og:locale"      content="es_ES" />

      {/* ── Twitter Card ── */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:site"        content="@aszutech" />
      <meta name="twitter:creator"     content="@aszutech" />
      <meta name="twitter:url"         content={url} />
      <meta name="twitter:title"       content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image"       content={image} />
      <meta name="twitter:image:alt"   content={`${SITE_NAME} - ${title}`} />

      {/* ── JSON-LD Structured Data ── */}
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(websiteSchema)}
      </script>
      {productSchema && (
        <script type="application/ld+json">
          {JSON.stringify(productSchema)}
        </script>
      )}
      {breadcrumbSchema && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
