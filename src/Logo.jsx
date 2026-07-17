export function LogoMark({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="46" stroke="#0F172A" strokeWidth="5" fill="white" />
      <text x="24" y="67" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" fontSize="52" fill="#0F172A">E</text>
      <text x="44" y="67" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" fontSize="52" fill="#0F172A">R</text>
    </svg>
  );
}

export function Logo({ size = 40, textClassName = "text-slate-900" }) {
  return (
    <div className="flex items-center gap-2.5" translate="no">
      <LogoMark size={size} />
      <span className={`font-bold tracking-tight ${textClassName}`} style={{ fontSize: size * 0.5 }}>
        ERental
      </span>
    </div>
  );
}
