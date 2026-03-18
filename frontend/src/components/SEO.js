import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ 
  title = 'AszuTech — Tecnología Premium al Mejor Precio',
  description = 'AszuTech: tu tienda de electrónica y tecnología en España. iPhone, Samsung, laptops, accesorios y más. Envío rápido, garantía oficial y soporte 24/7.',
  keywords = 'tienda tecnología online, electrónica España, AszuTech, comprar iPhone, Samsung, laptops, accesorios móvil',
  image = 'https://aszutech.store/og-image.jpg',
  url = 'https://aszutech.store',
  type = 'website'
}) => {
  const siteTitle = 'AszuTech';
  const fullTitle = title.includes(siteTitle) ? title : `${title} | ${siteTitle}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={siteTitle} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* SEO */}
      <meta name="robots" content="index, follow" />
      <meta name="language" content="Spanish" />
      <meta name="author" content="AszuTech" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </Helmet>
  );
};

export default SEO;