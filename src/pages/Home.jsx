import { useState, useEffect } from "react";
import { ShieldCheck, Calendar, ArrowRight } from "lucide-react";
import { apiFetch } from "../api";
import { Field, PrimaryButton } from "../components";

export default function Home({ dataFillimit, setDataFillimit, dataPerfundimit, setDataPerfundimit, onSearch, loading }) {
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    apiFetch("/Companies", null).then((data) => {
      setCompanies(data.filter((c) => c.eshteVerifikuar));
    }).catch(() => {});
  }, []);

  const loop = companies.length > 0 ? [...companies, ...companies] : [];

  return (
    <div>
      <div className="relative rounded-3xl overflow-hidden min-h-[560px] sm:min-h-[520px]">
        <img
          src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1600&auto=format&fit=crop"
          alt="Makine ne rruge"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
        <div className="relative flex flex-col justify-end min-h-[560px] sm:min-h-[520px] p-6 sm:p-12">
          <span className="inline-flex items-center gap-1.5 text-emerald-300 text-xs font-semibold tracking-wide uppercase bg-emerald-900/40 border border-emerald-400/30 rounded-full px-3 py-1.5 w-fit mb-4 backdrop-blur-sm">
            ERental Albania
          </span>
          <h1 className="text-white text-3xl sm:text-5xl font-bold tracking-tight max-w-xl">
            Merr makinen qe te duhet, kur te duhet.
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mt-3 max-w-lg">
            Platforma e pare shqiptare ku krahason dhe rezervon makinen tende me qera brenda sekondave — pa kosto te fshehura.
          </p>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 mt-8 w-full max-w-2xl flex flex-col sm:flex-row sm:items-end gap-3 shadow-2xl">
            <div className="flex-1 min-w-0">
              <Field label="Nga">
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 px-3 overflow-hidden focus-within:border-emerald-600 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:ring-2 focus-within:ring-emerald-100 dark:focus-within:ring-emerald-900/40 transition">
                  <Calendar size={15} className="text-emerald-600 shrink-0 pointer-events-none" />
                  <input
                    type="date"
                    className="flex-1 min-w-0 w-full py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none bg-transparent cursor-pointer font-semibold"
                    value={dataFillimit}
                    onChange={(e) => setDataFillimit(e.target.value)}
                  />
                </div>
              </Field>
            </div>
            <ArrowRight size={18} className="hidden sm:block text-slate-300 mb-3 shrink-0" />
            <div className="flex-1 min-w-0">
              <Field label="Deri">
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 px-3 overflow-hidden focus-within:border-emerald-600 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:ring-2 focus-within:ring-emerald-100 dark:focus-within:ring-emerald-900/40 transition">
                  <Calendar size={15} className="text-emerald-600 shrink-0 pointer-events-none" />
                  <input
                    type="date"
                    className="flex-1 min-w-0 w-full py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none bg-transparent cursor-pointer font-semibold"
                    value={dataPerfundimit}
                    onChange={(e) => setDataPerfundimit(e.target.value)}
                  />
                </div>
              </Field>
            </div>
            <PrimaryButton onClick={onSearch} disabled={loading} className="sm:w-48 mb-3">{loading ? "Duke kerkuar..." : "Kerko makina"}</PrimaryButton>
          </div>
        </div>
      </div>

      {loop.length > 0 && (
        <div className="relative mt-10 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700">
          <div className="absolute inset-0 bg-slate-50 dark:bg-slate-800" />

          <div className="relative p-6 sm:p-8">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">Bizneset e verifikuara ne ERental</p>
            <div className="overflow-hidden">
              <div className="flex gap-3 animate-marquee w-max">
                {loop.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 bg-white/90 dark:bg-slate-900/70 backdrop-blur-sm flex-shrink-0 shadow-sm">
                    <ShieldCheck size={14} className="text-emerald-600 flex-shrink-0" />
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">{c.emri}</span>
                    <span className="text-xs text-slate-400 whitespace-nowrap">· {c.qyteti}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
