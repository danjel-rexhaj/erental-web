import { useState, useCallback } from "react";
import { LogOut, Menu, X, Bell } from "lucide-react";
import { apiFetch, decodeJwt, todayPlus } from "./api";
import { useNotifications } from "./notifications";
import { Logo } from "./Logo";
import { Notice } from "./components";
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

  // Browse flow state lives here so it persists across sub-page navigation
  const [stage, setStage] = useState("landing"); // landing | results | carDetail | companyProfile
  const [carDetailFrom, setCarDetailFrom] = useState("results"); // results | companyProfile
  const [dataFillimit, setDataFillimit] = useState(todayPlus(2));
  const [dataPerfundimit, setDataPerfundimit] = useState(todayPlus(5));
  const [cars, setCars] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);

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

  function handleNotificationClick(n) {
    setHighlightBookingId(n.bookingId ?? null);
    window.clearTimeout(window.__highlightTimeout);
    window.__highlightTimeout = window.setTimeout(() => setHighlightBookingId(null), 3000);
    if (n.target === "business_booking") {
      setBusinessTab("bookings");
      setView("business");
    } else if (n.target === "client_booking" || n.target === "leave_review") {
      setView("bookings");
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
    setView(role === "business" ? "business" : "browse");
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
    setView("browse");
  }

  const search = useCallback(async () => {
    setSearching(true);
    try {
      const data = await apiFetch(`/Cars/available?dataFillimit=${dataFillimit}&dataPerfundimit=${dataPerfundimit}`, null);
      setCars(data);
      setStage("results");
    } catch (e) { showError(e); } finally { setSearching(false); }
  }, [dataFillimit, dataPerfundimit]);

  const backToResults = useCallback(async () => {
    setStage("results");
    try {
      const data = await apiFetch(`/Cars/available?dataFillimit=${dataFillimit}&dataPerfundimit=${dataPerfundimit}`, null);
      setCars(data);
    } catch { /* mban rezultatet e vjetra nese rifreskimi deshton */ }
  }, [dataFillimit, dataPerfundimit]);

  function goBrowseHome() {
    setView("browse");
    setStage("landing");
    setSelectedCar(null);
    setSelectedCompanyId(null);
  }

  function goToBookingsAfterBooking() {
    setStage("landing");
    setSelectedCar(null);
    setSelectedCompanyId(null);
    setView("bookings");
  }

  function renderBrowse() {
    if (stage === "companyProfile" && selectedCompanyId) {
      const companyCars = cars.filter((c) => c.companyId === selectedCompanyId);
      const company = companyCars[0]?.company;
      return (
        <CompanyProfile
          company={company}
          cars={companyCars}
          onBack={() => setStage("results")}
          onSelectCar={(car) => { setSelectedCar(car); setCarDetailFrom("companyProfile"); setStage("carDetail"); }}
        />
      );
    }
    if (stage === "carDetail" && selectedCar) {
      return (
        <CarDetail
          car={selectedCar}
          dataFillimit={dataFillimit}
          dataPerfundimit={dataPerfundimit}
          onBack={carDetailFrom === "companyProfile" ? () => setStage("companyProfile") : backToResults}
          onSelectCompany={(id) => { setSelectedCompanyId(id); setStage("companyProfile"); }}
          onGoToBookings={goToBookingsAfterBooking}
          token={token}
          needAuth={() => setView("auth")}
          showError={showError}
          showOk={showOk}
        />
      );
    }
    if (stage === "results") {
      return (
        <Results
          cars={cars}
          dataFillimit={dataFillimit}
          dataPerfundimit={dataPerfundimit}
          onBack={() => setStage("landing")}
          onSelectCar={(car) => { setSelectedCar(car); setCarDetailFrom("results"); setStage("carDetail"); }}
          onSelectCompany={(id) => { setSelectedCompanyId(id); setStage("companyProfile"); }}
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
    setView(page);
  }

  return (
    <div className="w-full min-h-screen bg-slate-50 flex flex-col">
      <TopBar
        view={view}
        setView={(v) => (v === "browse" ? goBrowseHome() : setView(v))}
        user={user}
        onLogout={logout}
        loggedIn={!!token}
        notifications={notifications}
        unreadCount={unreadCount}
        markAllRead={markAllRead}
        onNotificationClick={handleNotificationClick}
        dismissNotification={dismissNotification}
        clearAllNotifications={clearAllNotifications}
      />
      <Notice notice={notice} onClose={() => setNotice(null)} />
      <div className="max-w-6xl mx-auto px-6 py-8 flex-1 w-full">
        {view === "browse" && renderBrowse()}
        {view === "bookings" && (token ? <Bookings token={token} showError={showError} showOk={showOk} highlightBookingId={highlightBookingId} refreshKey={bookingsRefreshKey} /> : <AuthGate onGo={() => setView("auth")} text="Kyçu per te pare rezervimet e tua." />)}
        {view === "business" && (token ? <Business token={token} showError={showError} showOk={showOk} isAdmin={isAdmin} tab={businessTab} setTab={setBusinessTab} highlightBookingId={highlightBookingId} refreshKey={bookingsRefreshKey} /> : <AuthGate onGo={() => setView("auth")} text="Kyçu per te menaxhuar biznesin tend." />)}
        {view === "auth" && (
          token
            ? <ProfileView user={user} token={token} onLogout={logout} showError={showError} showOk={showOk} onVerified={markEmailVerified} onUpdated={updateUser} />
            : <AuthView onAuth={handleAuth} showError={showError} showOk={showOk} goTo={handleGoTo} />
        )}
        {view === "verifyEmail" && (
          <VerifyView initialData={verifyData} onAuth={handleAuth} showError={showError} showOk={showOk} goTo={setView} />
        )}
        {view === "privacy" && <Privacy />}
        {view === "terms" && <Terms />}
        {view === "careers" && <Careers showError={showError} />}
        {view === "about" && <About />}
        {view === "contact" && <Contact loggedIn={!!token} showError={showError} />}
      </div>
      <Footer setView={setView} />
    </div>
  );
}

function TopBar({ view, setView, user, onLogout, loggedIn, notifications, unreadCount, markAllRead, onNotificationClick, dismissNotification, clearAllNotifications }) {
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
    <div className="border-b border-slate-200 bg-slate-50/95 backdrop-blur-md sticky top-0 z-20">
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
                    view === l.key ? "text-emerald-700 bg-emerald-50" : "text-slate-500 hover:text-slate-900"
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
                  moreLinks.some((l) => l.key === view) ? "text-emerald-700 bg-emerald-50" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Me shume
              </button>
              {moreOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg py-1 w-40 z-30">
                  {moreLinks.map((l, i) => (
                    <span key={l.key}>
                      {i > 0 && " "}
                      <button
                        onClick={() => { setView(l.key); setMoreOpen(false); }}
                        className="w-full text-left text-sm text-slate-600 hover:bg-slate-50 px-3 py-2"
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
          {loggedIn && (
            <div className="relative">
              <button
                onClick={() => { setNotifOpen((s) => !s); if (!notifOpen) markAllRead(); }}
                onBlur={() => setTimeout(() => setNotifOpen(false), 200)}
                className="relative text-slate-500 hover:text-slate-900"
              >
                <Bell size={19} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute top-full right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg w-72 max-h-96 overflow-y-auto z-30">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">Asnje njoftim ende.</p>
                  ) : (
                    <>
                      <div className="flex justify-end px-3 py-1.5 border-b border-slate-50 sticky top-0 bg-white">
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
                          className="px-4 py-3 border-b border-slate-50 last:border-0 flex items-start justify-between gap-2 cursor-pointer hover:bg-slate-50"
                        >
                          <div>
                            <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
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
            <button onClick={() => { setView("auth"); setMenuOpen(false); }} className="hidden sm:flex w-8 h-8 rounded-full bg-emerald-700 items-center justify-center text-white text-xs font-bold">
              {user?.emri?.[0]?.toUpperCase() || "?"}
            </button>
          )}
          {loggedIn ? (
            <button onClick={onLogout} className="hidden md:block text-slate-400 hover:text-slate-700"><LogOut size={16} /></button>
          ) : (
            <button
              onClick={() => setView("auth")}
              className="hidden md:block rounded-xl bg-emerald-700 text-white text-sm font-semibold px-4 py-1.5 hover:bg-emerald-800 transition"
            >
              Kyçu
            </button>
          )}
          <button onClick={() => setMenuOpen((s) => !s)} className="md:hidden text-slate-600">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-6 py-3 flex flex-col gap-1">
          {[...links, ...moreLinks].map((l, i) => (
            <span key={l.key}>
              {i > 0 && " "}
              <button
                onClick={() => { setView(l.key); setMenuOpen(false); }}
                className={`text-sm font-medium px-3 py-2 rounded-lg text-left transition ${
                  view === l.key ? "text-emerald-700 bg-emerald-50" : "text-slate-600"
                }`}
              >
                {l.label}
              </button>
            </span>
          ))}
          <div className="border-t border-slate-100 my-1" />
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
