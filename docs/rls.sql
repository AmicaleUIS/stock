alter table profiles enable row level security;
alter table products enable row level security;
alter table product_components enable row level security;
alter table sales_entries enable row level security;
alter table sales_items enable row level security;
alter table stock_journal enable row level security;
alter table supplier_orders enable row level security;

create policy "read own profile" on profiles for select to authenticated using (id = auth.uid());
create policy "admin read profiles" on profiles for select to authenticated using (get_role() in ('admin','super_admin'));

create policy "read products" on products for select to authenticated using (true);
create policy "admin insert products" on products for insert to authenticated with check (get_role() in ('admin','super_admin'));
create policy "admin update products" on products for update to authenticated using (get_role() in ('admin','super_admin'));

create policy "admin read components" on product_components for select to authenticated using (true);
create policy "admin write components" on product_components for all to authenticated using (get_role() in ('admin','super_admin')) with check (get_role() in ('admin','super_admin'));

create policy "user insert sales" on sales_entries for insert to authenticated with check (get_role() in ('user','admin','super_admin'));
create policy "user read own sales" on sales_entries for select to authenticated using (created_by = auth.uid());
create policy "admin read all sales" on sales_entries for select to authenticated using (get_role() in ('admin','super_admin'));
create policy "admin update sales" on sales_entries for update to authenticated using (get_role() in ('admin','super_admin'));

create policy "user insert sale items" on sales_items for insert to authenticated with check (true);
create policy "read sale items" on sales_items for select to authenticated using (true);

create policy "admin read journal" on stock_journal for select to authenticated using (get_role() in ('admin','super_admin'));
create policy "admin insert journal" on stock_journal for insert to authenticated with check (get_role() in ('admin','super_admin'));

create policy "admin read supplier orders" on supplier_orders for select to authenticated using (get_role() in ('admin','super_admin'));
create policy "admin write supplier orders" on supplier_orders for all to authenticated using (get_role() in ('admin','super_admin')) with check (get_role() in ('admin','super_admin'));
