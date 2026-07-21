import { useState, useEffect, useRef } from "react";
import { Car as CarIcon, CheckCircle2, AlertCircle, MapPin, Search, Crosshair, ChevronLeft, ChevronRight, Download, Building2, ShieldCheck, Star, Fuel, Gauge, Users as UsersIcon, Clock, Heart } from "lucide-react";
import { decodeJwt } from "./api";
import { generateInvoicePdf } from "./invoicePdf";

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

function isoDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// Interactive booking calendar: red = booked, green = the currently selected range.
// Click a day to start a range, click a later free day to complete it; clicking a booked
// day is ignored, and picking past a booked gap simply restarts the selection at that day.
export function DateRangeCalendar({ ranges = [], selFrom, selTo, onSelect }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const viewDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const startWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  function isBooked(day) {
    const d = new Date(year, month, day);
    return ranges.some((r) => {
      const s = new Date(r.dataFillimit);
      const e = new Date(r.dataPerfundimit);
      return d >= new Date(s.getFullYear(), s.getMonth(), s.getDate()) && d < new Date(e.getFullYear(), e.getMonth(), e.getDate());
    });
  }

  function isPast(day) {
    return new Date(year, month, day) < today;
  }

  function isSelected(day) {
    if (!selFrom) return false;
    const d = isoDate(year, month, day);
    if (!selTo) return d === selFrom;
    return d >= selFrom && d <= selTo;
  }

  function hasBookedBetween(fromDate, toDateVal) {
    const cur = new Date(fromDate);
    while (cur <= toDateVal) {
      if (ranges.some((r) => {
        const s = new Date(r.dataFillimit);
        const e = new Date(r.dataPerfundimit);
        return cur >= new Date(s.getFullYear(), s.getMonth(), s.getDate()) && cur < new Date(e.getFullYear(), e.getMonth(), e.getDate());
      })) return true;
      cur.setDate(cur.getDate() + 1);
    }
    return false;
  }

  function clickDay(day) {
    if (isPast(day) || isBooked(day)) return;
    const clicked = new Date(year, month, day);
    const clickedIso = isoDate(year, month, day);

    if (!selFrom || selTo) {
      onSelect(clickedIso, null);
      return;
    }
    const start = new Date(selFrom);
    if (clicked <= start || hasBookedBetween(start, clicked)) {
      onSelect(clickedIso, null);
      return;
    }
    onSelect(selFrom, clickedIso);
  }

  const cells = Array(startWeekday).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={() => setMonthOffset((m) => m - 1)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"><ChevronLeft size={14} /></button>
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{MUAJT_KAL[month]} {year}</p>
        <button type="button" onClick={() => setMonthOffset((m) => m + 1)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"><ChevronRight size={14} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {DITET_KAL.map((d, i) => <span key={i} className="text-[10px] text-slate-400">{d}</span>)}
        {cells.map((day, i) => {
          if (day == null) return <span key={i} />;
          const booked = isBooked(day);
          const past = isPast(day);
          const selected = isSelected(day);
          return (
            <button
              type="button"
              key={i}
              onClick={() => clickDay(day)}
              disabled={booked || past}
              className={`text-[11px] h-7 flex items-center justify-center rounded-lg transition ${
                selected
                  ? "bg-emerald-500 text-white font-semibold"
                  : booked
                    ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 font-semibold cursor-not-allowed"
                    : past
                      ? "text-slate-300 dark:text-slate-700 cursor-not-allowed"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-3 mt-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-red-100 dark:bg-red-900/40 border border-red-200 dark:border-red-800" />
          <span className="text-[10px] text-slate-400">E zene</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
          <span className="text-[10px] text-slate-400">Zgjedhur</span>
        </div>
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

export function PaymentSuccessModal({ car, dataFillimit, dataPerfundimit, successInfo, token, onClose }) {
  const confirmim = `ER-${String(successInfo.bookingId).padStart(6, "0")}`;

  async function downloadInvoice() {
    const dite = Math.max(1, Math.round((new Date(dataPerfundimit) - new Date(dataFillimit)) / 86400000));
    await generateInvoicePdf({
      bookingId: successInfo.bookingId,
      carMakeModel: `${car.marka} ${car.modeli}`,
      dataFillimit,
      dataPerfundimit,
      cmimiPerDite: car.cmimiDites,
      dite,
      totalPrice: dite * car.cmimiDites,
      amountPaid: successInfo.amountPaid,
      eshtePagesePlote: successInfo.method === "paypal_full",
      clientLabel: decodeJwt(token)?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] || "",
      company: car.company,
      cardLast4: successInfo.cardLast4,
    });
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 size={28} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="text-lg font-bold text-center text-slate-900 dark:text-slate-100 mb-1">Pagesa u krye ✓</h3>
        <p className="text-sm text-center text-slate-500 dark:text-slate-400 mb-4">Rezervimi yt per {car.marka} {car.modeli} u konfirmua.</p>

        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 mb-4 text-xs space-y-1.5">
          <div className="flex justify-between"><span className="text-slate-400">Konfirmimi</span><span className="font-semibold text-slate-900 dark:text-slate-100">{confirmim}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Datat</span><span className="font-semibold text-slate-900 dark:text-slate-100">{dataFillimit} → {dataPerfundimit}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Shuma e paguar</span><span className="font-semibold text-emerald-700 dark:text-emerald-400">{successInfo.amountPaid}€</span></div>
        </div>

        <button
          onClick={downloadInvoice}
          className="w-full flex items-center justify-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 mb-2 hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          <Download size={15} /> Shkarko faturen
        </button>
        <PrimaryButton onClick={onClose}>Kthehu</PrimaryButton>
      </div>
    </div>
  );
}

export function CarPhoto({ car }) {
  const photos = (car.carPhotos || []).filter(Boolean);
  const main = photos.find((p) => p.eshteKryesore) || photos[0];
  if (main?.urlFotos) {
    return <img src={main.urlFotos} alt={`${car.marka} ${car.modeli}`} className="w-full h-36 object-cover rounded-t-2xl bg-slate-100 dark:bg-slate-800" />;
  }
  return <div className="w-full h-36 rounded-t-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><CarIcon size={32} className="text-slate-300 dark:text-slate-600" /></div>;
}

export function CarCard({ car, onSelectCar, onSelectCompany, nearMiss, freeInLabel, showCompany = true, isFavorited, onToggleFavorite }) {
  return (
    <div
      onClick={() => onSelectCar(car)}
      onKeyDown={(e) => { if (e.key === "Enter") onSelectCar(car); }}
      role="button"
      tabIndex={0}
      className={`text-left rounded-2xl border overflow-hidden hover:shadow-md transition bg-white dark:bg-slate-800 cursor-pointer ${nearMiss ? "border-amber-200 dark:border-amber-800/60" : "border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500"}`}
    >
      <div className={`relative ${nearMiss ? "opacity-70 grayscale-[30%]" : ""}`}>
        <CarPhoto car={car} />
        <span className="absolute top-2 left-2 text-[10px] font-semibold uppercase tracking-wide bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 px-2 py-1 rounded-lg backdrop-blur-sm">
          {car.kategoria}
        </span>
        {nearMiss && freeInLabel && (
          <span className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-semibold bg-amber-500 text-white px-2 py-1 rounded-lg">
            <Clock size={11} /> {freeInLabel}
          </span>
        )}
        {onToggleFavorite && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(car); }}
            className={`absolute right-2 w-7 h-7 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm flex items-center justify-center hover:scale-110 active:scale-95 transition ${nearMiss && freeInLabel ? "top-10" : "top-2"}`}
            title={isFavorited ? "Hiq nga te preferuarat" : "Shto te preferuarat"}
          >
            <Heart size={15} className={isFavorited ? "text-red-500 fill-red-500" : "text-slate-500 dark:text-slate-300"} />
          </button>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between">
          <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{car.marka} {car.modeli}</p>
          <span className="text-xs font-bold text-white bg-slate-900 dark:bg-slate-700 px-2 py-1 rounded-lg whitespace-nowrap">{car.cmimiDites}€/dite</span>
        </div>
        {showCompany && (
          <span
            onClick={(e) => { e.stopPropagation(); onSelectCompany(car.companyId); }}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:underline flex items-center gap-1 mt-1 w-fit cursor-pointer"
          >
            <Building2 size={11} /> {car.company?.emri}
            {car.company?.eshteVerifikuar && <ShieldCheck size={11} className="text-emerald-600" />}
            {car.company?.avgRating != null && (
              <span className="flex items-center gap-0.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 ml-1">
                <Star size={11} className="text-amber-400 fill-amber-400" /> {car.company.avgRating} <span className="text-slate-400 dark:text-slate-500 font-normal">({car.company.reviewCount})</span>
              </span>
            )}
          </span>
        )}
        <div className="flex items-center justify-between mt-2">
          <div className="flex gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1"><Fuel size={12} />{car.karburanti}</span>
            <span className="flex items-center gap-1"><Gauge size={12} />{car.transmisioni}</span>
            <span className="flex items-center gap-1"><UsersIcon size={12} />{car.numriVendeve}</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onSelectCar(car); }}
            className="text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1.5 rounded-lg transition"
          >
            Rezervo
          </button>
        </div>
      </div>
    </div>
  );
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

const TIRANA = [41.3275, 19.8189];

function loadLeaflet(onReady) {
  if (window.L) { onReady(); return; }
  if (!document.getElementById("leaflet-css")) {
    const link = document.createElement("link");
    link.id = "leaflet-css";
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
  }
  let script = document.getElementById("leaflet-js");
  if (!script) {
    script = document.createElement("script");
    script.id = "leaflet-js";
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    document.body.appendChild(script);
  }
  script.addEventListener("load", onReady);
  return () => script.removeEventListener("load", onReady);
}

export function LocationPicker({ adresa, qyteti, coords, onChange, showError }) {
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState([adresa, qyteti].filter(Boolean).join(", "));
  const [results, setResults] = useState([]);
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => loadLeaflet(() => {
    if (!mapElRef.current || mapRef.current || !window.L) return;
    const start = coords ? [coords.latitude, coords.longitude] : TIRANA;
    const map = window.L.map(mapElRef.current).setView(start, coords ? 15 : 12);
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);
    const marker = window.L.marker(start, { draggable: true }).addTo(map);
    marker.on("dragend", () => {
      const { lat, lng } = marker.getLatLng();
      onChange({ latitude: lat, longitude: lng });
    });
    map.on("click", (e) => {
      marker.setLatLng(e.latlng);
      onChange({ latitude: e.latlng.lat, longitude: e.latlng.lng });
    });
    mapRef.current = map;
    markerRef.current = marker;
  }), []);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !coords) return;
    const latlng = [coords.latitude, coords.longitude];
    markerRef.current.setLatLng(latlng);
    mapRef.current.setView(latlng, 15);
  }, [coords]);

  async function searchAddress() {
    if (!query.trim()) { showError(new Error("Shkruaj diçka per te kerkuar.")); return; }
    setBusy(true);
    setResults([]);
    try {
      const q = encodeURIComponent(query);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=al&q=${q}`);
      const data = await res.json();
      if (!data.length) { showError(new Error("Nuk u gjet asgje me kete emer. Provo tjeter, ose kliko direkt ne harte per te vendosur piken.")); return; }
      setResults(data);
    } catch (e) { showError(e); } finally { setBusy(false); }
  }

  function pickResult(r) {
    onChange({ latitude: parseFloat(r.lat), longitude: parseFloat(r.lon) });
    setResults([]);
  }

  function useGps() {
    if (!navigator.geolocation) { showError(new Error("Shfletuesi yt nuk mbeshtet vendndodhjen.")); return; }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { onChange({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }); setBusy(false); },
      () => { showError(new Error("Nuk u lejua akses ne vendndodhje.")); setBusy(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const btnClass = "flex items-center justify-center gap-1.5 text-xs font-semibold rounded-xl px-3 py-2.5 border transition border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 shrink-0";

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); searchAddress(); } }}
          placeholder="Plaza Tirane, Rruga Kavajes..."
          className="flex-1 min-w-0 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-teal-600"
        />
        <button type="button" onClick={searchAddress} disabled={busy} className={btnClass}>
          <Search size={13} /> {busy ? "..." : "Kerko"}
        </button>
        <button type="button" onClick={useGps} disabled={busy} className={btnClass}>
          <Crosshair size={13} /> GPS
        </button>
      </div>
      {results.length > 0 && (
        <div className="mt-1 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          {results.map((r, i) => (
            <button key={i} type="button" onClick={() => pickResult(r)} className="block w-full text-left px-3 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
              {r.display_name}
            </button>
          ))}
        </div>
      )}
      <p className="text-[10px] text-slate-400 mt-1">Kerko me emer/adrese, ose kliko/terhiq piken direkt ne harte per ta vendosur vete.</p>
      <div ref={mapElRef} className="mt-2 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 h-52" />
      {coords && (
        <p className="flex items-center gap-1 text-[11px] text-teal-700 dark:text-teal-400 font-medium mt-1"><MapPin size={11} /> Vendndodhja u vendos</p>
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
