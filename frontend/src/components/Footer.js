import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';
import '../styles/Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>SimShop</h3>
            <p>Tu tienda online de confianza para tarjetas SIM y productos electrónicos.</p>
            <div className="social-links">
              <a href="#" aria-label="Facebook"><FaFacebook /></a>
              <a href="#" aria-label="Twitter"><FaTwitter /></a>
              <a href="#" aria-label="Instagram"><FaInstagram /></a>
              <a href="#" aria-label="LinkedIn"><FaLinkedin /></a>
            </div>
          </div>

          <div className="footer-section">
            <h4>Categorías</h4>
            <ul>
              <li><Link to="/categoria/sim-prepago">SIM Prepago</Link></li>
              <li><Link to="/categoria/telefonia-smartwatch">Telefonía</Link></li>
              <li><Link to="/categoria/accesorios-moviles">Accesorios</Link></li>
              <li><Link to="/categoria/informatica-gaming">Informática</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Atención al Cliente</h4>
            <ul>
              <li><Link to="/contacto">Contacto</Link></li>
              <li><Link to="/envios">Envíos</Link></li>
              <li><Link to="/devoluciones">Devoluciones</Link></li>
              <li><Link to="/faq">Preguntas Frecuentes</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Información Legal</h4>
            <ul>
              <li><Link to="/terminos">Términos y Condiciones</Link></li>
              <li><Link to="/privacidad">Política de Privacidad</Link></li>
              <li><Link to="/cookies">Política de Cookies</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2024 SimShop. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
