import { useState, useEffect } from "react";
import { Lock, MailCheck, ShieldCheck, Phone, MessageCircle, Calendar, Pencil, KeyRound } from "lucide-react";
import { apiFetch } from "../api";
import { Field, PrimaryButton, GhostButton, inputClass } from "../components";

function looksAlbanian(phone) {
  const digits = (phone || "").replace(/[\s-]/g, "");
  return /^(\+355|00355|0)6\d{7,8}$/.test(digits);
}

export function AuthGate({ onGo, text }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-8 py-20 gap-4">
      <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center"><Lock size={22} className="text-emerald-700" /></div>
      <p className="text-sm text-slate-500">{text}</p>
      <PrimaryButton onClick={onGo} className="max-w-[160px]">Kyçu</PrimaryButton>
    </div>
  );
}

export function AuthView({ onAuth, showError, showOk, goTo }) {
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [hasWhatsapp, setHasWhatsapp] = useState(false);
  const [form, setForm] = useState({ emri: "", mbiemri: "", email: "", password: "", telefoni: "" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const [forgotStep, setForgotStep] = useState("request");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotCode, setForgotCode] = useState("");
  const [forgotPassword, setForgotPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (mode === "register" && !acceptTerms) {
      showError(new Error("Duhet te pranosh Kushtet e Perdorimit per t'u regjistruar."));
      return;
    }
    setLoading(true);
    try {
      if (mode === "register") {
        await apiFetch("/Auth/register", null, { method: "POST", body: JSON.stringify({ ...form, hasWhatsapp }) });
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
      showOk && showOk("Fjalekalimi u ndryshua. Kyçu me fjalekalimin e ri.");
      setMode("login");
      setForgotStep("request");
      setForgotEmail(""); setForgotCode(""); setForgotPassword("");
    } catch (e) { showError(e); } finally { setForgotLoading(false); }
  }

  if (mode === "forgot") {
    return (
      <div className="max-w-md mx-auto py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Rivendos fjalekalimin</h1>
        <p className="text-sm text-slate-500 mb-6">
          {forgotStep === "request" ? "Shkruaj email-in tend dhe do te dergojme nje kod." : `Nese ${forgotEmail} eshte i regjistruar, u dergua nje kod 6-shifror.`}
        </p>
        {forgotStep === "request" ? (
          <form onSubmit={requestReset}>
            <Field label="Email"><input required type="email" className={inputClass} value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="ti@email.com" /></Field>
            <PrimaryButton type="submit" disabled={forgotLoading} className="mt-2">{forgotLoading ? "Duke derguar..." : "Dergo kodin"}</PrimaryButton>
          </form>
        ) : (
          <form onSubmit={confirmReset}>
            <Field label="Kodi"><input required className={`${inputClass} text-center text-lg tracking-[0.3em]`} value={forgotCode} onChange={(e) => setForgotCode(e.target.value)} maxLength={6} placeholder="123456" /></Field>
            <Field label="Fjalekalimi i ri"><input required type="password" className={inputClass} value={forgotPassword} onChange={(e) => setForgotPassword(e.target.value)} placeholder="••••••••" /></Field>
            <PrimaryButton type="submit" disabled={forgotLoading} className="mt-2">{forgotLoading ? "Duke ndryshuar..." : "Ndrysho fjalekalimin"}</PrimaryButton>
          </form>
        )}
        <button onClick={() => { setMode("login"); setForgotStep("request"); }} className="w-full text-center text-xs text-slate-500 mt-4">
          Kthehu tek <span className="text-emerald-700 font-semibold underline">Kyçu</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">
        {mode === "login" ? "Mire se erdhe" : "Krijo llogari"}
      </h1>
      <p className="text-sm text-slate-500 mb-6">
        {mode === "login" ? "Kyçu per te vazhduar." : "Regjistrohu per te filluar."}
      </p>
      <form onSubmit={submit}>
        {mode === "register" && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Emri"><input required className={inputClass} value={form.emri} onChange={set("emri")} placeholder="Andi" /></Field>
            <Field label="Mbiemri"><input required className={inputClass} value={form.mbiemri} onChange={set("mbiemri")} placeholder="Krasniqi" /></Field>
          </div>
        )}
        <Field label="Email"><input required type="email" className={inputClass} value={form.email} onChange={set("email")} placeholder="ti@email.com" /></Field>
        {mode === "register" && <Field label="Telefoni"><input className={inputClass} value={form.telefoni} onChange={set("telefoni")} placeholder="0691234567" /></Field>}
        {mode === "register" && form.telefoni && !looksAlbanian(form.telefoni) && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
            Ky numer nuk duket shqiptar — sigurohu qe ka WhatsApp aktiv, pasi biznesi mund te te kontaktoje vetem aty.
          </p>
        )}
        {mode === "register" && (
          <label className="flex items-center gap-2 mb-4 text-xs text-slate-600">
            <input type="checkbox" checked={hasWhatsapp} onChange={(e) => setHasWhatsapp(e.target.checked)} />
            Ky numer ka WhatsApp (ndihmon biznesin te te kontaktoje, sidomos per numra te huaj)
          </label>
        )}
        <Field label="Fjalekalimi"><input required type="password" className={inputClass} value={form.password} onChange={set("password")} placeholder="••••••••" /></Field>

        {mode === "login" && (
          <button type="button" onClick={() => setMode("forgot")} className="text-xs text-emerald-700 underline -mt-2 mb-4 block">
            Harrove fjalekalimin?
          </button>
        )}

        {mode === "register" && (
          <label className="flex items-start gap-2 mb-4 text-xs text-slate-600">
            <input type="checkbox" className="mt-0.5" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} />
            <span>
              Prano <button type="button" onClick={() => goTo && goTo("terms")} className="text-emerald-700 underline">Kushtet e Perdorimit</button> dhe{" "}
              <button type="button" onClick={() => goTo && goTo("privacy")} className="text-emerald-700 underline">Politiken e Privatesise</button>.
              Kuptoj qe ERental eshte nje platforme ndermjetese (marketplace) dhe nuk mban pergjegjesi per makinat, gjendjen e tyre, apo marreveshjet mes meje dhe biznesit.
            </span>
          </label>
        )}

        <PrimaryButton type="submit" disabled={loading} className="mt-2">{loading ? "Duke pritur..." : mode === "login" ? "Kyçu" : "Regjistrohu"}</PrimaryButton>
      </form>
      <button onClick={() => setMode(mode === "login" ? "register" : "login")} className="w-full text-center text-xs text-slate-500 mt-4">
        {mode === "login" ? "S'ke llogari? " : "Ke tashme llogari? "}
        <span className="text-emerald-700 font-semibold underline">{mode === "login" ? "Regjistrohu" : "Kyçu"}</span>
      </button>
    </div>
  );
}

