import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import emailjs from 'emailjs-com';
import { DEFAULT_SITE_CONTENT, loadSiteContent } from '../lib/siteContent';

function Contact() {
  const [content, setContent] = useState(DEFAULT_SITE_CONTENT);
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

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

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.id]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSending(true);

    try {
      await emailjs.send(
        'service_eov03a9',
        'template_b58gn3c',
        { from_name: formData.name, from_email: formData.email, message: formData.message },
        'I6E-q_Ze7F2s-ghH2',
      );
      window.alert('✅ Mensaje enviado correctamente. Te contactaremos pronto.');
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      window.alert(`❌ No fue posible enviar el mensaje. ${error?.text || 'Intenta nuevamente.'}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.main className="container my-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <h1 className="text-center mb-4" data-cms="contact-title" style={{ color: 'var(--site-text, #321808)' }}>
        {content['contact.title']}
      </h1>
      <p className="text-center mb-4" data-cms="contact-subtitle">{content['contact.subtitle']}</p>

      <div className="row justify-content-center g-4">
        <div className="col-lg-4">
          <aside className="card border-0 shadow-sm h-100" style={{ background: 'var(--site-surface, #fffaf4)' }}>
            <div className="card-body">
              <h2 className="h4">Información</h2>
              {content['business.address'] && <p>📍 {content['business.address']}</p>}
              {content['business.phone'] && <p>📞 {content['business.phone']}</p>}
              {content['business.email'] && <p>✉️ {content['business.email']}</p>}
              {content['business.hours'] && <p>🕒 {content['business.hours']}</p>}
            </div>
          </aside>
        </div>

        <div className="col-lg-7">
          <form onSubmit={handleSubmit} className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <div className="mb-3">
                <label htmlFor="name" className="form-label">Nombre</label>
                <input type="text" className="form-control" id="name" value={formData.name} onChange={handleChange} placeholder="Tu nombre" autoComplete="name" required />
              </div>
              <div className="mb-3">
                <label htmlFor="email" className="form-label">Correo electrónico</label>
                <input type="email" className="form-control" id="email" value={formData.email} onChange={handleChange} placeholder="nombre@ejemplo.com" autoComplete="email" required />
              </div>
              <div className="mb-3">
                <label htmlFor="message" className="form-label">Mensaje</label>
                <textarea className="form-control" id="message" rows="5" value={formData.message} onChange={handleChange} placeholder="Escribe tu mensaje..." required />
              </div>
              <button type="submit" className="btn btn-primary" disabled={sending}>
                {sending ? 'Enviando...' : 'Enviar mensaje'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </motion.main>
  );
}

export default Contact;
