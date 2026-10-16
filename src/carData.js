export const OTHER_BRAND = "Tjeter";
export const OTHER_MODEL = "Tjeter";

// Per-day markup built into the customer-facing price — must match PlatformMarkup in both
// PaymentsController.cs and BookingsController.cs. Business sets their rate; customer sees rate + PLATFORM_MARKUP.
export const PLATFORM_MARKUP = 5;

// Ordered by how common each brand is on Albanian roads (Mercedes-Benz/VW/BMW/Audi's
// dominance there is well known, not from a formal registry dataset), so the most
// relevant options are at the top of the dropdown instead of alphabetical/random order.
export const CAR_BRANDS = {
  "Mercedes-Benz": ["A-Class", "B-Class", "C-Class", "C-Class Coupe", "C-Class Cabrio", "CLA", "CLA Shooting Brake", "CLK", "CLS", "E-Class", "E-Class Coupe", "E-Class Cabrio", "S-Class", "S-Class Coupe", "Maybach S-Class", "190", "SLK", "SLC", "SL", "AMG GT", "G-Class", "GLA", "GLB", "GLC", "GLC Coupe", "GLE", "GLE Coupe", "GLK", "GLS", "ML", "GL", "R-Class", "X-Class", "EQA", "EQB", "EQC", "EQE", "EQE SUV", "EQS", "EQS SUV", "EQV", "V-Class", "Viano", "Vito", "Citan", "Sprinter", "A-Class Sedan", "CLE", "CLE Cabrio", "CL-Class", "CLC", "AMG GT 4-Door", "SLS AMG", "SLR McLaren", "G-Class Electric", "Maybach GLS", "Maybach EQS SUV", "EQT", "T-Class", "Vaneo", "MB100", "eVito", "eSprinter", "eCitan", "W123", "W124"],
  "Volkswagen": ["Golf", "Golf 3", "Golf 4", "Golf 5", "Golf 6", "Golf 7", "Golf 8", "Golf Plus", "Golf Variant", "Golf Sportsvan", "Golf GTI", "Golf R", "Polo", "Lupo", "Fox", "Up!", "Beetle", "New Beetle", "Scirocco", "Eos", "Jetta", "Bora", "Vento", "Passat", "Passat Variant", "Passat CC", "CC", "Arteon", "Phaeton", "Touran", "Sharan", "Caddy", "T-Cross", "T-Roc", "Taigo", "Tiguan", "Tiguan Allspace", "Touareg", "ID.3", "ID.4", "ID.5", "ID.7", "ID. Buzz", "Amarok", "Transporter", "Caravelle", "Multivan", "California", "Crafter"],
  "BMW": ["Seria 1", "Seria 2", "Seria 2 Active Tourer", "Seria 2 Gran Tourer", "Seria 2 Gran Coupe", "Seria 3", "Seria 3 Touring", "Seria 3 Gran Turismo", "Seria 4", "Seria 4 Gran Coupe", "Seria 5", "Seria 5 Touring", "Seria 5 Gran Turismo", "Seria 6", "Seria 6 Gran Turismo", "Seria 7", "Seria 8", "X1", "X2", "X3", "X4", "X5", "X6", "X7", "XM", "Z3", "Z4", "M2", "M3", "M4", "M5", "M8", "X3 M", "X4 M", "X5 M", "X6 M", "i3", "i4", "i5", "i7", "iX", "iX1", "iX2", "iX3"],
  "Audi": ["A1", "A2", "A3", "A3 Sportback", "A3 Sedan", "A3 Cabrio", "A4", "A4 Avant", "A4 Allroad", "A5", "A5 Sportback", "A5 Cabrio", "A6", "A6 Avant", "A6 Allroad", "A7", "A8", "80", "100", "TT", "R8", "Q2", "Q3", "Q3 Sportback", "Q4 e-tron", "Q5", "Q5 Sportback", "Q6 e-tron", "Q7", "Q8", "e-tron", "Q8 e-tron", "e-tron GT", "S3", "S4", "S5", "S6", "S7", "S8", "SQ5", "SQ7", "SQ8", "RS3", "RS4", "RS5", "RS6", "RS7", "RS Q3", "RS Q8"],
  "Toyota": ["Aygo", "Aygo X", "Yaris", "Yaris Cross", "Auris", "Corolla", "Corolla Cross", "Corolla Verso", "Verso", "Avensis", "Camry", "Prius", "Prius+", "C-HR", "RAV4", "Highlander", "Urban Cruiser", "Land Cruiser", "Land Cruiser Prado", "Hilux", "Supra", "GT86", "GR86", "bZ4X", "Proace", "Proace City", "Hiace"],
  "Opel": ["Adam", "Agila", "Karl", "Tigra", "Corsa", "Astra", "Vectra", "Signum", "Insignia", "Omega", "Meriva", "Zafira", "Zafira Life", "Combo", "Mokka", "Crossland", "Grandland", "Antara", "Frontera", "Ampera", "Vivaro", "Movano"],
  "Ford": ["Ka", "Ka+", "Fiesta", "Fusion", "Focus", "Mondeo", "B-Max", "C-Max", "S-Max", "Galaxy", "EcoSport", "Puma", "Kuga", "Edge", "Explorer", "Mustang", "Mustang Mach-E", "Ranger", "Tourneo Connect", "Tourneo Custom", "Transit", "Transit Connect", "Transit Custom"],
  "Fiat": ["500", "500C", "500e", "500L", "500X", "600", "Panda", "Punto", "Grande Punto", "Punto Evo", "Tipo", "Bravo", "Stilo", "Linea", "Sedici", "Multipla", "Qubo", "Fiorino", "Doblo", "Freemont", "Fullback", "Scudo", "Talento", "Ducato"],
  "Renault": ["Twingo", "Clio", "Zoe", "Modus", "Megane", "Megane E-Tech", "Fluence", "Symbol", "Laguna", "Talisman", "Scenic", "Grand Scenic", "Espace", "Captur", "Kadjar", "Austral", "Arkana", "Rafale", "Koleos", "Kangoo", "Trafic", "Master"],
  "Peugeot": ["106", "107", "108", "206", "207", "208", "e-208", "301", "306", "307", "308", "407", "408", "508", "607", "1007", "2008", "e-2008", "3008", "4007", "5008", "RCZ", "Bipper", "Partner", "Rifter", "Expert", "Traveller", "Boxer"],
  "Skoda": ["Citigo", "Fabia", "Felicia", "Rapid", "Scala", "Octavia", "Superb", "Roomster", "Yeti", "Kamiq", "Karoq", "Kodiaq", "Enyaq", "Elroq"],
  "Hyundai": ["i10", "i20", "i30", "i40", "Atos", "Getz", "Accent", "Elantra", "Avante", "Sonata", "Grandeur", "Genesis", "Veloster", "Matrix", "ix20", "ix35", "ix55", "Bayon", "Venue", "Kona", "Creta", "Tucson", "Santa Fe", "Palisade", "Ioniq", "Ioniq 5", "Ioniq 6", "H-1", "Staria"],
  "Kia": ["Picanto", "Morning", "Ray", "Rio", "Ceed", "ProCeed", "XCeed", "Cerato", "K3", "Optima", "K5", "K7", "K8", "Stinger", "Soul", "Venga", "Carens", "Carnival", "Stonic", "Niro", "Seltos", "Sportage", "Sorento", "Mohave", "EV3", "EV6", "EV9"],
  "Nissan": ["Micra", "Note", "Almera", "Tiida", "Pulsar", "Primera", "Leaf", "Juke", "Qashqai", "Qashqai+2", "X-Trail", "Murano", "Pathfinder", "Patrol", "Ariya", "Navara", "NV200", "Primastar", "350Z", "370Z", "GT-R"],
  "Honda": ["Jazz", "City", "Civic", "Insight", "Accord", "FR-V", "HR-V", "ZR-V", "CR-V", "e:Ny1", "Pilot", "S2000"],
  "Mazda": ["Mazda2", "Mazda3", "Mazda5", "Mazda6", "CX-3", "CX-30", "CX-5", "CX-60", "CX-7", "CX-80", "CX-9", "MX-30", "MX-5", "RX-8"],
  "Citroen": ["C1", "C2", "C3", "C3 Aircross", "C3 Picasso", "C4", "C4 Cactus", "C4 Picasso", "C4 Grand Picasso", "C4 X", "C5", "C5 Aircross", "C5 X", "C6", "C-Elysee", "C-Crosser", "Saxo", "Xsara", "Xsara Picasso", "Berlingo", "Jumpy", "SpaceTourer", "Jumper"],
  "Dacia": ["Sandero", "Sandero Stepway", "Logan", "Logan MCV", "Duster", "Bigster", "Jogger", "Lodgy", "Dokker", "Spring"],
  "Seat": ["Mii", "Ibiza", "Cordoba", "Leon", "Toledo", "Altea", "Exeo", "Arona", "Ateca", "Tarraco", "Alhambra"],
  "Volvo": ["C30", "S40", "S60", "S80", "S90", "V40", "V50", "V60", "V70", "V90", "XC40", "XC60", "XC70", "XC90", "C40", "EX30", "EX40", "EX90"],
  "Jeep": ["Avenger", "Renegade", "Compass", "Patriot", "Cherokee", "Grand Cherokee", "Commander", "Wrangler", "Gladiator"],
  "Land Rover": ["Defender", "Discovery", "Discovery Sport", "Freelander", "Range Rover", "Range Rover Sport", "Range Rover Velar", "Range Rover Evoque"],
  "Mini": ["Cooper", "Cooper S", "John Cooper Works", "Convertible", "Clubman", "Countryman", "Paceman", "Aceman"],
  "Porsche": ["911", "718 Boxster", "718 Cayman", "Boxster", "Cayman", "Cayenne", "Cayenne Coupe", "Macan", "Panamera", "Taycan"],
  "Lexus": ["CT", "IS", "ES", "GS", "LS", "RC", "LC", "LBX", "UX", "NX", "RX", "RZ", "LX"],
  "Mitsubishi": ["Space Star", "Colt", "Lancer", "ASX", "Eclipse Cross", "Outlander", "Pajero", "Pajero Sport", "L200", "i-MiEV"],
  "Suzuki": ["Alto", "Celerio", "Ignis", "Splash", "Swift", "Baleno", "SX4", "S-Cross", "Vitara", "Grand Vitara", "Jimny", "Across", "Swace"],
  "Chevrolet": ["Spark", "Matiz", "Aveo", "Kalos", "Lacetti", "Cruze", "Epica", "Malibu", "Orlando", "Trax", "Captiva", "Tahoe", "Camaro"],
  "Alfa Romeo": ["MiTo", "147", "156", "159", "166", "Giulietta", "Giulia", "Brera", "GT", "Junior", "Tonale", "Stelvio"],
  "Jaguar": ["X-Type", "S-Type", "XE", "XF", "XJ", "F-Type", "E-Pace", "F-Pace", "I-Pace"],
  "Chrysler": ["300C", "Sebring", "PT Cruiser", "Voyager", "Grand Voyager", "Pacifica"],
  "Smart": ["Fortwo", "Forfour", "#1", "#3"],
  "Tesla": ["Model 3", "Model Y", "Model S", "Model X"],
  "Cupra": ["Born", "Leon", "Formentor", "Ateca", "Terramar", "Tavascan"],
  "DS": ["DS 3", "DS 3 Crossback", "DS 4", "DS 5", "DS 7", "DS 9"],
  "Lancia": ["Ypsilon", "Musa", "Delta"],
  "Subaru": ["Impreza", "XV", "Crosstrek", "Forester", "Outback", "Legacy", "BRZ", "Solterra"],
  "SsangYong": ["Tivoli", "Korando", "Rexton", "Torres", "Musso"],
  "MG": ["MG3", "MG4", "MG5", "ZS", "HS", "Marvel R", "Cyberster"],
  "BYD": ["Dolphin", "Atto 3", "Seal", "Seal U", "Han", "Tang"],
  "Dodge": ["Journey", "Durango", "Challenger", "Charger", "RAM"],
  "Infiniti": ["Q30", "Q50", "QX30", "QX50", "QX70"],
  "Maserati": ["Ghibli", "Quattroporte", "Levante", "Grecale", "GranTurismo", "MC20"],
  "Cadillac": ["CT5", "XT4", "XT5", "XT6", "Escalade"],
  "Bentley": ["Continental GT", "Flying Spur", "Bentayga"],
  "Iveco": ["Daily"],
  [OTHER_BRAND]: [],
};

