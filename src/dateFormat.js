const MONTHS = {
  sq: ["Janar", "Shkurt", "Mars", "Prill", "Maj", "Qershor", "Korrik", "Gusht", "Shtator", "Tetor", "Nentor", "Dhjetor"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  de: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
  fr: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
  it: ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"],
  tr: ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"],
  el: ["Ιανουάριος", "Φεβρουάριος", "Μάρτιος", "Απρίλιος", "Μάιος", "Ιούνιος", "Ιούλιος", "Αύγουστος", "Σεπτέμβριος", "Οκτώβριος", "Νοέμβριος", "Δεκέμβριος"],
};

const MONTHS_SHORT = {
  sq: ["Jan", "Shk", "Mar", "Pri", "Maj", "Qer", "Kor", "Gsh", "Sht", "Tet", "Nen", "Dhj"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  de: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"],
  fr: ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."],
  it: ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"],
  tr: ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"],
  el: ["Ιαν", "Φεβ", "Μαρ", "Απρ", "Μαΐ", "Ιουν", "Ιουλ", "Αυγ", "Σεπ", "Οκτ", "Νοε", "Δεκ"],
};

const WEEKDAY_INITIALS = {
  sq: ["H", "M", "M", "E", "P", "S", "D"],
  en: ["M", "T", "W", "T", "F", "S", "S"],
  de: ["M", "D", "M", "D", "F", "S", "S"],
  fr: ["L", "M", "M", "J", "V", "S", "D"],
  it: ["L", "M", "M", "G", "V", "S", "D"],
  tr: ["P", "S", "Ç", "P", "C", "C", "P"],
  el: ["Δ", "Τ", "Τ", "Π", "Π", "Σ", "Κ"],
};

const DATE_LOCALES = { sq: "sq-AL", en: "en-GB", de: "de-DE", fr: "fr-FR", it: "it-IT", tr: "tr-TR", el: "el-GR" };

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
  return d.toLocaleDateString(DATE_LOCALES[lang] || "sq-AL");
}
