import { useMemo, useState, useEffect, useRef } from "react";
import { ChevronLeft, Search, Car as CarIcon, SlidersHorizontal, MapPin, X } from "lucide-react";
import { CarCard } from "../components";
import { CAR_CATEGORIES, CAR_BRANDS, CITY_SLUGS } from "../carData";
import { useLang } from "../useLang";

// Cars naturally arrive clustered by business (a business usually adds several cars in one
// sitting, so their car_ids land close together) -- shuffled here so results don't visually
// read as "one business's block, then the next's." Fisher-Yates, stable per `cars` reference
// via useMemo below so it doesn't re-shuffle (and jump around) on every filter/render.
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const categoryLabel = (key, t) => (CAR_CATEGORIES.some((c) => c.key === key) ? t(`category.${key}`) : key);
const BRAND_ORDER = Object.keys(CAR_BRANDS);
function sortByBrandPopularity(brands) {
  return [...brands].sort((a, b) => {
    const ia = BRAND_ORDER.indexOf(a), ib = BRAND_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

const selectClass = "w-full text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 outline-none focus:border-slate-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-sky-100 dark:focus:ring-emerald-900/40 transition";

// How many cards render at once -- the rest load in as the user scrolls near the bottom (see the
// IntersectionObserver below), instead of every matching car mounting into the DOM immediately.
const PAGE_SIZE = 24;

// Desktop sidebar renders each single-select filter as a radio list (rather than a <select>
// dropdown), one option always checked ("all" included) since the underlying filter state is a
// single value per field, not a multi-select set.
function FilterSection({ title, allLabel, options, value, onChange, scroll }) {
  return (
    <div className="py-3 border-b border-slate-100 dark:border-slate-800 first:pt-0 last:border-b-0">
      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">{title}</p>
      <div className={`flex flex-col gap-1.5 ${scroll ? "max-h-44 overflow-y-auto pr-1" : ""}`}>
        <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200 cursor-pointer">
          <input type="radio" checked={!value} onChange={() => onChange("")} className="accent-sky-600 dark:accent-emerald-500 shrink-0" />
          {allLabel}
        </label>
        {options.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200 cursor-pointer">
            <input type="radio" checked={value === opt.value} onChange={() => onChange(opt.value)} className="accent-sky-600 dark:accent-emerald-500 shrink-0" />
            <span className="truncate">{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function freeInLabel(lirohetMe, dataFillimit, t) {
  const days = Math.round((new Date(lirohetMe) - new Date(dataFillimit)) / 86400000);
  if (days <= 0) return t("results.freeToday");
  if (days === 1) return t("results.freeTomorrow");
  return t("results.freeInDays", { days });
}

export default function Results({ cars, dataFillimit, dataPerfundimit, onBack, onSelectCar, onSelectCompany, favoriteIds, onToggleFavorite, filters, setFilters, showFilters, setShowFilters, pageHeading, pageIntro, currentCity, goHash }) {
  const { t } = useLang();
  const shuffledCars = useMemo(() => shuffleArray(cars), [cars]);

  const brands = sortByBrandPopularity([...new Set(cars.map((c) => c.marka).filter(Boolean))]);
  const models = [...new Set(cars.filter((c) => !filters.marka || c.marka === filters.marka).map((c) => c.modeli).filter(Boolean))].sort();
  const categories = [...new Set(cars.map((c) => c.kategoria).filter(Boolean))].sort();
  const zones = [...new Set(cars.map((c) => c.company?.qyteti).filter(Boolean))].sort();
  const years = [...new Set(cars.map((c) => c.viti).filter(Boolean))].sort((a, b) => b - a);
  const businesses = [...new Map(cars.filter((c) => c.company).map((c) => [c.companyId, c.company.emri])).entries()].sort((a, b) => a[1].localeCompare(b[1]));

  const term = filters.search.trim().toLowerCase();
  let visibleCars = shuffledCars.filter((c) =>
    (!filters.marka || c.marka === filters.marka) &&
    (!filters.modeli || c.modeli === filters.modeli) &&
    (!filters.biznesi || String(c.companyId) === filters.biznesi) &&
    (!filters.karburanti || c.karburanti === filters.karburanti) &&
    (!filters.kategoria || c.kategoria === filters.kategoria) &&
    (!filters.zona || c.company?.qyteti === filters.zona) &&
    (!filters.vitiMin || c.viti >= Number(filters.vitiMin)) &&
    (!filters.vitiMax || c.viti <= Number(filters.vitiMax)) &&
    (!filters.cmimiMax || c.cmimiDites <= Number(filters.cmimiMax)) &&
    filters.amenities.every((key) => c.amenities?.includes(key)) &&
    (!term ||
      c.marka?.toLowerCase().includes(term) ||
      c.modeli?.toLowerCase().includes(term) ||
      c.company?.emri?.toLowerCase().includes(term))
  );
  if (filters.sort === "asc") visibleCars = [...visibleCars].sort((a, b) => a.cmimiDites - b.cmimiDites);
  if (filters.sort === "desc") visibleCars = [...visibleCars].sort((a, b) => b.cmimiDites - a.cmimiDites);

  // Resets back to the first page whenever the result set itself changes (new search, filter
  // change, or a fresh car list) so a narrower filter never leaves a stale, too-large count behind.
  const filterKey = JSON.stringify(filters);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [cars, filterKey]);

  const sentinelRef = useRef(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) setVisibleCount((c) => c + PAGE_SIZE); },
      { rootMargin: "600px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visibleCount, visibleCars.length]);

  const shownCars = visibleCars.slice(0, visibleCount);

  const grouped = visibleCars.reduce((acc, c) => {
    if (!acc[c.companyId]) acc[c.companyId] = { company: c.company, cars: [] };
    acc[c.companyId].cars.push(c);
    return acc;
  }, {});
  const companyGroups = Object.values(grouped);
  const activeFilterCount = ["marka", "modeli", "biznesi", "karburanti", "kategoria", "zona", "vitiMin", "vitiMax", "cmimiMax", "sort"].filter((k) => filters[k]).length + filters.amenities.length;

  // Radio-list filter sections, shared by the always-visible desktop sidebar and the full-screen
  // mobile filter modal -- no <select> dropdowns and no amenities on either surface, per request.
  const filterSections = (
    <>
      <FilterSection title={t("results.filterCategory")} allLabel={t("results.allCategories")} value={filters.kategoria} onChange={(v) => setFilters((f) => ({ ...f, kategoria: v }))} options={categories.map((k) => ({ value: k, label: categoryLabel(k, t) }))} />
      <FilterSection title={t("results.filterBrand")} allLabel={t("results.allBrands")} value={filters.marka} onChange={(v) => setFilters((f) => ({ ...f, marka: v, modeli: "" }))} options={brands.map((b) => ({ value: b, label: b }))} scroll />
      <FilterSection title={t("results.filterModel")} allLabel={t("results.allModels")} value={filters.modeli} onChange={(v) => setFilters((f) => ({ ...f, modeli: v }))} options={models.map((m) => ({ value: m, label: m }))} scroll />
      <FilterSection title={t("results.filterBusiness")} allLabel={t("results.allBusinesses")} value={filters.biznesi} onChange={(v) => setFilters((f) => ({ ...f, biznesi: v }))} options={businesses.map(([id, emri]) => ({ value: String(id), label: emri }))} scroll />
      <FilterSection title={t("results.filterZone")} allLabel={t("home.allZones")} value={filters.zona} onChange={(v) => setFilters((f) => ({ ...f, zona: v }))} options={zones.map((z) => ({ value: z, label: z }))} scroll />
      <FilterSection title={t("results.filterFuel")} allLabel={t("results.allFuels")} value={filters.karburanti} onChange={(v) => setFilters((f) => ({ ...f, karburanti: v }))} options={[
        { value: "diesel", label: "Diesel" },
        { value: "benzine", label: "Benzine" },
        { value: "hybrid", label: "Hybrid" },
        { value: "elektrik", label: "Elektrik" },
      ]} />

      <div className="py-3 border-b border-slate-100 dark:border-slate-800">
        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">{t("results.filterYear")}</p>
        <div className="flex items-center gap-2">
          <select
            value={filters.vitiMin}
            onChange={(e) => {
              const v = e.target.value;
              setFilters((f) => ({ ...f, vitiMin: v, vitiMax: f.vitiMax && v && Number(f.vitiMax) < Number(v) ? v : f.vitiMax }));
            }}
            className={selectClass}
          >
            <option value="">{t("results.yearFrom")}</option>
            {years.filter((y) => !filters.vitiMax || y <= Number(filters.vitiMax)).map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select
            value={filters.vitiMax}
            onChange={(e) => {
              const v = e.target.value;
              setFilters((f) => ({ ...f, vitiMax: v, vitiMin: f.vitiMin && v && Number(f.vitiMin) > Number(v) ? v : f.vitiMin }));
            }}
            className={selectClass}
          >
            <option value="">{t("results.yearTo")}</option>
            {years.filter((y) => !filters.vitiMin || y >= Number(filters.vitiMin)).map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="py-3 border-b border-slate-100 dark:border-slate-800">
        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">{t("results.filterPrice")}</p>
        <input
          type="number"
          min={0}
          value={filters.cmimiMax}
          onChange={(e) => setFilters((f) => ({ ...f, cmimiMax: e.target.value }))}
          placeholder={t("results.maxPricePlaceholder")}
          className={selectClass}
        />
      </div>

      <FilterSection title={t("common.sortBy")} allLabel={t("results.sortDefault")} value={filters.sort} onChange={(v) => setFilters((f) => ({ ...f, sort: v }))} options={[
        { value: "asc", label: t("common.priceAsc") },
        { value: "desc", label: t("common.priceDesc") },
      ]} />

      {activeFilterCount > 0 && (
        <button onClick={() => setFilters((f) => ({ ...f, marka: "", modeli: "", biznesi: "", karburanti: "", kategoria: "", zona: "", vitiMin: "", vitiMax: "", cmimiMax: "", amenities: [], sort: "" }))} className="text-xs text-slate-500 dark:text-slate-400 font-medium underline px-0 hover:text-slate-800 dark:hover:text-slate-200 mt-3">
          {t("common.clearFilters")}
        </button>
      )}
    </>
  );

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 mb-4 hover:text-slate-700 dark:hover:text-slate-200">
        <ChevronLeft size={16} /> {t("results.changeDates")}
      </button>

      {pageHeading && (
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1.5">{pageHeading}</h1>
          {pageIntro && <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl">{pageIntro}</p>}
        </div>
      )}

      <div className="lg:flex lg:items-start lg:gap-6">
        {/* Desktop: always-visible sidebar. Mobile: same sections open in a full-screen modal instead (below). */}
        <div className="hidden lg:block lg:w-64 shrink-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide mb-1 flex items-center gap-1.5">
            <SlidersHorizontal size={13} /> {t("common.filter")}{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </p>
          {filterSections}
        </div>

        <div className="flex-1 min-w-0">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 mb-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                  placeholder={t("results.searchPlaceholder")}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-slate-400 dark:focus:border-slate-500 transition"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowFilters((s) => !s)}
                className={`lg:hidden flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition ${
                  showFilters || activeFilterCount > 0
                    ? "border-sky-300 dark:border-emerald-600 text-sky-600 dark:text-emerald-400 bg-sky-50 dark:bg-emerald-900/20"
                    : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                }`}
              >
                <SlidersHorizontal size={13} /> {t("common.filter")}{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
              </button>
              {dataFillimit && dataPerfundimit && (
                <span className="text-xs text-slate-400 ml-auto whitespace-nowrap">{dataFillimit} → {dataPerfundimit}</span>
              )}
            </div>

            <p className="text-xs text-slate-400 mt-3">{t("results.availableCars", { count: visibleCars.filter((c) => c.eshteELire !== false).length })} · {t("results.businessCount", { count: companyGroups.length })}</p>
          </div>

          {showFilters && (
            <div className="lg:hidden fixed inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col">
              <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <SlidersHorizontal size={14} /> {t("common.filter")}{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                </p>
                <button onClick={() => setShowFilters(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4">
                {filterSections}
              </div>
              <div className="shrink-0 p-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setShowFilters(false)}
                  className="w-full text-sm font-semibold text-white bg-sky-600 dark:bg-emerald-600 hover:bg-sky-700 dark:hover:bg-emerald-700 rounded-xl py-3 transition"
                >
                  {t("results.viewResultsButton", { count: visibleCars.length })}
                </button>
              </div>
            </div>
          )}

          {visibleCars.length === 0 && (
            <div className="text-center py-16">
              <CarIcon size={28} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">{t("results.noResults")}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {shownCars.map((car) => (
              <CarCard
                key={car.carId}
                car={car}
                onSelectCar={onSelectCar}
                onSelectCompany={onSelectCompany}
                nearMiss={car.eshteELire === false}
                freeInLabel={car.eshteELire === false ? freeInLabel(car.lirohetMe, dataFillimit, t) : null}
                isFavorited={favoriteIds?.has(car.carId)}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>

          {visibleCount < visibleCars.length && (
            <div ref={sentinelRef} className="flex justify-center py-6">
              <p className="text-xs text-slate-400">{t("common.loading")}</p>
            </div>
          )}

          <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
              {currentCity ? t("results.seoTitleCity", { city: currentCity }) : t("results.seoTitleGeneric")}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed">
              {currentCity ? t("results.seoBodyCity", { city: currentCity }) : t("results.seoBodyGeneric")}
            </p>

            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-6 mb-3">{t("results.citiesTitle")}</h3>
            <div className="flex flex-wrap gap-2">
              {Object.keys(CITY_SLUGS).filter((city) => city !== currentCity).map((city) => (
                <a
                  key={city}
                  href={`/makina-me-qera-${CITY_SLUGS[city]}`}
                  onClick={(e) => { e.preventDefault(); goHash?.(`/makina-me-qera-${CITY_SLUGS[city]}`); }}
                  className="flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-full hover:border-sky-300 dark:hover:border-emerald-600 hover:text-sky-600 dark:hover:text-emerald-400 transition"
                >
                  <MapPin size={11} /> {city}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
