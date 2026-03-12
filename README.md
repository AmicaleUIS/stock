# Gestion stock bière

Base propre pour GitHub Pages + Supabase.

## Pages
- `index.html` : accueil
- `login.html` : connexion
- `vente.html` : vente rapide admin
- `stock.html` : visualisation du stock
- `admin.html` : ajout produit + exports PDF

## À faire dans Supabase
1. SQL Editor → exécuter `docs/schema.sql`
2. SQL Editor → exécuter `docs/seed.sql`
3. SQL Editor → exécuter `docs/rls.sql`
4. Créer ton utilisateur dans Auth
5. Ajouter ta ligne dans `profiles`

## Profil super admin
Exemple :
```sql
insert into profiles (id, email, display_name, role)
values ('TON-UUID-UTILISATEUR', 'ton@email.com', 'Ton nom', 'super_admin');
```

## Notes
- La clé Supabase incluse ici est la clé publishable, donc publique.
- Ne jamais mettre de clé `service_role` dans ce dépôt.