export function VerifyView({ initialData, onAuth, showError, showOk, goTo }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  if (!initialData?.email) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <p className="text-sm text-slate-500 mb-4">S'kemi gjetur nje regjistrim ne pritje. Provo te regjistrohesh perseri.</p>
        <button onClick={() => goTo && goTo("auth")} className="text-sm font-semibold text-emerald-700 underline">Kthehu tek regjistrimi</button>
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
      showOk && showOk("Kod i ri u dergua ne email.");
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
      <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
        <MailCheck size={28} className="text-emerald-700" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Verifiko email-in</h1>
      <p className="text-sm text-slate-500 mb-6">Te derguam nje kod 6-shifror ne <strong>{initialData?.email}</strong>. Kontrollo edhe Spam nese s'e sheh. Duhet ta verifikosh per te vazhduar.</p>

      <form onSubmit={verify} className="text-left">
        <Field label="Kodi i verifikimit">
          <input
            className={`${inputClass} text-center text-lg tracking-[0.3em]`}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            maxLength={6}
            autoFocus
          />
        </Field>
        <PrimaryButton type="submit" disabled={loading || code.length !== 6}>{loading ? "Duke verifikuar..." : "Verifiko"}</PrimaryButton>
      </form>

      <button onClick={resend} disabled={resending || cooldown > 0} className="text-xs text-emerald-700 underline mt-4 disabled:no-underline disabled:text-slate-400">
        {resending ? "Duke derguar..." : cooldown > 0 ? `Prit ${cooldown}s per te derguar perseri` : "Nuk more kod? Dergo perseri"}
      </button>
    </div>
  );
}

