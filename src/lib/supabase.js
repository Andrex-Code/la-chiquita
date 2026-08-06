import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  console.warn('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY.');
}

export const supabase = createClient(
  supabaseUrl || 'https://example.supabase.co',
  supabasePublishableKey || 'missing-publishable-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

export const ADMIN_EMAIL_DOMAIN = 'admin.panaderialachiquita.local';

export function usernameToEmail(username) {
  return `${username.trim().toLowerCase()}@${ADMIN_EMAIL_DOMAIN}`;
}
