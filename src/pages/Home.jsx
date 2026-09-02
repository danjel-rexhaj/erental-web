import { useState, useEffect, useRef } from "react";
import { ShieldCheck, BadgeCheck, RotateCcw, Calendar, ArrowRight, MapPin, Clock, Lock, Zap, ChevronDown, HelpCircle, Sparkles, Star, Quote } from "lucide-react";
import { apiFetch } from "../api";
import { Field, PrimaryButton, CarCard } from "../components";
import { CITY_SLUGS, CAR_CATEGORIES } from "../carData";
import { useLang } from "../useLang";

const today = () => new Date().toISOString().split("T")[0];
const dayAfter = (dateStr) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
};

// Only the cities with real live listings today get their own featured card / quick-link --
// the rest of ALBANIAN_LOCATIONS still gets a plain link further down (their SEO pages exist and
// work already, they just don't have inventory to feature yet).
const FEATURED_DESTINATIONS = [
  { city: "Tirane", descKey: "home.destinationTiraneDesc" },
  { city: "Aeroporti Rinas (Tirane)", descKey: "home.destinationRinasDesc" },
];

export default function Home({ dataFillimit, setDataFillimit, dataPerfundimit, setDataPerfundimit, zona, setZona, onSearch, loading, onSelectCar, onSelectCompany, favoriteIds, onToggleFavorite, goHash }) {
  const { t } = useLang();
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [featuredCars, setFeaturedCars] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [faqSectionOpen, setFaqSectionOpen] = useState(false);
  const [openFaqs, setOpenFaqs] = useState(new Set());
  const faqRef = useRef(null);

  useEffect(() => {
    apiFetch("/Companies", null).then((data) => {
      setCompanies(data.filter((c) => c.eshteVerifikuar));
    }).catch(() => {}).finally(() => setLoadingCompanies(false));
    apiFetch("/Cars/featured?take=9", null).then(setFeaturedCars).catch(() => {}).finally(() => setLoadingFeatured(false));
    apiFetch("/Reviews/recent?take=6", null).then(setReviews).catch(() => {}).finally(() => setLoadingReviews(false));
  }, []);

  // Lets "FAQ" links elsewhere in the app (e.g. the profile page) land here already expanded and
  // scrolled into view, instead of dumping the visitor at the top of a long homepage.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("scrollTo") === "faq") {
      setFaqSectionOpen(true);
      setTimeout(() => faqRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    }
  }, []);

  // Only zones with at least one verified business — picking a zone nobody serves yet
  // always returned an empty result, which just read as broken. New zones show up here
  // automatically as soon as a business registers there, no code change needed.
  const zones = [...new Set(companies.map((c) => c.qyteti).filter(Boolean))].sort();
  const loop = companies.length > 0 ? [...companies, ...companies] : [];
  const otherCities = Object.entries(CITY_SLUGS).filter(([city]) => !FEATURED_DESTINATIONS.some((d) => d.city === city));

  function changeFrom(value) {
    // The native <input type="date" min=...> attribute isn't reliably enforced on every
    // mobile browser/WebView when a date is typed rather than picked, so re-validate here too.
    if (value < today()) return;
    setDataFillimit(value);
    if (dataPerfundimit && value >= dataPerfundimit) setDataPerfundimit(dayAfter(value));
  }

  function changeTo(value) {
    if (value < today()) return;
    if (dataFillimit && value <= dataFillimit) return;
    setDataPerfundimit(value);
  }

  function goCity(city) {
    goHash?.(`/makina-me-qera-${CITY_SLUGS[city]}`);
  }

  function goCategory(key) {
    goHash?.(`/rezultate?kategoria=${key}`);
  }

  return (
    <div>
      <div className="relative rounded-3xl overflow-hidden min-h-[560px] sm:min-h-[520px]">
        <img
          src="https://images.unsplash.com/photo-1689740895651-3ff48a31c852?q=80&w=1600&auto=format&fit=crop"
          alt="Makine ne rruge, breg deti"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 inline-flex items-center gap-1.5 text-white text-xs font-semibold bg-black/40 backdrop-blur-sm border border-white/20 rounded-full pl-2.5 pr-3 py-1.5 shadow-lg">
          <Clock size={13} className="text-cyan-300 dark:text-teal-300" />
          <span className="hidden sm:inline">Check-in</span>
          <ArrowRight size={11} className="opacity-60" />
          <span className="hidden sm:inline">Check-out</span>
          <span className="opacity-70 font-normal">10:00</span>
        </div>
        <div className="relative flex flex-col justify-end min-h-[560px] sm:min-h-[520px] p-6 sm:p-12">
          <span className="inline-flex items-center gap-1.5 text-white text-xs font-semibold tracking-wide uppercase bg-gradient-to-r from-sky-500 to-cyan-500 dark:from-teal-500 dark:to-emerald-600 rounded-full px-3 py-1.5 w-fit mb-4 shadow-lg shadow-sky-900/30 dark:shadow-teal-900/30">
            {t("home.badge")}
          </span>
          <h1 className="text-white text-3xl sm:text-5xl font-bold tracking-tight max-w-xl">
            {t("home.title")}
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mt-3 max-w-lg">
            {t("home.subtitle")}
          </p>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 mt-8 w-full max-w-2xl flex flex-col sm:flex-row sm:items-end gap-3 shadow-2xl flex-wrap">
            <div className="flex-1 min-w-[170px]">
              <Field label={t("home.zone")}>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 px-3 overflow-hidden focus-within:border-sky-600 dark:focus-within:border-emerald-500 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:ring-2 focus-within:ring-sky-100 dark:focus-within:ring-emerald-900/40 transition">
                  <MapPin size={15} className="text-sky-600 dark:text-emerald-400 shrink-0 pointer-events-none" />
                  <select
                    className="flex-1 min-w-0 w-full py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none bg-transparent cursor-pointer font-semibold"
                    value={zona}
                    onChange={(e) => setZona(e.target.value)}
                  >
                    <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value="">{t("home.allZones")}</option>
                    {zones.map((z) => (
                      <option key={z} value={z} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{z}</option>
                    ))}
                  </select>
                </div>
              </Field>
            </div>
            <div className="flex-1 min-w-0">
              <Field label={t("home.from")}>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 px-3 overflow-hidden focus-within:border-sky-600 dark:focus-within:border-emerald-500 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:ring-2 focus-within:ring-sky-100 dark:focus-within:ring-emerald-900/40 transition">
                  <Calendar size={15} className="text-sky-600 dark:text-emerald-400 shrink-0 pointer-events-none" />
                  <input
                    type="date"
                    min={today()}
                    className="flex-1 min-w-0 w-full py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none bg-transparent cursor-pointer font-semibold"
                    value={dataFillimit}
                    onChange={(e) => changeFrom(e.target.value)}
                  />
                </div>
              </Field>
            </div>
            <ArrowRight size={18} className="hidden sm:block text-slate-300 mb-3 shrink-0" />
            <div className="flex-1 min-w-0">
              <Field label={t("home.to")}>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 px-3 overflow-hidden focus-within:border-sky-600 dark:focus-within:border-emerald-500 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:ring-2 focus-within:ring-sky-100 dark:focus-within:ring-emerald-900/40 transition">
                  <Calendar size={15} className="text-sky-600 dark:text-emerald-400 shrink-0 pointer-events-none" />
                  <input
                    type="date"
                    min={dataFillimit ? dayAfter(dataFillimit) : today()}
                    className="flex-1 min-w-0 w-full py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none bg-transparent cursor-pointer font-semibold"
                    value={dataPerfundimit}
                    onChange={(e) => changeTo(e.target.value)}
                  />
                </div>
              </Field>
            </div>
            <PrimaryButton onClick={onSearch} disabled={loading} className="sm:w-48 mb-3">{loading ? t("home.searching") : t("home.search")}</PrimaryButton>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">{t("home.exploreCities")}:</span>
        {FEATURED_DESTINATIONS.map(({ city }) => (
          <button
            key={city}
            onClick={() => goCity(city)}
            className="text-xs font-semibold text-sky-700 dark:text-emerald-300 bg-sky-50 dark:bg-emerald-900/30 border border-sky-200 dark:border-emerald-800 rounded-full px-3 py-1.5 hover:bg-sky-100 dark:hover:bg-emerald-900/50 transition"
          >
            {city}
          </button>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto">
        <div className="flex gap-3 w-max sm:w-full sm:grid sm:grid-cols-3 lg:grid-cols-6">
          {[
            { Icon: Lock, title: t("home.trustFeesTitle"), sub: t("home.trustFeesSub") },
            { Icon: RotateCcw, title: t("home.trustCancelTitle"), sub: t("home.trustCancelSub") },
            { Icon: ShieldCheck, title: t("home.trustSecureTitle"), sub: t("home.trustSecureSub") },
            { Icon: BadgeCheck, title: t("home.trustVerifiedTitle"), sub: t("home.trustVerifiedSub") },
            { Icon: Zap, title: t("home.trustClickTitle"), sub: t("home.trustClickSub") },
            { Icon: Clock, title: t("home.trustFastTitle"), sub: t("home.trustFastSub") },
          ].map(({ Icon, title, sub }, i) => (
            <div key={i} className="shrink-0 w-[180px] sm:w-auto flex flex-col gap-2.5 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-6 bg-white dark:bg-slate-800">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 dark:from-emerald-600 dark:to-teal-600 flex items-center justify-center shrink-0">
                <Icon size={22} className="text-white sm:hidden" />
                <Icon size={26} className="text-white hidden sm:block" />
              </div>
              <div className="min-w-0">
                <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">{title}</p>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-tight mt-0.5">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">{t("home.categoriesTitle")}</h2>
        <div className="flex flex-wrap gap-2">
          {CAR_CATEGORIES.map(({ key }) => (
            <button
              key={key}
              onClick={() => goCategory(key)}
              className="text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-full px-4 py-2 hover:border-sky-300 dark:hover:border-emerald-600 hover:text-sky-600 dark:hover:text-emerald-400 transition"
            >
              {t(`category.${key}`)}
            </button>
          ))}
        </div>
      </div>

      {(loadingFeatured || featuredCars.length > 0) && (
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={18} className="text-sky-600 dark:text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t("home.featuredTitle")}</h2>
          </div>
          {loadingFeatured ? (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-64 shrink-0 h-56 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {featuredCars.map((car) => (
                <div key={car.carId} className="w-64 shrink-0">
                  <CarCard
                    car={car}
                    onSelectCar={onSelectCar}
                    onSelectCompany={onSelectCompany}
                    isFavorited={favoriteIds?.has(car.carId)}
                    onToggleFavorite={onToggleFavorite}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-10">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">{t("home.destinationsTitle")}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{t("home.destinationsIntro")}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {FEATURED_DESTINATIONS.map(({ city, descKey }) => (
            <button
              key={city}
              onClick={() => goCity(city)}
              className="text-left border border-slate-200 dark:border-slate-700 rounded-2xl p-5 hover:border-sky-300 dark:hover:border-emerald-600 hover:shadow-sm transition bg-white dark:bg-slate-800"
            >
              <p className="font-bold text-slate-900 dark:text-slate-100">{city}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t(descKey)}</p>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-emerald-400 mt-3">
                {t("common.reserve")} <ArrowRight size={12} />
              </span>
            </button>
          ))}
        </div>
        <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2">{t("home.moreCities")}</p>
        <div className="flex flex-wrap gap-2">
          {otherCities.map(([city, slug]) => (
            <a
              key={slug}
              href={`/makina-me-qera-${slug}`}
              onClick={(e) => { e.preventDefault(); goCity(city); }}
              className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-emerald-600 rounded-full px-3 py-1.5 transition"
            >
              {city}
            </a>
          ))}
        </div>
      </div>

      {(loadingReviews || reviews.length > 0) && (
        <div className="mt-10">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">{t("home.reviewsTitle")}</h2>
          {loadingReviews ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[0, 1, 2].map((i) => <div key={i} className="h-36 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {reviews.map((r) => (
                <div key={r.reviewId} className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 bg-white dark:bg-slate-800 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={12} className={i < r.rating ? "text-amber-400 fill-amber-400" : "text-slate-200 dark:text-slate-700"} />
                      ))}
                    </div>
                    <Quote size={16} className="text-slate-200 dark:text-slate-700 shrink-0" />
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed flex-1">"{r.koment}"</p>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-3">{r.emri} {r.mbiemriInicial}. <span className="font-normal text-slate-400">· {r.companyEmri}</span></p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {(loadingCompanies || loop.length > 0) && (
        <div className="relative mt-10 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-cyan-50 dark:from-teal-950/40 dark:via-slate-800 dark:to-emerald-950/30" />

          <div className="relative p-6 sm:p-8">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">{t("home.verifiedBusinesses")}</p>
            {loadingCompanies ? (
              <div className="flex gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-11 w-36 rounded-xl bg-white/70 dark:bg-slate-900/50 animate-pulse flex-shrink-0" />
                ))}
              </div>
            ) : (
              <div className="overflow-hidden">
                <div className="flex gap-3 animate-marquee w-max">
                  {loop.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 border border-sky-100 dark:border-teal-800/50 rounded-xl px-4 py-3 bg-white/90 dark:bg-slate-900/70 backdrop-blur-sm flex-shrink-0 shadow-sm">
                      <ShieldCheck size={14} className="text-sky-600 dark:text-teal-400 flex-shrink-0" />
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">{c.emri}</span>
                      <span className="text-xs text-slate-400 whitespace-nowrap">· {c.qyteti}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-10" ref={faqRef}>
        <button
          type="button"
          onClick={() => setFaqSectionOpen((s) => !s)}
          className="w-full flex items-center justify-between gap-2 mb-4"
        >
          <div className="flex items-center gap-2">
            <HelpCircle size={18} className="text-sky-600 dark:text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t("home.faqTitle")}</h2>
          </div>
          <ChevronDown size={18} className={`text-slate-400 shrink-0 transition-transform ${faqSectionOpen ? "rotate-180" : ""}`} />
        </button>
        {faqSectionOpen && (
          <div className="flex flex-col gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => {
              const open = openFaqs.has(i);
              return (
                <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => setOpenFaqs((prev) => {
                      const next = new Set(prev);
                      if (next.has(i)) next.delete(i); else next.add(i);
                      return next;
                    })}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
                  >
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t(`home.faq${i}Q`)}</span>
                    <ChevronDown size={16} className={`text-slate-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
                  </button>
                  {open && (
                    <p className="px-4 pb-4 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{t(`home.faq${i}A`)}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
