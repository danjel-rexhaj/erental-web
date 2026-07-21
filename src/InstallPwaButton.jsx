import { useState, useEffect } from "react";
import { Download, Share, X, PlusSquare } from "lucide-react";

// Android/Chrome (and desktop Chrome/Edge) fire beforeinstallprompt for an installable PWA — we
// capture it so our own button can trigger the native install dialog with one click. iOS Safari
// has no such API at all (Apple restricts "Add to Home Screen" to the manual Share-sheet action),
// so there we can only show instructions instead of a real one-click install.
export function InstallPwaButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
    setIsStandalone(standalone);
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);

    function onBeforeInstall(e) {
      e.preventDefault();
      setDeferredPrompt(e);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    function onInstalled() {
      setIsStandalone(true);
      setDeferredPrompt(null);
    }
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (isStandalone) return null;
  if (!deferredPrompt && !isIOS) return null;

  async function handleClick() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return;
    }
    setShowIosHelp(true);
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-700 rounded-full px-3 py-1.5 hover:bg-emerald-800 transition whitespace-nowrap shrink-0"
        title="Shkarko ERental si aplikacion"
      >
        <Download size={13} /> Shkarko App
      </button>

      {showIosHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setShowIosHelp(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 max-w-sm w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Shto ERental ne ekranin kryesor</h3>
              <button onClick={() => setShowIosHelp(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"><X size={16} /></button>
            </div>
            <ol className="text-sm text-slate-600 dark:text-slate-300 space-y-4">
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center justify-center mt-0.5">1</span>
                <span>Shtyp ikonen <Share size={15} className="inline mx-0.5 -mt-0.5" /> "Share" poshte ne Safari.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center justify-center mt-0.5">2</span>
                <span>Zgjidh <PlusSquare size={15} className="inline mx-0.5 -mt-0.5" /> "Add to Home Screen".</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center justify-center mt-0.5">3</span>
                <span>Shtyp "Add" — gati, ikona ERental del ne ekranin tend.</span>
              </li>
            </ol>
          </div>
        </div>
      )}
    </>
  );
}
