import { useState } from "react";
import { Building2, X } from "lucide-react";
import { apiFetch } from "../api";
import { Field, PrimaryButton, inputClass, LocationPicker } from "../components";
import { ALBANIAN_LOCATIONS, BORDER_COUNTRIES } from "../carData";
import { EMPTY_COMPANY_EXTRAS, companyExtrasPayload, validDeliveryZones } from "../companyExtras";
import { useLang } from "../useLang";

// The optional business details, rendered as a fragment so each form keeps its own spacing.
// Used at registration and again in Business.jsx's EditCompanyDetailsForm.
export function CompanyExtrasFields({ form, setForm, zones, setZones, deliveryLabel }) {
  const { t } = useLang();
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggleCountry = (c) => setForm((f) => ({
    ...f,
    vendetKufitare: f.vendetKufitare.includes(c) ? f.vendetKufitare.filter((x) => x !== c) : [...f.vendetKufitare, c],
  }));
  const setZone = (i, k) => (e) => setZones((zs) => zs.map((z, idx) => (idx === i ? { ...z, [k]: e.target.value } : z)));
  const removeZone = (i) => setZones((zs) => zs.filter((_, idx) => idx !== i));
  const addZone = () => setZones((zs) => [...zs, { zona: "", cmimi: "" }]);

  return (
    <>
      <Field label={t("business.minimumDaysDefault")}>
        <input type="number" min="1" className={inputClass} value={form.minimumDitesh} onChange={set("minimumDitesh")} placeholder="1" />
        <span className="block text-[11px] text-slate-400 mt-1">{t("business.minimumDaysDefaultHint")}</span>
      </Field>
      <Field label={t("business.fullInsurancePrice")}>
        <input type="number" min="0" step="0.01" className={inputClass} value={form.cmimiSigurimit} onChange={set("cmimiSigurimit")} placeholder="10" />
        <span className="block text-[11px] text-slate-400 mt-1">{t("business.fullInsurancePriceHint")}</span>
      </Field>
      <label className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={form.ofronDergimMakine}
          onChange={(e) => setForm((f) => ({ ...f, ofronDergimMakine: e.target.checked }))}
        />
        <span>{deliveryLabel}</span>
      </label>

      <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mt-2">{t("business.extraServicesTitle")}</p>
      <label className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={form.ofronKmTePakufizuara}
          onChange={(e) => setForm((f) => ({ ...f, ofronKmTePakufizuara: e.target.checked }))}
        />
        <span>{t("business.unlimitedKmOffer")}</span>
      </label>
      <Field label={t("business.extraDriverPrice")}>
        <input type="number" min="0" step="0.01" className={inputClass} value={form.cmimiShoferiShtese} onChange={set("cmimiShoferiShtese")} placeholder="0" />
        <span className="block text-[11px] text-slate-400 mt-1">{t("business.extraServicePriceHint")}</span>
      </Field>
      <Field label={t("business.babySeatPrice")}>
        <input type="number" min="0" step="0.01" className={inputClass} value={form.cmimiSediljesBebe} onChange={set("cmimiSediljesBebe")} placeholder="0" />
      </Field>
      <Field label={t("business.outOfHoursDeliveryPrice")}>
        <input type="number" min="0" step="0.01" className={inputClass} value={form.cmimiDergesesJashtOrarit} onChange={set("cmimiDergesesJashtOrarit")} placeholder="0" />
      </Field>

      <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mt-2">{t("business.crossBorderTitle")}</p>
      <div className="grid grid-cols-2 gap-1.5">
        {BORDER_COUNTRIES.map((c) => (
          <label key={c} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={form.vendetKufitare.includes(c)} onChange={() => toggleCountry(c)} />
            {c}
          </label>
        ))}
      </div>

      <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mt-2">{t("business.lateReturnPolicyTitle")}</p>
      <div className="space-y-1.5">
        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          <input type="radio" name="vonjesaPolicy" value="" checked={form.vonjesaPolicy === ""} onChange={set("vonjesaPolicy")} />
          {t("business.lateReturnPolicy.none")}
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          <input type="radio" name="vonjesaPolicy" value="day" checked={form.vonjesaPolicy === "day"} onChange={set("vonjesaPolicy")} />
          {t("business.lateReturnPolicy.day")}
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          <input type="radio" name="vonjesaPolicy" value="fixed" checked={form.vonjesaPolicy === "fixed"} onChange={set("vonjesaPolicy")} />
          {t("business.lateReturnPolicy.fixed")}
        </label>
        {form.vonjesaPolicy === "fixed" && (
          <input type="number" min="0" step="0.01" className={inputClass} value={form.vonjesaAmount} onChange={set("vonjesaAmount")} placeholder="0" />
        )}
      </div>

      <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mt-2">{t("business.deliveryZonesTitle")}</p>
      {zones.map((z, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <input className={inputClass} value={z.zona} onChange={setZone(i, "zona")} placeholder={t("business.deliveryZonePlaceholder")} />
          <input type="number" min="0" step="0.01" className={inputClass} value={z.cmimi} onChange={setZone(i, "cmimi")} placeholder="0" />
          <button type="button" onClick={() => removeZone(i)} className="text-slate-400 hover:text-red-600 shrink-0"><X size={14} /></button>
        </div>
      ))}
      <button type="button" onClick={addZone} className="text-xs font-medium text-sky-600 dark:text-emerald-400 text-left">{t("business.addDeliveryZone")}</button>
    </>
  );
}

