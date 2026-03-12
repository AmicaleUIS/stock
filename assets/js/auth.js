document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  const messageBox = document.getElementById("login-message");

  function showMessage(text, type = "error") {
    if (!messageBox) {
      alert(text);
      return;
    }

    messageBox.textContent = text;
    messageBox.className = `message ${type}`;
    messageBox.style.display = "block";
  }

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const submitBtn = form.querySelector('button[type="submit"]');

    const email = emailInput?.value.trim() || "";
    const password = passwordInput?.value || "";

    if (!email || !password) {
      showMessage("Merci de remplir l’email et le mot de passe.");
      return;
    }

    if (!window.sb) {
      showMessage("Connexion Supabase indisponible. Vérifie supabase-client.js.");
      return;
    }

    try {
      if (submitBtn) submitBtn.disabled = true;
      showMessage("Connexion en cours...", "info");

      const { data, error } = await window.sb.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        if (
          error.message.toLowerCase().includes("invalid login credentials")
        ) {
          showMessage("Email ou mot de passe incorrect.");
        } else {
          showMessage(`Erreur de connexion : ${error.message}`);
        }

        if (submitBtn) submitBtn.disabled = false;
        return;
      }

      const user = data?.user;
      if (!user) {
        showMessage("Utilisateur non reconnu.");
        if (submitBtn) submitBtn.disabled = false;
        return;
      }

      const { data: profile, error: profileError } = await window.sb
        .from("profiles")
        .select("role, is_active")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        showMessage("Profil introuvable dans la base.");
        if (submitBtn) submitBtn.disabled = false;
        return;
      }

      if (!profile.is_active) {
        showMessage("Compte désactivé.");
        if (submitBtn) submitBtn.disabled = false;
        return;
      }

      showMessage("Connexion réussie.", "success");

      if (profile.role === "super_admin" || profile.role === "admin") {
        window.location.href = "vente.html";
      } else {
        window.location.href = "stock.html";
      }
    } catch (err) {
      showMessage(`Erreur inattendue : ${err.message}`);
      if (submitBtn) submitBtn.disabled = false;
    }
  });
});