// Admin-approved "Tjeter" suggestions (GET /CarSuggestions/approved) are merged into CAR_BRANDS in
// place, so every reader of the list picks them up without a deploy. Matching is case-insensitive
// so "ml 350" doesn't sit next to "ML 350"; new brands go before "Tjeter", which stays last.
export function mergeApprovedCarSuggestions(list) {
  const findKey = (name) => Object.keys(CAR_BRANDS).find((k) => k.toLowerCase() === name.toLowerCase());
  const addBrand = (name) => {
    const other = CAR_BRANDS[OTHER_BRAND];
    delete CAR_BRANDS[OTHER_BRAND];
    CAR_BRANDS[name] = [];
    CAR_BRANDS[OTHER_BRAND] = other;
    return name;
  };
  for (const s of list || []) {
    const value = (s.suggestedValue || "").trim();
    if (!value) continue;
    if (s.type === "brand") {
      if (!findKey(value)) addBrand(value);
    } else if (s.type === "model" && s.marka && s.marka !== OTHER_BRAND) {
      const brand = findKey(s.marka) || addBrand(s.marka);
      if (!CAR_BRANDS[brand].some((m) => m.toLowerCase() === value.toLowerCase())) CAR_BRANDS[brand].push(value);
    }
  }
}

// Display labels for these keys/categories live in src/i18n.jsx under amenity.*/amenityCategory.*,
// not here. Keys that already existed (sunroof/sedilje_lekuri/sensore_parkimi/kamera_pas/bluetooth/
// usb/traksion_4x4/sedilje_bebe/bagazh_i_madh) are kept as-is so cars that already have amenities
// selected don't silently lose them - only re-labeled/re-categorized. sedilje_femije was merged into
// sedilje_bebe (now "ISOFIX child-seat mounting points"); gps was dropped (not in the new catalog).
export const AMENITY_CATEGORIES = [
  {
    key: "comfort",
    items: [
      "sunroof", "keyless_entry", "keyless_start", "sedilje_lekuri", "heated_seats",
      "ventilated_seats", "electric_seats", "memory_seats", "auto_dimming_mirrors",
      "electric_windows", "climate_multizone", "rear_ac", "sensore_parkimi", "kamera_pas", "camera_360",
    ],
  },
  {
    key: "multimedia",
    items: ["apple_carplay", "android_auto", "bluetooth", "premium_sound", "dab_radio", "touchscreen", "voice_control", "usb", "wifi_hotspot"],
  },
  {
    key: "safety",
    items: [
      "collision_warning", "auto_emergency_braking", "adaptive_cruise_control", "lane_assist",
      "blind_spot_monitoring", "traffic_sign_recognition", "auto_headlights", "rain_sensor",
      "parking_assist", "driving_modes", "traksion_4x4", "heated_steering_wheel",
    ],
  },
  {
    key: "family",
    items: ["sedilje_bebe", "rear_child_anchors", "child_safety_locks", "rear_seat_foldable", "rear_sun_blinds"],
  },
  {
    key: "exterior",
    items: [
      "led_headlights", "adaptive_headlights", "matrix_led", "ambient_lighting", "alloy_wheels",
      "sport_package", "privacy_glass", "power_tailgate", "folding_mirrors",
    ],
  },
  {
    key: "practical",
    items: ["bagazh_i_madh", "folding_rear_seats", "hands_free_tailgate", "socket_12v", "wireless_charging", "cup_holders_temp"],
  },
];

