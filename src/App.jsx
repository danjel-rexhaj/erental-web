import { useState, useCallback, useEffect, useRef } from "react";
import { LogOut, Menu, X, Bell, Sun, Moon } from "lucide-react";
import { apiFetch, decodeJwt } from "./api";
import { useNotifications } from "./notifications";
import { Logo } from "./Logo";
import { Notice, PaymentSuccessModal } from "./components";
import Home from "./pages/Home";
import Results from "./pages/Results";
import { CarDetail, CompanyProfile } from "./pages/CarAndCompany";
import Bookings from "./pages/Bookings";
import Business from "./pages/Business";
import { AuthGate, AuthView, ProfileView, VerifyView } from "./pages/Auth";
import { Privacy, Terms, Careers, About, Contact } from "./pages/Legal";

export default function App() {
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
  const [highlightBookingId, setHighlightBookingId] = useState(null);
  const [bookingsRefreshKey, setBookingsRefreshKey] = useState(0);
  const [theme, setTheme] = useState(() => localStorage.getItem("erental_theme") || "light");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("erental_theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  // Browse flow state lives here so it persists across sub-page navigation
  const [stage, setStage] = useState("landing"); // landing | results | carDetail | companyProfile
  const [carDetailFrom, setCarDetailFrom] = useState("results"); // results | companyProfile
  const [dataFillimit, setDataFillimit] = useState("");
  const [dataPerfundimit, setDataPerfundimit] = useState("");
  const [cars, setCars] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [paymentSuccessInfo, setPaymentSuccessInfo] = useState(null);

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
  }, []);

  const { notifications, unreadCount, markAllRead, dismissNotification, clearAllNotifications } = useNotifications(token, handleAvailabilityChanged, handleLiveNotification);

  // ---- URL routing (hash-based: no server rewrite needed, refresh/back/forward all just work) ----
  const VIEW_TO_HASH = {
    browse: "/", bookings: "/rezervimet", business: "/biznesi", auth: "/profili",
    verifyEmail: "/verifiko", about: "/rreth-nesh", contact: "/kontakt", careers: "/karriere",
    privacy: "/privatesia", terms: "/kushtet",
  };
  const viewToHash = (v) => VIEW_TO_HASH[v] || "/";

  const applyRoute = useCallback(async (hashStr, hint) => {
    const [path = "/", queryStr] = (hashStr || "#/").replace(/^#/, "").split("?");
    const params = new URLSearchParams(queryStr || "");
    const segs = path.split("/").filter(Boolean);

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
          body: JSON.stringify({ carId: pending.carId, dataFillimit: pending.dataFillimit, dataPerfundimit: pending.dataPerfundimit, paymentMethod: pending.method, paypalCaptureId: cap.captureId }),
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
        catch { showError(new Error("Makina nuk u gjet.")); }
      }
      return;
    }
    if (segs[0] === "kompania" && segs[1]) {
      const id = Number(segs[1]);
      setSelectedCompanyId(id);
      setView("browse");
      setStage("companyProfile");
      if (hint?.cars) {
        setCars(hint.cars);
      } else {
        try { setCars(await apiFetch("/Cars", null)); } catch { /* ignore */ }
      }
      return;
    }
    if (segs[0] === "rezultate") {
      const from = params.get("nga") || "";
      const to = params.get("deri") || "";
      setDataFillimit(from);
      setDataPerfundimit(to);
      setView("browse");
      setStage("results");
      if (hint?.cars) {
        setCars(hint.cars);
      } else if (from && to) {
        try { setCars(await apiFetch(`/Cars/available?dataFillimit=${from}&dataPerfundimit=${to}`, null)); } catch { /* ignore */ }
      }
      return;
    }
    if (segs[0] === "rezervimet") { setView("bookings"); return; }
    if (segs[0] === "biznesi") { setView("business"); setBusinessTab(params.get("tab") || "dashboard"); return; }
    if (segs[0] === "profili") { setView("auth"); return; }
    if (segs[0] === "verifiko") { setView("verifyEmail"); return; }
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
    window.history.pushState(null, "", "#" + hashStr.replace(/^#/, ""));
    applyRoute(hashStr, hint);
  }

  const applyRouteRef = useRef(applyRoute);
  useEffect(() => { applyRouteRef.current = applyRoute; }, [applyRoute]);

  useEffect(() => {
    const t = setTimeout(() => applyRoute(window.location.hash || "#/"), 0);
    function onPopState() { applyRouteRef.current(window.location.hash || "#/"); }
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
    }
  }

  function handleAuth(data) {
    const role = data.hasCompany ? "business" : "client";
    const u = { email: data.email, emri: data.emri, mbiemri: data.mbiemri, telefoni: data.telefoni, hasWhatsapp: data.hasWhatsapp, emailVerified: data.emailVerified, role };
    setToken(data.token);
    setUser(u);
    localStorage.setItem("erental_auth", JSON.stringify({ token: data.token, user: u }));
    setNotice(null);
    setVerifyData(null);
    localStorage.removeItem("erental_verify");
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
    setToken(null);
    setUser(null);
    localStorage.removeItem("erental_auth");
    go("/");
  }

  const search = useCallback(async () => {
    if (!dataFillimit || !dataPerfundimit) {
      showError(new Error("Zgjidh datat e marrjes dhe te dorezimit."));
      return;
    }
    setSearching(true);
    try {
      const data = await apiFetch(`/Cars/available?dataFillimit=${dataFillimit}&dataPerfundimit=${dataPerfundimit}`, null);
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
          onBack={() => go(`/rezultate?nga=${dataFillimit}&deri=${dataPerfundimit}`)}
          onSelectCar={(car) => go(`/makina/${car.carId}?nga=${dataFillimit}&deri=${dataPerfundimit}&nga_faqja=kompania&kompania=${selectedCompanyId}`, { car })}
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
          onSelectCompany={(id) => go(`/kompania/${id}`, { cars })}
          onGoToBookings={() => go("/rezervimet")}
          token={token}
          needAuth={() => go("/profili")}
          showError={showError}
          showOk={showOk}
          isBusinessOwner={user?.role === "business"}
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
        />
      );
    }
    return (
      <Home
        dataFillimit={dataFillimit}
        setDataFillimit={setDataFillimit}
        dataPerfundimit={dataPerfundimit}
        setDataPerfundimit={setDataPerfundimit}
        onSearch={search}
        loading={searching}
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
        user={user}
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
        {view === "bookings" && (token ? <Bookings token={token} showError={showError} showOk={showOk} highlightBookingId={highlightBookingId} refreshKey={bookingsRefreshKey} /> : <AuthGate onGo={() => go("/profili")} text="Kyçu per te pare rezervimet e tua." />)}
        {view === "business" && (token ? <Business token={token} showError={showError} showOk={showOk} isAdmin={isAdmin} tab={businessTab} setTab={(t) => { setBusinessTab(t); window.history.replaceState(null, "", "#/biznesi?tab=" + t); }} highlightBookingId={highlightBookingId} refreshKey={bookingsRefreshKey} /> : <AuthGate onGo={() => go("/profili")} text="Kyçu per te menaxhuar biznesin tend." />)}
        {view === "auth" && (
          token
            ? <ProfileView user={user} token={token} onLogout={logout} showError={showError} showOk={showOk} onVerified={markEmailVerified} onUpdated={updateUser} goToBusiness={() => go("/biznesi")} />
            : <AuthView onAuth={handleAuth} showError={showError} showOk={showOk} goTo={handleGoTo} />
        )}
        {view === "verifyEmail" && (
          <VerifyView initialData={verifyData} onAuth={handleAuth} showError={showError} showOk={showOk} goTo={(v) => go(viewToHash(v))} />
        )}
        {view === "privacy" && <Privacy />}
        {view === "terms" && <Terms />}
        {view === "careers" && <Careers showError={showError} />}
        {view === "about" && <About />}
        {view === "contact" && <Contact loggedIn={!!token} showError={showError} />}
      </div>
      <Footer setView={(v) => go(viewToHash(v))} />
      {paymentSuccessInfo && (
        <PaymentSuccessModal
          {...paymentSuccessInfo}
          onClose={() => { setPaymentSuccessInfo(null); go("/rezervimet"); }}
        />
      )}
    </div>
  );
}

function TopBar({ view, setView, user, onLogout, loggedIn, notifications, unreadCount, markAllRead, onNotificationClick, dismissNotification, clearAllNotifications, theme, toggleTheme }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const links = [
    { key: "browse", label: "Makina" },
    { key: "bookings", label: "Rezervimet" },
    { key: "business", label: "Biznesi" },
  ];
  const moreLinks = [
    { key: "about", label: "Rreth nesh" },
    { key: "contact", label: "Kontakt" },
    { key: "careers", label: "Karriere" },
  ];
  return (
    <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-20 transition-colors">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <button onClick={() => { setView("browse"); setMenuOpen(false); }} className="flex items-center">
            <Logo size={34} />
          </button>
          <nav className="hidden md:flex items-center gap-1">
            {links.map((l, i) => (
              <span key={l.key}>
                {i > 0 && " "}
                <button
                  onClick={() => setView(l.key)}
                  className={`text-sm font-medium px-3 py-1.5 rounded-lg transition ${
                    view === l.key ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
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
                  moreLinks.some((l) => l.key === view) ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                Me shume
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
            onClick={toggleTheme}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            title={theme === "dark" ? "Kalo ne dritë" : "Kalo ne erresire"}
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
                    <p className="text-xs text-slate-400 text-center py-6">Asnje njoftim ende.</p>
                  ) : (
                    <>
                      <div className="flex justify-end px-3 py-1.5 border-b border-slate-50 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800">
                        <button
                          onClick={() => clearAllNotifications()}
                          className="text-[11px] font-medium text-slate-400 hover:text-red-600"
                        >
                          Fshi te gjitha
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
            <button onClick={() => { setView("auth"); setMenuOpen(false); }} className="hidden sm:flex w-8 h-8 rounded-full bg-emerald-700 items-center justify-center text-white text-xs font-bold overflow-hidden shrink-0">
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
              className="hidden md:block rounded-xl bg-emerald-700 text-white text-sm font-semibold px-4 py-1.5 hover:bg-emerald-800 transition"
            >
              Kyçu
            </button>
          )}
          <button onClick={() => setMenuOpen((s) => !s)} className="md:hidden text-slate-600 dark:text-slate-300">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-3 flex flex-col gap-1">
          {[...links, ...moreLinks].map((l, i) => (
            <span key={l.key}>
              {i > 0 && " "}
              <button
                onClick={() => { setView(l.key); setMenuOpen(false); }}
                className={`text-sm font-medium px-3 py-2 rounded-lg text-left transition ${
                  view === l.key ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30" : "text-slate-600 dark:text-slate-300"
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
                Profili ({user?.emri})
              </button>
              <button onClick={() => { onLogout(); setMenuOpen(false); }} className="text-sm font-medium px-3 py-2 rounded-lg text-left text-red-600">
                Dil nga llogaria
              </button>
            </>
          ) : (
            <button onClick={() => { setView("auth"); setMenuOpen(false); }} className="text-sm font-semibold px-3 py-2 rounded-lg text-left text-emerald-700">
              Kyçu / Regjistrohu
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Footer({ setView }) {
  return (
    <div className="bg-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
        <Logo size={30} textClassName="text-white" />
        <div className="flex items-center gap-4">
          <button onClick={() => setView("privacy")} className="text-xs text-slate-400 hover:text-white">Privatesia</button>{" "}
          <button onClick={() => setView("terms")} className="text-xs text-slate-400 hover:text-white">Kushtet</button>{" "}
          <button onClick={() => setView("careers")} className="text-xs text-slate-400 hover:text-white">Karriere</button>{" "}
          <a href="mailto:info@erental.store" className="text-xs text-slate-400 hover:text-white">info@erental.store</a>
        </div>
        <p className="text-xs text-slate-500">Platforma e makinave me qera.</p>
      </div>
    </div>
  );
}
