import { useState, useEffect } from "react";
import { Lock, MailCheck, ShieldCheck, Phone, MessageCircle, Calendar, Pencil, KeyRound, Camera, Building2, ArrowRight, ChevronRight, LogOut, AlertTriangle, Upload, HelpCircle, FileText, Car, Trash2 } from "lucide-react";
import { apiFetch, apiFetchBlob } from "../api";
import { Field, PrimaryButton, GhostButton, inputClass } from "../components";
import { NATIONALITIES } from "../carData";
import { useLang } from "../useLang";
import { monthName } from "../dateFormat";

function memberSince(raw, lang) {
  if (!raw) return null;
  const d = new Date(raw);
  if (isNaN(d)) return null;
  return `${monthName(d.getMonth(), lang)} ${d.getFullYear()}`;
}

function looksAlbanian(phone) {
  // Albanian mobiles are always 067/068/069 followed by exactly 7 more digits (10 digits total
  // with the leading 0, e.g. 068 123 4567) -- not a loose 8-9 digit range.
  const digits = (phone || "").replace(/[\s-]/g, "");
  return /^(\+355|00355|0)6[789]\d{7}$/.test(digits);
}

const PHONE_PREFIXES = [
  { code: "+355", flag: "🇦🇱" },
  { code: "+383", flag: "🇽🇰" },
  { code: "+389", flag: "🇲🇰" },
  { code: "+382", flag: "🇲🇪" },
  { code: "+30", flag: "🇬🇷" },
  { code: "+39", flag: "🇮🇹" },
  { code: "+49", flag: "🇩🇪" },
  { code: "+41", flag: "🇨🇭" },
  { code: "+44", flag: "🇬🇧" },
  { code: "+1", flag: "🇺🇸" },
];

export function AuthGate({ onGo, text }) {
  const { t } = useLang();
  return (
    <div className="flex flex-col items-center justify-center text-center px-8 py-20 gap-4">
      <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-emerald-900/30 flex items-center justify-center"><Lock size={22} className="text-sky-600 dark:text-emerald-400" /></div>
      <p className="text-sm text-slate-500 dark:text-slate-400">{text}</p>
      <PrimaryButton onClick={onGo} className="max-w-[160px]">{t("nav.login")}</PrimaryButton>
    </div>
  );
}

// Shown instead of the generic AuthGate when a logged-out visitor clicks "Biznesi" -- offers the
// direct business-signup entry point instead of only ever pointing at the login screen.
export function BusinessAuthGate({ onRegister, onLogin }) {
  const { t } = useLang();
  return (
    <div className="flex flex-col items-center justify-center text-center px-8 py-20 gap-4">
      <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-emerald-900/30 flex items-center justify-center"><Building2 size={22} className="text-sky-600 dark:text-emerald-400" /></div>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">{t("app.needLoginFor", { feature: t("app.featureManageBusiness") })}</p>
      <div className="flex flex-col gap-2 w-full max-w-[220px]">
        <PrimaryButton onClick={onRegister}>{t("business.registerAsBusinessCta")}</PrimaryButton>
        <GhostButton onClick={onLogin}>{t("business.alreadyHaveAccountCta")}</GhostButton>
      </div>
    </div>
  );
}

