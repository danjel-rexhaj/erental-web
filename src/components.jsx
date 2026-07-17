import { Car as CarIcon } from "lucide-react";

export const inputClass = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100 transition";

export function Notice({ notice, onClose }) {
  if (!notice) return null;
  const isError = notice.type === "error";
  return (
    <div
      style={{ background: isError ? "#FEF2F2" : "#F1F5F9", border: `1px solid ${isError ? "#FCA5A5" : "#CBD5E1"}`, color: isError ? "#B91C1C" : "#0F172A" }}
      className="mx-4 mt-3 rounded-xl px-3 py-2 text-sm flex items-start justify-between gap-2"
    >
      <span>{notice.text}</span>
      <button onClick={onClose} className="text-xs opacity-60 hover:opacity-100">✕</button>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <span className="block text-xs font-medium text-slate-500 mb-1">{label}</span>
      {children}
    </label>
  );
}

export function PrimaryButton({ children, className = "", ...props }) {
  return <button {...props} className={`w-full rounded-xl bg-emerald-700 text-white text-sm font-semibold py-2.5 hover:bg-emerald-800 active:scale-[0.99] transition disabled:opacity-50 disabled:pointer-events-none ${className}`}>{children}</button>;
}

export function GhostButton({ children, className = "", ...props }) {
  return <button {...props} className={`w-full rounded-xl border border-slate-200 text-slate-700 text-sm font-medium py-2.5 hover:bg-slate-50 active:scale-[0.99] transition disabled:opacity-50 ${className}`}>{children}</button>;
}

export function CarPhoto({ car }) {
  const photos = (car.carPhotos || []).filter(Boolean);
  const main = photos.find((p) => p.eshteKryesore) || photos[0];
  if (main?.urlFotos) {
    return <img src={main.urlFotos} alt={`${car.marka} ${car.modeli}`} className="w-full h-36 object-cover rounded-t-2xl bg-slate-100" />;
  }
  return <div className="w-full h-36 rounded-t-2xl bg-slate-100 flex items-center justify-center"><CarIcon size={32} className="text-slate-300" /></div>;
}

export function StatusPill({ status }) {
  const map = {
    pending: { bg: "#FEF3C7", text: "#92400E", label: "Ne pritje" },
    confirmed: { bg: "#DCFCE7", text: "#166534", label: "Konfirmuar" },
    completed: { bg: "#F1F5F9", text: "#334155", label: "Perfunduar" },
    cancelled: { bg: "#FEE2E2", text: "#991B1B", label: "Anuluar" },
  };
  const s = map[status] || { bg: "#F1F5F9", text: "#475569", label: status };
  return <span style={{ background: s.bg, color: s.text }} className="text-[11px] font-semibold px-2 py-0.5 rounded-full">{s.label}</span>;
}

export function Spec({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
      <Icon size={15} className="text-slate-400" />
      <div>
        <p className="text-[10px] text-slate-400 leading-none mb-0.5">{label}</p>
        <p className="text-xs font-medium text-slate-700 leading-none capitalize">{value}</p>
      </div>
    </div>
  );
}
