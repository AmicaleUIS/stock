insert into products (name, category, product_type, stock_units, unit_label, unit_size)
values
  ('Blonde', 'biere', 'simple', 0, 'bouteille', 12),
  ('Blanche', 'biere', 'simple', 0, 'bouteille', 12),
  ('Ambrée', 'biere', 'simple', 0, 'bouteille', 12),
  ('Ecocup', 'goodies', 'simple', 0, 'pièce', 1),
  ('Sacoche', 'goodies', 'simple', 0, 'pièce', 1),
  ('Kit du Sommelier', 'goodies', 'simple', 0, 'pièce', 1),
  ('Porte téléphone', 'goodies', 'simple', 0, 'pièce', 1),
  ('Verre gravé', 'goodies', 'simple', 0, 'pièce', 1),
  ('Patch UIS', 'patch', 'simple', 0, 'pièce', 1),
  ('Patch cabine', 'patch', 'simple', 0, 'pièce', 1),
  ('Patch UIS gomme', 'patch', 'simple', 0, 'pièce', 1),
  ('Porte-clé', 'goodies', 'simple', 0, 'pièce', 1),
  ('Insigne', 'goodies', 'simple', 0, 'pièce', 1),
  ('Coffret 2 bières + 1 verre', 'coffret', 'pack', 0, 'coffret', 1),
  ('Coffret 3 bières', 'coffret', 'pack', 0, 'coffret', 1),
  ('Coffret 2 verres + 1 bière', 'coffret', 'pack', 0, 'coffret', 1)
on conflict do nothing;
