import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

export const supabase = createClient(
  "https://ubulqgaaomnvwzicrmus.supabase.co",   // 👈 tu URL
  "sb_publishable_XhWQbBxT_AI8-8fXES7JLA_KcQQKEvw", // 👈 tu KEY pública
  {
    auth: {
      persistSession: true,    // guarda la sesión en localStorage
      autoRefreshToken: true,  // refresca tokens automáticamente
      detectSessionInUrl: true // detecta sesión en redirecciones OAuth
    },
  }
);
