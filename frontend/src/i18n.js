// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Traducciones ESPAÑOL
const es = {
  translation: {
    // Header
    'header.search': 'Buscar productos...',
    'header.login': 'Iniciar Sesión',
    'header.myProfile': 'Mi Perfil',
    'header.myOrders': 'Mis Pedidos',
    'header.notifications': 'Notificaciones',
    'header.settings': 'Configuración',
    'header.adminPanel': 'Panel Admin',
    'header.logout': 'Cerrar Sesión',
    'header.home': 'Inicio',
    'header.allProducts': 'Todos los Productos',
    
    // Home
    'home.hero.title': 'Tienda Online de Electrónica y Tecnología - Los Mejores Precios',
    'home.hero.subtitle': 'Miles de productos al mejor precio. Envío gratis en pedidos superiores a 50€',
    'home.hero.viewOffers': 'Ver Ofertas',
    'home.hero.exploreCatalog': 'Explorar Catálogo',
    
    'home.features.freeShipping': 'Envío Gratis',
    'home.features.freeShippingDesc': 'En pedidos superiores a 50€',
    'home.features.securePayment': 'Compra Segura',
    'home.features.securePaymentDesc': 'Pagos 100% protegidos',
    'home.features.support': 'Soporte 24/7',
    'home.features.supportDesc': 'Estamos aquí para ayudarte',
    'home.features.returns': 'Devoluciones Fáciles',
    'home.features.returnsDesc': '30 días para cambios',
    
    'home.featured': 'Ofertas Destacadas',
    'home.viewAll': 'Ver todo',
    'home.catalog': 'Explora Nuestro Catálogo',
    'home.viewAllProducts': 'Ver Todos los Productos',
    
    'home.seo.title1': '¿Por qué comprar en SimShop?',
    'home.seo.text1': 'SimShop es tu tienda online de confianza para comprar productos electrónicos y tecnología en España. Ofrecemos una amplia selección de móviles, laptops, tablets, accesorios y más, con los mejores precios del mercado y envío gratis en pedidos superiores a 50€.',
    'home.seo.title2': 'Nuestros productos más populares',
    'home.seo.text2': 'Encuentra las últimas novedades en smartphones como iPhone 15, Samsung Galaxy S24, laptops de las mejores marcas, auriculares inalámbricos, cargadores rápidos y mucho más. Todos nuestros productos cuentan con garantía oficial y atención al cliente personalizada.',
    'home.seo.title3': 'Compra segura y envío rápido',
    'home.seo.text3': 'Realizamos envíos a toda España con seguimiento incluido. Pago 100% seguro con tarjeta, Bizum, transferencia o contrareembolso. Devoluciones fáciles en 30 días. Soporte al cliente disponible para resolver todas tus dudas.',
    
    // Products
    'products.title': 'Productos',
    'products.addToCart': 'Añadir al Carrito',
    'products.outOfStock': 'Agotado',
    'products.loading': 'Cargando productos...',
    'products.noResults': 'No se encontraron productos',
    
    // Cart
    'cart.title': 'Carrito de Compra',
    'cart.empty': 'Tu carrito está vacío',
    'cart.continueShopping': 'Continuar Comprando',
    'cart.remove': 'Eliminar',
    'cart.subtotal': 'Subtotal',
    'cart.shipping': 'Envío',
    'cart.shippingFree': 'Gratis',
    'cart.total': 'Total',
    'cart.checkout': 'Finalizar Compra',
    'cart.added': 'añadido al carrito',
    'cart.removed': 'eliminado',
    'cart.cleared': 'Carrito vaciado',
    
    // Checkout
    'checkout.title': 'Finalizar Compra',
    'checkout.shippingAddress': 'Dirección de Envío',
    'checkout.address': 'Dirección',
    'checkout.city': 'Ciudad',
    'checkout.postalCode': 'Código Postal',
    'checkout.province': 'Provincia',
    'checkout.phone': 'Teléfono',
    'checkout.notes': 'Notas (opcional)',
    'checkout.paymentMethod': 'Método de Pago',
    'checkout.card': 'Tarjeta',
    'checkout.bizum': 'Bizum',
    'checkout.transfer': 'Transferencia',
    'checkout.cashOnDelivery': 'Contrareembolso',
    'checkout.payNow': 'Pagar Ahora',
    'checkout.confirmOrder': 'Confirmar Pedido',
    'checkout.summary': 'Resumen',
    
    // Auth
    'auth.login': 'Iniciar Sesión',
    'auth.register': 'Registrarse',
    'auth.email': 'Email',
    'auth.password': 'Contraseña',
    'auth.name': 'Nombre completo',
    'auth.confirmPassword': 'Confirmar contraseña',
    'auth.forgotPassword': '¿Olvidaste tu contraseña?',
    'auth.noAccount': '¿No tienes cuenta?',
    'auth.haveAccount': '¿Ya tienes cuenta?',
    'auth.registerHere': 'Regístrate aquí',
    'auth.loginHere': 'Inicia sesión aquí',
    
    // Common
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.cancel': 'Cancelar',
    'common.save': 'Guardar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.view': 'Ver',
    'common.close': 'Cerrar',
    'common.search': 'Buscar',
  }
};

