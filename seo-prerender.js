// Build-time SEO output (Vite plugin). The app itself is a client-rendered SPA, so without this
// every URL would serve the same index.html -- same title, description and canonical -- and
// crawlers that don't run JavaScript would see no text at all. From the built index.html it makes:
//
//   * index.html            -> the Albanian homepage, with its own <head> and core text
//   * seo/*.html            -> one file per other SEO page (every SEO language), served for its
//                              URL by the rewrites in vercel.json
//   * app.html              -> the plain SPA shell (no canonical, no page text) that every other
//                              route falls back to; the app sets the right <head> once it runs
//   * sitemap.xml           -> SEO pages with hreflang alternates, public pages, and every live
//                              car and company page (from the API, skipped if it's unreachable)
//
// The text placed in #root is the same copy the React page renders (both read src/seo.js); React
// replaces it as soon as it mounts.
import { SEO_PAGES, SEO_LANGS, SITE, alternatesFor } from "./src/seo.js";
import { companyPath } from "./src/carData.js";

/* global process */ // runs in Node at build time
const API = process.env.VITE_API_BASE || "https://erental-api.onrender.com/api";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// File each SEO page is written to (the Albanian homepage IS index.html).
export function seoFileFor(page, lang) {
  if (page.key === "home" && lang === "sq") return "index.html";
  return `seo/${page.paths[lang].replace(/^\/|\/$/g, "").replace(/\//g, "-") || "home"}.html`;
}

const LABELS = {
  sq: { all: "Të gjitha makinat", about: "Rreth nesh", contact: "Kontakt", business: "Regjistro biznesin" },
  en: { all: "All cars", about: "About us", contact: "Contact", business: "List your rental company" },
  it: { all: "Tutte le auto", about: "Chi siamo", contact: "Contatti", business: "Registra la tua azienda" },
  fr: { all: "Toutes les voitures", about: "À propos", contact: "Contact", business: "Inscrire votre agence" },
  tr: { all: "Tüm araçlar", about: "Hakkımızda", contact: "İletişim", business: "Firmanızı kaydedin" },
  el: { all: "Όλα τα αυτοκίνητα", about: "Σχετικά με εμάς", contact: "Επικοινωνία", business: "Καταχωρίστε την εταιρεία σας" },
};
// Each language version links to the others under its own name.
const LANG_NAMES = { sq: "Shqip", en: "English", it: "Italiano", fr: "Français", tr: "Türkçe", el: "Ελληνικά" };
const OG_LOCALES = { sq: "sq_AL", en: "en_GB", it: "it_IT", fr: "fr_FR", tr: "tr_TR", el: "el_GR" };
const homePath = (lang) => SEO_PAGES.find((p) => p.key === "home").paths[lang];

function bodyFor(page, lang) {
  const m = page.meta[lang];
  const L = LABELS[lang];
  const links = [
    ...SEO_PAGES.filter((p) => p !== page).map((p) => [p.paths[lang], p.meta[lang].h1]),
    ["/rezultate", L.all],
    ["/rreth-nesh", L.about],
    ["/kontakt", L.contact],
    ["/regjistrohu-biznes", L.business],
  ];
  const langLinks = SEO_LANGS.filter((l) => l !== lang).map((l) => `<a href="${esc(page.paths[l])}" hreflang="${l}" lang="${l}">${esc(LANG_NAMES[l])}</a>`).join(" · ");
  const sections = m.sections.map((s) => `<section><h2>${esc(s.h2)}</h2><p>${esc(s.p)}</p></section>`).join("");
  return `<div class="seo-prerender"><header><a href="${homePath(lang)}">ERental</a></header>`
    + `<main><h1>${esc(m.h1)}</h1><p>${esc(m.intro)}</p>${sections}</main>`
    + `<nav>${links.map(([href, label]) => `<a href="${esc(href)}">${esc(label)}</a>`).join(" · ")}</nav>`
    + `<nav>${langLinks}</nav></div>`;
}

// Minimal readable styling for the moment before the app's JS takes over.
const PRERENDER_STYLE = `<style>.seo-prerender{max-width:64rem;margin:0 auto;padding:1.5rem 1rem;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#0f172a;line-height:1.55}.seo-prerender header a{font-weight:700;font-size:1.25rem;color:#0284c7;text-decoration:none}.seo-prerender h1{font-size:1.75rem;margin:1.25rem 0 .5rem}.seo-prerender h2{font-size:1.1rem;margin:1.25rem 0 .25rem}.seo-prerender p{color:#475569;margin:0}.seo-prerender nav{margin-top:1.5rem;font-size:.9rem}.seo-prerender nav a{color:#0284c7}@media (prefers-color-scheme:dark){.seo-prerender{color:#f1f5f9}.seo-prerender p{color:#94a3b8}}</style>`;

