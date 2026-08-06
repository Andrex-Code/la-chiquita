import { useEffect, useState } from 'react';
import { DEFAULT_SITE_CONTENT, loadSiteContent } from '../lib/siteContent';

export default function About() {
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

  return (
    <div className="container my-5" style={{ color: 'var(--site-text, #321808)' }}>
      <h1 className="mb-4" style={{ color: 'var(--site-primary, #af6a18)' }}>Sobre Nosotros</h1>

      <div className="row align-items-center">
        <div className="col-md-6 mb-4 mb-md-0">
          <img src="/apariencia/about.PNG" alt="Panadería La Chiquita" className="img-fluid rounded shadow about-image" loading="lazy" />
        </div>
        <div className="col-md-6">
          <h2 className="h3 mb-3 about-title">{content['about.title']}</h2>
          <p className="about-text" style={{ fontSize: '1.1rem' }}>{content['about.body']}</p>
          <p style={{ fontSize: '1.1rem' }}>
            Desde nuestros inicios trabajamos con pasión para ofrecer productos frescos, deliciosos y de la mejor calidad.
          </p>
        </div>
      </div>

      <div className="mt-5">
        <h2 className="h3 mb-3">Nuestro Compromiso</h2>
        <ul style={{ fontSize: '1.1rem' }}>
          <li>Productos frescos y artesanales.</li>
          <li>Recetas tradicionales con ingredientes seleccionados.</li>
          <li>Atención cálida y personalizada para cada cliente.</li>
        </ul>
      </div>
    </div>
  );
}
