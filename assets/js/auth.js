const form = document.getElementById('loginForm');

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  setMessage('loginMessage', 'Connexion...');

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    setMessage('loginMessage', error.message, true);
    return;
  }

  const authInfo = await getCurrentUserAndProfile();
  if (!authInfo.profile) {
    setMessage('loginMessage', 'Compte connecté, mais profil non trouvé.', true);
    return;
  }

  if (['admin', 'super_admin'].includes(authInfo.profile.role)) {
    window.location.href = 'vente.html';
  } else {
    window.location.href = 'vente.html';
  }
});
