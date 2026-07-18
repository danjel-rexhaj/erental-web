import { useId } from "react";

export function LogoMark({ size = 40 }) {
  const gradId = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2dd4bf" />
          <stop offset="100%" stopColor="#0f766e" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="49" fill={`url(#${gradId})`} />
      <text x="50" y="65" textAnchor="middle" fontFamily="'Alex Brush', cursive" fontSize="52" fill="#ffffff">ER</text>
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
