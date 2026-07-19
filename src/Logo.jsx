export function Logo({ size = 44, variant = "auto" }) {
  const cls = "w-auto object-contain";
  if (variant === "dark") {
    return <img src="/logo-dark.png" alt="ERental" height={size} style={{ height: size }} className={cls} translate="no" />;
  }
  if (variant === "light") {
    return <img src="/logo-light.png" alt="ERental" height={size} style={{ height: size }} className={cls} translate="no" />;
  }
  return (
    <span translate="no">
      <img src="/logo-light.png" alt="ERental" height={size} style={{ height: size }} className={`${cls} dark:hidden`} />
      <img src="/logo-dark.png" alt="ERental" height={size} style={{ height: size }} className={`${cls} hidden dark:block`} />
    </span>
  );
}
