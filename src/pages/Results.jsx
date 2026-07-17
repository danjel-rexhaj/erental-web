import { useState } from "react";
import { ChevronLeft, Search, Building2, ShieldCheck, Fuel, Gauge, Users as UsersIcon, Car as CarIcon } from "lucide-react";
import { CarPhoto, inputClass } from "../components";

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

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 mb-4"><ChevronLeft size={16} /> Ndrysho datat</button>

      <div className="flex flex-wrap items-center gap-2 mb-6 pb-4 border-b border-slate-200">
        <span className="text-xs text-slate-400 mr-1 hidden sm:inline">{dataFillimit} → {dataPerfundimit}</span>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            placeholder="Kerko makine ose biznes..."
            className={`${inputClass} !w-56 !py-2 pl-7 text-xs`}
          />
        </div>
        <select value={filters.marka} onChange={(e) => setFilters((f) => ({ ...f, marka: e.target.value }))} className="text-xs font-medium border border-slate-200 rounded-lg px-3 py-2 text-slate-700 bg-white">
          <option value="">Te gjitha markat</option>
          {brands.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={filters.karburanti} onChange={(e) => setFilters((f) => ({ ...f, karburanti: e.target.value }))} className="text-xs font-medium border border-slate-200 rounded-lg px-3 py-2 text-slate-700 bg-white capitalize">
          <option value="">Te gjitha karburantet</option>
          <option value="diesel">Diesel</option>
          <option value="benzine">Benzine</option>
          <option value="hybrid">Hybrid</option>
          <option value="elektrik">Elektrik</option>
        </select>
        <select value={filters.kategoria} onChange={(e) => setFilters((f) => ({ ...f, kategoria: e.target.value }))} className="text-xs font-medium border border-slate-200 rounded-lg px-3 py-2 text-slate-700 bg-white capitalize">
          <option value="">Te gjitha kategorite</option>
          {categories.map((k) => <option key={k} value={k} className="capitalize">{k}</option>)}
        </select>
        <select value={filters.sort} onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))} className="text-xs font-medium border border-slate-200 rounded-lg px-3 py-2 text-slate-700 bg-white">
          <option value="">Rendit sipas</option>
          <option value="asc">Cmimi: me i ulet</option>
          <option value="desc">Cmimi: me i larte</option>
        </select>
        {(filters.search || filters.marka || filters.karburanti || filters.kategoria || filters.sort) && (
          <button onClick={() => setFilters({ search: "", marka: "", karburanti: "", kategoria: "", sort: "" })} className="text-xs text-emerald-700 font-medium underline px-2">
            Pastro filtrat
          </button>
        )}
        <span className="text-xs text-slate-400 ml-auto">{visibleCars.length} makina · {companyGroups.length} biznese</span>
      </div>

      {visibleCars.length === 0 && (
        <div className="text-center py-16">
          <CarIcon size={28} className="mx-auto text-slate-300 mb-2" />
          <p className="text-sm text-slate-500">Asnje makine e lire per keto data/filtra.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleCars.map((car) => (
          <button key={car.carId} onClick={() => onSelectCar(car)} className="text-left rounded-2xl border border-slate-200 overflow-hidden hover:border-emerald-600 hover:shadow-md transition bg-white">
            <div className="relative">
              <CarPhoto car={car} />
              <span className="absolute top-2 left-2 text-[10px] font-semibold uppercase tracking-wide bg-white/90 text-slate-700 px-2 py-1 rounded-lg backdrop-blur-sm">
                {car.kategoria}
              </span>
            </div>
            <div className="p-3">
              <div className="flex items-start justify-between">
                <p className="font-semibold text-slate-900 text-sm">{car.marka} {car.modeli}</p>
                <span className="text-xs font-bold text-white bg-emerald-700 px-2 py-1 rounded-lg whitespace-nowrap">{car.cmimiDites}€/dite</span>
              </div>
              <span
                onClick={(e) => { e.stopPropagation(); onSelectCompany(car.companyId); }}
                className="text-xs text-slate-500 hover:text-emerald-700 hover:underline flex items-center gap-1 mt-1 w-fit cursor-pointer"
              >
                <Building2 size={11} /> {car.company?.emri}
                {car.company?.eshteVerifikuar && <ShieldCheck size={11} className="text-emerald-600" />}
              </span>
              <div className="flex gap-3 mt-2 text-[11px] text-slate-400">
                <span className="flex items-center gap-1"><Fuel size={12} />{car.karburanti}</span>
                <span className="flex items-center gap-1"><Gauge size={12} />{car.transmisioni}</span>
                <span className="flex items-center gap-1"><UsersIcon size={12} />{car.numriVendeve}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
