import { useId } from "react";

export function LogoMark({ size = 40 }) {
  const gradId = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="96" height="96" rx="26" fill={`url(#${gradId})`} />
      <text x="50" y="67" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="800" fontSize="44" letterSpacing="-2" fill="#ffffff">ER</text>
    </svg>
  );
}

export function Logo({ size = 40, textClassName = "text-slate-900 dark:text-slate-100" }) {
  return (
    <div className="flex items-center gap-2.5" translate="no">
      <LogoMark size={size} />
      <span className={`font-bold tracking-tight ${textClassName}`} style={{ fontSize: size * 0.5 }}>
        ERental
      </span>
    </div>
  );
}
