import { useState } from "react";
import { Building2 } from "lucide-react";
import { apiFetch } from "../api";
import { Field, PrimaryButton, inputClass, LocationPicker } from "../components";
import { ALBANIAN_LOCATIONS } from "../carData";
import { useLang } from "../useLang";

// Shared by the logged-in-client "upgrade to business" path (Business.jsx's RegisterCompanyForm)
// and the unauthenticated BusinessSignup flow, so the validation below applies to both at once.
export function BusinessDetailsForm({ token, onDone, showError, showOk, submitLabel }) {
  const { t } = useLang();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({ emri: "", telefoni: "", adresa: "", qyteti: "", nipt: "", iban: "", ofronDergimMakine: false });
  const [coords, setCoords] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (!file) { showError(new Error(t("business.certRequiredError"))); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (coords) { fd.append("latitude", coords.latitude); fd.append("longitude", coords.longitude); }
      fd.append("certifikataFile", file);

      await apiFetch("/Companies/register", token, { method: "POST", body: fd });
      showOk(t("business.registered"));
      onDone();
    } catch (e) { showError(e); } finally { setLoading(false); }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-1"><Building2 size={20} className="text-emerald-700 dark:text-emerald-400" /><h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t("business.registerBusiness")}</h2></div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{t("business.willUseAccountEmail")}</p>
      <form onSubmit={submit}>
        <Field label={t("business.businessName")}><input required className={inputClass} value={form.emri} onChange={set("emri")} placeholder="AutoRent Tirana" /></Field>
        <Field label={t("auth.phone")}><input required className={inputClass} value={form.telefoni} onChange={set("telefoni")} placeholder="0691234567" /></Field>
        <Field label={t("business.address")}><input required className={inputClass} value={form.adresa} onChange={set("adresa")} placeholder="Rruga..." /></Field>
        <Field label={t("business.cityZone")}>
          <select required className={inputClass} value={form.qyteti} onChange={set("qyteti")}>
            <option value="">{t("business.choose")}</option>
            {ALBANIAN_LOCATIONS.map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
        </Field>
        <Field label={t("business.exactLocation")}>
          <LocationPicker adresa={form.adresa} qyteti={form.qyteti} coords={coords} onChange={setCoords} showError={showError} />
        </Field>
        <Field label={t("business.nipt")}><input required className={inputClass} value={form.nipt} onChange={set("nipt")} placeholder="L12345678A" /></Field>
        <Field label={t("business.ibanForPayments")}><input required className={inputClass} value={form.iban} onChange={set("iban")} placeholder="AL47212110090000000235698741" /></Field>
        <label className="flex items-start gap-2 mb-4 text-xs text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={form.ofronDergimMakine}
            onChange={(e) => setForm((f) => ({ ...f, ofronDergimMakine: e.target.checked }))}
          />
          <span>{t("business.offersDeliveryRegister")}</span>
        </label>
        <Field label={t("business.niptCertificate")}>
          <input required type="file" accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className={inputClass} />
        </Field>
        <PrimaryButton type="submit" disabled={loading}>{loading ? t("common.sending") : (submitLabel || t("business.registerBusiness"))}</PrimaryButton>
      </form>
    </div>
  );
}
