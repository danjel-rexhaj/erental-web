import { Component } from "react";

const TEXT = {
  sq: { title: "Dicka shkoi keq", body: "Faqja hasi nje problem te papritur. Rifreskoje per te vazhduar.", action: "Rifresko faqen" },
  en: { title: "Something went wrong", body: "The page ran into an unexpected problem. Reload to continue.", action: "Reload the page" },
  tr: { title: "Bir şeyler ters gitti", body: "Sayfada beklenmeyen bir sorun oluştu. Devam etmek için sayfayı yenileyin.", action: "Sayfayı yenile" },
  el: { title: "Κάτι πήγε στραβά", body: "Η σελίδα αντιμετώπισε ένα απρόσμενο πρόβλημα. Ανανεώστε τη για να συνεχίσετε.", action: "Ανανέωση σελίδας" },
  de: { title: "Etwas ist schiefgelaufen", body: "Auf der Seite ist ein unerwartetes Problem aufgetreten. Lade sie neu, um fortzufahren.", action: "Seite neu laden" },
  fr: { title: "Un problème est survenu", body: "La page a rencontré un problème inattendu. Recharge-la pour continuer.", action: "Recharger la page" },
  it: { title: "Qualcosa è andato storto", body: "La pagina ha riscontrato un problema imprevisto. Ricaricala per continuare.", action: "Ricarica la pagina" },
};

// Without this, any exception thrown while rendering unmounts the whole app and leaves a blank
// white page with no way out. Reads the language straight from localStorage (same key i18n.jsx
// uses) and renders with no hooks or providers, so it still works when those are what broke.
export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error("Render error:", error, info?.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    let lang = "sq";
    try { lang = localStorage.getItem("lang") || "sq"; } catch { /* storage blocked -- keep sq */ }
    const text = TEXT[lang] || (lang === "sq" ? TEXT.sq : TEXT.en);
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900 px-6 text-center">
        <div className="max-w-xs">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{text.title}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{text.body}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-5 rounded-xl bg-sky-600 dark:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 hover:bg-sky-700 dark:hover:bg-emerald-800 transition"
          >
            {text.action}
          </button>
        </div>
      </div>
    );
  }
}
