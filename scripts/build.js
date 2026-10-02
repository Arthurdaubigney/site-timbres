#!/usr/bin/env node
/**
 * Générateur de site statique : assemble src/pages/**.html avec le layout et les
 * partiels, produit les pages à la racine du dépôt, ainsi que sitemap.xml et robots.txt.
 *
 * URL du site : variable SITE_URL, sinon domaine de production Vercel
 * (VERCEL_PROJECT_PRODUCTION_URL), sinon "siteUrl" dans site.config.json.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");
const config = JSON.parse(fs.readFileSync(path.join(ROOT, "site.config.json"), "utf8"));
const faqData = JSON.parse(fs.readFileSync(path.join(SRC, "data", "faq.json"), "utf8"));

function resolveSiteUrl() {
  let url = process.env.SITE_URL || "";
  if (!url && process.env.VERCEL_PROJECT_PRODUCTION_URL) url = "https://" + process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (!url) url = config.siteUrl || "";
  return url.replace(/\/+$/, "");
}
const SITE_URL = resolveSiteUrl();

const read = (p) => fs.readFileSync(p, "utf8");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const stripTags = (s) => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

function parsePage(file) {
  const raw = read(file);
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error("Front matter manquant : " + file);
  const meta = {};
  m[1].split("\n").forEach((line) => {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  });
  return { meta, body: m[2] };
}

const layout = read(path.join(SRC, "layout.html"));
const partial = (name) => read(path.join(SRC, "partials", name + ".html"));

function faqHtml(items) {
  return items
    .map(
      (it, i) => `
<div class="t-acc reveal border-b border-nuit-900/15" data-open="false" style="--i:${Math.min(i, 6)}">
  <h3><button type="button" class="t-acc-head flex min-h-[4.25rem] w-full cursor-pointer items-center justify-between gap-6 py-5 text-left font-display text-[1.25rem] font-normal leading-snug" aria-expanded="false" aria-controls="faq-${it.id}">${it.q}
    <span class="t-acc-chevron shrink-0 text-or-700"><svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6.5L8 10.5L12 6.5"/></svg></span></button></h3>
  <div class="t-acc-panel" id="faq-${it.id}"><div class="t-acc-panel-inner"><p class="pb-6 pr-10 text-nuit-700">${it.a}</p></div></div>
</div>`
    )
    .join("\n");
}

function render(file) {
  const rel = path.relative(path.join(SRC, "pages"), file).replace(/\\/g, "/");
  const { meta, body } = parsePage(file);
  const urlPath = meta.path || "/" + rel.replace(/\.html$/, "").replace(/(^|\/)index$/, "");
  const jsonld = [];
  let content = body;
  let usedFaq = null;

  // {{faq:tag}} -> accordéon + schéma FAQPage
  content = content.replace(/\{\{faq:([\w-]+)\}\}/g, (_, tag) => {
    const items = tag === "all" ? faqData : faqData.filter((f) => (f.tags || []).includes(tag));
    usedFaq = (usedFaq || []).concat(items);
    return faqHtml(items);
  });
  // {{include:nom}} -> partiel
  content = content.replace(/\{\{include:([\w-]+)\}\}/g, (_, n) => partial(n));

  const canonical = SITE_URL ? SITE_URL + (urlPath === "/" ? "/" : urlPath) : "";
  const title = meta.title;
  const description = meta.description;
  const image = SITE_URL ? SITE_URL + (meta.image || config.defaultImage) : "";

  // Fil d'Ariane
  const crumbs = [["Accueil", "/"]];
  if (meta.crumbs) meta.crumbs.split(";").forEach((c) => { const [n, u] = c.split("="); crumbs.push([n.trim(), u.trim()]); });
  if (urlPath !== "/") crumbs.push([meta.crumb || meta.h1 || title, urlPath]);
  const breadcrumbHtml =
    urlPath === "/" || meta.nocrumb
      ? ""
      : `<nav aria-label="Fil d’Ariane" class="mb-8 text-[0.85rem] text-ivoire-100/65"><ol class="flex flex-wrap items-center gap-x-2 gap-y-1">${crumbs
          .map((c, i) =>
            i === crumbs.length - 1
              ? `<li aria-current="page" class="text-ivoire-100/90">${c[0]}</li>`
              : `<li><a class="underline-offset-4 hover:text-or-300 hover:underline" href="${c[1]}">${c[0]}</a></li><li aria-hidden="true">/</li>`
          )
          .join("")}</ol></nav>`;
  if (urlPath !== "/" && SITE_URL) {
    jsonld.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: stripTags(c[0]), item: SITE_URL + (c[1] === "/" ? "/" : c[1]) })),
    });
  }
  const org = { "@type": "Organization", name: config.siteName, ...(SITE_URL ? { url: SITE_URL + "/" } : {}) };
  if (urlPath === "/") {
    jsonld.push({ "@context": "https://schema.org", ...org, description: config.tagline });
    if (SITE_URL) jsonld.push({ "@context": "https://schema.org", "@type": "WebSite", name: config.siteName, url: SITE_URL + "/", inLanguage: "fr-FR" });
  }
  if (usedFaq && usedFaq.length) {
    jsonld.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: usedFaq.map((f) => ({ "@type": "Question", name: stripTags(f.q), acceptedAnswer: { "@type": "Answer", text: stripTags(f.a) } })),
    });
  }
  if (meta.type === "service") {
    jsonld.push({ "@context": "https://schema.org", "@type": "Service", name: stripTags(meta.h1 || title), serviceType: "Estimation et rachat de timbres et collections philatéliques", areaServed: { "@type": "Country", name: "France" }, provider: org, description });
  }
  if (meta.type === "article") {
    jsonld.push({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: stripTags(meta.h1 || title),
      description,
      inLanguage: "fr-FR",
      datePublished: meta.date,
      dateModified: meta.modified || meta.date,
      ...(image ? { image: [image] } : {}),
      author: org,
      publisher: org,
      ...(canonical ? { mainEntityOfPage: canonical } : {}),
    });
  }

  content = content.replace("{{breadcrumb}}", breadcrumbHtml);
  const robots = meta.robots || "index, follow, max-image-preview:large";
  const html = layout
    .replace("{{head-extra}}", meta.preload ? `<link rel="preload" as="image" href="${meta.preload}" type="image/webp">` : "")
    .replace(/\{\{title\}\}/g, esc(title))
    .replace(/\{\{description\}\}/g, esc(description))
    .replace("{{canonical}}", canonical ? `<link rel="canonical" href="${canonical}">\n  <meta property="og:url" content="${canonical}">` : "")
    .replace("{{image}}", image ? `<meta property="og:image" content="${image}">\n  <meta name="twitter:image" content="${image}">` : "")
    .replace("{{ogtype}}", meta.type === "article" ? "article" : "website")
    .replace("{{robots}}", robots)
    .replace("{{jsonld}}", jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join("\n  "))
    .replace("{{header}}", partial("header"))
    .replace("{{footer}}", partial("footer"))
    .replace("{{breadcrumb}}", breadcrumbHtml)
    .replace("{{content}}", content)
    .replace(/\{\{siteName\}\}/g, config.siteName);

  const outFile = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, html);
  return { urlPath, robots, modified: meta.modified || meta.date || "" };
}

// Nettoyage des anciennes pages générées
const pages = walk(path.join(SRC, "pages")).filter((f) => f.endsWith(".html"));
const results = pages.map(render);

// Scripts publics
fs.mkdirSync(path.join(ROOT, "assets", "js"), { recursive: true });
fs.copyFileSync(path.join(SRC, "js", "site.js"), path.join(ROOT, "assets", "js", "site.js"));

// sitemap.xml + robots.txt
if (SITE_URL) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = results
    .filter((r) => !/noindex/.test(r.robots) && r.urlPath !== "/404")
    .sort((a, b) => a.urlPath.length - b.urlPath.length)
    .map((r) => `  <url><loc>${SITE_URL}${r.urlPath === "/" ? "/" : r.urlPath}</loc><lastmod>${r.modified || today}</lastmod></url>`)
    .join("\n");
  fs.writeFileSync(path.join(ROOT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  fs.writeFileSync(path.join(ROOT, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
} else {
  fs.writeFileSync(path.join(ROOT, "robots.txt"), `User-agent: *\nAllow: /\n`);
  if (fs.existsSync(path.join(ROOT, "sitemap.xml"))) fs.unlinkSync(path.join(ROOT, "sitemap.xml"));
  console.warn("⚠ Aucune URL de site (SITE_URL / VERCEL_PROJECT_PRODUCTION_URL / site.config.json) : canonical et sitemap omis.");
}
console.log(`✓ ${results.length} pages générées` + (SITE_URL ? ` pour ${SITE_URL}` : ""));
