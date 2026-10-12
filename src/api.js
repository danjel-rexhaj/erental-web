export const API_BASE = import.meta.env.VITE_API_BASE || "https://localhost:7096/api";

// Not a React module, so no useLang() -- these fallback strings (never backend-authored) are
// looked up directly against the same localStorage key i18n.jsx itself reads from. They are what
// a customer sees when a request fails, so they say what to do next and nothing about the stack.
const API_TEXT = {
  sq: { networkDown: "Lidhja deshtoi. Kontrollo internetin dhe provo perseri.", serverError: "Dicka shkoi keq nga ana jone. Provo perseri pas pak.", genericError: (status) => `Kerkesa nuk u krye (kodi ${status}). Provo perseri.` },
  en: { networkDown: "Connection failed. Check your internet and try again.", serverError: "Something went wrong on our side. Please try again in a moment.", genericError: (status) => `The request didn't go through (code ${status}). Please try again.` },
  de: { networkDown: "Verbindung fehlgeschlagen. Prüfe dein Internet und versuche es erneut.", serverError: "Bei uns ist etwas schiefgelaufen. Bitte versuche es gleich noch einmal.", genericError: (status) => `Die Anfrage ist fehlgeschlagen (Code ${status}). Bitte versuche es erneut.` },
  fr: { networkDown: "Connexion échouée. Vérifie ta connexion internet et réessaie.", serverError: "Un problème est survenu de notre côté. Réessaie dans un instant.", genericError: (status) => `La demande n'a pas abouti (code ${status}). Réessaie.` },
  it: { networkDown: "Connessione non riuscita. Controlla internet e riprova.", serverError: "Qualcosa è andato storto da parte nostra. Riprova tra poco.", genericError: (status) => `La richiesta non è andata a buon fine (codice ${status}). Riprova.` },
};
function apiText() {
  return API_TEXT[localStorage.getItem("lang")] || API_TEXT.sq;
}

// For failures that aren't an API response at all (a code fault caught by a try/catch).
export const genericErrorText = () => apiText().serverError;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
  // A blip (flaky mobile data, the API restarting mid-deploy) shouldn't surface as an error when
  // simply asking again works. Reads only -- repeating a POST could book or charge twice.
  const retries = !options.method || options.method === "GET" ? 2 : 0;
  let res;
  for (let attempt = 0; ; attempt++) {
    try {
      res = await fetch(`${API_BASE}${path}`, { ...options, headers });
      if (![502, 503, 504].includes(res.status) || attempt >= retries) break;
    } catch {
      if (attempt >= retries) throw new Error(apiText().networkDown);
    }
    await wait(1200 * (attempt + 1));
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
    // A 5xx body is usually whatever the server or the proxy in front of it produced (an HTML error
    // page, a stack trace) -- never something to show a customer. The one exception is the short
    // plain-text reason our own controllers attach on purpose ("Dergimi i email-it deshtoi.").
    if (res.status >= 500) {
      const deliberate = res.status === 500 && typeof data === "string" && data.length < 160 && !data.includes("<");
      throw new Error(deliberate ? data : apiText().serverError);
    }
    const msg = typeof data === "string" ? data : data?.message || data?.title || apiText().genericError(res.status);
    throw new Error(msg || apiText().genericError(res.status));
  }
  return data;
}