// Traducciones INGLÉS
const en = {
  translation: {
    'header.search': 'Search products...',
    'header.login': 'Login',
    'header.myProfile': 'My Profile',
    'header.myOrders': 'My Orders',
    'header.notifications': 'Notifications',
    'header.settings': 'Settings',
    'header.adminPanel': 'Admin Panel',
    'header.logout': 'Logout',
    'header.home': 'Home',
    'header.allProducts': 'All Products',
    
    'home.hero.title': 'Electronics & Technology Online Store - Best Prices',
    'home.hero.subtitle': 'Thousands of products at the best price. Free shipping on orders over €50',
    'home.hero.viewOffers': 'View Offers',
    'home.hero.exploreCatalog': 'Explore Catalog',
    
    'home.features.freeShipping': 'Free Shipping',
    'home.features.freeShippingDesc': 'On orders over €50',
    'home.features.securePayment': 'Secure Payment',
    'home.features.securePaymentDesc': '100% protected payments',
    'home.features.support': '24/7 Support',
    'home.features.supportDesc': "We're here to help",
    'home.features.returns': 'Easy Returns',
    'home.features.returnsDesc': '30 days for exchanges',
    
    'home.featured': 'Featured Offers',
    'home.viewAll': 'View all',
    'home.catalog': 'Explore Our Catalog',
    'home.viewAllProducts': 'View All Products',
    
    'home.seo.title1': 'Why buy at SimShop?',
    'home.seo.text1': 'SimShop is your trusted online store for buying electronics and technology in Spain. We offer a wide selection of mobile phones, laptops, tablets, accessories and more, with the best market prices and free shipping on orders over €50.',
    'home.seo.title2': 'Our most popular products',
    'home.seo.text2': 'Find the latest in smartphones like iPhone 15, Samsung Galaxy S24, laptops from the best brands, wireless headphones, fast chargers and much more. All our products come with official warranty and personalized customer service.',
    'home.seo.title3': 'Secure shopping and fast shipping',
    'home.seo.text3': 'We ship throughout Spain with tracking included. 100% secure payment by card, Bizum, transfer or cash on delivery. Easy returns in 30 days. Customer support available to answer all your questions.',
    
    'products.title': 'Products',
    'products.addToCart': 'Add to Cart',
    'products.outOfStock': 'Out of Stock',
    'products.loading': 'Loading products...',
    'products.noResults': 'No products found',
    
    'cart.title': 'Shopping Cart',
    'cart.empty': 'Your cart is empty',
    'cart.continueShopping': 'Continue Shopping',
    'cart.remove': 'Remove',
    'cart.subtotal': 'Subtotal',
    'cart.shipping': 'Shipping',
    'cart.shippingFree': 'Free',
    'cart.total': 'Total',
    'cart.checkout': 'Checkout',
    'cart.added': 'added to cart',
    'cart.removed': 'removed',
    'cart.cleared': 'Cart cleared',
    
    'checkout.title': 'Checkout',
    'checkout.shippingAddress': 'Shipping Address',
    'checkout.address': 'Address',
    'checkout.city': 'City',
    'checkout.postalCode': 'Postal Code',
    'checkout.province': 'Province',
    'checkout.phone': 'Phone',
    'checkout.notes': 'Notes (optional)',
    'checkout.paymentMethod': 'Payment Method',
    'checkout.card': 'Card',
    'checkout.bizum': 'Bizum',
    'checkout.transfer': 'Transfer',
    'checkout.cashOnDelivery': 'Cash on Delivery',
    'checkout.payNow': 'Pay Now',
    'checkout.confirmOrder': 'Confirm Order',
    'checkout.summary': 'Summary',
    
    'auth.login': 'Login',
    'auth.register': 'Register',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.name': 'Full name',
    'auth.confirmPassword': 'Confirm password',
    'auth.forgotPassword': 'Forgot your password?',
    'auth.noAccount': "Don't have an account?",
    'auth.haveAccount': 'Already have an account?',
    'auth.registerHere': 'Register here',
    'auth.loginHere': 'Login here',
    
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.view': 'View',
    'common.close': 'Close',
    'common.search': 'Search',
  }
};

