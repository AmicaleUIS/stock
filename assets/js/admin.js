function getWeekDateRange(year, week) {
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  const dayOfWeek = simple.getUTCDay();
  const isoWeekStart = new Date(simple);

  if (dayOfWeek <= 4) {
    isoWeekStart.setUTCDate(simple.getUTCDate() - simple.getUTCDay() + 1);
  } else {
    isoWeekStart.setUTCDate(simple.getUTCDate() + 8 - simple.getUTCDay());
  }

  isoWeekStart.setUTCHours(0, 0, 0, 0);

  const isoWeekEnd = new Date(isoWeekStart);
  isoWeekEnd.setUTCDate(isoWeekStart.getUTCDate() + 6);
  isoWeekEnd.setUTCHours(23, 59, 59, 999);

  return { start: isoWeekStart, end: isoWeekEnd };
}

async function initAdmin() {
  const auth = await requireAuth(["admin", "super_admin"]);
  if (!auth) return;

  document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    await window.sb.auth.signOut();
    window.location.href = "login.html";
  });

  document.getElementById("addProductForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage("productMessage", "Création...");

    const payload = {
      name: document.getElementById("newName")?.value.trim(),
      category: document.getElementById("newCategory")?.value.trim().toLowerCase(),
      product_type: document.getElementById("newType")?.value,
      stock_units: Number(document.getElementById("newStock")?.value || 0),
      unit_label: document.getElementById("newUnitLabel")?.value.trim(),
      unit_size: Number(document.getElementById("newUnitSize")?.value || 1),
      created_by: auth.user.id
    };

    const { error } = await window.sb.from("products").insert(payload);

    if (error) {
      setMessage("productMessage", error.message, true);
      return;
    }

    setMessage("productMessage", "Produit ajouté.");
    event.target.reset();
  });

  document.getElementById("exportForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage("exportMessage", "Préparation du PDF...");

    const exportType = document.getElementById("exportType")?.value;
    let startDate;
    let endDate;
    let label;
    const now = new Date();

    if (exportType === "date") {
      const date = document.getElementById("exportDate")?.value;
      if (!date) {
        setMessage("exportMessage", "Choisis une date.", true);
        return;
      }

      startDate = `${date}T00:00:00.000Z`;
      endDate = `${date}T23:59:59.999Z`;
      label = `Ventes du ${date}`;
    } else if (exportType === "week") {
      const week = Number(document.getElementById("exportWeek")?.value || 1);
      const year = now.getUTCFullYear();
      const range = getWeekDateRange(year, week);

      startDate = range.start.toISOString();
      endDate = range.end.toISOString();
      label = `Ventes semaine ${week}`;
    } else {
      const monthValue = document.getElementById("exportMonth")?.value;
      if (!monthValue) {
        setMessage("exportMessage", "Choisis un mois.", true);
        return;
      }

      const [year, month] = monthValue.split("-").map(Number);
      const start = new Date(Date.UTC(year, month - 1, 1));
      const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

      startDate = start.toISOString();
      endDate = end.toISOString();
      label = `Ventes du mois ${monthValue}`;
    }

    const { data, error } = await window.sb
      .from("sales_items")
      .select(`
        quantity,
        quantity_units,
        sale_mode,
        products(name),
        sales_entries!inner(created_at,created_by_name,validated_by_name,status)
      `)
      .gte("sales_entries.created_at", startDate)
      .lte("sales_entries.created_at", endDate)
      .eq("sales_entries.status", "validee");

    if (error) {
      setMessage("exportMessage", error.message, true);
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text(label, 14, 18);

    doc.setFontSize(11);
    doc.text(`Généré par : ${auth.profile.display_name || auth.profile.email}`, 14, 28);

    let y = 40;

    data.forEach((row, index) => {
      const entry = row.sales_entries;
      const line = `${index + 1}. ${row.products.name} • qté ${row.quantity} • ${row.sale_mode} • saisi par ${entry.created_by_name} • validé par ${entry.validated_by_name}`;
      doc.text(line, 14, y, { maxWidth: 180 });
      y += 10;

      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save(`${label.replace(/\s+/g, "-").toLowerCase()}.pdf`);
    setMessage("exportMessage", `${data.length} ligne(s) exportée(s).`);
  });
}

document.addEventListener("DOMContentLoaded", initAdmin);