// Shared by the logged-in-client "upgrade to business" path (Business.jsx's RegisterCompanyForm)
// and the unauthenticated BusinessSignup flow, so the validation below applies to both at once.
// `prefill` ({ emri, telefoni }) comes from the signup account step: those fields were just typed
// there, so they are pre-set and hidden here instead of being asked a second time.
export function BusinessDetailsForm({ token, onDone, showError, showOk, submitLabel, prefill }) {
  const { t } = useLang();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({ emri: prefill?.emri || "", telefoni: prefill?.telefoni || "", adresa: "", qyteti: "", nipt: "", iban: "", ...EMPTY_COMPANY_EXTRAS });
  const [zones, setZones] = useState([]);
  const [coords, setCoords] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (!file) { showError(new Error(t("business.certRequiredError"))); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      ["emri", "telefoni", "adresa", "qyteti", "nipt", "iban", "ofronDergimMakine"].forEach((k) => fd.append(k, form[k]));
      if (coords) { fd.append("latitude", coords.latitude); fd.append("longitude", coords.longitude); }
      fd.append("certifikataFile", file);

      await apiFetch("/Companies/register", token, { method: "POST", body: fd });

      // The register endpoint only takes the core fields (it's a file upload); the rest goes through
      // the same two calls the edit form uses. The business exists by now, so a failure here must
      // not send the owner back to re-register -- say what's missing and carry on.
      try {
        const { emri, telefoni, adresa, qyteti, iban } = form;
        await apiFetch("/Companies/my-company", token, { method: "PUT", body: JSON.stringify({ emri, telefoni, adresa, qyteti, iban, ...companyExtrasPayload(form) }) });
        const deliveryZones = validDeliveryZones(zones);
        if (deliveryZones.length) await apiFetch("/Companies/my-delivery-zones", token, { method: "PUT", body: JSON.stringify(deliveryZones) });
        showOk(t("business.registered"));
      } catch {
        showError(new Error(t("business.registeredDetailsNotSaved")));
      }
      onDone();
    } catch (e) { showError(e); } finally { setLoading(false); }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-1"><Building2 size={20} className="text-emerald-700 dark:text-emerald-400" /><h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t("business.registerBusiness")}</h2></div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{t("business.willUseAccountEmail")}</p>
      <form onSubmit={submit}>
        {!prefill?.emri && <Field label={t("business.businessName")}><input required className={inputClass} value={form.emri} onChange={set("emri")} placeholder="AutoRent Tirana" /></Field>}
        {!prefill?.telefoni && <Field label={t("auth.phone")}><input required className={inputClass} value={form.telefoni} onChange={set("telefoni")} placeholder="0691234567" /></Field>}
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
        <Field label={t("business.niptCertificate")}>
          <input required type="file" accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className={inputClass} />
        </Field>
        <div className="flex flex-col gap-2 mb-4">
          <CompanyExtrasFields form={form} setForm={setForm} zones={zones} setZones={setZones} deliveryLabel={t("business.offersDeliveryRegister")} />
        </div>
        <PrimaryButton type="submit" disabled={loading}>{loading ? t("common.sending") : (submitLabel || t("business.registerBusiness"))}</PrimaryButton>
      </form>
    </div>
  );
}
