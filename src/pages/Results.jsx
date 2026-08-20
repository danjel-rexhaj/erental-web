import { useMemo } from "react";
import { ChevronLeft, Search, Car as CarIcon, SlidersHorizontal } from "lucide-react";
import { CarCard, AmenityPicker } from "../components";
import { CAR_CATEGORIES, CAR_BRANDS } from "../carData";
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

function freeInLabel(lirohetMe, dataFillimit, t) {
  const days = Math.round((new Date(lirohetMe) - new Date(dataFillimit)) / 86400000);
  if (days <= 0) return t("results.freeToday");
  if (days === 1) return t("results.freeTomorrow");
  return t("results.freeInDays", { days });
}

export default function Results({ cars, dataFillimit, dataPerfundimit, onBack, onSelectCar, onSelectCompany, favoriteIds, onToggleFavorite, filters, setFilters, showFilters, setShowFilters }) {
  const { t } = useLang();
  const shuffledCars = useMemo(() => shuffleArray(cars), [cars]);

  const brands = sortByBrandPopularity([...new Set(cars.map((c) => c.marka).filter(Boolean))]);
  const models = [...new Set(cars.filter((c) => !filters.marka || c.marka === filters.marka).map((c) => c.modeli).filter(Boolean))].sort();
  const categories = [...new Set(cars.map((c) => c.kategoria).filter(Boolean))].sort();
  const zones = [...new Set(cars.map((c) => c.company?.qyteti).filter(Boolean))].sort();
  const years = [...new Set(cars.map((c) => c.viti).filter(Boolean))].sort((a, b) => b - a);
  const businesses = [...new Map(cars.filter((c) => c.company).map((c) => [c.companyId, c.company.emri])).entries()].sort((a, b) => a[1].localeCompare(b[1]));

  function toggleAmenity(key) {
    setFilters((f) => ({
      ...f,
      amenities: f.amenities.includes(key) ? f.amenities.filter((k) => k !== key) : [...f.amenities, key],
    }));
  }

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

  const grouped = visibleCars.reduce((acc, c) => {
    if (!acc[c.companyId]) acc[c.companyId] = { company: c.company, cars: [] };
    acc[c.companyId].cars.push(c);
    return acc;
  }, {});
  const companyGroups = Object.values(grouped);
  const activeFilterCount = ["marka", "modeli", "biznesi", "karburanti", "kategoria", "zona", "vitiMin", "vitiMax", "cmimiMax", "sort"].filter((k) => filters[k]).length + filters.amenities.length;

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 mb-4 hover:text-slate-700 dark:hover:text-slate-200">
        <ChevronLeft size={16} /> {t("results.changeDates")}
      </button>

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
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition ${
              showFilters || activeFilterCount > 0
                ? "border-sky-300 dark:border-emerald-600 text-sky-600 dark:text-emerald-400 bg-sky-50 dark:bg-emerald-900/20"
                : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
            }`}
          >
            <SlidersHorizontal size={13} /> {t("common.filter")}{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </button>
          <span className="text-xs text-slate-400 ml-auto whitespace-nowrap">{dataFillimit} → {dataPerfundimit}</span>
        </div>

        <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${showFilters ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0"}`}>
          <div className="overflow-hidden">
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                <select value={filters.marka} onChange={(e) => setFilters((f) => ({ ...f, marka: e.target.value, modeli: "" }))} className={selectClass}>
                  <option value="">{t("results.allBrands")}</option>
                  {brands.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
                <select value={filters.modeli} onChange={(e) => setFilters((f) => ({ ...f, modeli: e.target.value }))} className={selectClass}>
                  <option value="">{t("results.allModels")}</option>
                  {models.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <select value={filters.biznesi} onChange={(e) => setFilters((f) => ({ ...f, biznesi: e.target.value }))} className={selectClass}>
                  <option value="">{t("results.allBusinesses")}</option>
                  {businesses.map(([id, emri]) => <option key={id} value={id}>{emri}</option>)}
                </select>
                <select value={filters.zona} onChange={(e) => setFilters((f) => ({ ...f, zona: e.target.value }))} className={selectClass}>
                  <option value="">{t("home.allZones")}</option>
                  {zones.map((z) => <option key={z} value={z}>{z}</option>)}
                </select>
                <select value={filters.karburanti} onChange={(e) => setFilters((f) => ({ ...f, karburanti: e.target.value }))} className={`${selectClass} capitalize`}>
                  <option value="">{t("results.allFuels")}</option>
                  <option value="diesel">Diesel</option>
                  <option value="benzine">Benzine</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="elektrik">Elektrik</option>
                </select>
                <select value={filters.kategoria} onChange={(e) => setFilters((f) => ({ ...f, kategoria: e.target.value }))} className={selectClass}>
                  <option value="">{t("results.allCategories")}</option>
                  {categories.map((k) => <option key={k} value={k}>{categoryLabel(k, t)}</option>)}
                </select>
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
                <input
                  type="number"
                  min={0}
                  value={filters.cmimiMax}
                  onChange={(e) => setFilters((f) => ({ ...f, cmimiMax: e.target.value }))}
                  placeholder={t("results.maxPricePlaceholder")}
                  className={selectClass}
                />
                <select value={filters.sort} onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))} className={selectClass}>
                  <option value="">{t("common.sortBy")}</option>
                  <option value="asc">{t("common.priceAsc")}</option>
                  <option value="desc">{t("common.priceDesc")}</option>
                </select>
              </div>

              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mt-4 mb-1.5">{t("common.amenities")}</p>
              <AmenityPicker selected={filters.amenities} onToggle={toggleAmenity} />

              {activeFilterCount > 0 && (
                <button onClick={() => setFilters((f) => ({ ...f, marka: "", modeli: "", biznesi: "", karburanti: "", kategoria: "", zona: "", vitiMin: "", vitiMax: "", cmimiMax: "", amenities: [], sort: "" }))} className="text-xs text-slate-500 dark:text-slate-400 font-medium underline px-0 hover:text-slate-800 dark:hover:text-slate-200 mt-3">
                  {t("common.clearFilters")}
                </button>
              )}
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-3">{t("results.availableCars", { count: visibleCars.filter((c) => c.eshteELire !== false).length })} · {t("results.businessCount", { count: companyGroups.length })}</p>
      </div>

      {visibleCars.length === 0 && (
        <div className="text-center py-16">
          <CarIcon size={28} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
          <p className="text-sm text-slate-500 dark:text-slate-400">{t("results.noResults")}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleCars.map((car) => (
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
    </div>
  );
}
