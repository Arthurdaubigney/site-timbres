# Expertise Philatélie

Site multi-pages (HTML5 + Tailwind CSS) d'estimation et de rachat de timbres rares, orienté SEO et conversion vers le formulaire d'estimation.

## Fonctionnement

- Les pages sources sont dans `src/pages/` (avec un en-tête `---` : title, description…), le layout dans `src/layout.html`, les blocs communs dans `src/partials/`, la FAQ dans `src/data/faq.json`.
- `npm run build` génère les pages HTML **à la racine**, `sitemap.xml`, `robots.txt` et `dist/style.css`.
- L'URL du site (canonical, sitemap, données structurées) vient de `SITE_URL`, sinon de `VERCEL_PROJECT_PRODUCTION_URL` (Vercel), sinon de `site.config.json`.
- `npm run serve` lance un serveur local avec URLs propres (http://localhost:4173).

## Formulaire d'estimation

Le formulaire se place dans `src/partials/form-slot.html` (affiché sur `/estimation-timbres`). Remplacer le bloc `data-form-placeholder` par le code d'intégration, puis relancer `npm run build`.

## À compléter

Les pages `mentions-legales` et `confidentialite` contiennent des champs `[À COMPLÉTER]` (éditeur, contact, durée de conservation).
