import { useEffect, useMemo, useState } from 'react';
import Slider from 'react-slick';
import { supabase } from '../lib/supabase';
import { DEFAULT_SITE_CONTENT, loadSiteContent, normalizeWhatsAppNumber } from '../lib/siteContent';

const fallbackTortas = [
  { id: 'fallback-1', image_url: '/tortas/torta_cafe.JPG', alt_text: 'Torta de café' },
  { id: 'fallback-2', image_url: '/tortas/torta1.JPG', alt_text: 'Torta personalizada' },
  { id: 'fallback-3', image_url: '/tortas/torta2.JPG', alt_text: 'Torta de tres leches' },
  { id: 'fallback-4', image_url: '/tortas/torta3.jpg', alt_text: 'Torta artesanal' },
  { id: 'fallback-5', image_url: '/tortas/torta4.png', alt_text: 'Torta especial' },
];

export default function TortasCarousel() {
  const [tortas, setTortas] = useState(fallbackTortas);
  const [content, setContent] = useState(DEFAULT_SITE_CONTENT);

  useEffect(() => {
    let active = true;

    async function loadGallery() {
      const { data, error } = await supabase
        .from('gallery')
        .select('id, title, alt_text, image_url, sort_order')
        .eq('active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (!active || error || !data?.length) return;
      setTortas(data);
    }

    loadGallery();
    loadSiteContent().then((values) => { if (active) setContent(values); });
    const handleContent = (event) => setContent(event.detail);
    window.addEventListener('site-content-loaded', handleContent);

    return () => {
      active = false;
      window.removeEventListener('site-content-loaded', handleContent);
    };
  }, []);

  const settings = useMemo(() => ({
    dots: tortas.length > 1,
    infinite: tortas.length > 1,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: tortas.length > 1,
    autoplaySpeed: 3500,
    centerMode: true,
    centerPadding: '0px',
    arrows: tortas.length > 1,
    adaptiveHeight: false,
  }), [tortas.length]);

  function openWhatsApp() {
    const phoneNumber = normalizeWhatsAppNumber(content['business.whatsapp']);
    const message = '¡Hola! Estoy interesado/a en hacer un pedido de tortas. ¿Podrían ayudarme?';
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="tortas-section">
      <h2 className="text-center mb-4" style={{ color: 'var(--site-text, #321808)' }}>TORTAS</h2>
      <div className="text-center mb-4">
        <h3 className="tortas-general-title" style={{ color: '#654321', fontStyle: 'italic' }}>
          GRAN VARIEDAD DE TORTAS DE TRES LECHES
        </h3>
      </div>

      <div className="tortas-carousel-container">
        <Slider {...settings}>
          {tortas.map((torta) => (
            <div key={torta.id} className="torta-slide">
              <div className="torta-card">
                <div className="image-container" style={{ width: '100%', height: 'clamp(250px, 60vw, 350px)', background: 'linear-gradient(135deg, var(--site-surface, #faf7e7), var(--site-secondary, #e9b274))', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                  <img
                    src={torta.image_url}
                    alt={torta.alt_text || torta.title || 'Torta de Panadería La Chiquita'}
                    className="torta-image"
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    onError={(event) => {
                      event.currentTarget.src = '/tortas/torta1.JPG';
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </div>

      <div className="text-center mt-4">
        <button className="btn whatsapp-btn" type="button" onClick={openWhatsApp}>
          HAZ TU PEDIDO YA
        </button>
      </div>
    </div>
  );
}
