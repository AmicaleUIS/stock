async function getCurrentUserAndProfile() {
  if (!window.sb) {
    throw new Error("Client Supabase introuvable.");
  }

  const {
    data: { user },
    error: userError
  } = await window.sb.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    return { user: null, profile: null };
  }

  const { data: profile, error: profileError } = await window.sb
    .from("profiles")
    .select("id, email, display_name, role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Erreur profil :", profileError);
    throw profileError;
  }

  return { user, profile };
}

async function requireAuth(allowedRoles = []) {
  try {
    const { user, profile } = await getCurrentUserAndProfile();

    if (!user) {
      window.location.href = "login.html";
      return null;
    }

    if (!profile) {
      alert("Profil introuvable dans la base.");
      window.location.href = "login.html";
      return null;
    }

    if (!profile.is_active) {
      alert("Compte désactivé.");
      await window.sb.auth.signOut();
      window.location.href = "login.html";
      return null;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
      alert("Accès refusé.");
      window.location.href = "login.html";
      return null;
    }

    return { user, profile };
  } catch (error) {
    console.error("Erreur auth :", error);
    alert("Erreur de vérification de session.");
    window.location.href = "login.html";
    return null;
  }
}

async function logout() {
  if (!window.sb) return;
  await window.sb.auth.signOut();
  window.location.href = "login.html";
}