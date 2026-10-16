import { useEffect, useState } from "react";
import { apiFetch } from "./api";

// Cities (ALBANIAN_LOCATIONS names) that have at least one active car of a verified business --
// the only city pages worth linking to. Comes from GET /Companies (a few KB, carries each
// business's active-car count), fetched once per page load and shared by every caller.
let pending = null;

function loadActiveCities() {
  if (!pending) {
    pending = apiFetch("/Companies", null)
      .then((list) => new Set(list.filter((c) => c.eshteVerifikuar && c.carCount > 0 && c.qyteti).map((c) => c.qyteti)))
      .catch(() => { pending = null; return new Set(); });
  }
  return pending;
}

// null while loading, then a Set of city names.
export function useActiveCities() {
  const [cities, setCities] = useState(null);
  useEffect(() => {
    let alive = true;
    loadActiveCities().then((set) => { if (alive) setCities(set); });
    return () => { alive = false; };
  }, []);
  return cities;
}
