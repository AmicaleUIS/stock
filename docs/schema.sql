create table if not exists profiles (
  id uuid primary key,
  email text unique,
  display_name text,
  role text not null check (role in ('super_admin', 'admin', 'user')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id bigint generated always as identity primary key,
  name text not null,
  category text not null,
  product_type text not null default 'simple' check (product_type in ('simple', 'pack')),
  stock_units integer not null default 0 check (stock_units >= 0),
  unit_label text not null default 'pièce',
  unit_size integer not null default 1,
  is_active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists product_components (
  id bigint generated always as identity primary key,
  pack_product_id bigint not null references products(id) on delete cascade,
  component_product_id bigint not null references products(id) on delete cascade,
  quantity integer not null check (quantity > 0)
);

create table if not exists sales_entries (
  id bigint generated always as identity primary key,
  created_by uuid not null,
  created_by_name text,
  status text not null default 'en_attente' check (status in ('en_attente','validee','refusee')),
  notes text,
  validated_by uuid,
  validated_by_name text,
  created_at timestamptz not null default now(),
  validated_at timestamptz
);

create table if not exists sales_items (
  id bigint generated always as identity primary key,
  sale_id bigint not null references sales_entries(id) on delete cascade,
  product_id bigint not null references products(id),
  quantity integer not null check (quantity > 0),
  quantity_units integer not null check (quantity_units > 0),
  sale_mode text not null default 'unit' check (sale_mode in ('unit','carton','pack'))
);

create table if not exists stock_journal (
  id bigint generated always as identity primary key,
  product_id bigint not null references products(id),
  action_type text not null,
  old_stock integer,
  new_stock integer,
  delta integer not null,
  done_by uuid,
  done_by_name text,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists supplier_orders (
  id bigint generated always as identity primary key,
  product_id bigint not null references products(id),
  quantity_units integer not null check (quantity_units > 0),
  supplier text,
  status text not null default 'commande' check (status in ('commande','en_transit','recu','annule')),
  created_by uuid,
  created_by_name text,
  created_at timestamptz not null default now(),
  received_at timestamptz
);

create or replace function get_role()
returns text
language sql
stable
as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function apply_admin_sale(p_sale_id bigint)
returns void
language plpgsql
security definer
as $$
declare
  item record;
  current_stock integer;
  v_name text;
begin
  if get_role() not in ('admin', 'super_admin') then
    raise exception 'Accès refusé';
  end if;

  for item in
    select si.product_id, si.quantity_units
    from sales_items si
    where si.sale_id = p_sale_id
  loop
    select stock_units, name into current_stock, v_name
    from products
    where id = item.product_id
    for update;

    if current_stock < item.quantity_units then
      raise exception 'Stock insuffisant pour %', v_name;
    end if;

    update products
    set stock_units = stock_units - item.quantity_units
    where id = item.product_id;

    insert into stock_journal(product_id, action_type, old_stock, new_stock, delta, done_by, done_by_name, reason)
    values (
      item.product_id,
      'vente_admin',
      current_stock,
      current_stock - item.quantity_units,
      -item.quantity_units,
      auth.uid(),
      (select display_name from profiles where id = auth.uid()),
      'Vente rapide admin'
    );
  end loop;
end;
$$;
