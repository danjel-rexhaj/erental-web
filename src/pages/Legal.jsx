import { useState } from "react";
import { Briefcase, Shield, FileText, Send, CheckCircle2, Info, Mail, MessageCircle, Car as CarIcon, Users, ShieldCheck, ChevronLeft } from "lucide-react";
import { PrimaryButton, Field, inputClass } from "../components";
import { apiFetch } from "../api";
import { useLang } from "../useLang";

const SUPPORT_WHATSAPP = "447520681572";
const SUPPORT_EMAIL = "info@erental.store";

// These pages are reached from several places (footer while browsing, Profile's Support links,
// a shared link, etc.), so a real browser-history back returns to wherever the visitor actually
// came from -- e.g. straight back to Profile when that's where they opened it from.
function BackButton() {
  const { t } = useLang();
  return (
    <button onClick={() => window.history.back()} className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 mb-6">
      <ChevronLeft size={16} /> {t("common.back")}
    </button>
  );
}

export function About() {
  const { t } = useLang();
  return (
    <div className="max-w-2xl mx-auto py-8">
      <BackButton />
      <div className="flex items-center gap-2 mb-1"><Info size={20} className="text-sky-600 dark:text-emerald-400" /><h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t("legal.about.title")}</h1></div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">{t("legal.about.subtitle")}</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-center">
          <CarIcon size={22} className="mx-auto text-sky-600 dark:text-emerald-400 mb-2" />
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t("legal.about.compareTitle")}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t("legal.about.compareBody")}</p>
        </div>
        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-center">
          <ShieldCheck size={22} className="mx-auto text-sky-600 dark:text-emerald-400 mb-2" />
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t("legal.about.verifiedTitle")}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t("legal.about.verifiedBody")}</p>
        </div>
        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-center">
          <Users size={22} className="mx-auto text-sky-600 dark:text-emerald-400 mb-2" />
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t("legal.about.noMiddlemanTitle")}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t("legal.about.noMiddlemanBody")}</p>
        </div>
      </div>

      <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        <p>{t("legal.about.p1")}</p>
        <p>{t("legal.about.p2")}</p>
        <p>{t("legal.about.p3")}</p>
        <p>{t("legal.about.p4")}</p>
      </div>
    </div>
  );
}

export function Contact() {
  const { t } = useLang();
  return (
    <div className="max-w-sm mx-auto py-12 text-center">
      <div className="text-left"><BackButton /></div>
      <div className="flex items-center justify-center gap-2 mb-1"><Mail size={20} className="text-sky-600 dark:text-emerald-400" /><h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t("legal.contact.title")}</h1></div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">{t("legal.contact.subtitle")}</p>

      <div className="flex flex-col gap-4">
        <a
          href={`https://wa.me/${SUPPORT_WHATSAPP}`}
          target="_blank"
          rel="noreferrer"
          className="flex flex-col items-center gap-1.5 rounded-2xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 py-8 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition"
        >
          <MessageCircle size={28} />
          <span className="text-base font-bold">WhatsApp</span>
          <span className="text-xs text-emerald-600 dark:text-emerald-400">{t("legal.contact.fastestReply")}</span>
        </a>
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="flex flex-col items-center gap-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 py-8 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
        >
          <Mail size={28} />
          <span className="text-base font-bold">Email</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">{SUPPORT_EMAIL}</span>
        </a>
      </div>
    </div>
  );
}

export function Privacy() {
  const { t } = useLang();
  return (
    <div className="max-w-2xl mx-auto py-8">
      <BackButton />
      <div className="flex items-center gap-2 mb-1"><Shield size={20} className="text-sky-600 dark:text-emerald-400" /><h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t("legal.privacy.title")}</h1></div>
      <p className="text-xs text-slate-400 mb-6">{t("legal.lastUpdated")}</p>

      <div className="space-y-5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        <section>
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{t("legal.privacy.s1Title")}</h2>
          <p>{t("legal.privacy.s1Body")}</p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{t("legal.privacy.s2Title")}</h2>
          <p>{t("legal.privacy.s2Body")}</p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{t("legal.privacy.s3Title")}</h2>
          <p>{t("legal.privacy.s3Body")}</p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{t("legal.privacy.s4Title")}</h2>
          <p>{t("legal.privacy.s4Body")}</p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{t("legal.privacy.s5Title")}</h2>
          <p>{t("legal.privacy.contactPrefix")} <a href={`mailto:${SUPPORT_EMAIL}`} className="text-sky-600 dark:text-emerald-400 underline">{SUPPORT_EMAIL}</a></p>
        </section>
      </div>
    </div>
  );
}

