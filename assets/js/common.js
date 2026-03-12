const supabaseClient = window.supabaseClient;

function setMessage(id, text, isError = false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text || '';
  el.classList.toggle('error', Boolean(isError));
}

function formatStock(product) {
  if (product.category === 'biere') {
    const cartons = Math.floor((product.stock_units || 0) / (product.unit_size || 12));
    return `${product.stock_units} bouteilles (${cartons} cartons)`;
  }
  return `${product.stock_units} ${product.unit_label || 'pièces'}`;
}

function getWeekDateRange(year, week) {
  const firstDayOfYear = new Date(Date.UTC(year, 0, 1));
  const dayOffset = (week - 1) * 7;
  const start = new Date(firstDayOfYear);
  start.setUTCDate(firstDayOfYear.getUTCDate() + dayOffset);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);
  return { start, end };
}

async function getCurrentUserAndProfile() {
  const { data: authData, error: authError } = await supabaseClient.auth.getUser();
  if (authError) throw authError;
  const user = authData.user;
  if (!user) return { user: null, profile: null };

  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) throw profileError;
  return { user, profile };
}

async function requireAuth(roles = []) {
  const { user, profile } = await getCurrentUserAndProfile();
  if (!user || !profile) {
    window.location.href = 'login.html';
    return null;
  }
  if (roles.length && !roles.includes(profile.role)) {
    window.location.href = 'vente.html';
    return null;
  }
  return { user, profile };
}
