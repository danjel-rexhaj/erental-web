import { ChevronLeft, Search, Car as CarIcon, SlidersHorizontal, Check } from "lucide-react";
import { CarCard } from "../components";
import { CAR_CATEGORIES, AMENITIES, CAR_BRANDS } from "../carData";

const categoryLabel = (key) => CAR_CATEGORIES.find((c) => c.key === key)?.label || key;
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

const selectClass = "w-full text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 outline-none focus:border-slate-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/40 transition";

function freeInLabel(lirohetMe, dataFillimit) {
  const days = Math.round((new Date(lirohetMe) - new Date(dataFillimit)) / 86400000);
  if (days <= 0) return "Lirohet sot";
  if (days === 1) return "Lirohet neser";
  return `Lirohet pas ${days} ditesh`;
}

export default function Results({ cars, dataFillimit, dataPerfundimit, onBack, onSelectCar, onSelectCompany, favoriteIds, onToggleFavorite, filters, setFilters, showFilters, setShowFilters }) {

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
  let visibleCars = cars.filter((c) =>
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
        <ChevronLeft size={16} /> Ndrysho datat
      </button>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 mb-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              placeholder="Kerko makine ose biznes..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-slate-400 dark:focus:border-slate-500 transition"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((s) => !s)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition ${
              showFilters || activeFilterCount > 0
                ? "border-emerald-300 dark:border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
            }`}
          >
            <SlidersHorizontal size={13} /> Filtro{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </button>
          <span className="text-xs text-slate-400 ml-auto whitespace-nowrap">{dataFillimit} → {dataPerfundimit}</span>
        </div>

        <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${showFilters ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0"}`}>
          <div className="overflow-hidden">
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                <select value={filters.marka} onChange={(e) => setFilters((f) => ({ ...f, marka: e.target.value, modeli: "" }))} className={selectClass}>
                  <option value="">Te gjitha markat</option>
                  {brands.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
                <select value={filters.modeli} onChange={(e) => setFilters((f) => ({ ...f, modeli: e.target.value }))} className={selectClass}>
                  <option value="">Te gjitha modelet</option>
                  {models.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <select value={filters.biznesi} onChange={(e) => setFilters((f) => ({ ...f, biznesi: e.target.value }))} className={selectClass}>
                  <option value="">Te gjitha bizneset</option>
                  {businesses.map(([id, emri]) => <option key={id} value={id}>{emri}</option>)}
                </select>
                <select value={filters.zona} onChange={(e) => setFilters((f) => ({ ...f, zona: e.target.value }))} className={selectClass}>
                  <option value="">Te gjitha zonat</option>
                  {zones.map((z) => <option key={z} value={z}>{z}</option>)}
                </select>
                <select value={filters.karburanti} onChange={(e) => setFilters((f) => ({ ...f, karburanti: e.target.value }))} className={`${selectClass} capitalize`}>
                  <option value="">Te gjitha karburantet</option>
                  <option value="diesel">Diesel</option>
                  <option value="benzine">Benzine</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="elektrik">Elektrik</option>
                </select>
                <select value={filters.kategoria} onChange={(e) => setFilters((f) => ({ ...f, kategoria: e.target.value }))} className={selectClass}>
                  <option value="">Te gjitha kategorite</option>
                  {categories.map((k) => <option key={k} value={k}>{categoryLabel(k)}</option>)}
                </select>
                <select value={filters.vitiMin} onChange={(e) => setFilters((f) => ({ ...f, vitiMin: e.target.value }))} className={selectClass}>
                  <option value="">Viti nga</option>
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <select value={filters.vitiMax} onChange={(e) => setFilters((f) => ({ ...f, vitiMax: e.target.value }))} className={selectClass}>
                  <option value="">Viti deri</option>
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <input
                  type="number"
                  min={0}
                  value={filters.cmimiMax}
                  onChange={(e) => setFilters((f) => ({ ...f, cmimiMax: e.target.value }))}
                  placeholder="Cmimi max/dite €"
                  className={selectClass}
                />
                <select value={filters.sort} onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))} className={selectClass}>
                  <option value="">Rendit sipas</option>
                  <option value="asc">Cmimi: me i ulet</option>
                  <option value="desc">Cmimi: me i larte</option>
                </select>
              </div>

              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mt-4 mb-1.5">Pajisje</p>
              <div className="flex flex-wrap gap-1.5">
                {AMENITIES.map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => toggleAmenity(a.key)}
                    className={`flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-full border transition ${
                      filters.amenities.includes(a.key)
                        ? "border-emerald-300 dark:border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                        : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                  >
                    {filters.amenities.includes(a.key) && <Check size={11} />} {a.label}
                  </button>
                ))}
              </div>

              {activeFilterCount > 0 && (
                <button onClick={() => setFilters((f) => ({ ...f, marka: "", modeli: "", biznesi: "", karburanti: "", kategoria: "", zona: "", vitiMin: "", vitiMax: "", cmimiMax: "", amenities: [], sort: "" }))} className="text-xs text-slate-500 dark:text-slate-400 font-medium underline px-0 hover:text-slate-800 dark:hover:text-slate-200 mt-3">
                  Pastro filtrat
                </button>
              )}
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-3">{visibleCars.filter((c) => c.eshteELire !== false).length} makina te lira · {companyGroups.length} biznese</p>
      </div>

      {visibleCars.length === 0 && (
        <div className="text-center py-16">
          <CarIcon size={28} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Asnje makine e lire per keto data/filtra.</p>
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
            freeInLabel={car.eshteELire === false ? freeInLabel(car.lirohetMe, dataFillimit) : null}
            isFavorited={favoriteIds?.has(car.carId)}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
    </div>
  );
}