export function AuthView({ onAuth, showError, showOk, goTo, businessMode = false }) {
  const { t } = useLang();
  const [mode, setMode] = useState(businessMode ? "register" : "login");
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [hasWhatsapp, setHasWhatsapp] = useState(false);
  const [form, setForm] = useState({ emri: "", mbiemri: "", email: "", password: "", telefoni: "", telefoniPrefix: "+355", kombesia: "Shqiperi" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const [forgotStep, setForgotStep] = useState("request");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotCode, setForgotCode] = useState("");
  const [forgotPassword, setForgotPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (mode === "register" && !acceptTerms) {
      showError(new Error(t("auth.termsRequired")));
      return;
    }
    setLoading(true);
    try {
      if (mode === "register") {
        const { telefoniPrefix, ...rest } = form;
        const telefoni = telefoniPrefix === "+355" ? form.telefoni : `${telefoniPrefix}${form.telefoni.replace(/^0+/, "")}`;
        await apiFetch("/Auth/register", null, { method: "POST", body: JSON.stringify({ ...rest, telefoni, hasWhatsapp }) });
        goTo("verifyEmail", { email: form.email, emri: form.emri });
      } else {
        const data = await apiFetch("/Auth/login", null, { method: "POST", body: JSON.stringify({ email: form.email, password: form.password }) });
        onAuth(data);
      }
    } catch (e) { showError(e); } finally { setLoading(false); }
  }

  async function requestReset(e) {
    e.preventDefault();
    setForgotLoading(true);
    try {
      await apiFetch("/Auth/forgot-password", null, { method: "POST", body: JSON.stringify({ email: forgotEmail }) });
      setForgotStep("confirm");
    } catch (e) { showError(e); } finally { setForgotLoading(false); }
  }

  async function confirmReset(e) {
    e.preventDefault();
    setForgotLoading(true);
    try {
      await apiFetch("/Auth/reset-password", null, { method: "POST", body: JSON.stringify({ email: forgotEmail, code: forgotCode, newPassword: forgotPassword }) });
      showOk && showOk(t("auth.passwordChanged"));
      setMode("login");
      setForgotStep("request");
      setForgotEmail(""); setForgotCode(""); setForgotPassword("");
    } catch (e) { showError(e); } finally { setForgotLoading(false); }
  }

  if (mode === "forgot") {
    return (
      <div className="max-w-md mx-auto py-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">{t("auth.resetPasswordTitle")}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          {forgotStep === "request" ? t("auth.resetRequestHint") : t("auth.resetConfirmHint", { email: forgotEmail })}
        </p>
        {forgotStep === "request" ? (
          <form onSubmit={requestReset}>
            <Field label="Email"><input required type="email" className={inputClass} value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="ti@email.com" /></Field>
            <PrimaryButton type="submit" disabled={forgotLoading} className="mt-2">{forgotLoading ? t("common.sending") : t("auth.sendCodeDefinite")}</PrimaryButton>
          </form>
        ) : (
          <form onSubmit={confirmReset}>
            <Field label={t("auth.codeLabel")}><input required autoComplete="one-time-code" inputMode="numeric" className={`${inputClass} text-center text-lg tracking-[0.3em]`} value={forgotCode} onChange={(e) => setForgotCode(e.target.value)} maxLength={6} placeholder="123456" /></Field>
            <Field label={t("auth.newPasswordLabel")}><input required type="password" className={inputClass} value={forgotPassword} onChange={(e) => setForgotPassword(e.target.value)} placeholder="••••••••" /></Field>
            <PrimaryButton type="submit" disabled={forgotLoading} className="mt-2">{forgotLoading ? t("auth.changing") : t("auth.changePassword")}</PrimaryButton>
          </form>
        )}
        <button onClick={() => { setMode("login"); setForgotStep("request"); }} className="w-full text-center text-xs text-slate-500 dark:text-slate-400 mt-4">
          {t("auth.backTo")} <span className="text-sky-600 dark:text-emerald-400 font-semibold underline">{t("nav.login")}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
        {mode === "login" ? t("auth.welcomeBack") : businessMode ? t("auth.createBusinessAccount") : t("auth.createAccount")}
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        {mode === "login" ? t("auth.loginToContinue") : businessMode ? t("auth.businessAccountHint") : t("auth.registerToStart")}
      </p>
      <form onSubmit={submit}>
        {mode === "register" && (
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("auth.firstName")}><input required className={inputClass} value={form.emri} onChange={set("emri")} placeholder="Andi" /></Field>
            <Field label={t("auth.lastName")}><input required className={inputClass} value={form.mbiemri} onChange={set("mbiemri")} placeholder="Krasniqi" /></Field>
          </div>
        )}
        <Field label="Email"><input required type="email" className={inputClass} value={form.email} onChange={set("email")} placeholder="ti@email.com" /></Field>
        {mode === "register" && (
          <Field label={t("auth.phone")}>
            <div className="grid gap-1.5" style={{ gridTemplateColumns: "6rem 1fr" }}>
              <select className={inputClass} value={form.telefoniPrefix} onChange={set("telefoniPrefix")}>
                {PHONE_PREFIXES.map((p) => <option key={p.code} value={p.code}>{p.flag} {p.code}</option>)}
              </select>
              <input required className={inputClass} value={form.telefoni} onChange={set("telefoni")} placeholder={form.telefoniPrefix === "+355" ? "0691234567" : "691234567"} />
            </div>
          </Field>
        )}
        {mode === "register" && (
          <Field label={t("auth.nationality")}>
            <select className={inputClass} value={form.kombesia} onChange={set("kombesia")}>
              {NATIONALITIES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </Field>
        )}
        {mode === "register" && form.telefoniPrefix === "+355" && form.telefoni && !looksAlbanian(form.telefoni) && (
          <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 mb-3">
            {t("auth.phoneNotAlbanianWarning")}
          </p>
        )}
        {mode === "register" && (
          <label className="flex items-center gap-2 mb-4 text-xs text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={hasWhatsapp} onChange={(e) => setHasWhatsapp(e.target.checked)} />
            {t("auth.hasWhatsappCheckbox")}
          </label>
        )}
        <Field label={t("auth.password")}><input required type="password" className={inputClass} value={form.password} onChange={set("password")} placeholder="••••••••" /></Field>

        {mode === "login" && (
          <button type="button" onClick={() => setMode("forgot")} className="text-xs text-sky-600 dark:text-emerald-400 underline -mt-2 mb-4 block">
            {t("auth.forgotPassword")}
          </button>
        )}

        {mode === "register" && (
          <label className="flex items-start gap-2 mb-4 text-xs text-slate-600 dark:text-slate-300">
            <input type="checkbox" className="mt-0.5" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} />
            <span>
              {t("auth.acceptPrefix")} <button type="button" onClick={() => goTo && goTo("terms")} className="text-sky-600 dark:text-emerald-400 underline">{t("auth.termsOfService")}</button> {t("auth.and")}{" "}
              <button type="button" onClick={() => goTo && goTo("privacy")} className="text-sky-600 dark:text-emerald-400 underline">{t("auth.privacyPolicy")}</button>.
              {" "}{t("auth.marketplaceDisclaimer")}
            </span>
          </label>
        )}

        <PrimaryButton type="submit" disabled={loading} className="mt-2">{loading ? t("auth.waiting") : mode === "login" ? t("nav.login") : t("auth.register")}</PrimaryButton>
      </form>
      {!businessMode && (
        <button onClick={() => setMode(mode === "login" ? "register" : "login")} className="w-full text-center text-xs text-slate-500 dark:text-slate-400 mt-4">
          {mode === "login" ? t("auth.noAccount") : t("auth.hasAccount")}
          <span className="text-sky-600 dark:text-emerald-400 font-semibold underline">{mode === "login" ? t("auth.register") : t("nav.login")}</span>
        </button>
      )}
    </div>
  );
}

export function VerifyView({ initialData, onAuth, showError, showOk, goTo }) {
  const { t } = useLang();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  if (!initialData?.email) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{t("auth.pendingRegNotFound")}</p>
        <button onClick={() => goTo && goTo("auth")} className="text-sm font-semibold text-sky-600 dark:text-emerald-400 underline">{t("auth.backToRegister")}</button>
      </div>
    );
  }

  async function verify(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await apiFetch("/Auth/verify-email", null, { method: "POST", body: JSON.stringify({ email: initialData.email, code }) });
      onAuth(data);
    } catch (e) { showError(e); } finally { setLoading(false); }
  }

  async function resend() {
    setResending(true);
    try {
      await apiFetch("/Auth/resend-code", null, { method: "POST", body: JSON.stringify({ email: initialData.email }) });
      showOk && showOk(t("auth.newCodeSent"));
      setCooldown(30);
      const timer = setInterval(() => {
        setCooldown((c) => {
          if (c <= 1) { clearInterval(timer); return 0; }
          return c - 1;
        });
      }, 1000);
    } catch (e) { showError(e); } finally { setResending(false); }
  }

  return (
    <div className="max-w-md mx-auto py-8 text-center">
      <div className="w-16 h-16 rounded-full bg-sky-50 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
        <MailCheck size={28} className="text-sky-600 dark:text-emerald-400" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">{t("auth.verifyEmailTitle")}</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{t("auth.codeSentTo", { email: initialData?.email })}</p>

      <form onSubmit={verify} className="text-left">
        <Field label={t("auth.verificationCode")}>
          <input
            className={`${inputClass} text-center text-lg tracking-[0.3em]`}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            maxLength={6}
            autoFocus
            autoComplete="one-time-code"
            inputMode="numeric"
          />
        </Field>
        <PrimaryButton type="submit" disabled={loading || code.length !== 6}>{loading ? t("auth.verifying") : t("auth.verify")}</PrimaryButton>
      </form>

      <button onClick={resend} disabled={resending || cooldown > 0} className="text-xs text-sky-600 dark:text-emerald-400 underline mt-4 disabled:no-underline disabled:text-slate-400">
        {resending ? t("common.sending") : cooldown > 0 ? t("auth.waitSeconds", { seconds: cooldown }) : t("auth.resendCode")}
      </button>
    </div>
  );
}

