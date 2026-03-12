async function initSalePage() {
  const auth = await requireAuth(['admin', 'super_admin']);
  if (!auth) return;

  document.getElementById('whoami').textContent = `${auth.profile.display_name || auth.profile.email} • ${auth.profile.role}`;

  const { data: products, error } = await supabaseClient
    .from('products')
    .select('id,name,category,product_type,unit_size,is_active')
    .eq('is_active', true)
    .order('category')
    .order('name');

  if (error) {
    setMessage('saleMessage', error.message, true);
    return;
  }

  const select = document.getElementById('productSelect');
  select.innerHTML = products.map((p) => `<option value="${p.id}" data-category="${p.category}" data-type="${p.product_type}" data-unit-size="${p.unit_size}">${p.name}</option>`).join('');

  const logoutBtn = document.getElementById('logoutBtn');
  logoutBtn?.addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.href = 'login.html';
  });

  document.getElementById('quickSaleForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    setMessage('saleMessage', 'Enregistrement...');

    const selectedOption = select.options[select.selectedIndex];
    const productId = Number(select.value);
    const saleMode = document.getElementById('saleMode').value;
    const quantity = Number(document.getElementById('quantity').value);
    const note = document.getElementById('saleNote').value.trim();
    const unitSize = Number(selectedOption.dataset.unitSize || '1');

    let quantityUnits = quantity;
    if (saleMode === 'carton') quantityUnits = quantity * unitSize;

    const { data: entry, error: entryError } = await supabaseClient
      .from('sales_entries')
      .insert({
        created_by: auth.user.id,
        created_by_name: auth.profile.display_name || auth.profile.email,
        status: 'validee',
        notes: note,
        validated_by: auth.user.id,
        validated_by_name: auth.profile.display_name || auth.profile.email,
        validated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (entryError) {
      setMessage('saleMessage', entryError.message, true);
      return;
    }

    const { error: itemError } = await supabaseClient.from('sales_items').insert({
      sale_id: entry.id,
      product_id: productId,
      quantity,
      quantity_units: quantityUnits,
      sale_mode: saleMode,
    });

    if (itemError) {
      setMessage('saleMessage', itemError.message, true);
      return;
    }

    const { error: rpcError } = await supabaseClient.rpc('apply_admin_sale', { p_sale_id: entry.id });
    if (rpcError) {
      setMessage('saleMessage', rpcError.message, true);
      return;
    }

    setMessage('saleMessage', 'Vente enregistrée et stock mis à jour.');
    event.target.reset();
    document.getElementById('quantity').value = 1;
  });
}

initSalePage();
