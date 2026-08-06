import { supabase } from './supabase';

export const DEFAULT_SITE_CONTENT = {
  'hero.eyebrow': 'Tradición desde 1978',
  'hero.title': 'Bienvenidos a La Chiquita',
  'hero.subtitle': 'Disfruta lo mejor del pan artesanal, hecho con amor.',
  'hero.primary_button': 'Ver productos',
  'about.title': 'Nuestra Historia',
  'about.body': 'Bienvenidos a Panadería La Chiquita, un rincón familiar donde el aroma del pan recién horneado se mezcla con la tradición y el amor por lo artesanal.',
  'contact.title': 'Contáctanos',
  'contact.subtitle': '¿Tienes dudas, sugerencias o quieres hacer un pedido especial? ¡Escríbenos!',
  'footer.tagline': 'Horneando los mejores productos desde 1978.',
  'business.whatsapp': '573203818931',
  'business.phone': '+57 320 3818 931',
  'business.email': 'lachiquitapanaderia1@gmail.com',
  'business.address': 'Cra 3 #10-02 Belalcázar, Caldas',
  'business.hours': 'Lunes a domingo',
  'appearance.primary': '#6f3d24',
  'appearance.secondary': '#d69b5b',
  'appearance.background': '#faf7e7',
  'appearance.surface': '#fffaf4',
  'appearance.text': '#321808',
  'appearance.radius': '18',
};

let contentPromise;

export async function loadSiteContent({ force = false } = {}) {
  if (!force && contentPromise) return contentPromise;

  contentPromise = (async () => {
    const { data, error } = await supabase
      .from('site_content')
      .select('section, content_key, value');

    if (error) {
      console.warn('No fue posible cargar el contenido editable:', error.message);
      return { ...DEFAULT_SITE_CONTENT };
    }

    const values = { ...DEFAULT_SITE_CONTENT };
    (data ?? []).forEach((item) => {
      values[`${item.section}.${item.content_key}`] = item.value ?? '';
    });

    return values;
  })();

  return contentPromise;
}

export function clearSiteContentCache() {
  contentPromise = undefined;
}

export function normalizeWhatsAppNumber(value) {
  return String(value || DEFAULT_SITE_CONTENT['business.whatsapp']).replace(/\D/g, '');
}