export function ProfileView({ user, token, onLogout, showError, showOk, onVerified, onUpdated, goToBusiness, goTo }) {
  const { t, lang } = useLang();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [bookingCount, setBookingCount] = useState(null);
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [waRequest, setWaRequest] = useState(null);
  const [waLoading, setWaLoading] = useState(false);
  const [company, setCompany] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingLicense, setUploadingLicense] = useState(null);
  const [showLicenseForm, setShowLicenseForm] = useState(false);
  const [licenseVersion, setLicenseVersion] = useState(0);
  const [licenseImgs, setLicenseImgs] = useState({ para: null, mbrapa: null });
  const [pendingLicense, setPendingLicense] = useState(null);

  useEffect(() => {
    apiFetch("/Bookings", token).then((b) => setBookingCount(b.length)).catch(() => {});
  }, [token]);

  useEffect(() => {
    apiFetch("/Users/me", token).then((data) => onUpdated && onUpdated(data)).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (user?.role === "business") {
      apiFetch("/Companies/my-company", token).then(setCompany).catch(() => {});
    }
  }, [token, user?.role]);

  async function verify(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/Auth/verify-email", token, { method: "POST", body: JSON.stringify({ email: user.email, code }) });
      showOk(t("auth.emailVerified"));
      onVerified && onVerified();
    } catch (e) { showError(e); } finally { setLoading(false); }
  }

  async function resend() {
    setResending(true);
    try {
      await apiFetch("/Auth/resend-code", token, { method: "POST", body: JSON.stringify({ email: user.email }) });
      showOk(t("auth.newCodeSent"));
    } catch (e) { showError(e); } finally { setResending(false); }
  }

  async function requestWhatsapp() {
    setWaLoading(true);
    try {
      const res = await apiFetch("/WhatsappVerifications", token, { method: "POST" });
      setWaRequest(res);
    } catch (e) { showError(e); } finally { setWaLoading(false); }
  }

  async function deleteAccount() {
    setDeleting(true);
    try {
      await apiFetch("/Users/me", token, { method: "DELETE" });
      onLogout();
    } catch (e) { showError(e); setConfirmingDelete(false); } finally { setDeleting(false); }
  }

  async function uploadPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await apiFetch("/Users/me/photo", token, { method: "POST", body: fd });
      onUpdated && onUpdated({ fotoProfili: res.fotoProfili });
      showOk(t("auth.profilePhotoChanged"));
    } catch (e) { showError(e); } finally { setUploadingPhoto(false); e.target.value = ""; }
  }

  async function uploadLogo(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await apiFetch("/Companies/my-company/logo", token, { method: "POST", body: fd });
      setCompany((c) => (c ? { ...c, logoUrl: res.logoUrl } : c));
      showOk(t("auth.logoChanged"));
    } catch (e) { showError(e); } finally { setUploadingLogo(false); e.target.value = ""; }
  }

  async function uploadLicensePart(side, file) {
    setUploadingLicense(side);
    try {
      const fd = new FormData();
      fd.append(side, file);
      const res = await apiFetch("/Users/me/license", token, { method: "POST", body: fd });
      onUpdated && onUpdated({ hasLicensePara: res.hasLicensePara, hasLicenseMbrapa: res.hasLicenseMbrapa });
      setLicenseVersion((v) => v + 1);
      showOk(t("auth.licenseUploaded"));
    } catch (e) { showError(e); } finally { setUploadingLicense(null); }
  }

  const hasLicense = !!user?.hasLicensePara && !!user?.hasLicenseMbrapa;

  useEffect(() => {
    if (!showLicenseForm) return;
    let paraUrl = null, mbrapaUrl = null, cancelled = false;
    (async () => {
      if (user?.hasLicensePara) {
        try { paraUrl = await apiFetchBlob("/Users/me/license/para", token); if (!cancelled) setLicenseImgs((s) => ({ ...s, para: paraUrl })); }
        catch (e) { console.error(e); }
      }
      if (user?.hasLicenseMbrapa) {
        try { mbrapaUrl = await apiFetchBlob("/Users/me/license/mbrapa", token); if (!cancelled) setLicenseImgs((s) => ({ ...s, mbrapa: mbrapaUrl })); }
        catch (e) { console.error(e); }
      }
    })();
    return () => {
      cancelled = true;
      if (paraUrl) URL.revokeObjectURL(paraUrl);
      if (mbrapaUrl) URL.revokeObjectURL(mbrapaUrl);
    };
  }, [showLicenseForm, user?.hasLicensePara, user?.hasLicenseMbrapa, token, licenseVersion]);

  const waLink = waRequest
    ? `https://wa.me/355688208868?text=${encodeURIComponent(`Verifikim ERental: ${waRequest.code} - ${user?.email}`)}`
    : null;
  const waPending = waRequest || user?.whatsappStatus === "pending";

  return (
    <div className="max-w-lg mx-auto py-6 sm:py-8 flex flex-col gap-5">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-8 flex flex-col items-center text-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-sky-600 dark:bg-emerald-700 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
            {user?.fotoProfili ? (
              <img src={user.fotoProfili} alt="Foto profili" className="w-full h-full object-cover" />
            ) : (
              user?.emri?.[0]?.toUpperCase() || "?"
            )}
          </div>
          <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center cursor-pointer ring-4 ring-white dark:ring-slate-800 hover:bg-slate-700 dark:hover:bg-white transition">
            {uploadingPhoto ? <span className="text-[9px]">...</span> : <Camera size={14} />}
            <input type="file" accept="image/*" className="hidden" onChange={uploadPhoto} disabled={uploadingPhoto} />
          </label>
          {user?.emailVerified && (
            <span className="absolute -bottom-0.5 -left-0.5 w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center ring-4 ring-white dark:ring-slate-800" title={t("common.verified")}>
              <ShieldCheck size={14} className="text-white" />
            </span>
          )}
        </div>
        <p className="font-bold text-xl text-slate-900 dark:text-slate-100 mt-4">{user?.emri} {user?.mbiemri}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{user?.role === "business" ? t("auth.business") : t("auth.client")}</p>
        <div className="flex items-center justify-center gap-3 flex-wrap text-xs text-slate-400 dark:text-slate-500 mt-3">
          <span>{user?.email}</span>
          {memberSince(user?.dataRegjistrimit, lang) && <span>{t("car.memberSince", { date: memberSince(user.dataRegjistrimit, lang) })}</span>}
        </div>
      </div>

      {user?.role !== "business" && (
        <div className={`border rounded-2xl bg-white dark:bg-slate-800 overflow-hidden text-left ${hasLicense ? "border-slate-200 dark:border-slate-700" : "border-amber-200 dark:border-amber-800"}`}>
          <button
            type="button"
            onClick={() => setShowLicenseForm((s) => !s)}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-900/40 transition"
          >
            {hasLicense ? <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400" /> : <AlertTriangle size={18} className="text-amber-500" />}
            <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200">{t("auth.drivingLicense")}</span>
            <span className={`text-xs font-semibold ${hasLicense ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
              {hasLicense ? t("auth.licenseVerified") : t("auth.licenseMissing")}
            </span>
            <ChevronRight size={16} className={`text-slate-300 dark:text-slate-600 transition-transform ${showLicenseForm ? "rotate-90" : ""}`} />
          </button>
          {showLicenseForm && (
            <div className="px-4 pb-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                {hasLicense ? t("auth.licenseEditHint") : t("auth.licenseAddHint")}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <LicenseSlot label={t("auth.licenseFront")} url={licenseImgs.para} uploading={uploadingLicense === "para"} onUpload={(f) => setPendingLicense({ side: "para", file: f, preview: URL.createObjectURL(f) })} />
                <LicenseSlot label={t("auth.licenseBack")} url={licenseImgs.mbrapa} uploading={uploadingLicense === "mbrapa"} onUpload={(f) => setPendingLicense({ side: "mbrapa", file: f, preview: URL.createObjectURL(f) })} />
              </div>
            </div>
          )}
        </div>
      )}

      {pendingLicense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => { URL.revokeObjectURL(pendingLicense.preview); setPendingLicense(null); }}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-3">{t("auth.confirmLicensePhoto")}</h3>
            <img src={pendingLicense.preview} alt={t("auth.drivingLicense")} className="w-full h-40 object-cover rounded-lg border border-slate-200 dark:border-slate-700 mb-3" />
            <p className="text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2.5 mb-4 leading-relaxed">
              {t("auth.licensePhotoWarning", { side: pendingLicense.side === "para" ? t("auth.licenseSideFront") : t("auth.licenseSideBack") })}
            </p>
            <div className="flex gap-2">
              <PrimaryButton
                type="button"
                onClick={() => { uploadLicensePart(pendingLicense.side, pendingLicense.file); URL.revokeObjectURL(pendingLicense.preview); setPendingLicense(null); }}
                className="flex-1 text-xs py-2"
              >
                {t("auth.confirmLicenseUpload")}
              </PrimaryButton>
              <GhostButton type="button" onClick={() => { URL.revokeObjectURL(pendingLicense.preview); setPendingLicense(null); }} className="flex-1 text-xs py-2">
                {t("booking.cancel")}
              </GhostButton>
            </div>
          </div>
        </div>
      )}

      {!user?.emailVerified && (
        <div className="border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/20 rounded-2xl p-4 text-left">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
            <MailCheck size={15} /> {t("auth.verifyEmailTitle")}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{t("auth.codeSentShort", { email: user?.email })}</p>
          <form onSubmit={verify}>
            <input
              className={inputClass}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              maxLength={6}
              autoComplete="one-time-code"
              inputMode="numeric"
            />
            <PrimaryButton type="submit" disabled={loading} className="mt-2">{loading ? t("auth.verifying") : t("auth.verify")}</PrimaryButton>
          </form>
          <button onClick={resend} disabled={resending} className="text-xs text-sky-600 dark:text-emerald-400 underline mt-2">
            {resending ? t("common.sending") : t("auth.sendNewCode")}
          </button>
        </div>
      )}

      {user?.role === "business" && company && (
        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 bg-white dark:bg-slate-800">
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-3">{t("auth.myBusiness")}</p>
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-xl ring-1 ring-slate-200 dark:ring-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                {company.logoUrl ? (
                  <img src={company.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Building2 size={22} className="text-slate-300 dark:text-slate-600" />
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center cursor-pointer ring-2 ring-white dark:ring-slate-800 hover:bg-slate-700 dark:hover:bg-white transition">
                {uploadingLogo ? <span className="text-[8px]">...</span> : <Camera size={11} />}
                <input type="file" accept="image/*" className="hidden" onChange={uploadLogo} disabled={uploadingLogo} />
              </label>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{company.emri}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{company.qyteti}</p>
            </div>
            {goToBusiness && (
              <button onClick={goToBusiness} className="shrink-0 flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100">
                {t("auth.panel")} <ArrowRight size={12} />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 bg-white dark:bg-slate-800">
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-3">{t("auth.myData")}</p>
        <div className="flex flex-col gap-2.5 text-sm">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <Phone size={14} className="text-slate-400 shrink-0" /> {user?.telefoni || t("auth.noPhoneSet")}
          </div>
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <Calendar size={14} className="text-slate-400 shrink-0" /> {bookingCount !== null ? t("auth.bookingsCount", { count: bookingCount }) : t("common.loading")}
          </div>
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <MessageCircle size={14} className="text-slate-400 shrink-0" />
            {!user?.telefoni || !user?.hasWhatsapp ? (
              <span className="text-slate-400 dark:text-slate-500">{t("auth.noWhatsappDeclared")}</span>
            ) : user?.whatsappVerified ? (
              <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium"><ShieldCheck size={12} /> {t("auth.whatsappVerified")}</span>
            ) : waPending ? (
              <span className="text-amber-700 dark:text-amber-400 font-medium">{t("auth.whatsappPendingReview")}</span>
            ) : (
              <span className="text-amber-700 dark:text-amber-400 font-medium">{t("auth.whatsappUnverified")}</span>
            )}
          </div>

          {user?.hasWhatsapp && !user?.whatsappVerified && !waPending && (
            <button onClick={requestWhatsapp} disabled={waLoading} className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 underline text-left w-fit">
              {waLoading ? t("auth.preparing") : t("auth.verifyWhatsapp")}
            </button>
          )}

          {waRequest && (
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 mt-1 text-xs text-slate-600 dark:text-slate-300">
              <p className="mb-2">{t("auth.sendCodeFromWhatsapp")}</p>
              <p className="font-bold text-lg text-center tracking-[0.3em] text-slate-900 dark:text-slate-100 mb-2">{waRequest.code}</p>
              <a href={waLink} target="_blank" rel="noreferrer" className="block text-center bg-emerald-700 text-white rounded-xl py-2 font-semibold hover:bg-emerald-800">
                {t("auth.openWhatsappSend")}
              </a>
              <p className="mt-2 text-slate-400">{t("auth.confirmWithinHours")}</p>
            </div>
          )}
        </div>
      </div>

      <div className="border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700 overflow-hidden">
        {editing ? (
          <div className="p-4"><EditProfileForm
            user={user}
            token={token}
            showError={showError}
            onDone={(patch) => { onUpdated && onUpdated(patch); setEditing(false); showOk(t("auth.dataChanged")); }}
            onCancel={() => setEditing(false)}
          /></div>
        ) : (
          <SettingsRow icon={Pencil} label={t("auth.editData")} onClick={() => setEditing(true)} />
        )}

        {changingPassword ? (
          <div className="p-4"><ChangePasswordForm
            token={token}
            showError={showError}
            onDone={() => { setChangingPassword(false); showOk(t("auth.passwordChangedShort")); }}
            onCancel={() => setChangingPassword(false)}
          /></div>
        ) : (
          <SettingsRow icon={KeyRound} label={t("auth.changePassword")} onClick={() => setChangingPassword(true)} />
        )}

        <SettingsRow icon={LogOut} label={t("nav.logout")} onClick={onLogout} danger />
      </div>

      {goTo && (
        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700 overflow-hidden">
          <SettingsRow icon={HelpCircle} label={t("home.faqTitle")} onClick={() => goTo("/?scrollTo=faq")} />
          <SettingsRow icon={Lock} label={t("footer.privacy")} onClick={() => goTo("/privatesia")} />
          <SettingsRow icon={FileText} label={t("footer.terms")} onClick={() => goTo("/kushtet")} />
          <SettingsRow icon={Car} label={t("footer.about")} onClick={() => goTo("/rreth-nesh")} />
        </div>
      )}

      <div className="border border-red-200 dark:border-red-800/60 rounded-2xl p-4">
        <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">{t("auth.dangerZone")}</p>
        {confirmingDelete ? (
          <>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">{t("auth.deleteAccountWarning")}</p>
            <div className="flex gap-2">
              <button onClick={deleteAccount} disabled={deleting} className="text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl px-3 py-2 disabled:opacity-50">
                {deleting ? t("auth.deletingAccount") : t("auth.confirmDeleteAccount")}
              </button>
              <GhostButton type="button" onClick={() => setConfirmingDelete(false)} className="text-xs py-2">{t("booking.cancel")}</GhostButton>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{t("auth.deleteAccountHint")}</p>
            <button onClick={() => setConfirmingDelete(true)} className="text-xs font-semibold text-red-600 dark:text-red-400 underline flex items-center gap-1">
              <Trash2 size={12} /> {t("auth.deleteAccountCta")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function LicenseSlot({ label, url, uploading, onUpload }) {
  const { t } = useLang();
  return (
    <label className={`relative flex flex-col items-center justify-center gap-1 h-24 rounded-xl border-2 border-dashed cursor-pointer overflow-hidden transition ${url ? "border-emerald-300 dark:border-emerald-700" : "border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500"}`}>
      {url ? (
        <>
          <img src={url} alt={label} className="absolute inset-0 w-full h-full object-cover" />
          <span className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[9px] text-center py-0.5">{label} {t("auth.changeSuffix")}</span>
        </>
      ) : (
        <>
          <Upload size={16} className="text-slate-400" />
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{label}</span>
        </>
      )}
      {uploading && <span className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[10px]">{t("common.loading")}</span>}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        disabled={uploading}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }}
      />
    </label>
  );
}

function SettingsRow({ icon: Icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-900/40 transition ${danger ? "text-red-600 dark:text-red-400" : "text-slate-700 dark:text-slate-200"}`}
    >
      <Icon size={18} className={danger ? "text-red-500 dark:text-red-400" : "text-slate-400 dark:text-slate-500"} />
      <span className="flex-1 text-sm font-medium">{label}</span>
      {!danger && <ChevronRight size={16} className="text-slate-300 dark:text-slate-600" />}
    </button>
  );
}

function ChangePasswordForm({ token, showError, onDone, onCancel }) {
  const { t } = useLang();
  const [step, setStep] = useState("request");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function requestCode() {
    setLoading(true);
    try {
      await apiFetch("/Auth/change-password/request", token, { method: "POST" });
      setStep("confirm");
    } catch (e) { showError(e); } finally { setLoading(false); }
  }

  async function confirm(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/Auth/change-password/confirm", token, { method: "POST", body: JSON.stringify({ code, newPassword }) });
      onDone();
    } catch (e) { showError(e); } finally { setLoading(false); }
  }

  return (
    <div className="w-full border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-left">
      {step === "request" ? (
        <>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{t("auth.willSendCodeToEmail")}</p>
          <div className="flex gap-2">
            <PrimaryButton type="button" onClick={requestCode} disabled={loading}>{loading ? t("common.sending") : t("auth.sendCodeIndefinite")}</PrimaryButton>
            <GhostButton type="button" onClick={onCancel}>{t("booking.cancel")}</GhostButton>
          </div>
        </>
      ) : (
        <form onSubmit={confirm}>
          <Field label={t("auth.codeLabel")}><input required autoComplete="one-time-code" inputMode="numeric" className={`${inputClass} text-center tracking-[0.3em]`} value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} placeholder="123456" /></Field>
          <Field label={t("auth.newPasswordLabel")}><input required type="password" className={inputClass} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" /></Field>
          <div className="flex gap-2 mt-2">
            <PrimaryButton type="submit" disabled={loading}>{loading ? t("common.saving") : t("auth.change")}</PrimaryButton>
            <GhostButton type="button" onClick={onCancel}>{t("booking.cancel")}</GhostButton>
          </div>
        </form>
      )}
    </div>
  );
}

