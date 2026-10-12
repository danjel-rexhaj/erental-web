import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { API_BASE, apiFetch } from "./api";
import { useLang } from "./useLang";

const QUICK_QUESTIONS = ["chat.q1", "chat.q2", "chat.q3", "chat.q4"];

// Floating support assistant. The backend only answers once its AI key is configured, so the
// widget asks first and renders nothing at all otherwise -- never a launcher that leads nowhere.
export default function SupportChat() {
  const { lang, t } = useLang();
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const launcherRef = useRef(null);
  const [covering, setCovering] = useState(false);

  useEffect(() => {
    apiFetch("/Support/status", null).then((d) => setEnabled(!!d?.enabled)).catch(() => {});
  }, []);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, loading, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // The launcher floats over the page, so wherever the visitor scrolls it could land on top of a
  // real control -- a Pay button, the PayPal card form, a form field. Whenever one is underneath,
  // the launcher steps aside (fades out and lets taps through) until the page moves on. Popups sit
  // above it anyway (z-50 and up); this covers everything inline.
  useEffect(() => {
    if (!enabled || open) return;
    function check() {
      const el = launcherRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const points = [[r.left + r.width / 2, r.top + r.height / 2], [r.left + 4, r.top + 4], [r.right - 4, r.top + 4], [r.left + 4, r.bottom - 4], [r.right - 4, r.bottom - 4]];
      const blocked = points.some(([x, y]) => document.elementsFromPoint(x, y).some((under) => {
        if (under === el || el.contains(under)) return false;
        if (under.tagName === "IFRAME") return true;
        // Small controls only: a whole car card is clickable too, and hiding over those would
        // leave the launcher invisible on most of the results page.
        return under.matches('button, a, input, select, textarea, [role="button"]') && under.getBoundingClientRect().height <= 80;
      }));
      setCovering(blocked);
    }
    check();
    const timer = setInterval(check, 400);
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      clearInterval(timer);
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [enabled, open]);

  async function send(text) {
    const question = text.trim();
    if (!question || loading) return;
    const next = [...messages, { role: "user", text: question }];
    setMessages(next);
    setDraft("");
    setLoading(true);
    try {
      // Plain fetch (not apiFetch): the reply to show depends on the status code, and a 401 handler
      // has no business here -- this endpoint is public.
      const res = await fetch(`${API_BASE}/Support/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // `local` bubbles are our own error notes, not part of the conversation the assistant sees.
        body: JSON.stringify({ lang, messages: next.filter((m) => !m.local).map(({ role, text }) => ({ role, text })) }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.reply) setMessages((prev) => [...prev, { role: "model", text: data.reply }]);
      else setMessages((prev) => [...prev, { role: "model", local: true, text: t(res.status === 429 ? "chat.limit" : "chat.error") }]);
    } catch {
      setMessages((prev) => [...prev, { role: "model", local: true, text: t("chat.error") }]);
    } finally {
      setLoading(false);
    }
  }

  if (!enabled) return null;

  if (!open) {
    return (
      <button
        ref={launcherRef}
        onClick={() => setOpen(true)}
        aria-label={t("chat.open")}
        className={`fixed right-2 sm:right-4 bottom-[max(0.5rem,env(safe-area-inset-bottom))] sm:bottom-4 z-40 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-sky-600 dark:bg-emerald-700 text-white shadow-lg shadow-slate-900/20 flex items-center justify-center hover:bg-sky-700 dark:hover:bg-emerald-800 active:scale-95 transition ${covering ? "opacity-0 pointer-events-none" : ""}`}
      >
        <MessageCircle size={20} />
      </button>
    );
  }

  // Phones: a small card docked in the bottom corner, never the whole screen. Desktop: floating.
  return (
    <div className="fixed right-2 sm:right-4 bottom-[env(safe-area-inset-bottom)] sm:bottom-4 z-40 w-[min(19rem,calc(100vw-1rem))] sm:w-[360px] h-[24rem] sm:h-[480px] max-h-[58vh] sm:max-h-[75vh] flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-900/25">
      <div className="flex items-center gap-2.5 px-3.5 py-3 bg-sky-600 dark:bg-emerald-700 text-white shrink-0">
        <span className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0"><MessageCircle size={18} /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold leading-tight">{t("chat.title")}</span>
          <span className="block text-xs opacity-85 truncate">{t("chat.subtitle")}</span>
        </span>
        <button onClick={() => setOpen(false)} aria-label={t("chat.close")} className="p-1 opacity-90 hover:opacity-100 shrink-0"><X size={18} /></button>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        <Bubble role="model">{t("chat.greeting")}</Bubble>
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {QUICK_QUESTIONS.map((key) => (
              <button
                key={key}
                onClick={() => send(t(key))}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-600 text-sky-600 dark:text-emerald-400 hover:bg-sky-50 dark:hover:bg-slate-700 transition"
              >
                {t(key)}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => <Bubble key={i} role={m.role}>{m.text}</Bubble>)}
        {loading && (
          <Bubble role="model">
            <span className="inline-flex gap-1 py-1" aria-label={t("chat.typing")}>
              {[0, 150, 300].map((delay) => (
                <span key={delay} className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${delay}ms` }} />
              ))}
            </span>
          </Bubble>
        )}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(draft); }}
        className="flex items-center gap-2 px-3 py-2.5 border-t border-slate-200 dark:border-slate-700 shrink-0"
      >
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={500}
          placeholder={t("chat.placeholder")}
          // 16px on phones: iOS zooms the whole page into any focused input smaller than that.
          className="flex-1 min-w-0 text-base sm:text-sm rounded-full px-3.5 py-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-emerald-500"
        />
        <button
          type="submit"
          disabled={loading || !draft.trim()}
          aria-label={t("chat.send")}
          className="w-9 h-9 rounded-full bg-sky-600 dark:bg-emerald-700 text-white flex items-center justify-center shrink-0 hover:bg-sky-700 dark:hover:bg-emerald-800 transition disabled:opacity-40 disabled:pointer-events-none"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

function Bubble({ role, children }) {
  return (
    <div
      className={`max-w-[85%] px-3 py-2 text-sm leading-snug whitespace-pre-wrap break-words ${
        role === "user"
          ? "self-end rounded-2xl rounded-br-md bg-sky-600 dark:bg-emerald-700 text-white"
          : "self-start rounded-2xl rounded-bl-md bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100"
      }`}
    >
      {children}
    </div>
  );
}
