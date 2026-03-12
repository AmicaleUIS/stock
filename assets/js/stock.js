function sumByProduct(rows, productIdField = "product_id", qtyField = "quantity_units") {
  const map = new Map();
  (rows || []).forEach((row) => {
    const pid = row[productIdField];
    const qty = Number(row[qtyField] || 0);
    map.set(pid, (map.get(pid) || 0) + qty);
  });
  return map;
}

function getCartons(item, units) {
  if (item.category === "biere" && Number(item.unit_size) > 1) {
    return Math.floor(units / Number(item.unit_size));
  }
  return "-";
}

function stockClass(value) {
  if (value <= 0) return "cell-danger";
  if (value <= 5) return "cell-warn";
  return "cell-ok";
}

async function loadStock() {
  const tbody = document.getElementById("stock-body");
  const status = document.getElementById("stock-status");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="8">Chargement...</td></tr>`;
  if (status) status.textContent = "Chargement...";

  const auth = await requireAuth(["admin", "super_admin", "user"]);
  if (!auth) return;

  const now = new Date();
  const lastMonth = new Date();
  lastMonth.setDate(now.getDate() - 30);

  const [
    productsRes,
    pendingSalesRes,
    monthlySalesRes,
    supplierRes
  ] = await Promise.all([
    window.sb
      .from("products")
      .select("id,name,category,stock_units,unit_size,unit_label,is_active")
      .eq("is_active", true)
      .order("category", { ascending: true })
      .order("name", { ascending: true }),

    window.sb
      .from("sales_items")
      .select("product_id, quantity_units, sales_entries!inner(status)")
      .eq("sales_entries.status", "en_attente"),

    window.sb
      .from("sales_items")
      .select("product_id, quantity_units, sales_entries!inner(status, created_at)")
      .eq("sales_entries.status", "validee")
      .gte("sales_entries.created_at", lastMonth.toISOString()),

    window.sb
      .from("supplier_orders")
      .select("product_id, quantity_units, status")
      .in("status", ["commande", "en_transit"])
  ]);

  if (productsRes.error) {
    console.error(productsRes.error);
    tbody.innerHTML = `<tr><td colspan="8">Erreur produits : ${productsRes.error.message}</td></tr>`;
    return;
  }

  if (pendingSalesRes.error) {
    console.error(pendingSalesRes.error);
  }
  if (monthlySalesRes.error) {
    console.error(monthlySalesRes.error);
  }
  if (supplierRes.error) {
    console.error(supplierRes.error);
  }

  const products = productsRes.data || [];
  const pendingMap = sumByProduct(pendingSalesRes.data || []);
  const monthlyMap = sumByProduct(monthlySalesRes.data || []);
  const supplierMap = sumByProduct(supplierRes.data || []);

  tbody.innerHTML = "";

  products.forEach((item) => {
    const stock = Number(item.stock_units || 0);
    const pending = Number(pendingMap.get(item.id) || 0);
    const monthly = Number(monthlyMap.get(item.id) || 0);
    const incoming = Number(supplierMap.get(item.id) || 0);
    const projected = stock - pending + incoming;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.name}</td>
      <td>${item.category}</td>
      <td>${stock}</td>
      <td class="cell-warn">${pending}</td>
      <td class="cell-info">${monthly}</td>
      <td class="cell-ok">${incoming}</td>
      <td class="${stockClass(projected)}">${projected}</td>
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
  document.getElementById("refresh-stock")?.addEventListener("click", loadStock);
});