import { useState, useCallback, useEffect, useRef } from "react";
import { LogOut, Menu, X, Bell, Sun, Moon, Car } from "lucide-react";
import { apiFetch, decodeJwt } from "./api";
import { useNotifications } from "./notifications";
import { subscribeToPush, unsubscribeFromPush } from "./push";
import { Logo } from "./Logo";
import { InstallPwaButton } from "./InstallPwaButton";
import { useLang } from "./useLang";
import { Notice, PaymentSuccessModal } from "./components";
import Home from "./pages/Home";
import Results from "./pages/Results";
import { CarDetail, CompanyProfile } from "./pages/CarAndCompany";
import Bookings from "./pages/Bookings";
import Favorites from "./pages/Favorites";
import Business from "./pages/Business";
import { AuthGate, BusinessAuthGate, AuthView, ProfileView, VerifyView } from "./pages/Auth";
import BusinessSignup from "./pages/BusinessSignup";
import { Privacy, Terms, Careers, About, Contact } from "./pages/Legal";
import { SLUG_TO_CITY, CITY_SLUGS } from "./carData";

// index.html ships a single hardcoded canonical tag pointing at the homepage -- every other
// route needs its own, and specifically WITHOUT query params (?nga=&deri=&...), or Google treats
// every date-range combination on a car/results page as separate duplicate-content URLs.
function updateCanonical(pathname) {
  const clean = (pathname || "/").split("?")[0] || "/";
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", `https://www.erental.store${clean}`);
}

// index.html's <title>/<meta name="description"> are homepage-only and were showing up
// identically for every route in Google's results (site:erental.store), making the pages look
// indistinguishable from each other. This keeps them in sync with whatever's actually on screen.
const DEFAULT_TITLE = "ERental — Makina me qera në Shqipëri";
const DEFAULT_DESCRIPTION = "ERental — platforma e parë shqiptare ku krahason dhe rezervon makina me qera nga biznese të verifikuara në të gjithë Shqipërinë, brenda sekondave dhe pa kosto të fshehura.";

const PAGE_META = {
  bookings: { title: `Rezervimet e mia — ERental`, description: "Shiko dhe menaxho rezervimet e tua të makinave me qera në ERental." },
  favorites: { title: `Makinat e preferuara — ERental`, description: "Makinat me qera që ke ruajtur si të preferuara në ERental." },
  business: { title: `Regjistro biznesin tënd — ERental`, description: "Listo makinat e biznesit tënd të qerasë në ERental dhe merr klientë të rinj çdo ditë, pa kosto fillestare." },
  auth: { title: `Hyr ose regjistrohu — ERental`, description: DEFAULT_DESCRIPTION },
  businessSignup: { title: `Regjistro biznesin — ERental`, description: "Regjistro biznesin tënd të qerasë së makinave në ERental dhe fillo të marrësh rezervime online." },
  about: { title: `Rreth nesh — ERental`, description: "Mëso më shumë rreth ERental, platforma e parë shqiptare e qerasë së makinave online." },
  contact: { title: `Na kontakto — ERental`, description: "Na kontakto për pyetje rreth rezervimeve ose regjistrimit të biznesit tënd në ERental." },
  careers: { title: `Karriera — ERental`, description: "Shiko pozicionet e hapura dhe bashkohu me ekipin e ERental." },
  privacy: { title: `Politika e privatësisë — ERental`, description: DEFAULT_DESCRIPTION },
  terms: { title: `Kushtet e përdorimit — ERental`, description: DEFAULT_DESCRIPTION },
};

// Unread-count badge on the browser tab (title prefix + a red dot drawn onto the favicon), like
// Gmail/Slack -- module-level (not React state) because it has to survive/reapply across route
// changes, which call updatePageMeta with a fresh base title that would otherwise wipe the prefix.
let currentBaseTitle = DEFAULT_TITLE;
let currentUnreadCount = 0;
let faviconImg = null;

function applyTitleBadge() {
  document.title = currentUnreadCount > 0 ? `(${currentUnreadCount > 9 ? "9+" : currentUnreadCount}) ${currentBaseTitle}` : currentBaseTitle;
}

function drawFaviconBadge() {
  if (!faviconImg) {
    faviconImg = new Image();
    faviconImg.src = "/favicon.png";
    faviconImg.onload = drawFaviconBadge;
    return;
  }
  if (!faviconImg.complete || faviconImg.naturalWidth === 0) return;

  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(faviconImg, 0, 0, size, size);

  if (currentUnreadCount > 0) {
    const r = 18, cx = size - r * 0.85, cy = r * 0.85;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = "#dc2626";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#fff";
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 22px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(currentUnreadCount > 9 ? "9+" : String(currentUnreadCount), cx, cy + 1);
  }

  let link = document.querySelector('link[rel="icon"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "icon");
    document.head.appendChild(link);
  }
  link.setAttribute("href", canvas.toDataURL("image/png"));
}

function updateUnreadBadge(count) {
  currentUnreadCount = count;
  applyTitleBadge();
  drawFaviconBadge();
}

function updatePageMeta(title, description) {
  currentBaseTitle = title || DEFAULT_TITLE;
  applyTitleBadge();
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute("content", description || DEFAULT_DESCRIPTION);
}