export function Terms() {
  const { t } = useLang();
  return (
    <div className="max-w-2xl mx-auto py-8">
      <BackButton />
      <div className="flex items-center gap-2 mb-1"><FileText size={20} className="text-sky-600 dark:text-emerald-400" /><h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t("legal.terms.title")}</h1></div>
      <p className="text-xs text-slate-400 mb-6">{t("legal.lastUpdated")}</p>

      <div className="space-y-5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        <section className="bg-sky-50 dark:bg-emerald-900/20 border border-sky-200 dark:border-emerald-800/60 rounded-xl p-4">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{t("legal.terms.marketplaceTitle")}</h2>
          <p>{t("legal.terms.marketplaceBody1")} <strong>{t("legal.terms.marketplaceBodyBold")}</strong> {t("legal.terms.marketplaceBody2")}</p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{t("legal.terms.s1Title")}</h2>
          <p>{t("legal.terms.s1Body")}</p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{t("legal.terms.s2Title")}</h2>
          <p>{t("legal.terms.s2Body1")} <strong>{t("legal.terms.s2BodyBold")}</strong> {t("legal.terms.s2Body2")}</p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{t("legal.terms.s3Title")}</h2>
          <p>{t("legal.terms.s3Body")}</p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{t("legal.terms.s4Title")}</h2>
          <p>{t("legal.terms.s4Body")}</p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{t("legal.terms.s5Title")}</h2>
          <p>{t("legal.terms.s5Body")}</p>
        </section>
      </div>
    </div>
  );
}

export function Careers({ showError }) {
  const { t } = useLang();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ emri: "", email: "", pozicioni: "", mesazhi: "" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/Contact", null, {
        method: "POST",
        body: JSON.stringify({
          emri: form.emri,
          email: form.email,
          subjekti: `${t("legal.careers.applicationSubject")}${form.pozicioni ? " — " + form.pozicioni : ""}`,
          mesazhi: form.mesazhi,
        }),
      });
      setSent(true);
    } catch (e) { showError && showError(e); } finally { setLoading(false); }
  }

  if (sent) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <div className="text-left"><BackButton /></div>
        <CheckCircle2 size={32} className="mx-auto text-sky-600 dark:text-emerald-400 mb-3" />
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t("legal.careers.thanksTitle")}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{t("legal.careers.thanksBody")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <BackButton />
      <div className="flex items-center gap-2 mb-1"><Briefcase size={20} className="text-sky-600 dark:text-emerald-400" /><h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t("legal.careers.title")}</h1></div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{t("legal.careers.subtitle")}</p>
      <a href={`mailto:${SUPPORT_EMAIL}`} className="text-xs text-sky-600 dark:text-emerald-400 underline">{SUPPORT_EMAIL}</a>
      <form onSubmit={submit} className="mt-4">
        <Field label={t("legal.careers.fullName")}><input required className={inputClass} value={form.emri} onChange={set("emri")} placeholder={t("legal.careers.namePlaceholder")} /></Field>
        <Field label="Email"><input required type="email" className={inputClass} value={form.email} onChange={set("email")} placeholder="ti@email.com" /></Field>
        <Field label={t("legal.careers.desiredPosition")}><input className={inputClass} value={form.pozicioni} onChange={set("pozicioni")} placeholder={t("legal.careers.positionPlaceholder")} /></Field>
        <Field label={t("legal.careers.shortMessage")}>
          <textarea required className={inputClass} rows={4} value={form.mesazhi} onChange={set("mesazhi")} placeholder={t("legal.careers.messagePlaceholder")} />
        </Field>
        <PrimaryButton type="submit" disabled={loading} className="flex items-center justify-center gap-2">
          <Send size={14} /> {loading ? t("common.sending") : t("legal.careers.submit")}
        </PrimaryButton>
      </form>
    </div>
  );
}
