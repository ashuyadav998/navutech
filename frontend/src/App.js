import React, { Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ChatButton from './components/ChatWidget';



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

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <>
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