export function ProfileView({ user, token, onLogout, showError, showOk, onVerified, onUpdated }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [bookingCount, setBookingCount] = useState(null);
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [waRequest, setWaRequest] = useState(null);
  const [waLoading, setWaLoading] = useState(false);

  useEffect(() => {
    apiFetch("/Bookings", token).then((b) => setBookingCount(b.length)).catch(() => {});
  }, [token]);

  useEffect(() => {
    apiFetch("/Users/me", token).then((data) => onUpdated && onUpdated(data)).catch(() => {});
  }, [token]);

  async function verify(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/Auth/verify-email", token, { method: "POST", body: JSON.stringify({ email: user.email, code }) });
      showOk("Email-i u verifikua!");
      onVerified && onVerified();
    } catch (e) { showError(e); } finally { setLoading(false); }
  }

  async function resend() {
    setResending(true);
    try {
      await apiFetch("/Auth/resend-code", token, { method: "POST", body: JSON.stringify({ email: user.email }) });
      showOk("Kod i ri u dergua ne email.");
    } catch (e) { showError(e); } finally { setResending(false); }
  }

  async function requestWhatsapp() {
    setWaLoading(true);
    try {
      const res = await apiFetch("/WhatsappVerifications", token, { method: "POST" });
      setWaRequest(res);
    } catch (e) { showError(e); } finally { setWaLoading(false); }
  }

  const waLink = waRequest
    ? `https://wa.me/355688208868?text=${encodeURIComponent(`Verifikim ERental: ${waRequest.code} - ${user?.email}`)}`
    : null;
  const waPending = waRequest || user?.whatsappStatus === "pending";

  return (
    <div className="max-w-lg mx-auto py-8 flex flex-col gap-5">
      <div className="flex flex-col items-center text-center gap-2">
        <div className="w-16 h-16 rounded-full bg-emerald-700 flex items-center justify-center text-white text-xl font-bold">{user?.emri?.[0]?.toUpperCase() || "?"}</div>
        <div>
          <p className="font-semibold text-slate-900">{user?.emri} {user?.mbiemri}</p>
          <p className="text-sm text-slate-500">{user?.email}</p>
        </div>

        {user?.emailVerified ? (
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full">
            <ShieldCheck size={13} /> Email i verifikuar
          </span>
        ) : (
          <div className="w-full border border-amber-200 bg-amber-50/50 rounded-2xl p-4 mt-2 text-left">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-800 mb-1">
              <MailCheck size={15} /> Verifiko email-in
            </p>
            <p className="text-xs text-slate-500 mb-3">Te derguam nje kod 6-shifror ne {user?.email}.</p>
            <form onSubmit={verify}>
              <input
                className={inputClass}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
              />
              <PrimaryButton type="submit" disabled={loading} className="mt-2">{loading ? "Duke verifikuar..." : "Verifiko"}</PrimaryButton>
            </form>
            <button onClick={resend} disabled={resending} className="text-xs text-emerald-700 underline mt-2">
              {resending ? "Duke derguar..." : "Dergo kod te ri"}
            </button>
          </div>
        )}
      </div>

      <div className="border border-slate-200 rounded-2xl p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Te dhenat e mia</p>
        <div className="flex flex-col gap-2.5 text-sm">
          <div className="flex items-center gap-2 text-slate-700">
            <Phone size={14} className="text-slate-400 shrink-0" /> {user?.telefoni || "S'ka numer te vendosur"}
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <Calendar size={14} className="text-slate-400 shrink-0" /> {bookingCount !== null ? `${bookingCount} rezervime` : "Duke ngarkuar..."}
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <MessageCircle size={14} className="text-slate-400 shrink-0" />
            {!user?.telefoni || !user?.hasWhatsapp ? (
              <span className="text-slate-400">Pa WhatsApp te deklaruar</span>
            ) : user?.whatsappVerified ? (
              <span className="flex items-center gap-1 text-emerald-700 font-medium"><ShieldCheck size={12} /> WhatsApp i verifikuar</span>
            ) : waPending ? (
              <span className="text-amber-700 font-medium">WhatsApp: ne shqyrtim nga admin</span>
            ) : (
              <span className="text-amber-700 font-medium">WhatsApp: i paverifikuar</span>
            )}
          </div>

          {user?.hasWhatsapp && !user?.whatsappVerified && !waPending && (
            <button onClick={requestWhatsapp} disabled={waLoading} className="text-xs font-semibold text-emerald-700 underline text-left w-fit">
              {waLoading ? "Duke pergatitur..." : "Verifiko WhatsApp"}
            </button>
          )}

          {waRequest && (
            <div className="border border-slate-200 rounded-xl p-3 mt-1 text-xs text-slate-600">
              <p className="mb-2">Dergo kete kod nga WhatsApp yt tek numri ynë i biznesit:</p>
              <p className="font-bold text-lg text-center tracking-[0.3em] text-slate-900 mb-2">{waRequest.code}</p>
              <a href={waLink} target="_blank" rel="noreferrer" className="block text-center bg-emerald-700 text-white rounded-xl py-2 font-semibold hover:bg-emerald-800">
                Hap WhatsApp dhe dergo
              </a>
              <p className="mt-2 text-slate-400">Pasi ta dergosh, do ta konfirmojme brenda pak oresh.</p>
            </div>
          )}
        </div>
      </div>

      <div className="border border-slate-200 rounded-2xl p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Veprime</p>
        <div className="flex flex-col gap-3">
          {editing ? (
            <EditProfileForm
              user={user}
              token={token}
              showError={showError}
              onDone={(patch) => { onUpdated && onUpdated(patch); setEditing(false); showOk("Te dhenat u ndryshuan."); }}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-sm font-medium text-slate-700 w-fit">
              <Pencil size={14} /> Ndrysho te dhenat
            </button>
          )}

          {changingPassword ? (
            <ChangePasswordForm
              token={token}
              showError={showError}
              onDone={() => { setChangingPassword(false); showOk("Fjalekalimi u ndryshua."); }}
              onCancel={() => setChangingPassword(false)}
            />
          ) : (
            <button onClick={() => setChangingPassword(true)} className="flex items-center gap-1.5 text-sm font-medium text-slate-700 w-fit">
              <KeyRound size={14} /> Ndrysho fjalekalimin
            </button>
          )}

          <GhostButton onClick={onLogout} className="max-w-[200px] mt-1">Dil nga llogaria</GhostButton>
        </div>
      </div>
    </div>
  );
}

