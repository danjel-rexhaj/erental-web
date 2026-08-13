export const OTHER_BRAND = "Tjeter";
export const OTHER_MODEL = "Tjeter";

// Ordered by how common each brand is on Albanian roads (Mercedes-Benz/VW/BMW/Audi's
// dominance there is well known, not from a formal registry dataset), so the most
// relevant options are at the top of the dropdown instead of alphabetical/random order.
export const CAR_BRANDS = {
  "Mercedes-Benz": ["A-Class", "C-Class", "E-Class", "S-Class", "GLA", "GLC", "GLE", "CLA", "Vito", "Sprinter"],
  "Volkswagen": ["Golf", "Polo", "Passat", "Tiguan", "Touran", "Jetta", "Arteon", "T-Roc", "T-Cross", "Up!"],
  "BMW": ["Seria 1", "Seria 2", "Seria 3", "Seria 4", "Seria 5", "Seria 7", "X1", "X3", "X5", "X6"],
  "Audi": ["A1", "A3", "A4", "A5", "A6", "A8", "Q2", "Q3", "Q5", "Q7"],
  "Toyota": ["Corolla", "Yaris", "Camry", "RAV4", "C-HR", "Auris", "Aygo", "Land Cruiser", "Hilux", "Prius"],
  "Opel": ["Corsa", "Astra", "Insignia", "Mokka", "Crossland", "Grandland", "Zafira", "Vivaro"],
  "Ford": ["Fiesta", "Focus", "Mondeo", "Kuga", "Puma", "EcoSport", "Transit", "S-Max"],
  "Fiat": ["500", "Panda", "Tipo", "Punto", "500X", "Doblo", "Ducato"],
  "Renault": ["Clio", "Megane", "Talisman", "Captur", "Kadjar", "Koleos", "Scenic", "Twingo"],
  "Peugeot": ["208", "308", "508", "2008", "3008", "5008", "Partner"],
  "Skoda": ["Fabia", "Octavia", "Superb", "Kamiq", "Karoq", "Kodiaq", "Rapid", "Scala"],
  "Hyundai": ["i10", "i20", "i30", "Elantra", "Tucson", "Santa Fe", "Kona"],
  "Kia": ["Picanto", "Rio", "Ceed", "Sportage", "Sorento", "Niro", "Stonic"],
  "Nissan": ["Micra", "Juke", "Qashqai", "X-Trail", "Leaf", "Navara"],
  "Honda": ["Civic", "Accord", "CR-V", "HR-V", "Jazz"],
  "Mazda": ["Mazda2", "Mazda3", "Mazda6", "CX-3", "CX-5", "CX-30"],
  "Citroen": ["C3", "C4", "C5", "Berlingo", "C3 Aircross"],
  "Dacia": ["Sandero", "Logan", "Duster", "Dokker", "Spring"],
  "Seat": ["Ibiza", "Leon", "Arona", "Ateca", "Tarraco"],
  "Volvo": ["S60", "S90", "V40", "V60", "XC40", "XC60", "XC90"],
  "Jeep": ["Renegade", "Compass", "Cherokee", "Grand Cherokee", "Wrangler"],
  "Land Rover": ["Discovery", "Discovery Sport", "Range Rover", "Range Rover Evoque", "Range Rover Sport", "Defender"],
  "Mini": ["Cooper", "Countryman", "Clubman"],
  "Porsche": ["911", "Cayenne", "Macan", "Panamera", "Taycan"],
  "Lexus": ["IS", "ES", "RX", "NX", "UX"],
  "Mitsubishi": ["Space Star", "ASX", "Outlander", "L200", "Eclipse Cross"],
  "Suzuki": ["Swift", "Vitara", "S-Cross", "Jimny", "Baleno"],
  "Chevrolet": ["Spark", "Aveo", "Cruze", "Captiva", "Trax"],
  "Alfa Romeo": ["Giulietta", "Giulia", "Stelvio", "MiTo"],
  "Jaguar": ["XE", "XF", "F-Pace", "E-Pace"],
  "Chrysler": ["300C", "Voyager", "Pacifica"],
  "Smart": ["Fortwo", "Forfour"],
  [OTHER_BRAND]: [],
};

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