// Traducciones CATALÁN
const ca = {
  translation: {
    'header.search': 'Cercar productes...',
    'header.login': 'Iniciar Sessió',
    'header.myProfile': 'El Meu Perfil',
    'header.myOrders': 'Les Meves Comandes',
    'header.notifications': 'Notificacions',
    'header.settings': 'Configuració',
    'header.adminPanel': 'Panell Admin',
    'header.logout': 'Tancar Sessió',
    'header.home': 'Inici',
    'header.allProducts': 'Tots els Productes',
    
    'home.hero.title': 'Botiga Online d\'Electrònica i Tecnologia - Els Millors Preus',
    'home.hero.subtitle': 'Milers de productes al millor preu. Enviament gratuït en comandes superiors a 50€',
    'home.hero.viewOffers': 'Veure Ofertes',
    'home.hero.exploreCatalog': 'Explorar Catàleg',
    
    'home.features.freeShipping': 'Enviament Gratuït',
    'home.features.freeShippingDesc': 'En comandes superiors a 50€',
    'home.features.securePayment': 'Compra Segura',
    'home.features.securePaymentDesc': 'Pagaments 100% protegits',
    'home.features.support': 'Suport 24/7',
    'home.features.supportDesc': 'Som aquí per ajudar-te',
    'home.features.returns': 'Devolucions Fàcils',
    'home.features.returnsDesc': '30 dies per a canvis',
    
    'home.featured': 'Ofertes Destacades',
    'home.viewAll': 'Veure tot',
    'home.catalog': 'Explora el Nostre Catàleg',
    'home.viewAllProducts': 'Veure Tots els Productes',
    
    'home.seo.title1': 'Per què comprar a SimShop?',
    'home.seo.text1': 'SimShop és la teva botiga online de confiança per comprar productes electrònics i tecnologia a Espanya. Oferim una àmplia selecció de mòbils, portàtils, tauletes, accessoris i més, amb els millors preus del mercat i enviament gratuït en comandes superiors a 50€.',
    'home.seo.title2': 'Els nostres productes més populars',
    'home.seo.text2': 'Troba les últimes novetats en smartphones com iPhone 15, Samsung Galaxy S24, portàtils de les millors marques, auriculars sense fil, carregadors ràpids i molt més. Tots els nostres productes compten amb garantia oficial i atenció al client personalitzada.',
    'home.seo.title3': 'Compra segura i enviament ràpid',
    'home.seo.text3': 'Realitzem enviaments a tota Espanya amb seguiment inclòs. Pagament 100% segur amb targeta, Bizum, transferència o contrareemborsament. Devolucions fàcils en 30 dies. Suport al client disponible per resoldre tots els teus dubtes.',
    
    'products.title': 'Productes',
    'products.addToCart': 'Afegir a la Cistella',
    'products.outOfStock': 'Esgotat',
    'products.loading': 'Carregant productes...',
    'products.noResults': 'No s\'han trobat productes',
    
    'cart.title': 'Cistella de Compra',
    'cart.empty': 'La teva cistella està buida',
    'cart.continueShopping': 'Continuar Comprant',
    'cart.remove': 'Eliminar',
    'cart.subtotal': 'Subtotal',
    'cart.shipping': 'Enviament',
    'cart.shippingFree': 'Gratuït',
    'cart.total': 'Total',
    'cart.checkout': 'Finalitzar Compra',
    'cart.added': 'afegit a la cistella',
    'cart.removed': 'eliminat',
    'cart.cleared': 'Cistella buidada',
    
    'checkout.title': 'Finalitzar Compra',
    'checkout.shippingAddress': 'Adreça d\'Enviament',
    'checkout.address': 'Adreça',
    'checkout.city': 'Ciutat',
    'checkout.postalCode': 'Codi Postal',
    'checkout.province': 'Província',
    'checkout.phone': 'Telèfon',
    'checkout.notes': 'Notes (opcional)',
    'checkout.paymentMethod': 'Mètode de Pagament',
    'checkout.card': 'Targeta',
    'checkout.bizum': 'Bizum',
    'checkout.transfer': 'Transferència',
    'checkout.cashOnDelivery': 'Contrareemborsament',
    'checkout.payNow': 'Pagar Ara',
    'checkout.confirmOrder': 'Confirmar Comanda',
    'checkout.summary': 'Resum',
    
    'auth.login': 'Iniciar Sessió',
    'auth.register': 'Registrar-se',
    'auth.email': 'Email',
    'auth.password': 'Contrasenya',
    'auth.name': 'Nom complet',
    'auth.confirmPassword': 'Confirmar contrasenya',
    'auth.forgotPassword': 'Has oblidat la teva contrasenya?',
    'auth.noAccount': 'No tens compte?',
    'auth.haveAccount': 'Ja tens compte?',
    'auth.registerHere': 'Registra\'t aquí',
    'auth.loginHere': 'Inicia sessió aquí',
    
    'common.loading': 'Carregant...',
    'common.error': 'Error',
    'common.success': 'Èxit',
    'common.cancel': 'Cancel·lar',
    'common.save': 'Desar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.view': 'Veure',
    'common.close': 'Tancar',
    'common.search': 'Cercar',
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: es,
      en: en,
      ca: ca
    },
    fallbackLng: 'es',
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    },
    interpolation: {
      escapeValue: false
    }
  });

  

export default i18n;