function ChangePasswordForm({ token, showError, onDone, onCancel }) {
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
    <div className="w-full border border-slate-200 rounded-2xl p-4 text-left">
      {step === "request" ? (
        <>
          <p className="text-xs text-slate-500 mb-3">Do te dergojme nje kod verifikimi ne email-in tend.</p>
          <div className="flex gap-2">
            <PrimaryButton type="button" onClick={requestCode} disabled={loading}>{loading ? "Duke derguar..." : "Dergo kod"}</PrimaryButton>
            <GhostButton type="button" onClick={onCancel}>Anulo</GhostButton>
          </div>
        </>
      ) : (
        <form onSubmit={confirm}>
          <Field label="Kodi"><input required className={`${inputClass} text-center tracking-[0.3em]`} value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} placeholder="123456" /></Field>
          <Field label="Fjalekalimi i ri"><input required type="password" className={inputClass} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" /></Field>
          <div className="flex gap-2 mt-2">
            <PrimaryButton type="submit" disabled={loading}>{loading ? "Duke ruajtur..." : "Ndrysho"}</PrimaryButton>
            <GhostButton type="button" onClick={onCancel}>Anulo</GhostButton>
          </div>
        </form>
      )}
    </div>
  );
}

function EditProfileForm({ user, token, showError, onDone, onCancel }) {
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
    <form onSubmit={submit} className="w-full border border-slate-200 rounded-2xl p-4 mt-2 text-left">
      <div className="grid grid-cols-2 gap-2">
        <Field label="Emri"><input required className={inputClass} value={form.emri} onChange={set("emri")} /></Field>
        <Field label="Mbiemri"><input required className={inputClass} value={form.mbiemri} onChange={set("mbiemri")} /></Field>
      </div>
      <Field label="Telefoni"><input className={inputClass} value={form.telefoni} onChange={set("telefoni")} placeholder="0691234567" /></Field>
      <label className="flex items-center gap-2 mb-3 text-xs text-slate-600">
        <input type="checkbox" checked={form.hasWhatsapp} onChange={(e) => setForm((f) => ({ ...f, hasWhatsapp: e.target.checked }))} />
        Ky numer ka WhatsApp
      </label>
      <div className="flex gap-2">
        <PrimaryButton type="submit" disabled={loading}>{loading ? "Duke ruajtur..." : "Ruaj"}</PrimaryButton>
        <GhostButton type="button" onClick={onCancel}>Anulo</GhostButton>
      </div>
    </form>
  );
}
