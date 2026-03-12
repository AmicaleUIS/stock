async function loadStock() {
  const tbody = document.getElementById("stock-body");
  const status = document.getElementById("stock-status");

  if (!tbody) return;

  if (status) status.textContent = "Chargement...";
  tbody.innerHTML = "<tr><td colspan='5'>Chargement...</td></tr>";

  if (!window.sb) {
    tbody.innerHTML = "<tr><td colspan='5'>Client Supabase introuvable.</td></tr>";
    if (status) status.textContent = "Erreur client Supabase";
    return;
  }

  const { data, error } = await window.sb
    .from("products")
    .select("id, name, category, stock_units, unit_size, unit_label, is_active")
    .eq("is_active", true)
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("Erreur stock :", error);
    tbody.innerHTML = `<tr><td colspan='5'>Erreur : ${error.message}</td></tr>`;
    if (status) status.textContent = "Erreur chargement";
    return;
  }

  if (!data || data.length === 0) {
    tbody.innerHTML = "<tr><td colspan='5'>Aucune donnée.</td></tr>";
    if (status) status.textContent = "Aucune donnée";
    return;
  }

  tbody.innerHTML = "";

  data.forEach((item) => {
    const cartons =
      item.category === "biere" && item.unit_size > 1
        ? Math.floor(item.stock_units / item.unit_size)
        : "-";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.name}</td>
      <td>${item.category}</td>
      <td>${item.stock_units}</td>
      <td>${cartons}</td>
      <td>${item.unit_label}</td>
    `;
    tbody.appendChild(tr);
  });

  if (status) {
    status.textContent = `Mis à jour à ${new Date().toLocaleTimeString("fr-FR")}`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadStock();

  const refreshBtn = document.getElementById("refresh-stock");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", async () => {
      await loadStock();
    });
  }
});