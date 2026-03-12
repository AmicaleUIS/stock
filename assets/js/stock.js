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
    const cartons = Math.floor(units / Number(item.unit_size));
    const reste = units % Number(item.unit_size);
    return `${cartons} c / ${reste} b`;
  }
  return "-";
}

function getCategoryClass(category) {
  if (category === "biere") return "row-biere";
  return "row-goodies";
}

async function updateStock(productId, currentStock) {
  const newValue = prompt("Nouveau stock :", currentStock);
  if (newValue === null) return;

  const parsed = Number(newValue);
  if (Number.isNaN(parsed) || parsed < 0) {
    alert("Valeur invalide.");
    return;
  }

  const { error } = await window.sb
    .from("products")
    .update({ stock_units: parsed })
    .eq("id", productId);

  if (error) {
    alert("Erreur : " + error.message);
    return;
  }

  await loadStock();
}

async function loadStock() {
  const tbody = document.getElementById("stock-body");
  const status = document.getElementById("stock-status");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="9">Chargement...</td></tr>`;
  if (status) status.textContent = "Chargement...";

  const auth = await requireAuth(["admin", "super_admin", "user"]);
  if (!auth) return;

  const now = new Date();
  const lastMonth = new Date();
  lastMonth.setDate(now.getDate() - 30);

  const [productsRes, pendingSalesRes, monthlySalesRes, supplierRes] = await Promise.all([
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
    tbody.innerHTML = `<tr><td colspan="9">Erreur : ${productsRes.error.message}</td></tr>`;
    return;
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

    const tr = document.createElement("tr");
    tr.className = getCategoryClass(item.category);

    tr.innerHTML = `
      <td>${item.category}</td>
      <td>${item.name}</td>
      <td>${stock}</td>
      <td>${getCartons(item, stock)}</td>
      <td>${pending}</td>
      <td>${monthly}</td>
      <td>${incoming}</td>
      <td>${item.unit_label}</td>
      <td>
        <button class="small-btn" data-id="${item.id}" data-stock="${stock}">
          Modifier
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  tbody.querySelectorAll(".small-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await updateStock(Number(btn.dataset.id), Number(btn.dataset.stock));
    });
  });

  if (status) {
    status.textContent = `Mis à jour à ${new Date().toLocaleTimeString("fr-FR")}`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadStock();
  document.getElementById("refresh-stock")?.addEventListener("click", loadStock);
  document.getElementById("edit-stock")?.addEventListener("click", () => {
    alert("Clique sur 'Modifier' sur la ligne du produit à ajuster.");
  });
});