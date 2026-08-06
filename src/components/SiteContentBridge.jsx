import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { loadSiteContent } from '../lib/siteContent';

const textTargets = {
  'hero.title': '.welcome-title',
  'hero.subtitle': '.welcome-subtitle',
  'about.title': '.about-title, [data-cms="about-title"]',
  'contact.title': '[data-cms="contact-title"]',
  'contact.subtitle': '[data-cms="contact-subtitle"]',
};

export default function SiteContentBridge() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith('/admin')) return undefined;

    let cancelled = false;
    let timer;

    async function applyCmsContent() {
      const values = await loadSiteContent({ force: true });
      if (cancelled) return;

      Object.entries(textTargets).forEach(([key, selector]) => {
        const value = values[key];
        if (!value) return;
        document.querySelectorAll(selector).forEach((element) => {
          element.textContent = value;
        });
      });

      const root = document.documentElement;
      root.style.setProperty('--site-primary', values['appearance.primary']);
      root.style.setProperty('--site-secondary', values['appearance.secondary']);
      root.style.setProperty('--site-background', values['appearance.background']);
      root.style.setProperty('--site-surface', values['appearance.surface']);
      root.style.setProperty('--site-text', values['appearance.text']);
      root.style.setProperty('--site-radius', `${values['appearance.radius']}px`);

      document.body.style.backgroundColor = values['appearance.background'];
      document.body.style.color = values['appearance.text'];
      window.dispatchEvent(new CustomEvent('site-content-loaded', { detail: values }));
    }

    timer = window.setTimeout(applyCmsContent, 50);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [location.pathname]);

  return null;
}
