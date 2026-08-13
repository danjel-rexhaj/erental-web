import { useState, useCallback } from "react";
import { LangContext } from "./langContext";

// Bilingual (sq/en) dictionary, extended page by page -- see the plan doc for the
// rollout order. Keys are namespaced by page (auth.*, business.*, ...); strings
// duplicated verbatim across pages live under common.*.
const TRANSLATIONS = {
  sq: {
    "nav.cars": "Makina",
    "nav.favorites": "Te preferuarat",
    "nav.bookings": "Rezervimet",
    "nav.business": "Biznesi",
    "nav.stats": "Statistikat",
    "nav.more": "Me shume",
    "nav.about": "Rreth nesh",
    "nav.contact": "Kontakt",
    "nav.careers": "Karriere",
    "nav.login": "Logohu",
    "nav.loginRegister": "Logohu / Regjistrohu",
    "nav.logout": "Dil nga llogaria",
    "nav.profile": "Profili",
    "home.badge": "ERental Shqiperi",
    "home.title": "Merr makinen qe te duhet, kur te duhet.",
    "home.subtitle": "Platforma e pare shqiptare ku krahason dhe rezervon makinen tende me qera brenda sekondave — pa kosto te fshehura.",
    "home.from": "Nga",
    "home.to": "Deri",
    "home.zone": "Zona",
    "home.allZones": "Te gjitha zonat",
    "home.search": "Kerko makina",
    "home.searching": "Duke kerkuar...",
    "home.verifiedBusinesses": "Bizneset e verifikuara ne ERental",
    "common.loading": "Duke ngarkuar...",
    "common.booked": "E zene",
    "common.selected": "Zgjedhur",
    "common.perDaySuffix": "/dite",
    "common.reserve": "Rezervo",
    "common.favoriteAdd": "Shto te preferuarat",
    "common.favoriteRemove": "Hiq nga te preferuarat",
    "common.offersDelivery": "Ofron dergim makine te klienti",
    "common.status.pending": "Ne pritje",
    "common.status.confirmed": "Konfirmuar",
    "common.status.completed": "Perfunduar",
    "common.status.cancelled": "Anuluar",
    "common.clearFilters": "Pastro filtrat",
    "common.sortBy": "Rendit sipas",
    "common.priceAsc": "Cmimi: me i ulet",
    "common.priceDesc": "Cmimi: me i larte",
    "common.filter": "Filtro",
    "common.amenities": "Pajisje",
    "common.getDirections": "Merr udhezime",
    "common.verified": "I verifikuar",
    "common.search": "Kerko",
    "favorites.emptyTitle": "Ende s'ke asnje makine te preferuar.",
    "favorites.emptySubtitle": "Shtyp zemren te nje makine per ta ruajtur ketu.",
    "paymentSuccess.title": "Pagesa u krye ✓",
    "paymentSuccess.confirmedFor": "Rezervimi yt per {{car}} u konfirmua.",
    "paymentSuccess.confirmation": "Konfirmimi",
    "paymentSuccess.dates": "Datat",
    "paymentSuccess.amountPaid": "Shuma e paguar",
    "paymentSuccess.downloadInvoice": "Shkarko faturen",
    "paymentSuccess.close": "Kthehu",
    "locationPicker.searchPlaceholder": "Plaza Tirane, Rruga Kavajes...",
    "locationPicker.hint": "Kerko me emer/adrese, ose kliko/terhiq piken direkt ne harte per ta vendosur vete.",
    "locationPicker.locationSet": "Vendndodhja u vendos",
    "locationPicker.errEmptyQuery": "Shkruaj diçka per te kerkuar.",
    "locationPicker.errNoResults": "Nuk u gjet asgje me kete emer. Provo tjeter, ose kliko direkt ne harte per te vendosur piken.",
    "locationPicker.errNoGeoSupport": "Shfletuesi yt nuk mbeshtet vendndodhjen.",
    "locationPicker.errGeoDenied": "Nuk u lejua akses ne vendndodhje.",
    "results.changeDates": "Ndrysho datat",
    "results.searchPlaceholder": "Kerko makine ose biznes...",
    "results.allBrands": "Te gjitha markat",
    "results.allModels": "Te gjitha modelet",
    "results.allBusinesses": "Te gjitha bizneset",
    "results.allFuels": "Te gjitha karburantet",
    "results.allCategories": "Te gjitha kategorite",
    "results.yearFrom": "Viti nga",
    "results.yearTo": "Viti deri",
    "results.maxPricePlaceholder": "Cmimi max/dite €",
    "results.availableCars": { one: "{{count}} makine e lire", other: "{{count}} makina te lira" },
    "results.businessCount": { one: "{{count}} biznes", other: "{{count}} biznese" },
    "results.noResults": "Asnje makine e lire per keto data/filtra.",
    "results.freeToday": "Lirohet sot",
    "results.freeTomorrow": "Lirohet neser",
    "results.freeInDays": "Lirohet pas {{days}} ditesh",
  },
  en: {
    "nav.cars": "Cars",
    "nav.favorites": "Favorites",
    "nav.bookings": "Bookings",
    "nav.business": "Business",
    "nav.stats": "Statistics",
    "nav.more": "More",
    "nav.about": "About us",
    "nav.contact": "Contact",
    "nav.careers": "Careers",
    "nav.login": "Log in",
    "nav.loginRegister": "Log in / Sign up",
    "nav.logout": "Log out",
    "nav.profile": "Profile",
    "home.badge": "ERental Albania",
    "home.title": "Get the car you need, when you need it.",
    "home.subtitle": "Albania's first platform to compare and book your rental car in seconds — no hidden costs.",
    "home.from": "From",
    "home.to": "To",
    "home.zone": "Location",
    "home.allZones": "All areas",
    "home.search": "Search cars",
    "home.searching": "Searching...",
    "home.verifiedBusinesses": "Verified businesses on ERental",
    "common.loading": "Loading...",
    "common.booked": "Booked",
    "common.selected": "Selected",
    "common.perDaySuffix": "/day",
    "common.reserve": "Book",
    "common.favoriteAdd": "Add to favorites",
    "common.favoriteRemove": "Remove from favorites",
    "common.offersDelivery": "Offers car delivery to client",
    "common.status.pending": "Pending",
    "common.status.confirmed": "Confirmed",
    "common.status.completed": "Completed",
    "common.status.cancelled": "Cancelled",
    "common.clearFilters": "Clear filters",
    "common.sortBy": "Sort by",
    "common.priceAsc": "Price: lowest first",
    "common.priceDesc": "Price: highest first",
    "common.filter": "Filter",
    "common.amenities": "Amenities",
    "common.getDirections": "Get directions",
    "common.verified": "Verified",
    "common.search": "Search",
    "favorites.emptyTitle": "You haven't saved any favorite cars yet.",
    "favorites.emptySubtitle": "Tap the heart on a car to save it here.",
    "paymentSuccess.title": "Payment successful ✓",
    "paymentSuccess.confirmedFor": "Your booking for {{car}} is confirmed.",
    "paymentSuccess.confirmation": "Confirmation",
    "paymentSuccess.dates": "Dates",
    "paymentSuccess.amountPaid": "Amount paid",
    "paymentSuccess.downloadInvoice": "Download invoice",
    "paymentSuccess.close": "Close",
    "locationPicker.searchPlaceholder": "Plaza Tirane, Rruga Kavajes...",
    "locationPicker.hint": "Search by name/address, or click/drag the pin directly on the map to set it yourself.",
    "locationPicker.locationSet": "Location set",
    "locationPicker.errEmptyQuery": "Type something to search.",
    "locationPicker.errNoResults": "Nothing found with that name. Try something else, or click directly on the map to set the pin.",
    "locationPicker.errNoGeoSupport": "Your browser doesn't support location.",
    "locationPicker.errGeoDenied": "Location access was denied.",
    "results.changeDates": "Change dates",
    "results.searchPlaceholder": "Search car or business...",
    "results.allBrands": "All brands",
    "results.allModels": "All models",
    "results.allBusinesses": "All businesses",
    "results.allFuels": "All fuel types",
    "results.allCategories": "All categories",
    "results.yearFrom": "Year from",
    "results.yearTo": "Year to",
    "results.maxPricePlaceholder": "Max price/day €",
    "results.availableCars": { one: "{{count}} car available", other: "{{count}} cars available" },
    "results.businessCount": { one: "{{count}} business", other: "{{count}} businesses" },
    "results.noResults": "No cars available for these dates/filters.",
    "results.freeToday": "Free today",
    "results.freeTomorrow": "Free tomorrow",
    "results.freeInDays": "Free in {{days}} days",
  },
};

function interpolate(str, vars) {
  if (!vars) return str;
  return str.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] ?? ""));
}

function resolve(value, vars) {
  if (value && typeof value === "object") {
    const count = vars?.count;
    value = count === 1 ? value.one : value.other;
  }
  return typeof value === "string" ? interpolate(value, vars) : value;
}

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem("lang") || "sq");

  const setLang = useCallback((next) => {
    setLangState(next);
    localStorage.setItem("lang", next);
  }, []);

  const t = useCallback(
    (key, vars) => {
      const raw = TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.sq[key];
      return raw !== undefined ? resolve(raw, vars) : key;
    },
    [lang]
  );

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}
