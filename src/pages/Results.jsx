import { useState } from "react";
import { ChevronLeft, Search, Building2, ShieldCheck, Fuel, Gauge, Users as UsersIcon, Car as CarIcon, SlidersHorizontal, Clock, Star } from "lucide-react";
import { CarPhoto } from "../components";

const selectClass = "text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 outline-none focus:border-slate-400 dark:focus:border-slate-500 transition";

function freeInLabel(lirohetMe, dataFillimit) {
  const days = Math.round((new Date(lirohetMe) - new Date(dataFillimit)) / 86400000);
  if (days <= 0) return "Lirohet sot";
  if (days === 1) return "Lirohet neser";
  return `Lirohet pas ${days} ditesh`;
}

export default function Results({ cars, dataFillimit, dataPerfundimit, onBack, onSelectCar, onSelectCompany }) {
  const [filters, setFilters] = useState({ search: "", marka: "", karburanti: "", kategoria: "", sort: "" });

  const brands = [...new Set(cars.map((c) => c.marka).filter(Boolean))].sort();
  const categories = [...new Set(cars.map((c) => c.kategoria).filter(Boolean))].sort();

  const term = filters.search.trim().toLowerCase();
  let visibleCars = cars.filter((c) =>
    (!filters.marka || c.marka === filters.marka) &&
    (!filters.karburanti || c.karburanti === filters.karburanti) &&
    (!filters.kategoria || c.kategoria === filters.kategoria) &&
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
  const hasFilters = filters.search || filters.marka || filters.karburanti || filters.kategoria || filters.sort;

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 mb-4 hover:text-slate-700 dark:hover:text-slate-200">
        <ChevronLeft size={16} /> Ndrysho datat
      </button>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 mb-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <SlidersHorizontal size={14} className="text-slate-400" />
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Filtro</span>
          <span className="text-xs text-slate-400 ml-auto">{dataFillimit} → {dataPerfundimit}</span>
        </div>

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
          <select value={filters.marka} onChange={(e) => setFilters((f) => ({ ...f, marka: e.target.value }))} className={selectClass}>
            <option value="">Te gjitha markat</option>
            {brands.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={filters.karburanti} onChange={(e) => setFilters((f) => ({ ...f, karburanti: e.target.value }))} className={`${selectClass} capitalize`}>
            <option value="">Te gjitha karburantet</option>
            <option value="diesel">Diesel</option>
            <option value="benzine">Benzine</option>
            <option value="hybrid">Hybrid</option>
            <option value="elektrik">Elektrik</option>
          </select>
          <select value={filters.kategoria} onChange={(e) => setFilters((f) => ({ ...f, kategoria: e.target.value }))} className={`${selectClass} capitalize`}>
            <option value="">Te gjitha kategorite</option>
            {categories.map((k) => <option key={k} value={k} className="capitalize">{k}</option>)}
          </select>
          <select value={filters.sort} onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))} className={selectClass}>
            <option value="">Rendit sipas</option>
            <option value="asc">Cmimi: me i ulet</option>
            <option value="desc">Cmimi: me i larte</option>
          </select>
          {hasFilters && (
            <button onClick={() => setFilters({ search: "", marka: "", karburanti: "", kategoria: "", sort: "" })} className="text-xs text-slate-500 dark:text-slate-400 font-medium underline px-2 hover:text-slate-800 dark:hover:text-slate-200">
              Pastro filtrat
            </button>
          )}
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
        {visibleCars.map((car) => {
          const nearMiss = car.eshteELire === false;
          return (
          <button
            key={car.carId}
            onClick={() => onSelectCar(car)}
            className={`text-left rounded-2xl border overflow-hidden hover:shadow-md transition bg-white dark:bg-slate-800 ${nearMiss ? "border-amber-200 dark:border-amber-800/60" : "border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500"}`}
          >
            <div className={`relative ${nearMiss ? "opacity-70 grayscale-[30%]" : ""}`}>
              <CarPhoto car={car} />
              <span className="absolute top-2 left-2 text-[10px] font-semibold uppercase tracking-wide bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 px-2 py-1 rounded-lg backdrop-blur-sm">
                {car.kategoria}
              </span>
              {nearMiss && (
                <span className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-semibold bg-amber-500 text-white px-2 py-1 rounded-lg">
                  <Clock size={11} /> {freeInLabel(car.lirohetMe, dataFillimit)}
                </span>
              )}
            </div>
            <div className="p-3">
              <div className="flex items-start justify-between">
                <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{car.marka} {car.modeli}</p>
                <span className="text-xs font-bold text-white bg-slate-900 dark:bg-slate-700 px-2 py-1 rounded-lg whitespace-nowrap">{car.cmimiDites}€/dite</span>
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span
                  onClick={(e) => { e.stopPropagation(); onSelectCompany(car.companyId); }}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:underline flex items-center gap-1 w-fit cursor-pointer"
                >
                  <Building2 size={11} /> {car.company?.emri}
                  {car.company?.eshteVerifikuar && <ShieldCheck size={11} className="text-emerald-600" />}
                </span>
                {car.company?.avgRating != null && (
                  <span className="flex items-center gap-0.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                    <Star size={11} className="text-amber-400 fill-amber-400" /> {car.company.avgRating}
                    <span className="text-slate-400 dark:text-slate-500 font-normal">({car.company.reviewCount})</span>
                  </span>
                )}
              </div>
              <div className="flex gap-3 mt-2 text-[11px] text-slate-400">
                <span className="flex items-center gap-1"><Fuel size={12} />{car.karburanti}</span>
                <span className="flex items-center gap-1"><Gauge size={12} />{car.transmisioni}</span>
                <span className="flex items-center gap-1"><UsersIcon size={12} />{car.numriVendeve}</span>
              </div>
            </div>
          </button>
          );
        })}
      </div>
    </div>
  );
}