export const AMENITIES = AMENITY_CATEGORIES.flatMap((c) => c.items.map((key) => ({ key, category: c.key })));

// Built-in amenities have i18n labels (amenity.<key>); admin-approved suggestions don't -- their key
// *is* the text the business typed, so it's shown as-is.
const BUILTIN_AMENITY_KEYS = new Set(AMENITIES.map((a) => a.key));
export const amenityLabel = (t, key) => (BUILTIN_AMENITY_KEYS.has(key) ? t(`amenity.${key}`) : key);

// Approved suggestions (GET /AmenitySuggestions/approved) land in an "other" category, which the
// picker hides while empty.
const OTHER_AMENITY_CATEGORY = { key: "other", items: [] };
AMENITY_CATEGORIES.push(OTHER_AMENITY_CATEGORY);
export function mergeApprovedAmenities(list) {
  for (const s of list || []) {
    const value = (s.suggestion || "").trim();
    if (!value || AMENITIES.some((a) => a.key.toLowerCase() === value.toLowerCase())) continue;
    OTHER_AMENITY_CATEGORY.items.push(value);
    AMENITIES.push({ key: value, category: "other" });
  }
}

export const CAR_CATEGORIES = [
  { key: "economy" },
  { key: "compact" },
  { key: "sedan" },
  { key: "suv" },
  { key: "luxury" },
  { key: "van" },
];

