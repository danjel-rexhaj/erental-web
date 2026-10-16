// Single source of truth for the indexable SEO pages: their URLs per language, titles,
// descriptions and the core copy (H1 + intro). Used by the app at runtime (App.jsx keeps the
// <head> in sync while navigating) AND by the build (vite.config.js prerenders one static HTML
// file per page from this, so crawlers get the right metadata and text without running JS).
// Plain JS on purpose -- no React/JSX -- so the build can import it directly.
//
// Albanian lives at the root (the URLs Google already indexed); every other SEO language under its
// own prefix (/en/, /it/, /fr/, /tr/, /el/) -- their copy is in seoCopy.js except English. Only pages
// with real inventory get a landing page -- every live listing today is in Tirana or at Rinas.

import { SEO_COPY_MORE } from "./seoCopy.js";

export const SITE = "https://www.erental.store";

export const SEO_PAGES = [
  {
    key: "home",
    paths: { sq: "/", en: "/en/" },
    meta: {
      sq: {
        title: "Makina me qera në Shqipëri | Krahaso çmimet - ERental",
        description: "Krahaso dhe rezervo makina me qera në Shqipëri nga biznese lokale të verifikuara. Makina në Tiranë, në Aeroportin e Rinasit dhe më gjerë — rezervim online me ERental.",
        h1: "Makina me qera në Shqipëri",
        intro: "ERental mbledh në një vend makinat me qera të bizneseve lokale të verifikuara. Krahaso çmimet, shiko kushtet e secilit biznes dhe rezervo online — në Tiranë, në Aeroportin e Rinasit dhe më gjerë.",
        sections: [
          { h2: "Krahaso makinat e disa bizneseve njëherësh", p: "Në vend që të telefonosh zyrat e qerasë një nga një, sheh krah për krah makinat e disa bizneseve lokale: çmimin për ditë, karburantin, kambion, numrin e vendeve dhe kushtet e vetë biznesit — si minimumi i ditëve, depozita dhe politika për kthimin me vonesë." },
          { h2: "Makina me qera në Tiranë dhe në Aeroportin e Rinasit", p: "Sot, shumica e makinave në ERental janë në Tiranë ose pranë Aeroportit Ndërkombëtar të Tiranës (Rinas), kështu që këto janë vendet më të lehta për ta marrë makinën. Disa biznese ofrojnë edhe dorëzim — kërko shenjën përkatëse te makina." },
          { h2: "Biznese të verifikuara", p: "Çdo biznes kontrollohet nga ekipi ynë para se makinat e tij të shfaqen me shenjën \"I verifikuar\". Vlerësimet e klientëve pas qerave të përfunduara shfaqen te faqja e biznesit." },
          { h2: "Si funksionon rezervimi", p: "Zgjidh datat, zgjidh makinën dhe paguaj online me kartë — ose një depozitë, me pjesën tjetër në dorëzim, ose shumën e plotë kur biznesi e kërkon. Para rezervimit të parë duhet të ngarkosh foton e patentës në profil. Anulimi është falas sa kohë rezervimi pret konfirmim dhe për 12 orë pasi biznesi e konfirmon." },
        ],
      },
      en: {
        title: "Rent a Car in Albania | Compare Car Rentals - ERental",
        description: "Compare rental cars in Albania from local rental companies. Find cars in Tirana, Tirana Airport and across Albania. Book online with ERental.",
        h1: "Rent a car in Albania",
        intro: "ERental brings rental cars from verified local companies together in one place. Compare prices, check each company's terms and book online — in Tirana, at Tirana International Airport and beyond.",
        sections: [
          { h2: "Compare cars from several companies at once", p: "Instead of calling rental offices one by one, you see cars from several local companies side by side: the daily price, fuel, transmission, number of seats and each company's own terms — such as minimum rental days, deposit and late-return policy." },
          { h2: "Car rental in Tirana and at Tirana Airport", p: "Today, most cars on ERental are in Tirana or near Tirana International Airport (Rinas), which makes these the easiest places to pick up a car. Some companies also offer delivery — look for the badge on the car." },
          { h2: "Verified rental companies", p: "Every company is checked by our team before its cars are shown with the \"Verified\" badge. Reviews from customers who completed a rental appear on the company's page." },
          { h2: "How booking works", p: "Choose your dates, pick a car and pay online by card — either a deposit, with the rest paid at pickup, or the full amount where the company requires it. Before your first booking you'll need to add a photo of your driving licence to your profile. Cancellation is free while the booking is pending and for 12 hours after the company confirms it." },
        ],
      },
    },
  },
  {
    key: "tirana",
    city: "Tirane",
    paths: { sq: "/makina-me-qera-tirane", en: "/en/rent-a-car-tirana" },
    meta: {
      sq: {
        title: "Makina me qera në Tiranë | Krahaso çmimet - ERental",
        description: "Makina me qera në Tiranë nga biznese lokale të verifikuara. Krahaso çmimet dhe kushtet, pastaj rezervo online me ERental.",
        h1: "Makina me qera në Tiranë",
        intro: "Krahaso makinat me qera që ofrojnë bizneset e verifikuara në Tiranë — nga makina ekonomike për qytetin te SUV për udhëtime më të gjata. Çdo makinë tregon çmimin për ditë, kushtet e biznesit dhe datat e lira.",
        sections: [
          { h2: "Marrja e makinës në Tiranë", p: "Çdo biznes vendos vetë orarin dhe vendin e marrjes. Te faqja e makinës sheh adresën e biznesit në hartë dhe mund të hapësh udhëzimet drejt tij me një klik." },
          { h2: "Cila makinë për udhëtimin tënd", p: "Një makinë e vogël ekonomike është zgjidhja më e lehtë për trafikun dhe parkimin në Tiranë. Për udhëtime drejt bregdetit ose maleve, mendo për një SUV ose një makinë me më shumë vend për bagazhe. Përdor filtrat për karburantin, kategorinë dhe çmimin." },
          { h2: "Çfarë të kesh gati", p: "Ngarko foton e patentës në profil para rezervimit të parë. Kontrollo minimumin e ditëve që kërkon biznesi dhe, nëse e dëshiron, sigurimin e plotë kur biznesi e ofron — të dyja shfaqen para pagesës." },
        ],
      },
      en: {
        title: "Rent a Car in Tirana | Compare Car Rentals - ERental",
        description: "Rent a car in Tirana from verified local rental companies. Compare prices and terms, then book online with ERental.",
        h1: "Rent a car in Tirana",
        intro: "Compare rental cars offered by verified companies in Tirana — from economy cars for the city to SUVs for longer trips. Every car shows its daily price, the company's terms and its available dates.",
        sections: [
          { h2: "Picking up a car in Tirana", p: "Each company sets its own pickup times and location. On every car's page you'll see the company's address on a map and can open directions to it in one tap." },
          { h2: "Which car for your trip", p: "A small economy car is the easiest choice for Tirana's traffic and parking. For trips to the coast or the mountains, consider an SUV or a car with more luggage space. Use the filters for fuel type, category and price." },
          { h2: "What to have ready", p: "Add a photo of your driving licence to your profile before your first booking. Check the company's minimum rental days and, if you want it, full insurance where the company offers it — both are shown before you pay." },
        ],
      },
    },
  },
  {
    key: "airport",
    city: "Aeroporti Rinas (Tirane)",
    paths: { sq: "/makina-me-qera-aeroporti-rinas", en: "/en/tirana-airport-car-rental" },
    meta: {
      sq: {
        title: "Makina me qera në Aeroportin e Rinasit | ERental",
        description: "Makina me qera në Aeroportin Ndërkombëtar të Tiranës (Rinas) nga biznese lokale të verifikuara. Krahaso çmimet dhe rezervo online para se të mbërrish.",
        h1: "Makina me qera në Aeroportin e Rinasit",
        intro: "Rezervo makinën para se të mbërrish dhe merre në Aeroportin Ndërkombëtar të Tiranës (Rinas). Krahaso ofertat e bizneseve të verifikuara që shërbejnë aeroportin dhe zgjidh atë që të përshtatet.",
        sections: [
          { h2: "Rezervo para se të mbërrish", p: "Rezervo online me datat e mbërritjes, që makina të jetë gati kur të arrish. Disa biznese kërkojnë biletën e avionit gjatë rezervimit, që ta planifikojnë marrjen sipas orarit të fluturimit." },
          { h2: "Marrja në Rinas", p: "Mënyrën e dorëzimit e vendos çdo biznes. Te faqja e makinës sheh vendndodhjen dhe të dhënat e biznesit; pikën e takimit e konfirmon me biznesin pasi rezervimi të konfirmohet." },
          { h2: "Fluturime të vona dhe kthimi", p: "Nëse fluturimi yt i kthimit është natën vonë, kontrollo politikën e biznesit për kthimin me vonesë — shfaqet para se të paguash, që të mos ketë surpriza." },
        ],
      },
      en: {
        title: "Tirana Airport Car Rental | Compare Prices - ERental",
        description: "Car rental at Tirana International Airport (Rinas) from verified local companies. Compare prices and book online before you land.",
        h1: "Tirana Airport car rental",
        intro: "Book your car before you land and pick it up at Tirana International Airport (Rinas). Compare offers from verified companies serving the airport and choose the one that suits your trip.",
        sections: [
          { h2: "Book before you land", p: "Book online with your arrival dates so the car is ready when you get there. Some companies ask for your flight ticket when you book, so they can plan the handover around your flight." },
          { h2: "Pickup at Rinas", p: "Each company sets how the handover works. The car's page shows the company's location and details; confirm the meeting point with the company once your booking is confirmed." },
          { h2: "Late flights and returns", p: "If your return flight leaves late at night, check the company's late-return policy — it's shown before you pay, so there are no surprises." },
        ],
      },
    },
  },
];

