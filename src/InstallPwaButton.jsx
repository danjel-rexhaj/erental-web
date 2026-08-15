import { useState, useEffect } from "react";
import { Download, Share, X, PlusSquare } from "lucide-react";
import { useLang } from "./useLang";

// Android/Chrome (and desktop Chrome/Edge) fire beforeinstallprompt for an installable PWA — we
// capture it so our own button can trigger the native install dialog with one click. iOS Safari
// has no such API at all (Apple restricts "Add to Home Screen" to the manual Share-sheet action).
// Samsung Internet is the third case: it doesn't reliably fire beforeinstallprompt either, but
// unlike iOS it's not detectable up front — so instead of hiding the button (which used to mean
// no install option ever appeared there), we give the event a grace period and fall back to
// generic "use your browser's menu" instructions if it never arrives.
export function InstallPwaButton() {
  const { t } = useLang();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [promptGraceElapsed, setPromptGraceElapsed] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

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

    const graceTimer = setTimeout(() => setPromptGraceElapsed(true), 2500);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      clearTimeout(graceTimer);
    };
  }, []);

  if (isStandalone) return null;
  if (!deferredPrompt && !isIOS && !promptGraceElapsed) return null;

  async function handleClick() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return;
    }
    setShowHelp(true);
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="flex items-center gap-1.5 text-xs font-semibold text-white bg-sky-600 dark:bg-emerald-700 rounded-full px-3 py-1.5 hover:bg-sky-700 dark:hover:bg-emerald-800 transition whitespace-nowrap shrink-0"
        title={t("pwa.downloadTitle")}
      >
        <Download size={13} /> {t("pwa.downloadApp")}
      </button>

      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setShowHelp(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 max-w-sm w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{t("pwa.addToHomeScreen")}</h3>
              <button onClick={() => setShowHelp(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"><X size={16} /></button>
            </div>
            {isIOS ? (
              <ol className="text-sm text-slate-700 dark:text-slate-200 space-y-4">
                <li className="flex items-center gap-3">
                  <span className="shrink-0 w-8 h-8 rounded-full bg-sky-600 dark:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center">1</span>
                  <span className="flex items-center gap-1.5 flex-wrap">{t("pwa.step1Before")} <Share size={16} className="text-sky-600 dark:text-emerald-400" /> {t("pwa.step1After")}</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="shrink-0 w-8 h-8 rounded-full bg-sky-600 dark:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center">2</span>
                  <span className="flex items-center gap-1.5 flex-wrap">{t("pwa.step2Before")} <PlusSquare size={16} className="text-sky-600 dark:text-emerald-400" /> {t("pwa.step2After")}</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="shrink-0 w-8 h-8 rounded-full bg-sky-600 dark:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center">3</span>
                  <span>{t("pwa.step3")}</span>
                </li>
              </ol>
            ) : (
              <ol className="text-sm text-slate-700 dark:text-slate-200 space-y-4">
                <li className="flex items-center gap-3">
                  <span className="shrink-0 w-8 h-8 rounded-full bg-sky-600 dark:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center">1</span>
                  <span>{t("pwa.genericStep1")}</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="shrink-0 w-8 h-8 rounded-full bg-sky-600 dark:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center">2</span>
                  <span>{t("pwa.genericStep2")}</span>
                </li>
              </ol>
            )}
          </div>
        </div>
      )}
    </>
  );
}
