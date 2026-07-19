import { useState } from "react";
import { Car as CarIcon, CheckCircle2, AlertCircle, MapPin, Search, Crosshair, ChevronLeft, ChevronRight } from "lucide-react";
import { mapEmbedUrl } from "./api";

const MUAJT_KAL = ["Janar", "Shkurt", "Mars", "Prill", "Maj", "Qershor", "Korrik", "Gusht", "Shtator", "Tetor", "Nentor", "Dhjetor"];
const DITET_KAL = ["H", "M", "M", "E", "P", "S", "D"];

export function AvailabilityCalendar({ ranges = [] }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const today = new Date();
  const viewDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const startWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  function isBooked(day) {
    const d = new Date(year, month, day);
    return ranges.some((r) => {
      const start = new Date(r.dataFillimit);
      const end = new Date(r.dataPerfundimit);
      const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      return d >= s && d < e;
    });
  }

  const cells = Array(startWeekday).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 max-w-xs">
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={() => setMonthOffset((m) => m - 1)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"><ChevronLeft size={14} /></button>
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{MUAJT_KAL[month]} {year}</p>
        <button type="button" onClick={() => setMonthOffset((m) => m + 1)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"><ChevronRight size={14} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {DITET_KAL.map((d, i) => <span key={i} className="text-[10px] text-slate-400">{d}</span>)}
        {cells.map((day, i) => (
          <span
            key={i}
            className={`text-[11px] h-7 flex items-center justify-center rounded-lg ${
              day == null ? "" : isBooked(day)
                ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 font-semibold"
                : "text-slate-600 dark:text-slate-300"
            }`}
          >
            {day || ""}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-2">
        <span className="w-2.5 h-2.5 rounded bg-red-100 dark:bg-red-900/40 border border-red-200 dark:border-red-800" />
        <span className="text-[10px] text-slate-400">E zene</span>
      </div>
    </div>
  );
}

export const inputClass = "w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/40 transition";

export function Notice({ notice, onClose }) {
  if (!notice) return null;
  const isError = notice.type === "error";
  const Icon = isError ? AlertCircle : CheckCircle2;
  return (
    <div className="fixed top-4 inset-x-4 sm:inset-x-auto sm:right-4 sm:left-auto z-[100] sm:max-w-sm pointer-events-none">
      <div
        key={notice.text + notice.type}
        className={`animate-toast-in pointer-events-auto rounded-2xl px-4 py-3 text-sm font-medium flex items-start gap-2.5 border shadow-lg backdrop-blur-sm ${
          isError
            ? "bg-red-50/95 dark:bg-red-950/90 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300"
            : "bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
        }`}
      >
        <Icon size={18} className="shrink-0 mt-0.5" />
        <span className="flex-1">{notice.text}</span>
        <button onClick={onClose} className="text-xs opacity-50 hover:opacity-100 shrink-0 mt-0.5">✕</button>
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</span>
      {children}
    </label>
  );
}

export function PrimaryButton({ children, className = "", ...props }) {
  return <button {...props} className={`w-full rounded-xl bg-emerald-700 text-white text-sm font-semibold py-2.5 hover:bg-emerald-800 active:scale-[0.99] transition disabled:opacity-50 disabled:pointer-events-none ${className}`}>{children}</button>;
}

export function GhostButton({ children, className = "", ...props }) {
  return <button {...props} className={`w-full rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.99] transition disabled:opacity-50 ${className}`}>{children}</button>;
}

export function CarPhoto({ car }) {
  const photos = (car.carPhotos || []).filter(Boolean);
  const main = photos.find((p) => p.eshteKryesore) || photos[0];
  if (main?.urlFotos) {
    return <img src={main.urlFotos} alt={`${car.marka} ${car.modeli}`} className="w-full h-36 object-cover rounded-t-2xl bg-slate-100 dark:bg-slate-800" />;
  }
  return <div className="w-full h-36 rounded-t-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><CarIcon size={32} className="text-slate-300 dark:text-slate-600" /></div>;
}

export function StatusPill({ status }) {
  const map = {
    pending: { cls: "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300", label: "Ne pritje" },
    confirmed: { cls: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300", label: "Konfirmuar" },
    completed: { cls: "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300", label: "Perfunduar" },
    cancelled: { cls: "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300", label: "Anuluar" },
  };
  const s = map[status] || { cls: "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300", label: status };
  return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>;
}

export function LocationPicker({ adresa, qyteti, coords, onChange, showError }) {
  const [busy, setBusy] = useState(null);

  async function searchAddress() {
    if (!adresa && !qyteti) { showError(new Error("Shkruaj adresen ose qytetin fillimisht.")); return; }
    setBusy("search");
    try {
      const q = encodeURIComponent(`${adresa ? adresa + ", " : ""}${qyteti}, Shqiperi`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`);
      const data = await res.json();
      if (!data.length) throw new Error("Nuk u gjet adresa. Provo ta shkruash me saktesi, ose perdor GPS.");
      onChange({ latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) });
    } catch (e) { showError(e); } finally { setBusy(null); }
  }

  function useGps() {
    if (!navigator.geolocation) { showError(new Error("Shfletuesi yt nuk mbeshtet vendndodhjen.")); return; }
    setBusy("gps");
    navigator.geolocation.getCurrentPosition(
      (pos) => { onChange({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }); setBusy(null); },
      () => { showError(new Error("Nuk u lejua akses ne vendndodhje.")); setBusy(null); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const btnClass = "flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-xl px-3 py-2.5 border transition border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50";

  return (
    <div>
      <div className="flex gap-2">
        <button type="button" onClick={searchAddress} disabled={busy !== null} className={btnClass}>
          <Search size={13} /> {busy === "search" ? "Duke kerkuar..." : "Gjej nga adresa"}
        </button>
        <button type="button" onClick={useGps} disabled={busy !== null} className={btnClass}>
          <Crosshair size={13} /> {busy === "gps" ? "Duke marre..." : "Perdor GPS"}
        </button>
      </div>
      <p className="text-[10px] text-slate-400 mt-1">"Gjej nga adresa" eshte me e sakte. GPS-i i kompjuterit mund te gaboje (VPN, WiFi) — kontrollo piken poshte para se te ruash.</p>
      {coords && (
        <div className="mt-2">
          <div className="rounded-xl overflow-hidden border border-teal-200 dark:border-teal-800">
            <iframe title="Pamje paraprake" src={mapEmbedUrl(coords.latitude, coords.longitude)} className="w-full h-36 border-0" loading="lazy" />
          </div>
          <p className="flex items-center gap-1 text-[11px] text-teal-700 dark:text-teal-400 font-medium mt-1"><MapPin size={11} /> Nese pika s'duket ne vendin e sakte, provo "Gjej nga adresa"</p>
        </div>
      )}
    </div>
  );
}

export function Spec({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2">
      <Icon size={15} className="text-slate-400" />
      <div>
        <p className="text-[10px] text-slate-400 leading-none mb-0.5">{label}</p>
        <p className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-none capitalize">{value}</p>
      </div>
    </div>
  );
}
