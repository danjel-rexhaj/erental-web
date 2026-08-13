const MONTHS = {
  sq: ["Janar", "Shkurt", "Mars", "Prill", "Maj", "Qershor", "Korrik", "Gusht", "Shtator", "Tetor", "Nentor", "Dhjetor"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};

const MONTHS_SHORT = {
  sq: ["Jan", "Shk", "Mar", "Pri", "Maj", "Qer", "Kor", "Gsh", "Sht", "Tet", "Nen", "Dhj"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

const WEEKDAY_INITIALS = {
  sq: ["H", "M", "M", "E", "P", "S", "D"],
  en: ["M", "T", "W", "T", "F", "S", "S"],
};

export function monthName(monthIndex, lang) {
  return MONTHS[lang]?.[monthIndex] ?? MONTHS.sq[monthIndex];
}

export function monthShort(monthIndex, lang) {
  return MONTHS_SHORT[lang]?.[monthIndex] ?? MONTHS_SHORT.sq[monthIndex];
}

export function weekdayInitials(lang) {
  return WEEKDAY_INITIALS[lang] ?? WEEKDAY_INITIALS.sq;
}

export function formatLocaleDate(date, lang) {
  const d = new Date(date);
  if (isNaN(d)) return String(date);
  return d.toLocaleDateString(lang === "en" ? "en-GB" : "sq-AL");
}
