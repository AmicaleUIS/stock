function sumByProduct(rows, productIdField = "product_id", qtyField = "quantity_units") {
  const map = new Map();
  (rows || []).forEach((row) => {
    const pid = row[productIdField];
    const qty = Number(row[qtyField] || 0);
    map.set(pid, (map.get(pid) || 0) + qty);
  });
  return map;
}

function formatBeerStock(stockUnits, unitSize) {
  const cartons = Math.floor(stockUnits / unitSize);
  const bottles = stockUnits % unitSize;
  return `${cartons} carton${cartons > 1 ? "s" : ""} et ${bottles} bouteille${bottles > 1 ? "s" : ""}`;
}

function getCategoryClass(category) {
  return category === "biere" ? "row-biere" : "row-goodies";
}

async function updateStock(productId, currentStock, category, unitSize) {
  let message = "Nouveau stock :";

  if (category === "biere") {
    const cartons = Math.floor(currentStock / unitSize);
    const bottles = currentStock % unitSize;

    const newCartons = prompt("Nouveau nombre de cartons :", cartons);
    if (newCartons === null) return;

    const newBottles = prompt("Nouveau nombre de bouteilles :", bottles);
    if (newBottles === null) return;

    const cartonsNum = Number(newCartons);
    const bottlesNum = Number(newBottles);

    if (Number.isNaN(cartonsNum) || Number.isNaN(bottlesNum) || cartonsNum < 0 || bottlesNum < 0) {
      alert("Valeurs invalides.");
      return;
    }

    const newValue = cartonsNum * unitSize + bottlesNum;

    const { error } = await window.sb
      .from("products")
      .update({ stock_units: newValue })
      .eq("id", productId);

    if (error) {
      alert("Erreur : " + error.message);
      return;
    }

    await loadStock();
    return;
  }

  const newValue = prompt(message, currentStock);
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

  tbody.innerHTML = `<tr><td colspan="7">Chargement...</td></tr>`;
  if (status) status.textContent = "Chargement...";

  const auth = await requireAuth(["admin", "super_admin", "user"]);
  if (!auth) return;

  const now = new Date();
  const lastMonth = new Date();
  lastMonth.setDate(now.getDate() - 30);

  const [productsRes, pendingSalesRes, monthlySalesRes, supplierRes] = await Promise.all([
    window.sb
      .from("products")
      .select("id,name,category,stock_units,unit_size,is_active")
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
    tbody.innerHTML = `<tr><td colspan="7">Erreur : ${productsRes.error.message}</td></tr>`;
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

    const stockDisplay =
      item.category === "biere"
        ? formatBeerStock(stock, Number(item.unit_size || 12))
        : stock;

    const tr = document.createElement("tr");
    tr.className = getCategoryClass(item.category);

    tr.innerHTML = `
      <td class="category-cell">${item.category}</td>
      <td>${item.name}</td>
      <td>${stockDisplay}</td>
      <td>${pending}</td>
      <td>${monthly}</td>
      <td>${incoming}</td>
      <td>
        <button class="action-btn" data-id="${item.id}" data-stock="${stock}" data-category="${item.category}" data-unit-size="${item.unit_size}">
          Modifier
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  tbody.querySelectorAll(".action-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await updateStock(
        Number(btn.dataset.id),
        Number(btn.dataset.stock),
        btn.dataset.category,
        Number(btn.dataset.unitSize || 1)
      );
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
    alert("Clique sur Modifier sur la ligne du produit.");
  });
});