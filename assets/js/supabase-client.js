const SUPABASE_URL = "https://xqtxrolktiqnqtmetmtc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_oWEmzLtO8VFVD6Feh6nDhw_kZ_pIPKN";

// On utilise le SDK global chargé par le script CDN
window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});