export const ALBANIAN_LOCATIONS = [
  "Porti i Durresit", "Porti i Vlores", "Aeroporti Rinas (Tirane)",
  "Tirane", "Durres", "Vlore", "Shkoder", "Elbasan", "Fier", "Korce",
  "Berat", "Lushnje", "Kavaje", "Pogradec", "Gjirokaster", "Sarande",
  "Lezhe", "Kukes", "Peshkopi", "Kruje", "Fushe-Kruje", "Patos", "Kucove",
];

// URL slugs for the per-city SEO landing pages (/makina-me-qera-{slug}) -- kept as an explicit
// map rather than auto-slugified so the URLs stay stable even if ALBANIAN_LOCATIONS wording
// changes later (a slug changing would orphan whatever external links/rankings it had built up).
export const CITY_SLUGS = {
  "Porti i Durresit": "porti-durresit",
  "Porti i Vlores": "porti-vlores",
  "Aeroporti Rinas (Tirane)": "aeroporti-rinas",
  "Tirane": "tirane",
  "Durres": "durres",
  "Vlore": "vlore",
  "Shkoder": "shkoder",
  "Elbasan": "elbasan",
  "Fier": "fier",
  "Korce": "korce",
  "Berat": "berat",
  "Lushnje": "lushnje",
  "Kavaje": "kavaje",
  "Pogradec": "pogradec",
  "Gjirokaster": "gjirokaster",
  "Sarande": "sarande",
  "Lezhe": "lezhe",
  "Kukes": "kukes",
  "Peshkopi": "peshkopi",
  "Kruje": "kruje",
  "Fushe-Kruje": "fushe-kruje",
  "Patos": "patos",
  "Kucove": "kucove",
};

