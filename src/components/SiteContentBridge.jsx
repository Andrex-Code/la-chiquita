import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const textTargets = {
  'hero.title': '.welcome-title',
  'hero.subtitle': '.welcome-subtitle',
};

const defaultAppearance = {
  primary: '#6f3d24',
  secondary: '#d69b5b',
  background: '#f6efe7',
  surface: '#fffaf4',
  text: '#321808',
  radius: '18',
};

export default function SiteContentBridge() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith('/admin')) return undefined;

    let cancelled = false;
    let timer;

    async function applyCmsContent() {
      const { data, error } = await supabase
        .from('site_content')
        .select('section, content_key, value');

      if (cancelled || error || !data) return;

      const values = {};
      data.forEach((item) => {
        values[`${item.section}.${item.content_key}`] = item.value ?? '';
      });

      Object.entries(textTargets).forEach(([key, selector]) => {
        const element = document.querySelector(selector);
        if (element && values[key]) element.textContent = values[key];
      });

      const appearance = {
        primary: values['appearance.primary'] || defaultAppearance.primary,
        secondary: values['appearance.secondary'] || defaultAppearance.secondary,
        background: values['appearance.background'] || defaultAppearance.background,
        surface: values['appearance.surface'] || defaultAppearance.surface,
        text: values['appearance.text'] || defaultAppearance.text,
        radius: values['appearance.radius'] || defaultAppearance.radius,
      };

      const root = document.documentElement;
      root.style.setProperty('--site-primary', appearance.primary);
      root.style.setProperty('--site-secondary', appearance.secondary);
      root.style.setProperty('--site-background', appearance.background);
      root.style.setProperty('--site-surface', appearance.surface);
      root.style.setProperty('--site-text', appearance.text);
      root.style.setProperty('--site-radius', `${appearance.radius}px`);
    }

    timer = window.setTimeout(applyCmsContent, 60);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [location.pathname]);

  return null;
}
