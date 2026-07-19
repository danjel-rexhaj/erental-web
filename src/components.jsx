import { Car as CarIcon, CheckCircle2, AlertCircle } from "lucide-react";

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