// Used by the per-city landing pages: a city with zero live listings still needs to exist and
// render (so it "just works" the moment a business in that city signs up), but shouldn't be
// indexed as a real result page in the meantime -- Google penalizes near-empty pages that ARE
// indexed, but doesn't mind ones that exist and are explicitly marked noindex.
function updateRobotsMeta(noindex) {
  let meta = document.querySelector('meta[name="robots"]');
  if (!noindex) {
    if (meta) meta.remove();
    return;
  }
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "robots");
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", "noindex, follow");
}

// Shown in place of the homepage while search() fetches results and preloads their photos --
// replaces the old in-place "Duke kërkuar..." button label with a dedicated full-page transition,
// so the results appear all at once on a fresh screen instead of popping in over the search form.
function SearchLoading() {
  const { t } = useLang();
  return (
    <div className="flex flex-col items-center justify-center text-center px-8 py-24 gap-6">
      <div className="relative w-40 h-14">
        <div className="absolute bottom-0 left-0 right-0 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="absolute bottom-0.5 animate-drive">
          <Car size={40} className="text-sky-600 dark:text-emerald-400" />
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t("home.searchingTitle")}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{t("home.searchingHint")}</p>
      </div>
    </div>
  );
}

export default function App() {
  const { t } = useLang();
  const [token, setToken] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("erental_auth"));
      return saved?.token || null;
    } catch {
      return null;
    }
  });
  const [user, setUser] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("erental_auth"));
      return saved?.user || null;
    } catch {
      return null;
    }
  });
  const [view, setView] = useState("browse");
  const [notice, setNotice] = useState(null);
  const [verifyData, setVerifyData] = useState(() => {
    try { return JSON.parse(localStorage.getItem("erental_verify")) || null; } catch { return null; }
  });
  const [businessTab, setBusinessTab] = useState("dashboard");
  const [businessCarId, setBusinessCarIdState] = useState(null);
  const [highlightBookingId, setHighlightBookingId] = useState(null);
  const [bookingsRefreshKey, setBookingsRefreshKey] = useState(0);
  const [theme, setTheme] = useState(() => localStorage.getItem("erental_theme") || "light");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("erental_theme", theme);
  }, [theme]);

  // A stored token can go stale (expired, or the account changed server-side) while the app
  // still shows the user as logged in — apiFetch broadcasts this event on any 401 so we can
  // clear the session and explain why, instead of leaving every action silently failing.
  useEffect(() => {
    function onSessionExpired() {
      setToken(null);
      setUser(null);
      localStorage.removeItem("erental_auth");
      showError(new Error(t("app.sessionExpired")));
    }
    window.addEventListener("erental:sessionExpired", onSessionExpired);
    return () => window.removeEventListener("erental:sessionExpired", onSessionExpired);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  // Browse flow state lives here so it persists across sub-page navigation
  const [stage, setStage] = useState("landing"); // landing | results | carDetail | companyProfile
  const [carDetailFrom, setCarDetailFrom] = useState("results"); // results | companyProfile
  const [companyProfileFromCarId, setCompanyProfileFromCarId] = useState(null);
  const [dataFillimit, setDataFillimit] = useState("");
  const [dataPerfundimit, setDataPerfundimit] = useState("");
  const [cars, setCars] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [paymentSuccessInfo, setPaymentSuccessInfo] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  // Also lives here (not in Results.jsx) so it survives leaving for a car's detail page and coming back.
  const [resultFilters, setResultFilters] = useState({ search: "", marka: "", modeli: "", biznesi: "", karburanti: "", kategoria: "", zona: "", cmimiMax: "", vitiMin: "", vitiMax: "", amenities: [], sort: "" });
  const [showResultFilters, setShowResultFilters] = useState(false);
  // Set only when arriving via a /makina-me-qera-{qytet} SEO landing URL, so Results.jsx can show
  // a city-specific H1/intro instead of looking like the plain generic results page.
  const [cityLanding, setCityLanding] = useState(null);

  useEffect(() => {
    if (!token) { const t = setTimeout(() => setFavoriteIds(new Set()), 0); return () => clearTimeout(t); }
    apiFetch("/Favorites/ids", token).then((ids) => setFavoriteIds(new Set(ids))).catch(() => {});
  }, [token]);

  // Refreshes the full profile (photo, license status, etc.) right away on login/app-load instead
  // of only once the user happens to open the Profile page -- otherwise things like the nav avatar
  // stay on stale/missing data (from the login response, which doesn't carry the photo) until then.
  useEffect(() => {
    if (!token) return;
    apiFetch("/Users/me", token).then((data) => updateUser(data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Re-registers the push subscription on every app load, but only silently -- if the browser
  // permission is already "granted" from a previous session, requesting it again resolves
  // instantly with no prompt. If it's still "default" (never asked), this deliberately does
  // nothing; that first prompt only ever fires from the explicit button in ProfileView, since
  // browsers increasingly ignore/auto-deny permission prompts not triggered by a user gesture.
  useEffect(() => {
    if (!token || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    subscribeToPush(token).catch(() => {});
  }, [token]);

  // The service worker can't reach the SPA router directly, so a notification tap posts a message
  // back to whichever tab it focused/opened instead.
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    function onMessage(event) {
      if (event.data?.type === "notification-click" && event.data.url) go(event.data.url);
    }
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleFavorite(car) {
    if (!token) { go("/profili"); return; }
    const isFav = favoriteIds.has(car.carId);
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (isFav) next.delete(car.carId); else next.add(car.carId);
      return next;
    });
    try {
      await apiFetch(`/Favorites/${car.carId}`, token, { method: isFav ? "DELETE" : "POST" });
    } catch (e) {
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (isFav) next.add(car.carId); else next.delete(car.carId);
        return next;
      });
      showError(e);
    }
  }

  const showError = (e) => {
    setNotice({ type: "error", text: e.message || String(e) });
    window.clearTimeout(window.__noticeTimeout);
    window.__noticeTimeout = window.setTimeout(() => setNotice(null), 5000);
  };
  const showOk = (text) => {
    setNotice({ type: "ok", text });
    window.clearTimeout(window.__noticeTimeout);
    window.__noticeTimeout = window.setTimeout(() => setNotice(null), 4000);
  };

  const isAdmin = token && decodeJwt(token)?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] === "1";

  const handleAvailabilityChanged = useCallback(() => {
    setStage((currentStage) => {
      if (currentStage === "results") {
        apiFetch(`/Cars/available?dataFillimit=${dataFillimit}&dataPerfundimit=${dataPerfundimit}`, null)
          .then(setCars)
          .catch(() => {});
      }
      return currentStage;
    });
  }, [dataFillimit, dataPerfundimit]);

  const handleLiveNotification = useCallback((n) => {
    if (n.target === "business_booking" || n.target === "client_booking" || n.target === "leave_review") {
      setBookingsRefreshKey((k) => k + 1);
    }
    if (n.target === "whatsapp_verified") {
      updateUser({ whatsappVerified: true });
    }
    if (n.target === "license_verified") {
      updateUser({ patentaStatus: "verified" });
    }
    if (n.target === "license_rejected") {
      updateUser({ patentaStatus: "rejected" });
    }
  }, []);

  const { notifications, unreadCount, markAllRead, dismissNotification, clearAllNotifications, connection: hubConnection } = useNotifications(token, handleAvailabilityChanged, handleLiveNotification);

  // Browser-tab badge (title prefix + red dot on the favicon) mirroring the in-app bell count.
  useEffect(() => { updateUnreadBadge(unreadCount); }, [unreadCount]);

  // ---- URL routing (real paths, server-side SPA-fallback rewrite required -- see vercel.json) ----
  const VIEW_TO_PATH = {
    browse: "/", bookings: "/rezervimet", favorites: "/preferuarat", business: "/biznesi", auth: "/profili",
    verifyEmail: "/verifiko", businessSignup: "/regjistrohu-biznes", about: "/rreth-nesh", contact: "/kontakt", careers: "/karriere",
    privacy: "/privatesia", terms: "/kushtet",
  };
  const viewToHash = (v) => VIEW_TO_PATH[v] || "/";

  const applyRoute = useCallback(async (hashStr, hint) => {
    const [path = "/", queryStr] = (hashStr || "/").replace(/^#/, "").split("?");
    const params = new URLSearchParams(queryStr || "");
    const segs = path.split("/").filter(Boolean);
    setCityLanding(null);
    updateRobotsMeta(false);

    if (segs[0] === "paypal-kthim") {
      const orderId = params.get("token");
      let pending = null;
      try { pending = JSON.parse(localStorage.getItem("erental_pending_payment") || "null"); } catch { /* ignore */ }
      localStorage.removeItem("erental_pending_payment");

      if (!orderId || !pending) { go("/"); return; }

      const paymentMethod = pending.method === "paypal_deposit" ? "deposit" : "full";
      setView("browse");
      setStage("landing");
      try {
        const cap = await apiFetch("/Payments/paypal/capture", token, {
          method: "POST",
          body: JSON.stringify({ carId: pending.carId, dataFillimit: pending.dataFillimit, dataPerfundimit: pending.dataPerfundimit, method: paymentMethod, paypalOrderId: orderId }),
        });
        const booking = await apiFetch("/Bookings", token, {
          method: "POST",
          body: JSON.stringify({ carId: pending.carId, dataFillimit: pending.dataFillimit, dataPerfundimit: pending.dataPerfundimit, oraMarrjes: pending.oraMarrjes, oraKthimit: pending.oraKthimit, paymentMethod: pending.method, paypalCaptureId: cap.captureId }),
        });
        const car = await apiFetch(`/Cars/${pending.carId}`, null).catch(() => null);
        setPaymentSuccessInfo({
          car: car || { marka: "", modeli: "" },
          dataFillimit: pending.dataFillimit,
          dataPerfundimit: pending.dataPerfundimit,
          successInfo: { bookingId: booking.bookingId, amountPaid: cap.amountPaid, method: pending.method },
        });
      } catch (e) {
        showError(e);
      }
      return;
    }

    if (segs[0] === "makina" && segs[1]) {
      const from = params.get("nga") || dataFillimit;
      const to = params.get("deri") || dataPerfundimit;
      if (from) setDataFillimit(from);
      if (to) setDataPerfundimit(to);
      setCarDetailFrom(params.get("nga_faqja") === "kompania" ? "companyProfile" : "results");
      if (params.get("kompania")) setSelectedCompanyId(Number(params.get("kompania")));
      setView("browse");
      setStage("carDetail");
      if (hint?.car) {
        setSelectedCar(hint.car);
      } else {
        try { setSelectedCar(await apiFetch(`/Cars/${segs[1]}`, null)); }
        catch { showError(new Error(t("app.carNotFound"))); }
      }
      return;
    }
    if (segs[0] === "kompania" && segs[1]) {
      const id = Number(segs[1]);
      setSelectedCompanyId(id);
      setCompanyProfileFromCarId(params.get("nga_faqja") === "makina" && params.get("makina") ? Number(params.get("makina")) : null);
      setView("browse");
      setStage("companyProfile");
      if (hint?.cars) {
        setCars(hint.cars);
      } else {
        try { setCars(await apiFetch("/Cars", null)); } catch { /* ignore */ }
      }
      return;
    }
    if (segs[0] && segs[0].startsWith("makina-me-qera-") && SLUG_TO_CITY[segs[0].slice("makina-me-qera-".length)]) {
      const city = SLUG_TO_CITY[segs[0].slice("makina-me-qera-".length)];
      setView("browse");
      setStage("results");
      setDataFillimit("");
      setDataPerfundimit("");
      setResultFilters({ search: "", marka: "", modeli: "", biznesi: "", karburanti: "", kategoria: "", zona: city, cmimiMax: "", vitiMin: "", vitiMax: "", amenities: [], sort: "" });
      setCityLanding(city);
      try {
        const allCars = hint?.cars || await apiFetch("/Cars", null);
        const cityCars = allCars.filter((c) => c.statusi === "active" && c.company?.eshteVerifikuar && c.company?.qyteti === city);
        setCars(cityCars);
        updateRobotsMeta(cityCars.length === 0);
      } catch { /* ignore */ }
      return;
    }
    if (segs[0] === "rezultate") {
      const from = params.get("nga") || "";
      const to = params.get("deri") || "";
      const kategoria = params.get("kategoria") || "";
      setDataFillimit(from);
      setDataPerfundimit(to);
      setView("browse");
      setStage("results");
      if (kategoria) setResultFilters({ search: "", marka: "", modeli: "", biznesi: "", karburanti: "", kategoria, zona: "", cmimiMax: "", vitiMin: "", vitiMax: "", amenities: [], sort: "" });
      if (hint?.cars) {
        setCars(hint.cars);
      } else if (from && to) {
        try { setCars(await apiFetch(`/Cars/available?dataFillimit=${from}&dataPerfundimit=${to}`, null)); } catch { /* ignore */ }
      } else {
        // No dates yet (e.g. a category shortcut from the homepage) -- browse all live listings
        // instead of leaving the page blank; picking dates still happens per-car same as always.
        try {
          const allCars = await apiFetch("/Cars", null);
          setCars(allCars.filter((c) => c.statusi === "active" && c.company?.eshteVerifikuar));
        } catch { /* ignore */ }
      }
      return;
    }
    if (segs[0] === "rezervimet") { setView("bookings"); return; }
    if (segs[0] === "preferuarat") { setView("favorites"); return; }
    if (segs[0] === "biznesi") {
      setView("business");
      setBusinessTab(params.get("tab") || "dashboard");
      const carId = params.get("carId");
      setBusinessCarIdState(carId ? Number(carId) : null);
      return;
    }
    if (segs[0] === "profili") { setView("auth"); return; }
    if (segs[0] === "verifiko") { setView("verifyEmail"); return; }
    if (segs[0] === "regjistrohu-biznes") { setView("businessSignup"); return; }
    if (segs[0] === "rreth-nesh") { setView("about"); return; }
    if (segs[0] === "kontakt") { setView("contact"); return; }
    if (segs[0] === "karriere") { setView("careers"); return; }
    if (segs[0] === "privatesia") { setView("privacy"); return; }
    if (segs[0] === "kushtet") { setView("terms"); return; }

    setView("browse");
    setStage("landing");
    setSelectedCar(null);
    setSelectedCompanyId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataFillimit, dataPerfundimit, token]);

  function go(hashStr, hint) {
    const path = hashStr.replace(/^#/, "");
    window.history.pushState(null, "", path);
    updateCanonical(path);
    applyRoute(hashStr, hint);
    window.scrollTo(0, 0);
  }

  const applyRouteRef = useRef(applyRoute);
  useEffect(() => { applyRouteRef.current = applyRoute; }, [applyRoute]);

  useEffect(() => {
    if (view === "browse") {
      if (stage === "carDetail" && selectedCar) {
        const carName = `${selectedCar.marka} ${selectedCar.modeli}`;
        const bizName = selectedCar.company?.emri;
        updatePageMeta(
          `${carName}${bizName ? ` — ${bizName}` : ""} me qera | ERental`,
          `Merr me qera ${carName} në Shqipëri${bizName ? ` nga ${bizName}` : ""}. Rezervo online, pa kosto të fshehura.`
        );
      } else if (stage === "companyProfile" && selectedCompanyId) {
        const bizName = cars.find((c) => c.companyId === selectedCompanyId)?.company?.emri;
        updatePageMeta(
          bizName ? `${bizName} — Makina me qera | ERental` : undefined,
          bizName ? `Shiko makinat me qera nga ${bizName} në ERental.` : undefined
        );
      } else if (stage === "results" && cityLanding) {
        updatePageMeta(
          `Makina me qera në ${cityLanding} — ERental`,
          `Krahaso dhe rezervo online makina me qera në ${cityLanding} nga biznese të verifikuara në ERental. Çmime transparente, pa kosto të fshehura.`
        );
      } else if (stage === "results") {
        updatePageMeta("Rezultatet e kërkimit — Makina me qera | ERental", DEFAULT_DESCRIPTION);
      } else {
        updatePageMeta();
      }
    } else {
      const meta = PAGE_META[view];
      updatePageMeta(meta?.title, meta?.description);
    }
  }, [view, stage, selectedCar, selectedCompanyId, cars, cityLanding]);

  useEffect(() => {
    // Backward-compat: a link shared/bookmarked before this migration (erental.store/#/makina/42)
    // still loads index.html fine (the server only ever sees the part before '#'), so on first
    // paint convert it to the new real-path URL before doing anything else.
    if (window.location.hash.startsWith("#/")) {
      window.history.replaceState(null, "", window.location.hash.slice(1));
    }
    updateCanonical(window.location.pathname);
    const t = setTimeout(() => applyRoute(window.location.pathname + window.location.search), 0);
    function onPopState() { updateCanonical(window.location.pathname); applyRouteRef.current(window.location.pathname + window.location.search); }
    window.addEventListener("popstate", onPopState);
    return () => { clearTimeout(t); window.removeEventListener("popstate", onPopState); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleNotificationClick(n) {
    setHighlightBookingId(n.bookingId ?? null);
    window.clearTimeout(window.__highlightTimeout);
    window.__highlightTimeout = window.setTimeout(() => setHighlightBookingId(null), 3000);
    if (n.target === "business_booking") {
      go("/biznesi?tab=bookings");
    } else if (n.target === "client_booking" || n.target === "leave_review") {
      go("/rezervimet");
    } else if (n.target === "admin_company_verification") {
      go("/biznesi?tab=admin");
    } else if (n.target === "admin_whatsapp_verification") {
      go("/biznesi?tab=whatsapp");
    } else if (n.target === "admin_license_verification") {
      go("/biznesi?tab=patenta");
    } else if (n.target === "admin_amenity_suggestion") {
      go("/biznesi?tab=amenity-suggestions");
    } else if (n.target === "admin_car_suggestion") {
      go("/biznesi?tab=car-suggestions");
    }
  }

  // Sets the session without navigating -- split out of handleAuth so BusinessSignup can log the
  // freshly-verified account in and continue straight into its own details step, instead of being
  // redirected away by handleAuth's normal post-login routing.
  function applyAuthSession(data) {
    const role = data.hasCompany ? "business" : "client";
    const u = { email: data.email, emri: data.emri, mbiemri: data.mbiemri, telefoni: data.telefoni, hasWhatsapp: data.hasWhatsapp, emailVerified: data.emailVerified, role };
    setToken(data.token);
    setUser(u);
    localStorage.setItem("erental_auth", JSON.stringify({ token: data.token, user: u }));
    setNotice(null);
    setVerifyData(null);
    localStorage.removeItem("erental_verify");
    return role;
  }

  function handleAuth(data) {
    const role = applyAuthSession(data);
    go(role === "business" ? "/biznesi" : "/");
  }

  function updateUser(patch) {
    setUser((u) => {
      const updated = { ...u, ...patch };
      const saved = JSON.parse(localStorage.getItem("erental_auth") || "{}");
      localStorage.setItem("erental_auth", JSON.stringify({ ...saved, user: updated }));
      return updated;
    });
  }

  function markEmailVerified() {
    setUser((u) => {
      const updated = { ...u, emailVerified: true };
      const saved = JSON.parse(localStorage.getItem("erental_auth") || "{}");
      localStorage.setItem("erental_auth", JSON.stringify({ ...saved, user: updated }));
      return updated;
    });
  }

  function logout() {
    if (token) unsubscribeFromPush(token);
    setToken(null);
    setUser(null);
    localStorage.removeItem("erental_auth");
    go("/");
  }

  const search = useCallback(async () => {
    if (!dataFillimit || !dataPerfundimit) {
      showError(new Error(t("app.pickDates")));
      return;
    }
    setSearching(true);
    try {
      const data = await apiFetch(`/Cars/available?dataFillimit=${dataFillimit}&dataPerfundimit=${dataPerfundimit}`, null);
      // Preload every result's main photo before navigating so the results grid appears with all
      // cars and photos ready at once, instead of each card's image popping in on its own as the
      // browser happens to finish that one request.
      const photoUrls = data
        .map((c) => (c.carPhotos || []).find((p) => p.eshteKryesore)?.urlFotos || c.carPhotos?.[0]?.urlFotos)
        .filter(Boolean);
      await Promise.all(photoUrls.map((url) => new Promise((resolve) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = resolve;
        img.src = url;
      })));
      go(`/rezultate?nga=${dataFillimit}&deri=${dataPerfundimit}`, { cars: data });
    } catch (e) { showError(e); } finally { setSearching(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataFillimit, dataPerfundimit]);

  function renderBrowse() {
    if (stage === "companyProfile" && selectedCompanyId) {
      const companyCars = cars.filter((c) => c.companyId === selectedCompanyId);
      const company = companyCars[0]?.company;
      return (
        <CompanyProfile
          company={company}
          cars={companyCars}
          dataFillimit={dataFillimit}
          dataPerfundimit={dataPerfundimit}
          onBack={companyProfileFromCarId
            ? () => go(`/makina/${companyProfileFromCarId}?nga=${dataFillimit}&deri=${dataPerfundimit}`, selectedCar?.carId === companyProfileFromCarId ? { car: selectedCar } : undefined)
            : () => go(`/rezultate?nga=${dataFillimit}&deri=${dataPerfundimit}`)}
          onSelectCar={(car) => go(`/makina/${car.carId}?nga=${dataFillimit}&deri=${dataPerfundimit}&nga_faqja=kompania&kompania=${selectedCompanyId}`, { car })}
          favoriteIds={favoriteIds}
          onToggleFavorite={toggleFavorite}
        />
      );
    }
    if (stage === "carDetail" && selectedCar) {
      return (
        <CarDetail
          car={selectedCar}
          dataFillimit={dataFillimit}
          dataPerfundimit={dataPerfundimit}
          onBack={carDetailFrom === "companyProfile"
            ? () => go(`/kompania/${selectedCompanyId}`, { cars })
            : () => go(`/rezultate?nga=${dataFillimit}&deri=${dataPerfundimit}`)}
          onSelectCompany={(id) => go(`/kompania/${id}?nga_faqja=makina&makina=${selectedCar.carId}`, { cars })}
          onGoToBookings={() => go("/rezervimet")}
          hubConnection={hubConnection}
          token={token}
          needAuth={() => go("/profili")}
          goToProfile={() => go("/profili")}
          showError={showError}
          showOk={showOk}
          isBusinessOwner={user?.role === "business"}
          favoriteIds={favoriteIds}
          onToggleFavorite={toggleFavorite}
        />
      );
    }
    if (stage === "results") {
      return (
        <Results
          cars={cars}
          dataFillimit={dataFillimit}
          dataPerfundimit={dataPerfundimit}
          onBack={() => go("/")}
          onSelectCar={(car) => go(`/makina/${car.carId}?nga=${dataFillimit}&deri=${dataPerfundimit}&nga_faqja=rezultate`, { car })}
          onSelectCompany={(id) => go(`/kompania/${id}`, { cars })}
          favoriteIds={favoriteIds}
          onToggleFavorite={toggleFavorite}
          filters={resultFilters}
          setFilters={setResultFilters}
          showFilters={showResultFilters}
          setShowFilters={setShowResultFilters}
          pageHeading={cityLanding ? `Makina me qera në ${cityLanding}` : undefined}
          pageIntro={cityLanding ? `Krahaso çmimet dhe rezervo online makina me qera nga biznese të verifikuara në ${cityLanding}.` : undefined}
        />
      );
    }
    if (searching) return <SearchLoading />;
    return (
      <Home
        dataFillimit={dataFillimit}
        setDataFillimit={setDataFillimit}
        dataPerfundimit={dataPerfundimit}
        setDataPerfundimit={setDataPerfundimit}
        zona={resultFilters.zona}
        setZona={(zona) => setResultFilters((f) => ({ ...f, zona }))}
        onSearch={search}
        loading={searching}
        onSelectCar={(car) => go(`/makina/${car.carId}?nga=${dataFillimit}&deri=${dataPerfundimit}`, { car })}
        onSelectCompany={(id) => go(`/kompania/${id}`)}
        favoriteIds={favoriteIds}
        onToggleFavorite={toggleFavorite}
        goHash={go}
      />
    );
  }

  function handleGoTo(page, data) {
    if (page === "verifyEmail") {
      setVerifyData(data);
      localStorage.setItem("erental_verify", JSON.stringify(data));
    }
    go(viewToHash(page));
  }

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col transition-colors">
      <TopBar
        view={view}
        setView={(v) => go(viewToHash(v))}
        businessTab={businessTab}
        goHash={go}
        user={user}
        isAdmin={isAdmin}
        onLogout={logout}
        loggedIn={!!token}
        notifications={notifications}
        unreadCount={unreadCount}
        markAllRead={markAllRead}
        onNotificationClick={handleNotificationClick}
        dismissNotification={dismissNotification}
        clearAllNotifications={clearAllNotifications}
        theme={theme}
        toggleTheme={toggleTheme}
      />
      <Notice notice={notice} onClose={() => setNotice(null)} />
      <div className="max-w-6xl mx-auto px-6 py-8 flex-1 w-full">
        {view === "browse" && renderBrowse()}
        {view === "bookings" && (token ? <Bookings token={token} showError={showError} showOk={showOk} highlightBookingId={highlightBookingId} refreshKey={bookingsRefreshKey} /> : <AuthGate onGo={() => go("/profili")} text={t("app.needLoginFor", { feature: t("app.featureYourBookings") })} />)}
        {view === "favorites" && (token ? (
          <Favorites
            token={token}
            showError={showError}
            onSelectCar={(car) => go(`/makina/${car.carId}?nga=${dataFillimit}&deri=${dataPerfundimit}`, { car })}
            onSelectCompany={(id) => go(`/kompania/${id}`)}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
          />
        ) : <AuthGate onGo={() => go("/profili")} text={t("app.needLoginFor", { feature: t("app.featureFavoriteCars") })} />)}
        {view === "business" && (token ? (
          <Business
            token={token}
            showError={showError}
            showOk={showOk}
            isAdmin={isAdmin}
            tab={businessTab}
            setTab={(t) => { setBusinessTab(t); window.history.replaceState(null, "", "/biznesi?tab=" + t); }}
            carId={businessCarId}
            setCarId={(id) => {
              setBusinessCarIdState(id);
              window.history.replaceState(null, "", `/biznesi?tab=${businessTab}${id ? `&carId=${id}` : ""}`);
            }}
            highlightBookingId={highlightBookingId}
            refreshKey={bookingsRefreshKey}
          />
        ) : <BusinessAuthGate onRegister={() => go("/regjistrohu-biznes")} onLogin={() => go("/profili")} />)}
        {view === "auth" && (
          token
            ? <ProfileView user={user} token={token} isAdmin={isAdmin} onLogout={logout} showError={showError} showOk={showOk} onVerified={markEmailVerified} onUpdated={updateUser} goToBusiness={() => go("/biznesi")} goTo={go} />
            : <AuthView onAuth={handleAuth} showError={showError} showOk={showOk} goTo={handleGoTo} />
        )}
        {view === "verifyEmail" && (
          <VerifyView initialData={verifyData} onAuth={handleAuth} showError={showError} showOk={showOk} goTo={(v) => go(viewToHash(v))} />
        )}
        {view === "businessSignup" && (
          <BusinessSignup onAuth={applyAuthSession} onDone={() => go("/biznesi")} showError={showError} showOk={showOk} />
        )}
        {view === "privacy" && <Privacy />}
        {view === "terms" && <Terms />}
        {view === "careers" && <Careers showError={showError} />}
        {view === "about" && <About />}
        {view === "contact" && <Contact />}
      </div>
      <Footer setView={(v) => go(viewToHash(v))} goHash={go} />
      {paymentSuccessInfo && (
        <PaymentSuccessModal
          {...paymentSuccessInfo}
          onClose={() => { setPaymentSuccessInfo(null); go("/rezervimet"); }}
        />
      )}
    </div>
  );
}

function TopBar({ view, setView, businessTab, goHash, user, isAdmin, onLogout, loggedIn, notifications, unreadCount, markAllRead, onNotificationClick, dismissNotification, clearAllNotifications, theme, toggleTheme }) {
  const { lang, setLang, t } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const businessLabel = isAdmin ? t("nav.adminPanel") : t("nav.business");
  const links = user?.role === "business"
    ? [
        { key: "browse", label: t("nav.cars") },
        { key: "business", tab: "dashboard", label: businessLabel },
        { key: "business", tab: "bookings", label: t("nav.bookings") },
        { key: "business", tab: "analytics", label: t("nav.stats") },
      ]
    : [
        { key: "browse", label: t("nav.cars") },
        { key: "favorites", label: t("nav.favorites") },
        { key: "bookings", label: t("nav.bookings") },
        { key: "business", tab: isAdmin ? "admin" : undefined, label: businessLabel },
      ];
  const moreLinks = [
    { key: "about", label: t("nav.about") },
    { key: "contact", label: t("nav.contact") },
    { key: "careers", label: t("nav.careers") },
  ];
  return (
    <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-20 transition-colors">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <button onClick={() => { setView("browse"); setMenuOpen(false); }} className="flex items-center">
            <Logo size={44} />
          </button>
          <nav className="hidden md:flex items-center gap-1">
            {links.map((l, i) => (
              <span key={l.key + (l.tab || "")}>
                {i > 0 && " "}
                <button
                  onClick={() => (l.tab ? goHash(`/biznesi?tab=${l.tab}`) : setView(l.key))}
                  className={`text-sm font-medium px-3 py-1.5 rounded-lg transition ${
                    view === l.key && (!l.tab || l.tab === businessTab) ? "text-sky-600 dark:text-emerald-400 bg-sky-50 dark:bg-emerald-900/30" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  {l.label}
                </button>
              </span>
            ))}{" "}
            <div className="relative">
              <button
                onClick={() => setMoreOpen((s) => !s)}
                onBlur={() => setTimeout(() => setMoreOpen(false), 150)}
                className={`text-sm font-medium px-3 py-1.5 rounded-lg transition ${
                  moreLinks.some((l) => l.key === view) ? "text-sky-600 dark:text-emerald-400 bg-sky-50 dark:bg-emerald-900/30" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                {t("nav.more")}
              </button>
              {moreOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1 w-40 z-30">
                  {moreLinks.map((l, i) => (
                    <span key={l.key}>
                      {i > 0 && " "}
                      <button
                        onClick={() => { setView(l.key); setMoreOpen(false); }}
                        className="w-full text-left text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-2"
                      >
                        {l.label}
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang(lang === "sq" ? "en" : "sq")}
            className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-full w-7 h-7 flex items-center justify-center shrink-0"
            title={lang === "sq" ? "Switch to English" : "Kalo ne shqip"}
          >
            {lang === "sq" ? "EN" : "SQ"}
          </button>
          <button
            onClick={toggleTheme}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            title={theme === "dark" ? t("app.switchToLight") : t("app.switchToDark")}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {loggedIn && (
            <div className="relative">
              <button
                onClick={() => { setNotifOpen((s) => !s); if (!notifOpen) markAllRead(); }}
                onBlur={() => setTimeout(() => setNotifOpen(false), 200)}
                className="relative text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              >
                <Bell size={19} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute top-full right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg w-72 max-h-96 overflow-y-auto z-30">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">{t("app.noNotifications")}</p>
                  ) : (
                    <>
                      <div className="flex justify-end px-3 py-1.5 border-b border-slate-50 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800">
                        <button
                          onClick={() => clearAllNotifications()}
                          className="text-[11px] font-medium text-slate-400 hover:text-red-600"
                        >
                          {t("app.clearAllNotifications")}
                        </button>
                      </div>
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => { onNotificationClick(n); setNotifOpen(false); }}
                          className="px-4 py-3 border-b border-slate-50 dark:border-slate-700 last:border-0 flex items-start justify-between gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                          <div>
                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{n.title}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); dismissNotification(n.id); }}
                            className="text-slate-300 hover:text-red-600 shrink-0"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
          {loggedIn && (
            <button onClick={() => { setView("auth"); setMenuOpen(false); }} className="hidden sm:flex w-8 h-8 rounded-full bg-sky-600 dark:bg-emerald-700 items-center justify-center text-white text-xs font-bold overflow-hidden shrink-0">
              {user?.fotoProfili ? (
                <img src={user.fotoProfili} alt="" className="w-full h-full object-cover" />
              ) : (
                user?.emri?.[0]?.toUpperCase() || "?"
              )}
            </button>
          )}
          {loggedIn ? (
            <button onClick={onLogout} className="hidden md:block text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"><LogOut size={16} /></button>
          ) : (
            <button
              onClick={() => setView("auth")}
              className="hidden md:block rounded-xl bg-sky-600 dark:bg-emerald-700 text-white text-sm font-semibold px-4 py-1.5 hover:bg-sky-700 dark:hover:bg-emerald-800 transition"
            >
              {t("nav.login")}
            </button>
          )}
          <button onClick={() => setMenuOpen((s) => !s)} className="md:hidden text-slate-600 dark:text-slate-300">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-3 flex flex-col gap-1">
          <div className="mb-1">
            <InstallPwaButton />
          </div>
          {[...links, ...moreLinks].map((l, i) => (
            <span key={l.key + (l.tab || "")}>
              {i > 0 && " "}
              <button
                onClick={() => { if (l.tab) goHash(`/biznesi?tab=${l.tab}`); else setView(l.key); setMenuOpen(false); }}
                className={`text-sm font-medium px-3 py-2 rounded-lg text-left transition ${
                  view === l.key && (!l.tab || l.tab === businessTab) ? "text-sky-600 dark:text-emerald-400 bg-sky-50 dark:bg-emerald-900/30" : "text-slate-600 dark:text-slate-300"
                }`}
              >
                {l.label}
              </button>
            </span>
          ))}
          <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
          {loggedIn ? (
            <>
              <button onClick={() => { setView("auth"); setMenuOpen(false); }} className="text-sm font-medium px-3 py-2 rounded-lg text-left text-slate-600">
                {t("nav.profile")} ({user?.emri})
              </button>
              <button onClick={() => { onLogout(); setMenuOpen(false); }} className="text-sm font-medium px-3 py-2 rounded-lg text-left text-red-600">
                {t("nav.logout")}
              </button>
            </>
          ) : (
            <button onClick={() => { setView("auth"); setMenuOpen(false); }} className="text-sm font-semibold px-3 py-2 rounded-lg text-left text-sky-600 dark:text-emerald-400">
              {t("nav.loginRegister")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const FOOTER_CITIES = ["Tirane", "Aeroporti Rinas (Tirane)", "Durres", "Vlore", "Sarande", "Shkoder"];

function Footer({ setView, goHash }) {
  const { t } = useLang();
  return (
    <div className="bg-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 sm:grid-cols-4 gap-8">
        <div className="col-span-2 sm:col-span-1">
          <Logo size={38} variant="dark" />
          <p className="text-xs text-slate-500 mt-3 max-w-[22ch]">{t("footer.tagline")}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-3">{t("footer.company")}</p>
          <div className="flex flex-col gap-2">
            <button onClick={() => setView("about")} className="text-xs text-slate-400 hover:text-white text-left">{t("nav.about")}</button>
            <button onClick={() => setView("careers")} className="text-xs text-slate-400 hover:text-white text-left">{t("nav.careers")}</button>
            <button onClick={() => setView("contact")} className="text-xs text-slate-400 hover:text-white text-left">{t("nav.contact")}</button>
            <a href="mailto:info@erental.store" className="text-xs text-slate-400 hover:text-white">info@erental.store</a>
          </div>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-3">{t("footer.legal")}</p>
          <div className="flex flex-col gap-2">
            <button onClick={() => setView("privacy")} className="text-xs text-slate-400 hover:text-white text-left">{t("footer.privacy")}</button>
            <button onClick={() => setView("terms")} className="text-xs text-slate-400 hover:text-white text-left">{t("footer.terms")}</button>
          </div>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-3">{t("footer.popularCities")}</p>
          <div className="flex flex-col gap-2">
            {FOOTER_CITIES.map((city) => (
              <a
                key={city}
                href={`/makina-me-qera-${CITY_SLUGS[city]}`}
                onClick={(e) => { e.preventDefault(); goHash?.(`/makina-me-qera-${CITY_SLUGS[city]}`); }}
                className="text-xs text-slate-400 hover:text-white"
              >
                {city}
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <p className="text-[11px] text-slate-600">© {new Date().getFullYear()} ERental</p>
        </div>
      </div>
    </div>
  );
}