function EditProfileForm({ user, token, showError, onDone, onCancel }) {
  const { t } = useLang();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    emri: user?.emri || "",
    mbiemri: user?.mbiemri || "",
    telefoni: user?.telefoni || "",
    hasWhatsapp: !!user?.hasWhatsapp,
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const updated = await apiFetch("/Users/me", token, { method: "PUT", body: JSON.stringify(form) });
      onDone(updated);
    } catch (e) { showError(e); } finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="w-full border border-slate-200 dark:border-slate-700 rounded-2xl p-4 mt-2 text-left">
      <div className="grid grid-cols-2 gap-2">
        <Field label={t("auth.firstName")}><input required className={inputClass} value={form.emri} onChange={set("emri")} /></Field>
        <Field label={t("auth.lastName")}><input required className={inputClass} value={form.mbiemri} onChange={set("mbiemri")} /></Field>
      </div>
      <Field label={t("auth.phone")}><input className={inputClass} value={form.telefoni} onChange={set("telefoni")} placeholder="0691234567" /></Field>
      <label className="flex items-center gap-2 mb-3 text-xs text-slate-600 dark:text-slate-300">
        <input type="checkbox" checked={form.hasWhatsapp} onChange={(e) => setForm((f) => ({ ...f, hasWhatsapp: e.target.checked }))} />
        {t("auth.hasWhatsappShort")}
      </label>
      <div className="flex gap-2">
        <PrimaryButton type="submit" disabled={loading}>{loading ? t("common.saving") : t("common.save")}</PrimaryButton>
        <GhostButton type="button" onClick={onCancel}>{t("booking.cancel")}</GhostButton>
      </div>
    </form>
  );
}
