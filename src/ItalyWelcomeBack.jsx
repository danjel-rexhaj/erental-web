import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Logo } from "./Logo";

// Re-engagement popup for visitors browsing from Italy -- we used to have real Italian clients
// who drifted away, and search traffic from Italy picked back up recently, so this is a warm
// "we're still here" nudge, not a functional prompt. Shown once per browser session (matches the
// existing sessionStorage caching pattern used for PayPal locale detection in CarAndCompany.jsx),
// and only once ever per browser via localStorage so repeat visitors aren't pestered every visit.
export default function ItalyWelcomeBack() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("itWelcomeChecked")) return;
    sessionStorage.setItem("itWelcomeChecked", "1");
    if (localStorage.getItem("itWelcomeShown")) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("https://ipapi.co/country/");
        const country = (await res.text()).trim().toUpperCase();
        if (!cancelled && country === "IT") {
          localStorage.setItem("itWelcomeShown", "1");
          setShow(true);
        }
      } catch {
        /* geolocation lookup failed -- fail silently, no popup */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4" onClick={() => setShow(false)}>
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full text-center shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setShow(false)}
          className="float-right text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 -mt-1 -mr-1"
        >
          <X size={18} />
        </button>
        <div className="flex justify-center mb-3">
          <Logo size={40} />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Bentornato! 👋</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">La porta di ERental è ancora aperta.</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">Welcome back — the door is open. Thanks for still caring.</p>
        <button
          onClick={() => setShow(false)}
          className="mt-5 text-sm font-semibold text-white bg-sky-600 dark:bg-emerald-600 hover:bg-sky-700 dark:hover:bg-emerald-700 rounded-xl px-5 py-2.5 transition"
        >
          Grazie!
        </button>
      </div>
    </div>
  );
}