export const SLUG_TO_CITY = Object.fromEntries(Object.entries(CITY_SLUGS).map(([city, slug]) => [slug, city]));

// Countries a business can opt into letting its cars cross into (cria.al-style "cross-border
// destinations") -- Albania's actual neighbors/near neighbors, not an arbitrary list.
export const BORDER_COUNTRIES = [
  "Mali i Zi", "Kosove", "Maqedonia e Veriut", "Greqia", "Kroacia", "Bosnja dhe Hercegovina", "Serbia",
];

export const NATIONALITIES = [
  "Shqiperi", "Kosove", "Maqedoni e Veriut", "Mal i Zi", "Greqi", "Itali", "Gjermani",
  "Zvicer", "Austri", "Spanje", "Franc", "Mbreteri e Bashkuar", "Belgjike", "Holande",
  "Suedi", "Turqi", "SHBA", "Tjeter",
];

// Display labels for these keys live in src/i18n.jsx under photoSlot.*, not here.
export const PHOTO_SLOTS = [
  { key: "front" },
  { key: "back" },
  { key: "left" },
  { key: "right" },
  { key: "interior_front" },
  { key: "interior_back" },
  { key: "trunk" },
];

// Mirrors ERental/Services/CarPricing.cs -- the backend recomputes this for the PayPal amount and
// rejects any mismatch, so keep the two identical. Each rental day (start inclusive, end exclusive)
// is priced alone: a car price period covering it wins, else base price + the largest company
// season surcharge covering it. Only when no day hit either does the multi-day offer apply.
// Returns business-side amounts (no platform markup).
export function computeRentalQuote(car, from, to) {
  const start = new Date(`${from}T00:00:00Z`);
  const days = Math.max(0, Math.round((new Date(`${to}T00:00:00Z`) - start) / 86400000));
  const periods = car.pricePeriods || [];
  const seasons = car.company?.seasonRules || [];
  let total = 0, firstDay = Number(car.cmimiDites), seasonal = false;
  for (let i = 0; i < days; i++) {
    const day = new Date(start.getTime() + i * 86400000).toISOString().slice(0, 10);
    const period = periods.find((p) => p.dataFillimit <= day && day <= p.dataPerfundimit);
    const hits = seasons.filter((s) => s.dataFillimit <= day && day <= s.dataPerfundimit);
    let price = Number(car.cmimiDites);
    if (period) { price = Number(period.cmimiDites); seasonal = true; }
    else if (hits.length) { price += Math.max(...hits.map((s) => Number(s.shtesaDites))); seasonal = true; }
    total += price;
    if (i === 0) firstDay = price;
  }
  const offer = !seasonal ? car.priceOffers?.find((o) => o.dite === days) : null;
  if (!seasonal) total = offer ? Number(offer.cmimiTotal) : days * Number(car.cmimiDites);
  return { days, total, firstDay, seasonal, offer };
}

