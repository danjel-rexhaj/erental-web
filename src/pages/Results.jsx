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

export default function Results({ cars, dataFillimit, dataPerfundimit, onBack, onSelectCar, onSelectCompany, favoriteIds, onToggleFavorite, filters, setFilters, showFilters, setShowFilters, pageHeading, pageIntro }) {
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

  // Mobile-only dropdown version, rendered inside the collapsible toggle panel below. Desktop uses
  // `desktopFilterFields` (radio-list sections in the sidebar) instead -- kept unchanged per request.
  const filterFields = (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2">
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
    </>
  );

  // Desktop-only: the same filters as `filterFields`, but as always-visible radio-list sections
  // instead of <select> dropdowns, per explicit request. Mobile keeps the dropdown version above.
  const desktopFilterFields = (
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
        {/* Desktop: always-visible sidebar. Mobile keeps the toggle+collapsible panel below instead. */}
        <div className="hidden lg:block lg:w-64 shrink-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide mb-1 flex items-center gap-1.5">
            <SlidersHorizontal size={13} /> {t("common.filter")}{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </p>
          {desktopFilterFields}
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

            <div className={`lg:hidden grid transition-[grid-template-rows,opacity] duration-300 ease-out ${showFilters ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0"}`}>
              <div className="overflow-hidden">
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  {filterFields}
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
      </div>
    </div>
  );
}
