const SUPABASE_URL = 'https://xqtxrolktiqnqtmetmtc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_oWEmzLtO8VFVD6Feh6nDhw_kZ_pIPKN';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

window.supabaseClient = supabase;
