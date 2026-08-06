import { useEffect, useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { DEFAULT_SITE_CONTENT, loadSiteContent, normalizeWhatsAppNumber } from '../lib/siteContent';

export default function WhatsAppButton() {
  const [showTooltip, setShowTooltip] = useState(false);
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

  const phoneNumber = normalizeWhatsAppNumber(content['business.whatsapp']);
  const message = '¡Hola! Me interesa conocer más sobre sus productos.';
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <div style={{ position: 'fixed', bottom: 90, right: 20, zIndex: 1000 }}>
      {showTooltip && (
        <div role="status" style={{ position: 'absolute', bottom: 70, right: 0, backgroundColor: '#333', color: 'white', padding: '8px 12px', borderRadius: 6, fontSize: 14, whiteSpace: 'nowrap', boxShadow: '0 4px 8px rgba(0,0,0,.3)' }}>
          ¡Contáctanos por WhatsApp!
        </div>
      )}

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="site-whatsapp-button"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        aria-label="Contactar a Panadería La Chiquita por WhatsApp"
      >
        <FaWhatsapp />
      </a>
    </div>
  );
}
