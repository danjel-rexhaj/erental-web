import { useState, useCallback } from "react";
import { LangContext } from "./langContext";

// Pilot bilingual pass (sq/en) covering the top navigation and homepage only --
// the rest of the app is still hardcoded Albanian. Add more keys here and swap
// hardcoded strings for t("key") page by page to extend coverage.
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
    "nav.login": "Kyçu",
    "nav.loginRegister": "Kyçu / Regjistrohu",
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
  },
};

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem("lang") || "sq");

  const setLang = useCallback((next) => {
    setLangState(next);
    localStorage.setItem("lang", next);
  }, []);

  const t = useCallback((key) => TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.sq[key] ?? key, [lang]);

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}
