import { useState, useEffect, useCallback } from "react";
import { Building2, Plus, Upload, ShieldCheck, Clock, CheckCircle2, Calendar, User as UserIcon, XCircle, MessageCircle, Mail, MapPin, CreditCard } from "lucide-react";
import { apiFetch, toWhatsappNumber } from "../api";
import { Field, PrimaryButton, GhostButton, inputClass, CarPhoto, StatusPill, LocationPicker, AvailabilityCalendar } from "../components";
import { CAR_BRANDS, OTHER_BRAND, OTHER_MODEL, AMENITIES } from "../carData";
import CarPhotoManager from "./CarPhotoManager";
import { BusinessAnalytics, AdminAnalytics, AdminLogins } from "./Analytics";

export default function Business({ token, showError, showOk, isAdmin, tab, setTab, highlightBookingId, refreshKey }) {
  const [company, setCompany] = useState(undefined);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localRefresh, setLocalRefresh] = useState(0);
  const analyticsRefreshKey = refreshKey + localRefresh;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const c = await apiFetch("/Companies/my-company", token);
      setCompany(c);
      const allCars = await apiFetch("/Cars", null);
      setCars(allCars.filter((car) => car.companyId === c.companyId));
    } catch (e) { setCompany(null); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <p className="text-center text-sm text-slate-400 py-16">Duke ngarkuar...</p>;

  if (company === null && !isAdmin) return <RegisterCompanyForm token={token} onDone={load} showError={showError} showOk={showOk} />;

  const tabs = [
    { key: "dashboard", label: "Biznesi im" },
    { key: "bookings", label: "Rezervimet" },
    ...(company ? [{ key: "analytics", label: "Statistikat" }] : []),
    ...(isAdmin ? [
      { key: "admin", label: "Verifikime" },
      { key: "whatsapp", label: "WhatsApp" },
      { key: "admin-analytics", label: "Statistikat e platformes" },
      { key: "admin-logins", label: "Logs hyrjesh" },
    ] : []),
  ];

  return (
    <div>
      <div className="flex mb-6 gap-2">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`text-xs font-semibold px-3 py-1.5 rounded-full ${tab === t.key ? "bg-emerald-700 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === "admin" && <AdminPending token={token} showError={showError} showOk={showOk} />}
      {tab === "whatsapp" && <AdminWhatsapp token={token} showError={showError} showOk={showOk} />}
      {tab === "admin-analytics" && <AdminAnalytics token={token} showError={showError} refreshKey={analyticsRefreshKey} />}
      {tab === "admin-logins" && <AdminLogins token={token} showError={showError} refreshKey={analyticsRefreshKey} />}
      {tab === "analytics" && <BusinessAnalytics token={token} showError={showError} refreshKey={analyticsRefreshKey} />}
      {tab === "bookings" && (
        <CompanyBookings
          token={token}
          showError={showError}
          showOk={showOk}
          highlightBookingId={highlightBookingId}
          companyName={company?.emri}
          refreshKey={refreshKey}
          onChanged={() => setLocalRefresh((k) => k + 1)}
        />
      )}
      {tab === "dashboard" && (
        company === null
          ? <RegisterCompanyForm token={token} onDone={load} showError={showError} showOk={showOk} />
          : <CompanyDashboard token={token} company={company} cars={cars} reload={load} showError={showError} showOk={showOk} />
      )}
    </div>
  );
}

function PaymentBadge({ b }) {
  if (!b.paymentMethod || b.paymentMethod === "cash") return null;
  return (
    <p className="text-[11px] text-teal-700 dark:text-teal-400 flex items-center gap-1 mt-0.5">
      <CreditCard size={11} />
      {b.paymentMethod === "paypal_full"
        ? "Paguar plotesisht me karte"
        : `Depozite ${b.payment?.shumaPaguarOnline ?? ""}€ e paguar me karte, pjesa tjeter cash`}
    </p>
  );
}

function CompanyBookings({ token, showError, showOk, highlightBookingId, companyName, refreshKey, onChanged }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [reason, setReason] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setBookings(await apiFetch("/Bookings/for-my-company", token)); } catch (e) { showError(e); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (refreshKey) load(); }, [refreshKey]);

  useEffect(() => {
    if (!highlightBookingId) return;
    const el = document.getElementById(`booking-${highlightBookingId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightBookingId, bookings]);

  async function confirm(id) {
    setActingId(id);
    try { await apiFetch(`/Bookings/${id}/confirm`, token, { method: "PUT" }); showOk("Rezervimi u miratua."); load(); onChanged && onChanged(); }
    catch (e) { showError(e); } finally { setActingId(null); }
  }
  async function reject(id) {
    if (!reason.trim()) { showError(new Error("Duhet te shkruash nje arsye per refuzimin.")); return; }
    setActingId(id);
    try {
      await apiFetch(`/Bookings/${id}/cancel`, token, { method: "PUT", body: JSON.stringify({ reason }) });
      showOk("Rezervimi u refuzua.");
      setRejectingId(null);
      setReason("");
      load();
      onChanged && onChanged();
    } catch (e) { showError(e); } finally { setActingId(null); }
  }
  async function removeBooking(id) {
    setActingId(id);
    try { await apiFetch(`/Bookings/${id}`, token, { method: "DELETE" }); showOk("Rezervimi u fshi."); setDeletingId(null); load(); }
    catch (e) { showError(e); } finally { setActingId(null); }
  }
  async function verifyId(id) {
    setActingId(id);
    try { await apiFetch(`/Bookings/${id}/verify-id`, token, { method: "PUT" }); showOk("Identiteti u verifikua."); load(); }
    catch (e) { showError(e); } finally { setActingId(null); }
  }

  const days = (b) => Math.max(1, Math.round((new Date(b.dataPerfundimit) - new Date(b.dataFillimit)) / 86400000));

  if (loading) return <p className="text-center text-sm text-slate-400 py-16">Duke ngarkuar...</p>;
  if (bookings.length === 0) return <div className="text-center py-16 px-8"><Calendar size={28} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" /><p className="text-sm text-slate-500 dark:text-slate-400">Ende s'ke asnje rezervim per makinat e tua.</p></div>;

  const pending = bookings.filter((b) => b.statusi === "pending");
  const others = bookings.filter((b) => b.statusi !== "pending");

  return (
    <div className="flex flex-col gap-8">
      {pending.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-3">Ne pritje te miratimit ({pending.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pending.map((b) => (
              <div
                key={b.bookingId}
                id={`booking-${b.bookingId}`}
                className={`border bg-amber-50/40 dark:bg-amber-900/20 rounded-2xl p-4 transition ${highlightBookingId === b.bookingId ? "border-emerald-400 dark:border-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-900/40" : "border-amber-200 dark:border-amber-800/60"}`}
              >
                <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{b.car.marka} {b.car.modeli}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{b.dataFillimit} → {b.dataPerfundimit} · {days(b)} dite</p>
                <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1 mt-2">
                  <UserIcon size={12} /> {b.klienti.emri} {b.klienti.mbiemri} · {b.klienti.telefoni}
                  {b.klienti.hasWhatsapp && b.klienti.telefoni && (
                    <a
                      href={`https://wa.me/${toWhatsappNumber(b.klienti.telefoni)}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300"
                      title="Shkruaj ne WhatsApp"
                    >
                      <MessageCircle size={13} />
                    </a>
                  )}
                  {b.klienti.email && (
                    <a
                      href={`mailto:${b.klienti.email}?subject=${encodeURIComponent(`Rezervimi juaj prane ${companyName || "nesh"}`)}&body=${encodeURIComponent(`Pershendetje ${b.klienti.emri},\n\nJu kontaktojme lidhur me rezervimin tuaj per ${b.car.marka} ${b.car.modeli} (${b.dataFillimit} - ${b.dataPerfundimit}) prane ${companyName || "nesh"}.\n\n`)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                      title="Shkruaj email"
                    >
                      <Mail size={13} />
                    </a>
                  )}
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-2">{b.cmimiTotal}€</p>
                <PaymentBadge b={b} />
                {rejectingId === b.bookingId ? (
                  <div className="mt-3">
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Arsyeja e refuzimit (i dergohet klientit)..."
                      rows={2}
                      autoFocus
                      className="w-full text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg px-2 py-1.5 mb-2 outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
                    />
                    <div className="flex gap-2">
                      <GhostButton onClick={() => reject(b.bookingId)} disabled={actingId === b.bookingId} className="text-xs py-2 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/60 hover:bg-red-50 dark:hover:bg-red-900/20">
                        Konfirmo refuzimin
                      </GhostButton>
                      <GhostButton onClick={() => { setRejectingId(null); setReason(""); }} className="text-xs py-2">
                        Anulo
                      </GhostButton>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 mt-3">
                    <PrimaryButton onClick={() => confirm(b.bookingId)} disabled={actingId === b.bookingId} className="text-xs py-2">
                      Mirato
                    </PrimaryButton>
                    <GhostButton onClick={() => { setRejectingId(b.bookingId); setReason(""); }} disabled={actingId === b.bookingId} className="text-xs py-2">
                      Refuzo
                    </GhostButton>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {others.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-3">Historiku</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {others.map((b) => (
              <div
                key={b.bookingId}
                id={`booking-${b.bookingId}`}
                className={`border rounded-2xl p-4 transition ${highlightBookingId === b.bookingId ? "border-emerald-400 dark:border-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-900/40" : "border-slate-200 dark:border-slate-700"}`}
              >
                <div className="flex items-start justify-between">
                  <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{b.car.marka} {b.car.modeli}</p>
                  <StatusPill status={b.statusi} />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{b.dataFillimit} → {b.dataPerfundimit} · {days(b)} dite</p>
                <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1 mt-2">
                  <UserIcon size={12} /> {b.klienti.emri} {b.klienti.mbiemri}
                  {b.klienti.hasWhatsapp && b.klienti.telefoni && (
                    <a
                      href={`https://wa.me/${toWhatsappNumber(b.klienti.telefoni)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300"
                      title="Shkruaj ne WhatsApp"
                    >
                      <MessageCircle size={13} />
                    </a>
                  )}
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-2">{b.cmimiTotal}€</p>
                <PaymentBadge b={b} />
                {b.statusi === "confirmed" && (
                  b.idVerifikuar ? (
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg px-2 py-1.5 mt-2 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Identiteti u verifikua
                    </p>
                  ) : (
                    <GhostButton onClick={() => verifyId(b.bookingId)} disabled={actingId === b.bookingId} className="text-xs py-2 mt-2">
                      Verifiko ID (patente + karte identiteti ne WhatsApp)
                    </GhostButton>
                  )
                )}
                {b.arsyejaRefuzimit && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 bg-slate-50 dark:bg-slate-800 rounded-lg px-2 py-1.5">
                    <span className="font-semibold">Arsyeja:</span> {b.arsyejaRefuzimit}
                  </p>
                )}
                {b.statusi === "cancelled" && (
                  deletingId === b.bookingId ? (
                    <div className="flex items-center gap-2 mt-3">
                      <button onClick={() => removeBooking(b.bookingId)} disabled={actingId === b.bookingId} className="text-xs font-semibold text-red-600 dark:text-red-400 underline">
                        {actingId === b.bookingId ? "Duke fshire..." : "Po, fshije"}
                      </button>
                      <button onClick={() => setDeletingId(null)} className="text-xs text-slate-400 dark:text-slate-500 underline">Anulo</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeletingId(b.bookingId)} className="text-xs text-slate-400 dark:text-slate-500 underline mt-3">
                      Fshi
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RegisterCompanyForm({ token, onDone, showError, showOk }) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({ emri: "", telefoni: "", adresa: "", qyteti: "", nipt: "" });
  const [coords, setCoords] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (coords) { fd.append("latitude", coords.latitude); fd.append("longitude", coords.longitude); }
      if (file) fd.append("certifikataFile", file);

      await apiFetch("/Companies/register", token, { method: "POST", body: fd });
      showOk("Biznesi u regjistrua. Ne pritje te verifikimit.");
      onDone();
    } catch (e) { showError(e); } finally { setLoading(false); }
  }

  return (
    <div className="max-w-2xl mx-auto py-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Bëhu pjesë e ERental</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Lista makinat e biznesit tënd te platforma jonë dhe merr klientë të rinj çdo ditë — pa kosto fillestare.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mb-1">0€</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Kosto fillestare</p>
        </div>
        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mb-1">24-48h</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Verifikim i shpejtë</p>
        </div>
        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-center flex flex-col items-center justify-center">
          <MessageCircle size={20} className="text-emerald-700 dark:text-emerald-400 mb-1" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Support: <a href="https://wa.me/355688208868" target="_blank" rel="noreferrer" className="text-emerald-700 dark:text-emerald-400 underline">WhatsApp</a></p>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-2 mb-1"><Building2 size={20} className="text-emerald-700 dark:text-emerald-400" /><h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Regjistro biznesin</h2></div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Do te perdorim email-in e llogarise tende per biznesin.</p>
        <form onSubmit={submit}>
          <Field label="Emri i biznesit"><input required className={inputClass} value={form.emri} onChange={set("emri")} placeholder="AutoRent Tirana" /></Field>
          <Field label="Telefoni"><input className={inputClass} value={form.telefoni} onChange={set("telefoni")} placeholder="0691234567" /></Field>
          <Field label="Adresa"><input className={inputClass} value={form.adresa} onChange={set("adresa")} placeholder="Rruga..." /></Field>
          <Field label="Qyteti"><input className={inputClass} value={form.qyteti} onChange={set("qyteti")} placeholder="Tirane" /></Field>
          <Field label="Vendndodhja e sakte (per hartë tek klientët)">
            <LocationPicker adresa={form.adresa} qyteti={form.qyteti} coords={coords} onChange={setCoords} showError={showError} />
          </Field>
          <Field label="NIPT"><input required className={inputClass} value={form.nipt} onChange={set("nipt")} placeholder="L12345678A" /></Field>
          <Field label="Certifikata e NIPT-it (foto/PDF)">
            <input type="file" accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className={inputClass} />
          </Field>
          <PrimaryButton type="submit" disabled={loading}>{loading ? "Duke dergaur..." : "Regjistro biznesin"}</PrimaryButton>
        </form>
      </div>
    </div>
  );
}

function CompanyDashboard({ token, company, cars, reload, showError, showOk }) {
  const [showAddCar, setShowAddCar] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);
  const [coords, setCoords] = useState(null);
  const [savingLocation, setSavingLocation] = useState(false);

  async function saveLocation() {
    if (!coords) return;
    setSavingLocation(true);
    try {
      await apiFetch("/Companies/my-company/location", token, { method: "PUT", body: JSON.stringify(coords) });
      showOk("Vendndodhja u ruajt.");
      setEditingLocation(false);
      setCoords(null);
      reload();
    } catch (e) { showError(e); } finally { setSavingLocation(false); }
  }

  return (
    <div>
      <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 mb-6 max-w-xl">
        <div className="flex items-start justify-between">
          <div><p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{company.emri}</p><p className="text-xs text-slate-500 dark:text-slate-400">{company.qyteti} · NIPT {company.nipt}</p></div>
          {company.eshteVerifikuar ? (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full"><ShieldCheck size={12} /> I verifikuar</span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-full"><Clock size={12} /> Ne pritje</span>
          )}
        </div>
        <p className="text-[11px] text-slate-400 mt-2">Modeli i faturimit: {company.billingModel === "commission" ? `Komision ${company.commissionRate}%` : "Abonim mujor"}</p>

        {editingLocation ? (
          <div className="mt-3">
            <LocationPicker adresa={company.adresa} qyteti={company.qyteti} coords={coords} onChange={setCoords} showError={showError} />
            <div className="flex gap-2 mt-2">
              <PrimaryButton type="button" onClick={saveLocation} disabled={!coords || savingLocation} className="text-xs py-2">
                {savingLocation ? "Duke ruajtur..." : "Ruaj vendndodhjen"}
              </PrimaryButton>
              <GhostButton type="button" onClick={() => { setEditingLocation(false); setCoords(null); }} className="text-xs py-2">Anulo</GhostButton>
            </div>
          </div>
        ) : (
          <button onClick={() => setEditingLocation(true)} className={`flex items-center gap-1.5 text-[11px] font-semibold rounded-full px-2.5 py-1 mt-2.5 w-fit border transition ${company.latitude != null ? "border-teal-300 dark:border-teal-700 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300" : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
            <MapPin size={11} /> {company.latitude != null ? "Vendndodhja e saktë e vendosur — ndrysho" : "Vendos vendndodhjen e sakte per hartë"}
          </button>
        )}
      </div>

      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Makinat e mia ({cars.length})</h3>
        <button onClick={() => setShowAddCar((s) => !s)} className="flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 underline"><Plus size={14} /> Shto makine</button>
      </div>

      {showAddCar && <div className="max-w-xl"><AddCarForm token={token} companyId={company.companyId} onDone={() => { setShowAddCar(false); reload(); }} showError={showError} showOk={showOk} /></div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cars.map((car) => <BusinessCarCard key={car.carId} car={car} token={token} reload={reload} showError={showError} showOk={showOk} />)}
      </div>
    </div>
  );
}

function buildCarForm(car) {
  if (!car) {
    return {
      marka: "", markaCustom: "", modeli: "", modeliCustom: "",
      viti: "2020", km: "0", karburanti: "diesel", transmisioni: "manual",
      ngjyra: "", targa: "", kategoria: "economy", numriVendeve: "5",
      klimatizimi: true, cmimiDites: "20", pershkrimi: "", kubatura: "", cilindra: "", amenities: [],
    };
  }
  const markaKnown = Object.prototype.hasOwnProperty.call(CAR_BRANDS, car.marka);
  const modeliKnown = markaKnown && (CAR_BRANDS[car.marka] || []).includes(car.modeli);
  return {
    marka: markaKnown ? car.marka : OTHER_BRAND,
    markaCustom: markaKnown ? "" : car.marka,
    modeli: modeliKnown ? car.modeli : OTHER_MODEL,
    modeliCustom: modeliKnown ? "" : car.modeli,
    viti: String(car.viti ?? "2020"),
    km: String(car.km ?? "0"),
    karburanti: car.karburanti || "diesel",
    transmisioni: car.transmisioni || "manual",
    ngjyra: car.ngjyra || "",
    targa: car.targa || "",
    kategoria: car.kategoria || "economy",
    numriVendeve: String(car.numriVendeve ?? "5"),
    klimatizimi: car.klimatizimi ?? true,
    cmimiDites: String(car.cmimiDites ?? "20"),
    pershkrimi: car.pershkrimi || "",
    kubatura: car.kubatura != null ? String(car.kubatura) : "",
    cilindra: car.cilindra != null ? String(car.cilindra) : "",
    amenities: car.amenities || [],
  };
}

function AddCarForm({ token, companyId, existingCar, onDone, showError, showOk }) {
  const isEdit = !!existingCar;
  const [loading, setLoading] = useState(false);
  const [createdCar, setCreatedCar] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [form, setForm] = useState(() => buildCarForm(existingCar));
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const models = CAR_BRANDS[form.marka] || [];

  function toggleAmenity(key) {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(key) ? f.amenities.filter((a) => a !== key) : [...f.amenities, key],
    }));
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const marka = form.marka === OTHER_BRAND ? form.markaCustom.trim() : form.marka;
      const modeli = form.modeli === OTHER_MODEL ? form.modeliCustom.trim() : form.modeli;
      const payload = {
        companyId, marka, modeli, viti: Number(form.viti), km: Number(form.km),
        karburanti: form.karburanti, transmisioni: form.transmisioni, ngjyra: form.ngjyra, targa: form.targa,
        kategoria: form.kategoria, numriVendeve: Number(form.numriVendeve), klimatizimi: form.klimatizimi,
        cmimiDites: Number(form.cmimiDites), pershkrimi: form.pershkrimi || null,
        kubatura: form.kubatura ? Number(form.kubatura) : null,
        cilindra: form.cilindra ? Number(form.cilindra) : null,
        amenities: form.amenities,
      };
      if (isEdit) {
        await apiFetch(`/Cars/${existingCar.carId}`, token, { method: "PUT", body: JSON.stringify(payload) });
        showOk("Makina u perditesua.");
        onDone();
      } else {
        const car = await apiFetch("/Cars", token, { method: "POST", body: JSON.stringify(payload) });
        setCreatedCar(car);
        showOk("Makina u shtua. Tani shto fotot.");
      }
    } catch (e) { showError(e); } finally { setLoading(false); }
  }

  async function refreshPhotos(carId) {
    try { setPhotos(await apiFetch(`/CarPhotos/car/${carId}`, token)); } catch (e) { showError(e); }
  }

  if (createdCar) {
    return (
      <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-3 mb-4 bg-slate-50 dark:bg-slate-800">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">{createdCar.marka} {createdCar.modeli} u shtua</p>
        <CarPhotoManager
          carId={createdCar.carId}
          token={token}
          photos={photos}
          showError={showError}
          onChanged={() => refreshPhotos(createdCar.carId)}
        />
        <PrimaryButton type="button" className="mt-3" onClick={onDone}>Perfundo</PrimaryButton>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="border border-slate-200 dark:border-slate-700 rounded-2xl p-3 mb-4 bg-slate-50 dark:bg-slate-800">
      <div className="grid grid-cols-2 gap-2">
        <Field label="Marka">
          <select required className={inputClass} value={form.marka} onChange={(e) => setForm((f) => ({ ...f, marka: e.target.value, modeli: "" }))}>
            <option value="" disabled>Zgjidh markën</option>
            {Object.keys(CAR_BRANDS).map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </Field>
        {form.marka === OTHER_BRAND && (
          <Field label="Marka (shkruaj)"><input required className={inputClass} value={form.markaCustom} onChange={set("markaCustom")} placeholder="Marka" /></Field>
        )}
        <Field label="Modeli">
          <select required className={inputClass} value={form.modeli} onChange={set("modeli")} disabled={!form.marka}>
            <option value="" disabled>Zgjidh modelin</option>
            {models.map((m) => <option key={m} value={m}>{m}</option>)}
            {form.marka && <option value={OTHER_MODEL}>Tjeter</option>}
          </select>
        </Field>
        {form.modeli === OTHER_MODEL && (
          <Field label="Modeli (shkruaj)"><input required className={inputClass} value={form.modeliCustom} onChange={set("modeliCustom")} placeholder="Modeli" /></Field>
        )}
        <Field label="Viti"><input type="number" className={inputClass} value={form.viti} onChange={set("viti")} /></Field>
        <Field label="Km"><input type="number" className={inputClass} value={form.km} onChange={set("km")} /></Field>
        <Field label="Kubatura (cc)"><input type="number" className={inputClass} value={form.kubatura} onChange={set("kubatura")} placeholder="1600" /></Field>
        <Field label="Cilindra"><input type="number" className={inputClass} value={form.cilindra} onChange={set("cilindra")} placeholder="4" /></Field>
        <Field label="Karburanti">
          <select className={inputClass} value={form.karburanti} onChange={set("karburanti")}>
            <option value="diesel">Diesel</option><option value="benzine">Benzine</option><option value="hybrid">Hybrid</option><option value="elektrik">Elektrik</option>
          </select>
        </Field>
        <Field label="Transmisioni">
          <select className={inputClass} value={form.transmisioni} onChange={set("transmisioni")}>
            <option value="manual">Manual</option><option value="automatik">Automatik</option>
          </select>
        </Field>
        <Field label="Ngjyra"><input className={inputClass} value={form.ngjyra} onChange={set("ngjyra")} placeholder="E zeze" /></Field>
        <Field label="Targa"><input required className={inputClass} value={form.targa} onChange={set("targa")} placeholder="AA123BB" /></Field>
        <Field label="Kategoria">
          <select className={inputClass} value={form.kategoria} onChange={set("kategoria")}>
            <option value="economy">Economy</option><option value="suv">SUV</option><option value="luxury">Luxury</option><option value="van">Van</option>
          </select>
        </Field>
        <Field label="Vende"><input type="number" className={inputClass} value={form.numriVendeve} onChange={set("numriVendeve")} /></Field>
        <Field label="Cmimi/dite (€)"><input type="number" className={inputClass} value={form.cmimiDites} onChange={set("cmimiDites")} /></Field>
        <label className="flex items-center gap-2 mt-6 text-xs text-slate-600 dark:text-slate-300">
          <input type="checkbox" checked={form.klimatizimi} onChange={(e) => setForm((f) => ({ ...f, klimatizimi: e.target.checked }))} /> Klimatizim
        </label>
      </div>
      <Field label="Pajisje shtese">
        <div className="grid grid-cols-2 gap-1.5">
          {AMENITIES.map((a) => (
            <label key={a.key} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <input type="checkbox" checked={form.amenities.includes(a.key)} onChange={() => toggleAmenity(a.key)} /> {a.label}
            </label>
          ))}
        </div>
      </Field>
      <PrimaryButton type="submit" disabled={loading} className="mt-2">
        {loading ? "Duke ruajtur..." : isEdit ? "Ruaj ndryshimet" : "Ruaj makinen"}
      </PrimaryButton>
    </form>
  );
}

function BusinessCarCard({ car, token, reload, showError, showOk }) {
  const [managingPhotos, setManagingPhotos] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [ranges, setRanges] = useState([]);

  function toggleCalendar() {
    const next = !showCalendar;
    setShowCalendar(next);
    if (next) apiFetch(`/Cars/${car.carId}/availability`, null).then(setRanges).catch(() => {});
  }

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
      <CarPhoto car={car} />
      <div className="p-3">
        <div className="flex items-start justify-between">
          <div><p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{car.marka} {car.modeli}</p><p className="text-xs text-slate-500 dark:text-slate-400">{car.targa} · {car.cmimiDites}€/dite</p></div>
          <StatusPill status={car.statusi === "active" ? "confirmed" : car.statusi} />
        </div>
        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={() => setEditing((s) => !s)}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl py-2 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            {editing ? "Mbyll" : "Edito"}
          </button>
          <button
            type="button"
            onClick={() => setManagingPhotos((s) => !s)}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 border border-dashed border-emerald-300 dark:border-emerald-700 rounded-xl py-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
          >
            <Upload size={13} />{managingPhotos ? "Mbyll" : "Fotot"}
          </button>
        </div>
        <button
          type="button"
          onClick={toggleCalendar}
          className="flex items-center justify-center gap-1.5 text-xs font-medium text-teal-700 dark:text-teal-400 border border-dashed border-teal-300 dark:border-teal-700 rounded-xl py-2 mt-2 w-full hover:bg-teal-50 dark:hover:bg-teal-900/20"
        >
          <Calendar size={13} />{showCalendar ? "Mbyll kalendarin" : "Kalendari i rezervimeve"}
        </button>
        {showCalendar && (
          <div className="mt-3">
            <AvailabilityCalendar ranges={ranges} />
          </div>
        )}
        {editing && (
          <div className="mt-3">
            <AddCarForm
              token={token}
              companyId={car.companyId}
              existingCar={car}
              onDone={() => { setEditing(false); reload(); }}
              showError={showError}
              showOk={showOk}
            />
          </div>
        )}
        {managingPhotos && (
          <div className="mt-3">
            <CarPhotoManager carId={car.carId} token={token} photos={car.carPhotos} showError={showError} onChanged={reload} />
          </div>
        )}
      </div>
    </div>
  );
}

function AdminPending({ token, showError, showOk }) {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setPending(await apiFetch("/Companies/pending", token)); } catch (e) { showError(e); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function verify(id) {
    try { await apiFetch(`/Companies/${id}/verify`, token, { method: "PUT" }); showOk("Biznesi u verifikua."); load(); }
    catch (e) { showError(e); }
  }

  async function reject(id) {
    try { await apiFetch(`/Companies/${id}/reject`, token, { method: "DELETE" }); showOk("Aplikimi u refuzua."); load(); }
    catch (e) { showError(e); }
  }

  if (loading) return <p className="text-center text-sm text-slate-400 py-16">Duke ngarkuar...</p>;
  if (pending.length === 0) return <div className="text-center py-16 px-8"><CheckCircle2 size={28} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" /><p className="text-sm text-slate-500 dark:text-slate-400">Asnje biznes ne pritje.</p></div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {pending.map((c) => (
        <div key={c.companyId} className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
          <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{c.emri}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{c.qyteti} · NIPT {c.nipt}</p>
          <p className="text-xs text-slate-400">{c.email} · {c.telefoni}</p>
          {c.certifikataUrl ? (
            <a href={c.certifikataUrl} target="_blank" rel="noreferrer" className="text-xs text-emerald-700 dark:text-emerald-400 underline mt-2 block">
              Shiko certifikaten e NIPT-it
            </a>
          ) : (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">S'ka certifikate te ngarkuar</p>
          )}
          <PrimaryButton onClick={() => verify(c.companyId)} className="mt-2 text-xs py-2">Verifiko biznesin</PrimaryButton>
          <GhostButton onClick={() => reject(c.companyId)} className="mt-2 text-xs py-2">Refuzo dhe fshi</GhostButton>
        </div>
      ))}
    </div>
  );
}

function AdminWhatsapp({ token, showError, showOk }) {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setPending(await apiFetch("/WhatsappVerifications/pending", token)); } catch (e) { showError(e); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function verify(id) {
    try { await apiFetch(`/WhatsappVerifications/${id}/verify`, token, { method: "PUT" }); showOk("Numri u verifikua."); load(); }
    catch (e) { showError(e); }
  }

  async function reject(id) {
    try { await apiFetch(`/WhatsappVerifications/${id}/reject`, token, { method: "PUT" }); showOk("Kerkesa u refuzua."); load(); }
    catch (e) { showError(e); }
  }

  if (loading) return <p className="text-center text-sm text-slate-400 py-16">Duke ngarkuar...</p>;
  if (pending.length === 0) return <div className="text-center py-16 px-8"><CheckCircle2 size={28} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" /><p className="text-sm text-slate-500 dark:text-slate-400">Asnje kerkese ne pritje.</p></div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {pending.map((w) => (
        <div key={w.id} className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
          <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{w.emri} {w.mbiemri}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{w.email}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1"><MessageCircle size={12} /> {w.telefoni || "S'ka numer"}</p>
          <p className="text-xs text-slate-400 mt-2">Kontrollo WhatsApp-in e biznesit per kodin:</p>
          <p className="font-bold text-lg tracking-[0.3em] text-slate-900 dark:text-slate-100 text-center mt-1">{w.code}</p>
          <PrimaryButton onClick={() => verify(w.id)} className="mt-3 text-xs py-2">Verifiko</PrimaryButton>
          <GhostButton onClick={() => reject(w.id)} className="mt-2 text-xs py-2">Refuzo</GhostButton>
        </div>
      ))}
    </div>
  );
}
