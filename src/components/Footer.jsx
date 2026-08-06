import { useEffect, useState } from 'react';
import { FaFacebookF, FaInstagram, FaWhatsapp } from 'react-icons/fa';
import { DEFAULT_SITE_CONTENT, loadSiteContent, normalizeWhatsAppNumber } from '../lib/siteContent';

export default function Footer() {
  const [content, setContent] = useState(DEFAULT_SITE_CONTENT);

  useEffect(() => {
    let active = true;
    loadSiteContent().then((values) => { if (active) setContent(values); });
    const handleContent = (event) => setContent(event.detail);
    window.addEventListener('site-content-loaded', handleContent);
    return () => {
      active = false;
      window.removeEventListener('site-content-loaded', handleContent);
    };
  }, []);

  const whatsapp = normalizeWhatsAppNumber(content['business.whatsapp']);

  return (
    <footer className="text-center text-lg-start" style={{ backgroundColor: 'var(--site-primary, #321808)', color: '#faf7e7' }}>
      <div className="container py-4">
        <div className="row">
          <div className="col-md-4 mb-3">
            <h5 style={{ color: 'var(--site-secondary, #e9b274)' }}>La Chiquita</h5>
            <p>{content['footer.tagline']}</p>
            {content['business.hours'] && <small>Horario: {content['business.hours']}</small>}
          </div>

          <div className="col-md-4 mb-3">
            <h5 style={{ color: 'var(--site-secondary, #e9b274)' }}>Contacto</h5>
            {content['business.address'] && <p>📍 {content['business.address']}</p>}
            {content['business.phone'] && <p>📞 {content['business.phone']}</p>}
            {content['business.email'] && <p>✉️ {content['business.email']}</p>}
          </div>

          <div className="col-md-4 mb-3">
            <h5 style={{ color: 'var(--site-secondary, #e9b274)' }}>Síguenos</h5>
            <a href="https://www.facebook.com/PanaderiayCafeteriaLaChiquita" className="me-3 d-inline-block" target="_blank" rel="noopener noreferrer" style={{ color: '#faf7e7', fontSize: '1.5rem' }} aria-label="Facebook de La Chiquita"><FaFacebookF /></a>
            <a href="https://www.instagram.com/la_chiquita_panaderia?igsh=MWVncXlzMTNhdW9vNQ==" className="me-3 d-inline-block" target="_blank" rel="noopener noreferrer" style={{ color: '#faf7e7', fontSize: '1.5rem' }} aria-label="Instagram de La Chiquita"><FaInstagram /></a>
            <a href={`https://wa.me/${whatsapp}`} className="d-inline-block" target="_blank" rel="noopener noreferrer" style={{ color: '#faf7e7', fontSize: '1.5rem' }} aria-label="WhatsApp de La Chiquita"><FaWhatsapp /></a>
          </div>
        </div>
      </div>

      <div className="text-center py-2" style={{ backgroundColor: 'var(--site-secondary, #af6a18)', color: 'var(--site-text, #321808)' }}>
        © {new Date().getFullYear()} La Chiquita. Todos los derechos reservados.
      </div>
    </footer>
  );
}