// Shareable company profile URLs: /kompania/autorentdemo instead of /kompania/27. "ë"/"ç" etc.
// are folded to plain letters. Two companies whose names slug the same get "-<id>" appended so
// each link stays unambiguous. Companies are taken from the loaded cars list (car.company).
export function slugify(text) {
  return (text || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function companiesFromCars(cars) {
  const map = new Map();
  for (const c of cars || []) if (c.company && !map.has(c.companyId)) map.set(c.companyId, c.company.emri);
  return map;
}

export function companyPath(companyId, cars) {
  const companies = companiesFromCars(cars);
  const slug = slugify(companies.get(companyId));
  if (!slug) return `/kompania/${companyId}`;
  const clash = [...companies].some(([id, name]) => id !== companyId && slugify(name) === slug);
  return `/kompania/${clash ? `${slug}-${companyId}` : slug}`;
}

export function companyIdFromSlug(segment, cars) {
  if (/^\d+$/.test(segment)) return Number(segment);
  const companies = companiesFromCars(cars);
  for (const [id, name] of companies) if (slugify(name) === segment) return id;
  const m = segment.match(/-(\d+)$/);
  return m && companies.has(Number(m[1])) ? Number(m[1]) : null;
}

// Cars store fuel/transmission as fixed Albanian values ("benzine", "automatik"); this shows them
// in the reader's language, falling back to the stored value for anything unexpected.
export function specValue(t, kind, value) {
  const key = `${kind}.${String(value || "").toLowerCase()}`;
  const label = t(key);
  return label === key ? value : label;
}
