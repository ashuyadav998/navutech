import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';
import '../styles/Footer.css';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">

          {/* ── Columna Brand ── */}
          <div className="footer-section footer-brand">
            <span className="footer-logo">AsZuTech</span>
            <p>
              Tu tienda de tecnología premium en España. Productos con garantía
              oficial, envío rápido y atención personalizada.
            </p>
            <div className="social-links">
              <a href="https://facebook.com/aszutech"  aria-label="Facebook"  target="_blank" rel="noopener noreferrer"><FaFacebook /></a>
              <a href="https://twitter.com/aszutech"   aria-label="Twitter"   target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
              <a href="https://instagram.com/aszutech" aria-label="Instagram" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
              <a href="https://linkedin.com/company/aszutech" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer"><FaLinkedin /></a>
            </div>
          </div>

          {/* ── Categorías ── */}
          <div className="footer-section">
            <h4>Categorías</h4>
            <ul>
              <li><Link to="/categoria/smartphones">Smartphones</Link></li>
              <li><Link to="/categoria/laptops">Laptops</Link></li>
              <li><Link to="/categoria/accesorios-moviles">Accesorios</Link></li>
              <li><Link to="/categoria/informatica-gaming">Informática</Link></li>
              <li><Link to="/products">Ver todo</Link></li>
            </ul>
          </div>

          {/* ── Atención al cliente ── */}
          <div className="footer-section">
            <h4>Atención al Cliente</h4>
            <ul>
              <li><Link to="/contacto">Contacto</Link></li>
              <li><Link to="/envios">Envíos y Seguimiento</Link></li>
              <li><Link to="/devoluciones">Devoluciones</Link></li>
              <li><Link to="/faq">Preguntas Frecuentes</Link></li>
            </ul>
          </div>

          {/* ── Legal ── */}
          <div className="footer-section">
            <h4>Información Legal</h4>
            <ul>
              <li><Link to="/terminos">Términos y Condiciones</Link></li>
              <li><Link to="/privacidad">Política de Privacidad</Link></li>
              <li><Link to="/cookies">Política de Cookies</Link></li>
            </ul>
          </div>

        </div>

        {/* ── Bottom bar ── */}
        <div className="footer-bottom">
          <p>&copy; {year} <strong>AsZuTech</strong>. Todos los derechos reservados.</p>
          <div className="footer-bottom-links">
            <Link to="/privacidad">Privacidad</Link>
            <Link to="/cookies">Cookies</Link>
            <Link to="/terminos">Términos</Link>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;