export function LogoMark({ size = 40, className = "text-slate-900 dark:text-white" }) {
  const w = size * 1.7;
  return (
    <svg width={w} height={size} viewBox="0 0 115 60" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M8,46 C13,29 24,16 40,12 C51,9 66,9 77,12 C93,16 104,28 109,44"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M8,46 L109,44" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" />
      <circle cx="34" cy="49" r="6.5" fill="currentColor" />
      <circle cx="85" cy="47" r="6.5" fill="currentColor" />
    </svg>
  );
}

export function Logo({ size = 40, textClassName = "text-slate-900 dark:text-white" }) {
  return (
    <div className="flex items-center gap-2" translate="no">
      <LogoMark size={size} className={textClassName} />
      <span className="font-bold tracking-tight" style={{ fontSize: size * 0.5 }}>
        <span className="text-amber-500">E</span>
        <span className={textClassName}>Rental</span>
      </span>
    </div>
  );
}
