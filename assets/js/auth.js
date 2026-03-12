document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
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

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showMessage("Merci de remplir l’email et le mot de passe.");
      return;
    }

    if (!window.sb) {
      showMessage("Client Supabase introuvable.");
      return;
    }

    try {
      showMessage("Connexion en cours...", "info");

      const { data, error } = await window.sb.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error("Erreur Supabase Auth :", error);

        if (error.message?.toLowerCase().includes("invalid login credentials")) {
          showMessage("Email ou mot de passe incorrect.");
        } else {
          showMessage("Erreur de connexion : " + error.message);
        }
        return;
      }

      const user = data?.user;
      if (!user) {
        showMessage("Utilisateur non reconnu.");
        return;
      }

      const { data: profile, error: profileError } = await window.sb
        .from("profiles")
        .select("role, is_active")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Erreur profil :", profileError);
        showMessage("Profil introuvable dans la base.");
        return;
      }

      if (!profile?.is_active) {
        showMessage("Compte désactivé.");
        return;
      }

      showMessage("Connexion réussie.", "success");

      if (profile.role === "super_admin" || profile.role === "admin") {
        window.location.href = "vente.html";
      } else {
        window.location.href = "stock.html";
      }
    } catch (err) {
      console.error("Erreur JS :", err);
      showMessage("Erreur inattendue : " + err.message);
    }
  });
});