for (const page of SEO_PAGES) {
  const more = SEO_COPY_MORE[page.key];
  Object.assign(page.paths, more.paths);
  Object.assign(page.meta, more.meta);
}

// Languages with their own indexable URLs. German is a UI language only (it reads the Albanian
// URLs with English copy), so it has no SEO pages and no hreflang entry.
export const SEO_LANGS = ["sq", "en", "it", "fr", "tr", "el"];
const PREFIXED = SEO_LANGS.filter((l) => l !== "sq");

// The language a URL belongs to by its prefix (/it/..., /el) -- null for Albanian/unprefixed.
export function langFromPath(path) {
  const seg = (path || "/").split("?")[0].split("/")[1];
  return PREFIXED.includes(seg) ? seg : null;
}

function normalize(path) {
  const clean = (path || "/").split("?")[0].split("#")[0];
  const home = PREFIXED.find((l) => clean === `/${l}` || clean === `/${l}/`);
  if (home) return `/${home}/`;
  return clean.length > 1 && clean.endsWith("/") ? clean.slice(0, -1) : clean;
}

// Which SEO language a UI language reads: its own when it has pages, Albanian otherwise (de).
export function seoLangFor(lang) {
  return SEO_LANGS.includes(lang) ? lang : "sq";
}

// Copy for a page in a UI language: its own, or English for a language without SEO copy (de).
export function seoMetaFor(page, lang) {
  return page.meta[lang] || page.meta.en;
}

