export const API_BASE = import.meta.env.VITE_API_BASE || "https://localhost:7096/api";

// Not a React module, so no useLang() -- these two fallback strings (never backend-authored)
// are looked up directly against the same localStorage key i18n.jsx itself reads from.
const API_TEXT = {
  sq: { networkDown: "S'u lidh dot me serverin. Kontrollo qe backend-i (Visual Studio) te jete duke punuar.", genericError: (status) => `Gabim ${status}` },
  en: { networkDown: "Couldn't connect to the server. Check that the backend (Visual Studio) is running.", genericError: (status) => `Error ${status}` },
};
function apiText() {
  const lang = localStorage.getItem("lang") === "en" ? "en" : "sq";
  return API_TEXT[lang];
}

export function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

// Keyless Google Maps embed (the classic output=embed URL) — no API key/billing needed,
// and looks like real Google Maps everywhere, unlike the plain OpenStreetMap tile embed.
export function mapEmbedUrl(lat, lng, zoom = 15) {
  return `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;
}

export function toWhatsappNumber(phone) {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("355")) return digits;
  if (digits.startsWith("0")) return "355" + digits.slice(1);
  return digits;
}

export function todayPlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// For images served through an authenticated, byte-streaming endpoint (never a public URL) — the
// license photo endpoints. Returns an object URL good only in this tab; caller must revoke it.
export async function apiFetchBlob(path, token) {
  const res = await fetch(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(apiText().genericError(res.status));
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export async function apiFetch(path, token, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new Error(apiText().networkDown);
  }
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    // The stored token can go stale (expiry, or the account changed server-side) while the app
    // still thinks it's logged in — every call then fails silently until the user manually logs
    // out and back in. Broadcasting this lets App.jsx clear the session and prompt a fresh login
    // instead of leaving the UI in a half-authenticated, everything-is-broken state.
    if (res.status === 401 && token) {
      window.dispatchEvent(new Event("erental:sessionExpired"));
    }
    const msg = typeof data === "string" ? data : data?.message || data?.title || apiText().genericError(res.status);
    throw new Error(msg || apiText().genericError(res.status));
  }
  return data;
}
