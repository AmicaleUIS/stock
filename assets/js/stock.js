async function loadStock() {
  setMessage('stockMessage', 'Chargement...');
  const tbody = document.getElementById('stockBody');
  tbody.innerHTML = '';

  const { data, error } = await supabaseClient
    .from('products')
    .select('id,name,category,stock_units,unit_label,unit_size,is_active')
    .eq('is_active', true)
    .order('category')
    .order('name');

  if (error) {
    setMessage('stockMessage', error.message, true);
    return;
  }

  data.forEach((product) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${product.name}</td>
      <td>${product.category}</td>
      <td>${formatStock(product)}</td>
      <td>${product.category === 'biere' ? `1 carton = ${product.unit_size} bouteilles` : product.unit_label}</td>
    `;
    tbody.appendChild(tr);
  });

  setMessage('stockMessage', `${data.length} produit(s) affiché(s).`);
}

document.getElementById('refreshStock')?.addEventListener('click', loadStock);
loadStock();