function jsonLdFor(page, lang) {
  const m = page.meta[lang];
  const url = SITE + page.paths[lang];
  const data = page.key === "home"
    ? { "@context": "https://schema.org", "@type": "WebSite", name: "ERental", url, inLanguage: lang }
    : {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "ERental", item: SITE + homePath(lang) },
          { "@type": "ListItem", position: 2, name: m.h1, item: url },
        ],
      };
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

function setAttrContent(html, selectorAttr, key, value) {
  const re = new RegExp(`(<meta ${selectorAttr}="${key}" content=")[^"]*(")`);
  return re.test(html) ? html.replace(re, `$1${esc(value)}$2`) : html.replace("</head>", `  <meta ${selectorAttr}="${key}" content="${esc(value)}" />\n  </head>`);
}

export function renderSeoPage(shell, page, lang) {
  const m = page.meta[lang];
  const url = SITE + page.paths[lang];
  let html = shell
    .replace(/<html lang="[^"]*">/, `<html lang="${lang}">`)
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(m.title)}</title>`)
    .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${url}" />`);
  html = setAttrContent(html, "name", "description", m.description);
  html = setAttrContent(html, "property", "og:title", m.title);
  html = setAttrContent(html, "property", "og:description", m.description);
  html = setAttrContent(html, "property", "og:url", url);
  html = setAttrContent(html, "property", "og:locale", OG_LOCALES[lang]);
  html = setAttrContent(html, "name", "twitter:title", m.title);
  html = setAttrContent(html, "name", "twitter:description", m.description);
  const alternates = alternatesFor(page).map((a) => `    <link rel="alternate" hreflang="${a.hreflang}" href="${a.href}" />`).join("\n");
  html = html.replace("</head>", `${alternates}\n    ${jsonLdFor(page, lang)}\n    ${PRERENDER_STYLE}\n  </head>`);
  return html.replace('<div id="root"></div>', `<div id="root">${bodyFor(page, lang)}</div>`);
}

// The fallback shell for every non-SEO route: no hardcoded canonical (it pointed every car page
// at the homepage) -- App.jsx sets the real one for the route on load.
export function appShell(shell) {
  return shell.replace(/\s*<link rel="canonical" href="[^"]*" \/>/, "");
}

async function fetchJson(path) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(API + path, { signal: ctrl.signal });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function sitemapXml() {
  const today = new Date().toISOString().slice(0, 10);
  const entry = (loc, extra = "") => `  <url>\n    <loc>${esc(loc)}</loc>\n    <lastmod>${today}</lastmod>${extra}\n  </url>`;
  const urls = [];
  for (const page of SEO_PAGES) {
    const alts = alternatesFor(page).map((a) => `\n    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${esc(a.href)}" />`).join("");
    for (const lang of SEO_LANGS) urls.push(entry(SITE + page.paths[lang], alts));
  }
  for (const p of ["/rezultate", "/rreth-nesh", "/kontakt", "/regjistrohu-biznes"]) urls.push(entry(SITE + p));

  const cars = await fetchJson("/Cars");
  if (Array.isArray(cars)) {
    const live = cars.filter((c) => c.statusi === "active" && c.company?.eshteVerifikuar);
    for (const c of live) urls.push(entry(`${SITE}/makina/${c.carId}`));
    for (const id of [...new Set(live.map((c) => c.companyId))]) urls.push(entry(SITE + companyPath(id, cars)));
  } else {
    console.warn("[seo-prerender] API unreachable -- sitemap built without car/company pages");
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join("\n")}\n</urlset>\n`;
}

export default function seoPrerender() {
  return {
    name: "erental-seo-prerender",
    apply: "build",
    enforce: "post",
    async generateBundle(_options, bundle) {
      const index = bundle["index.html"];
      if (!index) return;
      const shell = String(index.source);
      this.emitFile({ type: "asset", fileName: "app.html", source: appShell(shell) });
      for (const page of SEO_PAGES) {
        for (const lang of SEO_LANGS) {
          const fileName = seoFileFor(page, lang);
          const html = renderSeoPage(shell, page, lang);
          if (fileName === "index.html") index.source = html;
          else this.emitFile({ type: "asset", fileName, source: html });
        }
      }
      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: await sitemapXml() });
    },
  };
}