// { page, lang } for an SEO page URL, or null for every other route.
export function seoPageForPath(path) {
  const p = normalize(path);
  for (const page of SEO_PAGES) {
    for (const lang of SEO_LANGS) if (page.paths[lang] === p) return { page, lang };
  }
  return null;
}

export function seoPageByKey(key) {
  return SEO_PAGES.find((p) => p.key === key) || null;
}

// The SEO page for a city landing (by ALBANIAN_LOCATIONS name), if that city has one.
export function seoPageForCity(city) {
  return SEO_PAGES.find((p) => p.city === city) || null;
}

// The URL to show for `pathWithQuery` in `lang`: an SEO page maps to its twin in that language
// (/it/... for Italian and so on; German and Albanian → the Albanian URL); every other route is
// returned as is.
export function localizePath(pathWithQuery, lang) {
  const [path, query] = (pathWithQuery || "/").split("?");
  const seo = seoPageForPath(path);
  if (!seo) return pathWithQuery;
  const target = seo.page.paths[seoLangFor(lang)];
  return target + (query ? `?${query}` : "");
}

// hreflang alternates for a page: one per language plus x-default (the Albanian root URL).
export function alternatesFor(page) {
  return [
    ...SEO_LANGS.map((lang) => ({ hreflang: lang, href: SITE + page.paths[lang] })),
    { hreflang: "x-default", href: SITE + page.paths.sq },
  ];
}

// Routes that are user-specific or transactional -- never worth indexing. (/regjistrohu-biznes
// stays indexable: it's the page a rental company searching for us should land on.)
export const NOINDEX_PREFIXES = ["/profili", "/rezervimet", "/preferuarat", "/biznesi", "/verifiko", "/paypal-kthim"];
