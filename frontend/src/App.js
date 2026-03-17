import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ChatButton from './components/ChatWidget';
import '../src/styles/App.css';



const PageLoader = () => (
  <div className="full-page-loader">
    <div className="spinner"></div>
    <p>Cargando sección...</p>
  </div>
);

const Home             = lazy(() => import('./pages/Home'));
const Products         = lazy(() => import('./pages/Products'));
const ProductDetail    = lazy(() => import('./pages/ProductDetail'));
const Cart             = lazy(() => import('./pages/Cart'));
const Checkout         = lazy(() => import('./pages/Checkout'));
const Login            = lazy(() => import('./pages/Login'));
const Register         = lazy(() => import('./pages/Register'));
const Profile          = lazy(() => import('./pages/Profile'));
const AdminLayout      = lazy(() => import('./components/admin/AdminLayout'));
const AdminDashboard   = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProducts    = lazy(() => import('./pages/admin/AdminProducts'));
const AdminCategories  = lazy(() => import('./pages/admin/AdminCategories'));
const AdminOrders      = lazy(() => import('./pages/admin/AdminOrders'));
const AdminUsers       = lazy(() => import('./pages/admin/AdminUsers'));
const AdminChat        = lazy(() => import('./components/admin/AdminChat'));
const ForgotPassword   = lazy(() => import('./components/ForgotPassword'));
const NotificationsTab = lazy(() => import('./components/profile/NotificationsTab'));
const OrdersTab        = lazy(() => import('./components/profile/OrdersTab'));
const SecurityTab      = lazy(() => import('./components/profile/SecurityTab'));

// ⚙️ FECHA DE LANZAMIENTO — cambia esta fecha cuando quieras publicar
const LAUNCH_DATE = new Date(Date.now() + 1 * 60 * 1000);
function CountdownScreen() {
  const calcTime = () => {
    const diff = LAUNCH_DATE - Date.now();
    if (diff <= 0) return null;
    return {
      days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours:   Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60)
    };
  };
  const [time, setTime] = useState(calcTime());
  useEffect(() => {
    const t = setInterval(() => { const n = calcTime(); setTime(n); if (!n) clearInterval(t); }, 1000);
    return () => clearInterval(t);
  }, []);
  if (!time) return null;
  return (
    <div className="countdown-page">
      <div className="countdown-content">
        <div className="countdown-logo">AsZuTech</div>
        <h1>Próximamente</h1>
        <p>Estamos preparando algo increíble. ¡Vuelve pronto!</p>
        <div className="countdown-grid">
          {[['days','Días'],['hours','Horas'],['minutes','Minutos'],['seconds','Segundos']].map(([k,l], i) => (
            <React.Fragment key={k}>
              {i > 0 && <div className="countdown-sep">:</div>}
              <div className="countdown-block">
                <span className="countdown-number">{String(time[k]).padStart(2,'0')}</span>
                <span className="countdown-label">{l}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

function App() {
  
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  /*const [launched, setLaunched] = useState(Date.now() >= LAUNCH_DATE);
useEffect(() => {
  if (launched) return;
  const t = setInterval(() => { if (Date.now() >= LAUNCH_DATE) { setLaunched(true); clearInterval(t); } }, 1000);
  return () => clearInterval(t);
}, [launched]);
if (!launched && !isAdminRoute) return <CountdownScreen />;*/

  return (
    <>
      {!isAdminRoute && (
        <div className="dev-banner">
          🚧 <strong>Sitio en desarrollo</strong> — Esta tienda está en fase de pruebas. Por favor, <strong>no realices pedidos reales</strong> ni introduzcas datos de pago reales.
        </div>
      )}
      {!isAdminRoute && <Header />}

      <Suspense fallback={<PageLoader />}>
        <main className={isAdminRoute ? '' : 'main-content'}>
          <Routes>
            {/* Rutas Públicas */}
            <Route path="/"                     element={<Home />} />
            <Route path="/products"             element={<Products />} />
            <Route path="/product/:id"          element={<ProductDetail />} />
            <Route path="/cart"                 element={<Cart />} />
            <Route path="/checkout"             element={<Checkout />} />
            <Route path="/login"                element={<Login />} />
            <Route path="/register"             element={<Register />} />
            <Route path="/forgot-password"      element={<ForgotPassword />} />
            <Route path="/categoria/:categorySlug" element={<Products />} />

            {/* ✅ Rutas protegidas de usuario */}
            <Route path="/notifications" element={
              <ProtectedRoute><NotificationsTab /></ProtectedRoute>
            } />
            <Route path="/orders" element={
              <ProtectedRoute><OrdersTab /></ProtectedRoute>
            } />
            <Route path="/security" element={
              <ProtectedRoute><SecurityTab /></ProtectedRoute>
            } />

            {/* Perfil unificado */}
            <Route path="/perfil/*" element={
              <ProtectedRoute><Profile /></ProtectedRoute>
            } />

            {/* Rutas de Admin */}
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin={true}><AdminLayout /></ProtectedRoute>
            }>
              <Route index                  element={<AdminDashboard />} />
              <Route path="productos"       element={<AdminProducts />} />
              <Route path="categorias"      element={<AdminCategories />} />
              <Route path="pedidos"         element={<AdminOrders />} />
              <Route path="usuarios"        element={<AdminUsers />} />
              <Route path="chat"            element={<AdminChat />} />
            </Route>
          </Routes>
        </main>
      </Suspense>

      {!isAdminRoute && <ChatButton />}
      {!isAdminRoute && <Footer />}
    </>
  );
}

export default App;