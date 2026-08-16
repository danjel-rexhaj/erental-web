import { useState, useEffect, useCallback, useRef } from "react";
import { Building2, Plus, Upload, ShieldCheck, Clock, CheckCircle2, Calendar, User as UserIcon, MessageCircle, Mail, MapPin, CreditCard, Pencil, Ban, Trash2, X, Download, ChevronLeft, Car as CarIcon, Star, ChevronDown, Truck } from "lucide-react";
import { apiFetch, apiFetchBlob, toWhatsappNumber, mapEmbedUrl as getMapEmbedUrl } from "../api";
import { Field, PrimaryButton, GhostButton, inputClass, CarPhoto, StatusPill, LocationPicker, DateRangeCalendar, AmenityPicker } from "../components";
import { generateInvoicePdf } from "../invoicePdf";
import { CAR_BRANDS, OTHER_BRAND, OTHER_MODEL, AMENITIES, CAR_CATEGORIES, ALBANIAN_LOCATIONS } from "../carData";
import CarPhotoManager from "./CarPhotoManager";
import { BusinessAnalytics, AdminAnalytics, AdminLogins, TransactionsPage } from "./Analytics";
import { useLang } from "../useLang";

export default function Business({ token, showError, showOk, isAdmin, tab, setTab, carId, setCarId, highlightBookingId, refreshKey }) {
  const { t } = useLang();
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

  // Only show the full-page spinner on the very first load -- reload() also runs after small
  // actions like uploading a photo, and swapping the whole tree out mid-session would unmount
  // CompanyDashboard, losing things like which car's detail view is open.
  if (loading && company === undefined) return <p className="text-center text-sm text-slate-400 py-16">{t("common.loading")}</p>;

  if (company === null && !isAdmin) return <RegisterCompanyForm token={token} onDone={load} showError={showError} showOk={showOk} />;

  // Biznesi im / Rezervimet / Statistikat are reachable directly from the top nav now,
  // so this bar only needs to surface the admin-only views.
  const tabs = isAdmin ? [
    { key: "admin", label: t("business.tabsVerifications") },
    { key: "whatsapp", label: "WhatsApp" },
    { key: "amenity-suggestions", label: t("business.tabsAmenitySuggestions") },
    { key: "admin-analytics", label: t("business.tabsPlatformStats") },
    { key: "admin-logins", label: t("business.tabsLoginLogs") },
  ] : [];

  return (
    <div>
      {tabs.length > 0 && (
        <div className="flex mb-6 gap-2">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`text-xs font-semibold px-3 py-1.5 rounded-full ${tab === t.key ? "bg-sky-600 dark:bg-emerald-700 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"}`}>
              {t.label}
            </button>
          ))}
        </div>
      )}
      {tab === "admin" && <AdminPending token={token} showError={showError} showOk={showOk} />}
      {tab === "whatsapp" && <AdminWhatsapp token={token} showError={showError} showOk={showOk} />}
      {tab === "amenity-suggestions" && <AdminAmenitySuggestions token={token} showError={showError} showOk={showOk} />}
      {tab === "admin-analytics" && <AdminAnalytics token={token} showError={showError} showOk={showOk} refreshKey={analyticsRefreshKey} onGoPending={() => setTab("admin")} onGoTransactions={() => setTab("admin-transactions")} />}
      {tab === "admin-transactions" && <TransactionsPage token={token} showError={showError} admin onBack={() => setTab("admin-analytics")} />}
      {tab === "admin-logins" && <AdminLogins token={token} showError={showError} refreshKey={analyticsRefreshKey} />}
      {tab === "analytics" && <BusinessAnalytics token={token} showError={showError} refreshKey={analyticsRefreshKey} onGoBookings={() => setTab("bookings")} onGoTransactions={() => setTab("transactions")} />}
      {tab === "transactions" && <TransactionsPage token={token} showError={showError} businessName={company?.emri} onBack={() => setTab("analytics")} />}
      {tab === "bookings" && (
        <CompanyBookings
          token={token}
          showError={showError}
          showOk={showOk}
          highlightBookingId={highlightBookingId}
          company={company}
          refreshKey={refreshKey}
          onChanged={() => setLocalRefresh((k) => k + 1)}
        />
      )}
      {tab === "dashboard" && (
        company === null
          ? <RegisterCompanyForm token={token} onDone={load} showError={showError} showOk={showOk} />
          : <CompanyDashboard token={token} company={company} cars={cars} reload={load} showError={showError} showOk={showOk} managingCarId={carId} setManagingCarId={setCarId} />
      )}
    </div>
  );
}

function PaymentBadge({ b }) {
  const { t } = useLang();
  if (!b.paymentMethod || b.paymentMethod === "cash") return null;
  const shumaPaguar = b.payment?.shumaPaguarOnline ?? 0;
  const mbetetCash = (b.cmimiTotal - shumaPaguar).toFixed(2);
  return (
    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
      <CreditCard size={11} />
      {b.paymentMethod === "paypal_full"
        ? t("booking.fullyPaidCard")
        : t("booking.depositPaidRest", { amount: shumaPaguar, rest: mbetetCash })}
    </p>
  );
}

function CompanyBookings({ token, showError, showOk, highlightBookingId, company, refreshKey, onChanged }) {
  const { t, lang } = useLang();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [reason, setReason] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [licenseModalId, setLicenseModalId] = useState(null);
  const [showCancelled, setShowCancelled] = useState(false);

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
    try { await apiFetch(`/Bookings/${id}/confirm`, token, { method: "PUT" }); showOk(t("business.approvedToast")); load(); onChanged && onChanged(); }
    catch (e) { showError(e); } finally { setActingId(null); }
  }
  async function reject(id) {
    if (!reason.trim()) { showError(new Error(t("business.needRejectReasonError"))); return; }
    setActingId(id);
    try {
      await apiFetch(`/Bookings/${id}/cancel`, token, { method: "PUT", body: JSON.stringify({ reason }) });
      showOk(t("business.rejectedToast"));
      setRejectingId(null);
      setReason("");
      load();
      onChanged && onChanged();
    } catch (e) { showError(e); } finally { setActingId(null); }
  }
  async function removeBooking(id) {
    setActingId(id);
    try { await apiFetch(`/Bookings/${id}`, token, { method: "DELETE" }); showOk(t("booking.deleted")); setDeletingId(null); load(); }
    catch (e) { showError(e); } finally { setActingId(null); }
  }
  async function verifyId(id) {
    setActingId(id);
    try {
      await apiFetch(`/Bookings/${id}/verify-id`, token, { method: "PUT" });
      showOk(t("business.identityVerifiedContract"));
      setLicenseModalId(null);
      load();
    } catch (e) { showError(e); } finally { setActingId(null); }
  }

  async function rejectLicense(id, reason) {
    setActingId(id);
    try {
      await apiFetch(`/Bookings/${id}/cancel`, token, { method: "PUT", body: JSON.stringify({ reason }) });
      showOk(t("business.rejectedForLicense"));
      setLicenseModalId(null);
      load();
      onChanged && onChanged();
    } catch (e) { showError(e); } finally { setActingId(null); }
  }

  const days = (b) => Math.max(1, Math.round((new Date(b.dataPerfundimit) - new Date(b.dataFillimit)) / 86400000));
  const confirmim = (b) => `ER-${String(b.bookingId).padStart(6, "0")}`;

  async function downloadInvoice(b) {
    await generateInvoicePdf({
      bookingId: b.bookingId,
      carMakeModel: `${b.car.marka} ${b.car.modeli}`,
      dataFillimit: b.dataFillimit,
      dataPerfundimit: b.dataPerfundimit,
      cmimiPerDite: b.car.cmimiDites,
      dite: days(b),
      totalPrice: b.cmimiTotal,
      amountPaid: b.payment?.shumaPaguarOnline ?? 0,
      eshtePagesePlote: b.paymentMethod === "paypal_full",
      clientLabel: `${b.klienti.emri} ${b.klienti.mbiemri}`,
      company,
      cardLast4: b.payment?.cardLast4,
      transactionId: b.payment?.paypalCaptureId,
      lang,
    });
  }

  if (loading) return <p className="text-center text-sm text-slate-400 py-16">{t("common.loading")}</p>;
  if (bookings.length === 0) return <div className="text-center py-16 px-8"><Calendar size={28} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" /><p className="text-sm text-slate-500 dark:text-slate-400">{t("business.emptyBookings")}</p></div>;

  const confirmedGroup = bookings.filter((b) => b.statusi === "confirmed" || b.statusi === "completed");
  const pending = bookings.filter((b) => b.statusi === "pending");
  const cancelledGroup = bookings.filter((b) => b.statusi === "cancelled");

  const renderHistoryCard = (b) => (
    <div
      key={b.bookingId}
      id={`booking-${b.bookingId}`}
      className={`border rounded-2xl p-4 transition ${highlightBookingId === b.bookingId ? "border-sky-400 dark:border-emerald-500 ring-2 ring-sky-200 dark:ring-emerald-900/40" : "border-slate-200 dark:border-slate-700"}`}
    >
      <div className="flex items-start justify-between">
        <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{b.car.marka} {b.car.modeli}</p>
        <StatusPill status={b.statusi} />
      </div>
      <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">{confirmim(b)}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{b.dataFillimit} → {b.dataPerfundimit} · {t("car.daysCount", { count: days(b) })}</p>
      <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1 mt-2">
        <UserIcon size={12} /> {b.klienti.emri} {b.klienti.mbiemri}
        {b.klienti.hasWhatsapp && b.klienti.telefoni && (
          <a
            href={`https://wa.me/${toWhatsappNumber(b.klienti.telefoni)}`}
            target="_blank"
            rel="noreferrer"
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300"
            title={t("business.whatsappLinkTitle")}
          >
            <MessageCircle size={13} />
          </a>
        )}
      </p>
      <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-2">{b.cmimiTotal}€</p>
      {b.payment?.komisioni != null && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
          {t("business.commissionLine", { commission: b.payment.komisioni.toFixed(2), net: b.payment.shumaBiznesit.toFixed(2) })}
        </p>
      )}
      <PaymentBadge b={b} />
      {b.paymentMethod && b.paymentMethod !== "cash" && (
        <button
          type="button"
          onClick={() => downloadInvoice(b)}
          className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline underline-offset-2 mt-1"
        >
          <Download size={11} /> {t("paymentSuccess.downloadInvoice")}
        </button>
      )}
      {b.statusi === "confirmed" && (
        b.idVerifikuar ? (
          <p className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg px-2 py-1.5 mt-2 flex items-center gap-1">
            <CheckCircle2 size={12} /> {t("business.identityVerifiedShort")}
          </p>
        ) : (
          <GhostButton type="button" onClick={() => setLicenseModalId(b.bookingId)} disabled={actingId === b.bookingId} className="text-xs py-2 mt-2">
            {t("business.viewLicenseForVerification")}
          </GhostButton>
        )
      )}
      {b.arsyejaRefuzimit && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 bg-slate-50 dark:bg-slate-800 rounded-lg px-2 py-1.5">
          <span className="font-semibold">{t("business.reasonLabel")}</span> {b.arsyejaRefuzimit}
        </p>
      )}
      {b.statusi === "cancelled" && (
        deletingId === b.bookingId ? (
          <div className="flex items-center gap-2 mt-3">
            <button onClick={() => removeBooking(b.bookingId)} disabled={actingId === b.bookingId} className="text-xs font-semibold text-red-600 dark:text-red-400 underline">
              {actingId === b.bookingId ? t("booking.deleting") : t("booking.confirmDelete")}
            </button>
            <button onClick={() => setDeletingId(null)} className="text-xs text-slate-400 dark:text-slate-500 underline">{t("booking.cancel")}</button>
          </div>
        ) : (
          <button onClick={() => setDeletingId(b.bookingId)} className="text-xs text-slate-400 dark:text-slate-500 underline mt-3">
            {t("booking.delete")}
          </button>
        )
      )}
    </div>
  );

  const renderCancelledCard = (b) => (
    <div key={b.bookingId} className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
      <div className="flex items-start justify-between">
        <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{b.car.marka} {b.car.modeli}</p>
        <StatusPill status={b.statusi} />
      </div>
      <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">{confirmim(b)}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{b.dataFillimit} → {b.dataPerfundimit} · {b.klienti.emri} {b.klienti.mbiemri}</p>
      {b.arsyejaRefuzimit && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 bg-slate-50 dark:bg-slate-800 rounded-lg px-2 py-1.5">
          <span className="font-semibold">{t("business.reasonLabel")}</span> {b.arsyejaRefuzimit}
        </p>
      )}
      {deletingId === b.bookingId ? (
        <div className="flex items-center gap-2 mt-3">
          <button onClick={() => removeBooking(b.bookingId)} disabled={actingId === b.bookingId} className="text-xs font-semibold text-red-600 dark:text-red-400 underline">
            {actingId === b.bookingId ? t("booking.deleting") : t("booking.confirmDelete")}
          </button>
          <button onClick={() => setDeletingId(null)} className="text-xs text-slate-400 dark:text-slate-500 underline">{t("booking.cancel")}</button>
        </div>
      ) : (
        <button onClick={() => setDeletingId(b.bookingId)} className="text-xs text-slate-400 dark:text-slate-500 underline mt-3">
          {t("booking.delete")}
        </button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-8">
      {pending.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-3">{t("business.pendingApprovalCount", { count: pending.length })}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pending.map((b) => (
              <div
                key={b.bookingId}
                id={`booking-${b.bookingId}`}
                className={`border bg-amber-50/40 dark:bg-amber-900/20 rounded-2xl p-4 transition ${highlightBookingId === b.bookingId ? "border-sky-400 dark:border-emerald-500 ring-2 ring-sky-200 dark:ring-emerald-900/40" : "border-amber-200 dark:border-amber-800/60"}`}
              >
                <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{b.car.marka} {b.car.modeli}</p>
                <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{confirmim(b)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{b.dataFillimit} → {b.dataPerfundimit} · {t("car.daysCount", { count: days(b) })}</p>
                <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1 mt-2">
                  <UserIcon size={12} /> {b.klienti.emri} {b.klienti.mbiemri} · {b.klienti.telefoni}
                  {b.klienti.hasWhatsapp && b.klienti.telefoni && (
                    <a
                      href={`https://wa.me/${toWhatsappNumber(b.klienti.telefoni)}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300"
                      title={t("business.whatsappLinkTitle")}
                    >
                      <MessageCircle size={13} />
                    </a>
                  )}
                  {b.klienti.email && (
                    <a
                      href={`mailto:${b.klienti.email}?subject=${encodeURIComponent(`Rezervimi juaj prane ${company?.emri || "nesh"}`)}&body=${encodeURIComponent(`Pershendetje ${b.klienti.emri},\n\nJu kontaktojme lidhur me rezervimin tuaj per ${b.car.marka} ${b.car.modeli} (${b.dataFillimit} - ${b.dataPerfundimit}) prane ${company?.emri || "nesh"}.\n\n`)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                      title={t("business.emailLinkTitle")}
                    >
                      <Mail size={13} />
                    </a>
                  )}
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-2">{b.cmimiTotal}€</p>
                <PaymentBadge b={b} />
                {b.paymentMethod && b.paymentMethod !== "cash" && (
                  <button
                    type="button"
                    onClick={() => downloadInvoice(b)}
                    className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline underline-offset-2 mt-1"
                  >
                    <Download size={11} /> {t("paymentSuccess.downloadInvoice")}
                  </button>
                )}
                {b.idVerifikuar && (
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg px-2 py-1.5 mt-2 flex items-center gap-1">
                    <CheckCircle2 size={12} /> {t("business.identityVerifiedShort")}
                  </p>
                )}
                {rejectingId === b.bookingId ? (
                  <div className="mt-3">
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder={t("business.rejectReasonPlaceholder")}
                      rows={2}
                      autoFocus
                      className="w-full text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg px-2 py-1.5 mb-2 outline-none focus:border-sky-600 dark:focus:border-emerald-500"
                    />
                    <div className="flex gap-2">
                      <GhostButton onClick={() => reject(b.bookingId)} disabled={actingId === b.bookingId} className="text-xs py-2 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/60 hover:bg-red-50 dark:hover:bg-red-900/20">
                        {t("business.confirmReject")}
                      </GhostButton>
                      <GhostButton onClick={() => { setRejectingId(null); setReason(""); }} className="text-xs py-2">
                        {t("booking.cancel")}
                      </GhostButton>
                    </div>
                  </div>
                ) : b.idVerifikuar ? (
                  <div className="flex gap-2 mt-3">
                    <PrimaryButton onClick={() => confirm(b.bookingId)} disabled={actingId === b.bookingId} className="text-xs py-2">
                      {t("business.approve")}
                    </PrimaryButton>
                    <GhostButton onClick={() => { setRejectingId(b.bookingId); setReason(""); }} disabled={actingId === b.bookingId} className="text-xs py-2">
                      {t("business.reject")}
                    </GhostButton>
                  </div>
                ) : (
                  <div className="flex gap-2 mt-3">
                    <PrimaryButton onClick={() => setLicenseModalId(b.bookingId)} disabled={actingId === b.bookingId} className="text-xs py-2">
                      {t("business.viewLicenseForVerification")}
                    </PrimaryButton>
                    <GhostButton onClick={() => { setRejectingId(b.bookingId); setReason(""); }} disabled={actingId === b.bookingId} className="text-xs py-2">
                      {t("business.reject")}
                    </GhostButton>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {confirmedGroup.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-3">{t("business.confirmedCount", { count: confirmedGroup.length })}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {confirmedGroup.map(renderHistoryCard)}
          </div>
        </div>
      )}

      {cancelledGroup.length > 0 && (
        <div>
          <button
            onClick={() => setShowCancelled((s) => !s)}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          >
            <ChevronDown size={16} className={`transition-transform ${showCancelled ? "rotate-180" : ""}`} />
            {t("business.cancelledCount", { count: cancelledGroup.length })}
          </button>
          {showCancelled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
              {cancelledGroup.map(renderCancelledCard)}
            </div>
          )}
        </div>
      )}

      {licenseModalId && (
        <LicenseModal
          bookingId={licenseModalId}
          token={token}
          showError={showError}
          verifying={actingId === licenseModalId}
          onVerify={() => verifyId(licenseModalId)}
          onReject={(reason) => rejectLicense(licenseModalId, reason)}
          onClose={() => setLicenseModalId(null)}
        />
      )}
    </div>
  );
}

function LicenseModal({ bookingId, token, showError, verifying, onVerify, onReject, onClose }) {
  const { t } = useLang();
  const [imgs, setImgs] = useState({ para: null, mbrapa: null });
  const [loading, setLoading] = useState(true);
  const [zoomed, setZoomed] = useState(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  useEffect(() => {
    let paraUrl = null, mbrapaUrl = null, cancelled = false;
    (async () => {
      try {
        const [p, m] = await Promise.all([
          apiFetchBlob(`/Bookings/${bookingId}/license/para`, token),
          apiFetchBlob(`/Bookings/${bookingId}/license/mbrapa`, token),
        ]);
        paraUrl = p; mbrapaUrl = m;
        if (!cancelled) setImgs({ para: p, mbrapa: m });
      } catch (e) {
        showError(e);
        onClose();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      if (paraUrl) URL.revokeObjectURL(paraUrl);
      if (mbrapaUrl) URL.revokeObjectURL(mbrapaUrl);
    };
  }, [bookingId, token]);

  function submitReject() {
    if (!reason.trim()) { showError(new Error(t("business.needRejectReasonError"))); return; }
    onReject(reason);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{t("business.clientLicense")}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={16} /></button>
        </div>
        {loading ? (
          <p className="text-xs text-slate-400 text-center py-6">{t("common.loading")}</p>
        ) : imgs.para && imgs.mbrapa && (
          <>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button type="button" onClick={() => setZoomed(imgs.para)} className="block">
                <img src={imgs.para} alt={t("auth.licenseFront")} className="rounded-lg w-full h-28 object-cover border border-slate-200 dark:border-slate-700 hover:opacity-90 transition" />
              </button>
              <button type="button" onClick={() => setZoomed(imgs.mbrapa)} className="block">
                <img src={imgs.mbrapa} alt={t("auth.licenseBack")} className="rounded-lg w-full h-28 object-cover border border-slate-200 dark:border-slate-700 hover:opacity-90 transition" />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-3">{t("business.tapToZoom")}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-lg p-2.5 mb-3 leading-relaxed">
              {t("business.licensePrivacyNotice")}
            </p>

            {rejecting ? (
              <div className="flex flex-col gap-2">
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t("business.rejectReasonExamplePlaceholder")}
                  rows={2}
                  className={inputClass + " text-xs"}
                />
                <div className="flex gap-2">
                  <button type="button" onClick={submitReject} disabled={verifying} className="flex-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl px-3 py-2 disabled:opacity-50">
                    {verifying ? t("business.rejecting") : t("business.rejectAndCancelBooking")}
                  </button>
                  <GhostButton type="button" onClick={() => { setRejecting(false); setReason(""); }} className="flex-1 text-xs py-2">{t("booking.cancel")}</GhostButton>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <PrimaryButton type="button" onClick={onVerify} disabled={verifying} className="w-full text-xs py-2">
                  {verifying ? t("common.saving") : t("business.confirmVerification")}
                </PrimaryButton>
                <button type="button" onClick={() => setRejecting(true)} disabled={verifying} className="text-xs font-medium text-red-600 dark:text-red-400 underline">
                  {t("business.notLicensePhoto")}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {zoomed && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" onClick={(e) => { e.stopPropagation(); setZoomed(null); }}>
          <img src={zoomed} alt={t("business.enlargedLicenseAlt")} className="max-w-full max-h-full rounded-lg object-contain" />
          <button onClick={() => setZoomed(null)} className="absolute top-4 right-4 text-white bg-black/50 rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/70">
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

function RegisterCompanyForm({ token, onDone, showError, showOk }) {
  const { t } = useLang();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({ emri: "", telefoni: "", adresa: "", qyteti: "", nipt: "", iban: "", ofronDergimMakine: false });
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
      showOk(t("business.registered"));
      onDone();
    } catch (e) { showError(e); } finally { setLoading(false); }
  }

  return (
    <div className="max-w-2xl mx-auto py-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">{t("business.registerHeroTitle")}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          {t("business.registerHeroSubtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mb-1">0€</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t("business.startCost")}</p>
        </div>
        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mb-1">24-48h</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t("business.fastVerification")}</p>
        </div>
        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-center flex flex-col items-center justify-center">
          <MessageCircle size={20} className="text-emerald-700 dark:text-emerald-400 mb-1" />
          <p className="text-xs text-slate-500 dark:text-slate-400">{t("business.support")} <a href="https://wa.me/355688208868" target="_blank" rel="noreferrer" className="text-emerald-700 dark:text-emerald-400 underline">WhatsApp</a></p>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-2 mb-1"><Building2 size={20} className="text-emerald-700 dark:text-emerald-400" /><h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t("business.registerBusiness")}</h2></div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{t("business.willUseAccountEmail")}</p>
        <form onSubmit={submit}>
          <Field label={t("business.businessName")}><input required className={inputClass} value={form.emri} onChange={set("emri")} placeholder="AutoRent Tirana" /></Field>
          <Field label={t("auth.phone")}><input className={inputClass} value={form.telefoni} onChange={set("telefoni")} placeholder="0691234567" /></Field>
          <Field label={t("business.address")}><input className={inputClass} value={form.adresa} onChange={set("adresa")} placeholder="Rruga..." /></Field>
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
            <input type="file" accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className={inputClass} />
          </Field>
          <PrimaryButton type="submit" disabled={loading}>{loading ? t("common.sending") : t("business.registerBusiness")}</PrimaryButton>
        </form>
      </div>
    </div>
  );
}

function CompanyDashboard({ token, company, cars, reload, showError, showOk, managingCarId, setManagingCarId }) {
  const { t } = useLang();
  const [showAddCar, setShowAddCar] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);
  const [coords, setCoords] = useState(null);
  const [savingLocation, setSavingLocation] = useState(false);
  const [editingDetails, setEditingDetails] = useState(false);
  const [confirmingDeactivate, setConfirmingDeactivate] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  async function deactivate() {
    setDeactivating(true);
    try {
      await apiFetch("/Companies/my-company/deactivate", token, { method: "POST" });
      showOk(t("business.accountDeactivatedToast"));
      setConfirmingDeactivate(false);
      reload();
    } catch (e) { showError(e); } finally { setDeactivating(false); }
  }

  async function reactivate() {
    setDeactivating(true);
    try {
      await apiFetch("/Companies/my-company/reactivate", token, { method: "POST" });
      showOk(t("business.accountReactivatedToast"));
      reload();
    } catch (e) { showError(e); } finally { setDeactivating(false); }
  }

  async function saveLocation() {
    if (!coords) return;
    setSavingLocation(true);
    try {
      await apiFetch("/Companies/my-company/location", token, { method: "PUT", body: JSON.stringify(coords) });
      showOk(t("business.locationSaved"));
      setEditingLocation(false);
      setCoords(null);
      reload();
    } catch (e) { showError(e); } finally { setSavingLocation(false); }
  }

  const hasCoords = company.latitude != null && company.longitude != null;
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const directionsUrl = hasCoords
    ? (isIOS ? `https://maps.apple.com/?daddr=${company.latitude},${company.longitude}` : `https://www.google.com/maps/dir/?api=1&destination=${company.latitude},${company.longitude}`)
    : null;
  const mapEmbedUrl = hasCoords ? getMapEmbedUrl(company.latitude, company.longitude) : null;

  return (
    <div>
      {!company.iban && (
        <div className="border border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-900/20 rounded-2xl p-4 mb-4 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-amber-800 dark:text-amber-300">{t("business.noIbanWarning")}</p>
          <button onClick={() => setEditingDetails(true)} className="text-xs font-semibold text-amber-800 dark:text-amber-300 underline shrink-0">{t("business.addIban")}</button>
        </div>
      )}
      <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-stretch gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-sky-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
              {company.logoUrl ? (
                <img src={company.logoUrl} alt={company.emri} className="w-full h-full object-cover" />
              ) : (
                <Building2 size={28} className="text-sky-600 dark:text-emerald-400" />
              )}
            </div>
            <div className="min-w-0 flex-1 lg:flex-initial">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{company.emri}</p>
                {company.eshteVerifikuar ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0"><ShieldCheck size={12} /> {t("common.verified")}</span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0"><Clock size={12} /> {t("common.status.pending")}</span>
                )}
                {company.ofronDergimMakine && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-teal-300 bg-sky-50 dark:bg-teal-900/30 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0"><Truck size={12} /> {t("common.deliveryBadge")}</span>
                )}
                {!editingDetails && (
                  <button onClick={() => setEditingDetails(true)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" title={t("auth.editData")}>
                    <Pencil size={13} />
                  </button>
                )}
              </div>

              {editingDetails ? (
                <EditCompanyDetailsForm
                  token={token}
                  company={company}
                  showError={showError}
                  onDone={() => { setEditingDetails(false); reload(); }}
                  onCancel={() => setEditingDetails(false)}
                />
              ) : (
                <>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{company.qyteti} · NIPT {company.nipt}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{t("business.billingModelLabel")} {company.billingModel === "commission" ? t("business.commission", { pct: company.commissionRate }) : t("business.monthlySubscription")}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">IBAN: {company.iban || t("business.ibanNotSet")}</p>
                </>
              )}

              {!editingDetails && editingLocation ? (
                <div className="mt-3">
                  <LocationPicker adresa={company.adresa} qyteti={company.qyteti} coords={coords} onChange={setCoords} showError={showError} />
                  <div className="flex gap-2 mt-2">
                    <PrimaryButton type="button" onClick={saveLocation} disabled={!coords || savingLocation} className="text-xs py-2">
                      {savingLocation ? t("common.saving") : t("business.saveLocation")}
                    </PrimaryButton>
                    <GhostButton type="button" onClick={() => { setEditingLocation(false); setCoords(null); }} className="text-xs py-2">{t("booking.cancel")}</GhostButton>
                  </div>
                </div>
              ) : !editingDetails && (
                <button onClick={() => setEditingLocation(true)} className={`flex items-center gap-1.5 text-[11px] font-semibold rounded-full px-2.5 py-1 mt-2.5 w-fit border transition ${company.latitude != null ? "border-sky-300 dark:border-teal-700 bg-sky-50 dark:bg-teal-900/30 text-sky-600 dark:text-teal-300" : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
                  <MapPin size={11} /> {company.latitude != null ? t("business.exactLocationSetChange") : t("business.setExactLocation")}
                </button>
              )}
            </div>
          </div>

          {mapEmbedUrl && !editingLocation && (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noreferrer"
              title={t("business.openInGoogleMaps")}
              className="hidden lg:block relative flex-1 min-h-20 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700"
            >
              <iframe title={t("common.businessLocationTitle")} src={mapEmbedUrl} className="w-full h-full border-0 pointer-events-none" loading="lazy" tabIndex={-1} />
              <span className="absolute inset-0 bg-black/0 hover:bg-black/10 transition" />
            </a>
          )}
        </div>
      </div>

      {cars.find((c) => c.carId === managingCarId) ? (
        <BusinessCarDetail
          car={cars.find((c) => c.carId === managingCarId)}
          token={token}
          reload={reload}
          showError={showError}
          showOk={showOk}
          onBack={() => setManagingCarId(null)}
        />
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{t("business.myCars", { count: cars.length })}</h3>
            <button onClick={() => setShowAddCar((s) => !s)} className="flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-emerald-400 underline"><Plus size={14} /> {t("business.addCar")}</button>
          </div>

          {showAddCar && <div className="max-w-xl"><AddCarForm token={token} companyId={company.companyId} onDone={() => { setShowAddCar(false); reload(); }} showError={showError} showOk={showOk} /></div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cars.map((car) => <BusinessCarCard key={car.carId} car={car} onOpen={setManagingCarId} />)}
          </div>
        </>
      )}

      {!managingCarId && (company.statusi === "inactive" ? (
        <div className="mt-8 border border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-900/20 rounded-2xl p-4">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">{t("business.accountDeactivated")}</p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mb-3">{t("business.deactivatedNotice")}</p>
          <PrimaryButton type="button" onClick={reactivate} disabled={deactivating} className="text-xs py-2 w-fit">
            {deactivating ? t("business.reactivating") : t("business.reactivateAccount")}
          </PrimaryButton>
        </div>
      ) : (
        <div className="mt-8 border border-red-200 dark:border-red-800/60 rounded-2xl p-4">
          <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">{t("business.dangerZone")}</p>
          {confirmingDeactivate ? (
            <>
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
                {t("business.deactivateWarning")}
              </p>
              <div className="flex gap-2">
                <button onClick={deactivate} disabled={deactivating} className="text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl px-3 py-2 disabled:opacity-50">
                  {deactivating ? t("business.deactivating") : t("business.confirmDeleteAccount")}
                </button>
                <GhostButton type="button" onClick={() => setConfirmingDeactivate(false)} className="text-xs py-2">{t("booking.cancel")}</GhostButton>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{t("business.deactivateHint")}</p>
              <button onClick={() => setConfirmingDeactivate(true)} className="text-xs font-semibold text-red-600 dark:text-red-400 underline">
                {t("business.deleteAccount")}
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function EditCompanyDetailsForm({ token, company, showError, onDone, onCancel }) {
  const { t } = useLang();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    emri: company.emri || "",
    telefoni: company.telefoni || "",
    adresa: company.adresa || "",
    qyteti: company.qyteti || "",
    iban: company.iban || "",
    ofronDergimMakine: company.ofronDergimMakine ?? false,
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/Companies/my-company", token, { method: "PUT", body: JSON.stringify(form) });
      onDone();
    } catch (e) { showError(e); } finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="mt-2 flex flex-col gap-2 max-w-xs">
      <Field label={t("business.businessName")}><input required className={inputClass} value={form.emri} onChange={set("emri")} /></Field>
      <Field label={t("auth.phone")}><input className={inputClass} value={form.telefoni} onChange={set("telefoni")} /></Field>
      <Field label={t("business.address")}><input className={inputClass} value={form.adresa} onChange={set("adresa")} /></Field>
      <Field label={t("business.cityZone")}>
        <select className={inputClass} value={form.qyteti} onChange={set("qyteti")}>
          <option value="">{t("business.choose")}</option>
          {ALBANIAN_LOCATIONS.map((z) => <option key={z} value={z}>{z}</option>)}
        </select>
      </Field>
      <Field label={t("business.ibanForPayments")}><input className={inputClass} value={form.iban} onChange={set("iban")} placeholder="AL47212110090000000235698741" /></Field>
      <label className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={form.ofronDergimMakine}
          onChange={(e) => setForm((f) => ({ ...f, ofronDergimMakine: e.target.checked }))}
        />
        <span>{t("business.offersDeliveryEdit")}</span>
      </label>
      <div className="flex gap-2">
        <PrimaryButton type="submit" disabled={loading} className="text-xs py-2">{loading ? t("common.saving") : t("common.save")}</PrimaryButton>
        <GhostButton type="button" onClick={onCancel} className="text-xs py-2">{t("booking.cancel")}</GhostButton>
      </div>
    </form>
  );
}

function buildCarForm(car) {
  if (!car) {
    return {
      marka: "", markaCustom: "", modeli: "", modeliCustom: "",
      viti: "2020", km: "0", karburanti: "diesel", transmisioni: "manual",
      ngjyra: "", targa: "", kategoria: "economy", numriVendeve: "5",
      klimatizimi: true, cmimiDites: "20", pershkrimi: "", kubatura: "", cilindra: "", amenities: [],
      priceOffers: [],
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
    priceOffers: (car.priceOffers || []).map((o) => ({ dite: String(o.dite), cmimiTotal: String(o.cmimiTotal) })),
  };
}

function AddCarForm({ token, companyId, existingCar, onDone, showError, showOk, onDirtyChange }) {
  const { t } = useLang();
  const isEdit = !!existingCar;
  const [loading, setLoading] = useState(false);
  const [createdCar, setCreatedCar] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [form, setForm] = useState(() => buildCarForm(existingCar));
  const initialFormRef = useRef(form);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const models = CAR_BRANDS[form.marka] || [];
  const [amenitySuggestion, setAmenitySuggestion] = useState("");
  const [suggestingAmenity, setSuggestingAmenity] = useState(false);

  async function submitAmenitySuggestion() {
    if (!amenitySuggestion.trim()) return;
    setSuggestingAmenity(true);
    try {
      await apiFetch("/AmenitySuggestions", token, { method: "POST", body: JSON.stringify({ companyId, suggestion: amenitySuggestion.trim() }) });
      showOk(t("business.suggestAmenitySent"));
      setAmenitySuggestion("");
    } catch (e) { showError(e); } finally { setSuggestingAmenity(false); }
  }

  useEffect(() => {
    onDirtyChange?.(JSON.stringify(form) !== JSON.stringify(initialFormRef.current));
  }, [form, onDirtyChange]);

  function toggleAmenity(key) {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(key) ? f.amenities.filter((a) => a !== key) : [...f.amenities, key],
    }));
  }

  function addOffer() {
    setForm((f) => ({ ...f, priceOffers: [...f.priceOffers, { dite: "", cmimiTotal: "" }] }));
  }
  function updateOffer(i, key, value) {
    setForm((f) => ({ ...f, priceOffers: f.priceOffers.map((o, idx) => (idx === i ? { ...o, [key]: value } : o)) }));
  }
  function removeOffer(i) {
    setForm((f) => ({ ...f, priceOffers: f.priceOffers.filter((_, idx) => idx !== i) }));
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
        priceOffers: form.priceOffers
          .filter((o) => o.dite && o.cmimiTotal)
          .map((o) => ({ dite: Number(o.dite), cmimiTotal: Number(o.cmimiTotal) })),
      };
      if (isEdit) {
        await apiFetch(`/Cars/${existingCar.carId}`, token, { method: "PUT", body: JSON.stringify(payload) });
        showOk(t("business.carUpdated"));
        onDone();
      } else {
        const car = await apiFetch("/Cars", token, { method: "POST", body: JSON.stringify(payload) });
        setCreatedCar(car);
        showOk(t("business.carAddedNowPhotos"));
      }
    } catch (e) { showError(e); } finally { setLoading(false); }
  }

  async function refreshPhotos(carId) {
    try { setPhotos(await apiFetch(`/CarPhotos/car/${carId}`, token)); } catch (e) { showError(e); }
  }

  if (createdCar) {
    return (
      <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-3 mb-4 bg-slate-50 dark:bg-slate-800">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">{t("business.carAdded", { car: `${createdCar.marka} ${createdCar.modeli}` })}</p>
        <CarPhotoManager
          carId={createdCar.carId}
          token={token}
          photos={photos}
          showError={showError}
          onChanged={() => refreshPhotos(createdCar.carId)}
        />
        <PrimaryButton type="button" className="mt-3" onClick={onDone}>{t("business.finish")}</PrimaryButton>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="border border-slate-200 dark:border-slate-700 rounded-2xl p-3 mb-4 bg-slate-50 dark:bg-slate-800">
      <div className="grid grid-cols-2 gap-2">
        <Field label={t("business.carField.brand")}>
          <select required className={inputClass} value={form.marka} onChange={(e) => setForm((f) => ({ ...f, marka: e.target.value, modeli: "" }))}>
            <option value="" disabled>{t("business.carField.chooseBrand")}</option>
            {Object.keys(CAR_BRANDS).map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </Field>
        {form.marka === OTHER_BRAND && (
          <Field label={t("business.carField.brandCustom")}><input required className={inputClass} value={form.markaCustom} onChange={set("markaCustom")} placeholder={t("business.carField.brand")} /></Field>
        )}
        <Field label={t("business.carField.model")}>
          <select required className={inputClass} value={form.modeli} onChange={set("modeli")} disabled={!form.marka}>
            <option value="" disabled>{t("business.carField.chooseModel")}</option>
            {models.map((m) => <option key={m} value={m}>{m}</option>)}
            {form.marka && <option value={OTHER_MODEL}>{t("business.carField.other")}</option>}
          </select>
        </Field>
        {form.modeli === OTHER_MODEL && (
          <Field label={t("business.carField.modelCustom")}><input required className={inputClass} value={form.modeliCustom} onChange={set("modeliCustom")} placeholder={t("business.carField.model")} /></Field>
        )}
        <Field label={t("business.carField.year")}><input type="number" className={inputClass} value={form.viti} onChange={set("viti")} /></Field>
        <Field label={t("business.carField.km")}><input type="number" className={inputClass} value={form.km} onChange={set("km")} /></Field>
        <Field label={t("business.carField.engineSizeCc")}><input type="number" className={inputClass} value={form.kubatura} onChange={set("kubatura")} placeholder="1600" /></Field>
        <Field label={t("car.spec.cylinders")}><input type="number" className={inputClass} value={form.cilindra} onChange={set("cilindra")} placeholder="4" /></Field>
        <Field label={t("car.spec.fuel")}>
          <select className={inputClass} value={form.karburanti} onChange={set("karburanti")}>
            <option value="diesel">Diesel</option><option value="benzine">Benzine</option><option value="hybrid">Hybrid</option><option value="elektrik">Elektrik</option>
          </select>
        </Field>
        <Field label={t("car.spec.transmission")}>
          <select className={inputClass} value={form.transmisioni} onChange={set("transmisioni")}>
            <option value="manual">Manual</option><option value="automatik">Automatik</option>
          </select>
        </Field>
        <Field label={t("business.carField.color")}><input className={inputClass} value={form.ngjyra} onChange={set("ngjyra")} placeholder="E zeze" /></Field>
        <Field label={t("business.carField.plate")}><input required className={inputClass} value={form.targa} onChange={set("targa")} placeholder="AA123BB" /></Field>
        <Field label={t("business.carField.category")}>
          <select className={inputClass} value={form.kategoria} onChange={set("kategoria")}>
            {CAR_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{t(`category.${c.key}`)}</option>)}
          </select>
        </Field>
        <Field label={t("car.spec.seats")}><input type="number" className={inputClass} value={form.numriVendeve} onChange={set("numriVendeve")} /></Field>
        <Field label={t("business.carField.pricePerDay")}><input type="number" className={inputClass} value={form.cmimiDites} onChange={set("cmimiDites")} /></Field>
        <label className="flex items-center gap-2 mt-6 text-xs text-slate-600 dark:text-slate-300">
          <input type="checkbox" checked={form.klimatizimi} onChange={(e) => setForm((f) => ({ ...f, klimatizimi: e.target.checked }))} /> {t("car.spec.aircon")}
        </label>
      </div>
      <Field label={t("business.additionalAmenities")}>
        <AmenityPicker selected={form.amenities} onToggle={toggleAmenity} />
        <div className="flex items-center gap-1.5 mt-2">
          <input
            type="text"
            className={`${inputClass} text-xs`}
            value={amenitySuggestion}
            onChange={(e) => setAmenitySuggestion(e.target.value)}
            placeholder={t("business.suggestAmenityPlaceholder")}
          />
          <GhostButton type="button" onClick={submitAmenitySuggestion} disabled={suggestingAmenity || !amenitySuggestion.trim()} className="text-xs py-2.5 w-fit shrink-0 px-3">
            {t("business.suggestAmenityPrompt")}
          </GhostButton>
        </div>
      </Field>
      <Field label={t("business.priceOffersLabel")}>
        <div className="flex flex-col gap-1.5">
          {form.priceOffers.map((o, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <input type="number" min="1" placeholder={t("business.offerDaysPlaceholder")} className={`${inputClass} w-20`} value={o.dite} onChange={(e) => updateOffer(i, "dite", e.target.value)} />
              <span className="text-xs text-slate-400">{t("business.offerDaysEquals")}</span>
              <input type="number" min="0" step="0.01" placeholder={t("business.offerPricePlaceholder")} className={inputClass} value={o.cmimiTotal} onChange={(e) => updateOffer(i, "cmimiTotal", e.target.value)} />
              <button type="button" onClick={() => removeOffer(i)} className="text-slate-400 hover:text-red-600 shrink-0" title={t("business.removeOffer")}><X size={15} /></button>
            </div>
          ))}
          <GhostButton type="button" onClick={addOffer} className="text-xs py-1.5 w-fit">{t("business.addOffer")}</GhostButton>
        </div>
      </Field>
      <PrimaryButton type="submit" disabled={loading} className="mt-2">
        {loading ? t("common.saving") : isEdit ? t("business.saveChanges") : t("business.saveCar")}
      </PrimaryButton>
    </form>
  );
}

function CarStatusBadge({ statusi }) {
  const { t } = useLang();
  const active = statusi === "active";
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${active ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}>
      {active ? t("business.active") : t("business.inactive")}
    </span>
  );
}

function BusinessCarCard({ car, onOpen }) {
  const { t } = useLang();
  return (
    <button
      type="button"
      onClick={() => onOpen(car.carId)}
      className="text-left border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden hover:border-sky-300 dark:hover:border-emerald-600 hover:shadow-sm transition"
    >
      <CarPhoto car={car} />
      <div className="p-3">
        <div className="flex items-start justify-between">
          <div><p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{car.marka} {car.modeli}</p><p className="text-xs text-slate-500 dark:text-slate-400">{car.targa} · {car.cmimiDites}€/dite</p></div>
          <CarStatusBadge statusi={car.statusi} />
        </div>
        <p className="text-xs text-sky-600 dark:text-emerald-400 font-semibold mt-3">{t("business.viewDetails")}</p>
      </div>
    </button>
  );
}

function BusinessCarDetail({ car, token, reload, showError, showOk, onBack }) {
  const { t } = useLang();
  const photos = (car.carPhotos || []).filter(Boolean);
  const mainPhoto = photos.find((p) => p.eshteKryesore) || photos[0];
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const shownPhoto = previewPhoto || mainPhoto;
  const [managingPhotos, setManagingPhotos] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editDirty, setEditDirty] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [blocks, setBlocks] = useState([]);
  const [blockFrom, setBlockFrom] = useState(null);
  const [blockTo, setBlockTo] = useState(null);
  const [blockNote, setBlockNote] = useState("");
  const [savingBlock, setSavingBlock] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  function loadBlocks() {
    apiFetch(`/Cars/${car.carId}/blocks`, token).then(setBlocks).catch(() => {});
  }

  function toggleCalendar() {
    const next = !showCalendar;
    setShowCalendar(next);
    if (next) loadBlocks();
  }

  function guardedAction(action) {
    if (editing && editDirty) setPendingAction(() => action);
    else action();
  }

  function confirmDiscard() {
    setEditing(false);
    setEditDirty(false);
    pendingAction?.();
    setPendingAction(null);
  }

  function handleToggleEdit() {
    guardedAction(() => {
      setEditDirty(false);
      setEditing((s) => !s);
      setManagingPhotos(false);
    });
  }

  function handleTogglePhotos() {
    guardedAction(() => {
      setEditing(false);
      setEditDirty(false);
      setManagingPhotos((s) => !s);
    });
  }

  async function submitBlock() {
    if (!blockFrom || !blockTo) return;
    setSavingBlock(true);
    try {
      await apiFetch(`/Cars/${car.carId}/blocks`, token, {
        method: "POST",
        body: JSON.stringify({ dataFillimit: blockFrom, dataPerfundimit: blockTo, shenim: blockNote }),
      });
      showOk(t("business.datesBlocked"));
      setBlockFrom(null);
      setBlockTo(null);
      setBlockNote("");
      loadBlocks();
    } catch (e) { showError(e); } finally { setSavingBlock(false); }
  }

  async function removeBlock(blockId) {
    try {
      await apiFetch(`/Cars/${car.carId}/blocks/${blockId}`, token, { method: "DELETE" });
      loadBlocks();
    } catch (e) { showError(e); }
  }

  async function toggleStatus() {
    setTogglingStatus(true);
    try {
      const next = car.statusi === "active" ? "inactive" : "active";
      await apiFetch(`/Cars/${car.carId}/status`, token, { method: "PUT", body: JSON.stringify({ statusi: next }) });
      showOk(next === "active" ? t("business.carActivated") : t("business.carDeactivated"));
      reload();
    } catch (e) { showError(e); } finally { setTogglingStatus(false); }
  }

  async function deleteCar() {
    setDeleting(true);
    try {
      await apiFetch(`/Cars/${car.carId}`, token, { method: "DELETE" });
      showOk(t("business.carDeleted"));
      reload();
      onBack();
    } catch (e) { showError(e); } finally { setDeleting(false); }
  }

  return (
    <div>
      <button onClick={() => guardedAction(onBack)} className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 mb-4 hover:text-slate-700 dark:hover:text-slate-200">
        <ChevronLeft size={16} /> {t("business.backToCars")}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
            {shownPhoto ? (
              <img src={shownPhoto.urlFotos} alt={`${car.marka} ${car.modeli}`} className="w-full h-64 object-cover" />
            ) : (
              <div className="w-full h-64 flex items-center justify-center text-slate-300 dark:text-slate-600"><CarIcon size={40} /></div>
            )}
          </div>
          {car.carPhotos?.length > 1 && (
            <div className="grid grid-cols-4 gap-2 mt-2">
              {car.carPhotos.map((p) => (
                <button
                  key={p.photoId}
                  type="button"
                  onClick={() => setPreviewPhoto(p)}
                  className={`relative rounded-xl overflow-hidden border-2 ${p.photoId === shownPhoto?.photoId ? "border-sky-500 dark:border-emerald-500" : "border-transparent hover:border-slate-300 dark:hover:border-slate-600"}`}
                >
                  <img src={p.urlFotos} alt="" className="w-full h-16 object-cover" />
                  {p.eshteKryesore && (
                    <span className="absolute top-1 left-1 bg-amber-400 text-amber-950 rounded-full w-4 h-4 flex items-center justify-center" title={t("business.mainPhoto")}>
                      <Star size={9} className="fill-current" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          <GhostButton
            type="button"
            onClick={toggleCalendar}
            className={`flex items-center justify-center gap-1.5 py-2 mt-4 ${showCalendar ? "border-sky-300 dark:border-emerald-600 text-sky-600 dark:text-emerald-400 bg-sky-50 dark:bg-emerald-900/20" : ""}`}
          >
            <Calendar size={13} />{showCalendar ? t("business.closeCalendar") : t("business.bookingCalendar")}
          </GhostButton>

          {showCalendar && (
            <div className="mt-3 space-y-3">
              <div>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                  <Ban size={12} /> {t("business.blockForOutsidePlatform")}
                </p>
                <DateRangeCalendar
                  ranges={blocks}
                  selFrom={blockFrom}
                  selTo={blockTo}
                  onSelect={(from, to) => { setBlockFrom(from); setBlockTo(to); }}
                />
                {blockFrom && blockTo && (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      value={blockNote}
                      onChange={(e) => setBlockNote(e.target.value)}
                      placeholder={t("business.noteOptionalPlaceholder")}
                      className={inputClass + " text-xs py-1.5"}
                    />
                    <button
                      type="button"
                      onClick={submitBlock}
                      disabled={savingBlock}
                      className="shrink-0 text-xs font-medium text-white bg-slate-900 dark:bg-slate-700 rounded-xl px-3 py-1.5 disabled:opacity-50"
                    >
                      {savingBlock ? t("common.saving") : t("business.block")}
                    </button>
                  </div>
                )}
              </div>

              {blocks.length > 0 && (
                <div className="space-y-1.5">
                  {blocks.map((b) => (
                    <div key={b.blockId} className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800 rounded-lg px-2.5 py-1.5">
                      <div>
                        <span className="font-medium text-slate-700 dark:text-slate-200">{b.dataFillimit} → {b.dataPerfundimit}</span>
                        <span className="text-slate-400 ml-1.5">{b.eshteRezervimPlatforme ? t("business.platformBooking") : (b.shenim || t("business.outsidePlatform"))}</span>
                      </div>
                      {!b.eshteRezervimPlatforme && (
                        <button type="button" onClick={() => removeBlock(b.blockId)} className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 shrink-0 ml-2">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{car.marka} {car.modeli}</h1>
            <CarStatusBadge statusi={car.statusi} />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{car.targa} · {car.viti} · {car.cmimiDites}€/dite</p>

          <div className="flex gap-2 mt-4">
            <GhostButton
              type="button"
              onClick={handleToggleEdit}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 ${editing ? "border-sky-300 dark:border-emerald-600 text-sky-600 dark:text-emerald-400 bg-sky-50 dark:bg-emerald-900/20" : ""}`}
            >
              <Pencil size={13} />{editing ? t("business.closeEditing") : t("business.editDetailsBtn")}
            </GhostButton>
            <GhostButton
              type="button"
              onClick={handleTogglePhotos}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 ${managingPhotos ? "border-sky-300 dark:border-emerald-600 text-sky-600 dark:text-emerald-400 bg-sky-50 dark:bg-emerald-900/20" : ""}`}
            >
              <Upload size={13} />{managingPhotos ? t("business.closePhotos") : t("business.managePhotosBtn")}
            </GhostButton>
          </div>
          {editing && (
            <div className="mt-3">
              <AddCarForm
                token={token}
                companyId={car.companyId}
                existingCar={car}
                onDone={() => { setEditing(false); setEditDirty(false); reload(); }}
                showError={showError}
                showOk={showOk}
                onDirtyChange={setEditDirty}
              />
            </div>
          )}
          {managingPhotos && (
            <div className="mt-3">
              <CarPhotoManager carId={car.carId} token={token} photos={car.carPhotos} showError={showError} onChanged={reload} />
            </div>
          )}

          <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={toggleStatus}
              disabled={togglingStatus}
              className="text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
            >
              {togglingStatus ? t("business.updating") : car.statusi === "active" ? t("business.deactivateCarAction") : t("business.activateCarAction")}
            </button>
          </div>

          <div className="mt-4 border border-red-200 dark:border-red-800/60 rounded-2xl p-4">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">{t("business.dangerZone")}</p>
            {confirmingDelete ? (
              <>
                <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
                  {t("business.deleteCarWarning")}
                </p>
                <div className="flex gap-2">
                  <button onClick={deleteCar} disabled={deleting} className="text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl px-3 py-2 disabled:opacity-50">
                    {deleting ? t("business.deletingFinal") : t("business.confirmDeleteCarFinal")}
                  </button>
                  <GhostButton type="button" onClick={() => setConfirmingDelete(false)} className="text-xs py-2">{t("booking.cancel")}</GhostButton>
                </div>
              </>
            ) : (
              <button onClick={() => setConfirmingDelete(true)} className="text-xs font-semibold text-red-600 dark:text-red-400 underline">
                {t("business.deleteCarFinal")}
              </button>
            )}
          </div>
        </div>
      </div>

      {pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setPendingAction(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">{t("business.unsavedChanges")}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{t("business.unsavedChangesBody")}</p>
            <div className="flex gap-2">
              <button onClick={confirmDiscard} className="flex-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl px-3 py-2">{t("business.continueWithoutSaving")}</button>
              <GhostButton type="button" onClick={() => setPendingAction(null)} className="flex-1 text-xs py-2">{t("booking.cancel")}</GhostButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminPending({ token, showError, showOk }) {
  const { t } = useLang();
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setPending(await apiFetch("/Companies/pending", token)); } catch (e) { showError(e); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function verify(id) {
    try { await apiFetch(`/Companies/${id}/verify`, token, { method: "PUT" }); showOk(t("business.businessVerified")); load(); }
    catch (e) { showError(e); }
  }

  async function reject(id) {
    try { await apiFetch(`/Companies/${id}/reject`, token, { method: "DELETE" }); showOk(t("business.applicationRejected")); load(); }
    catch (e) { showError(e); }
  }

  if (loading) return <p className="text-center text-sm text-slate-400 py-16">{t("common.loading")}</p>;
  if (pending.length === 0) return <div className="text-center py-16 px-8"><CheckCircle2 size={28} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" /><p className="text-sm text-slate-500 dark:text-slate-400">{t("business.noBusinessesPending")}</p></div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {pending.map((c) => (
        <div key={c.companyId} className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
          <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{c.emri}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{c.qyteti} · NIPT {c.nipt}</p>
          <p className="text-xs text-slate-400">{c.email} · {c.telefoni}</p>
          {c.certifikataUrl ? (
            <a href={c.certifikataUrl} target="_blank" rel="noreferrer" className="text-xs text-sky-600 dark:text-emerald-400 underline mt-2 block">
              {t("business.viewNiptCert")}
            </a>
          ) : (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">{t("business.noCertUploaded")}</p>
          )}
          <PrimaryButton onClick={() => verify(c.companyId)} className="mt-2 text-xs py-2">{t("business.verifyBusiness")}</PrimaryButton>
          <GhostButton onClick={() => reject(c.companyId)} className="mt-2 text-xs py-2">{t("business.rejectAndDelete")}</GhostButton>
        </div>
      ))}
    </div>
  );
}

function AdminWhatsapp({ token, showError, showOk }) {
  const { t } = useLang();
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setPending(await apiFetch("/WhatsappVerifications/pending", token)); } catch (e) { showError(e); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function verify(id) {
    try { await apiFetch(`/WhatsappVerifications/${id}/verify`, token, { method: "PUT" }); showOk(t("business.numberVerified")); load(); }
    catch (e) { showError(e); }
  }

  async function reject(id) {
    try { await apiFetch(`/WhatsappVerifications/${id}/reject`, token, { method: "PUT" }); showOk(t("business.requestRejected")); load(); }
    catch (e) { showError(e); }
  }

  if (loading) return <p className="text-center text-sm text-slate-400 py-16">{t("common.loading")}</p>;
  if (pending.length === 0) return <div className="text-center py-16 px-8"><CheckCircle2 size={28} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" /><p className="text-sm text-slate-500 dark:text-slate-400">{t("business.noRequestsPending")}</p></div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {pending.map((w) => (
        <div key={w.id} className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
          <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{w.emri} {w.mbiemri}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{w.email}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1"><MessageCircle size={12} /> {w.telefoni || t("business.noNumber")}</p>
          <p className="text-xs text-slate-400 mt-2">{t("business.checkBusinessWhatsapp")}</p>
          <p className="font-bold text-lg tracking-[0.3em] text-slate-900 dark:text-slate-100 text-center mt-1">{w.code}</p>
          <PrimaryButton onClick={() => verify(w.id)} className="mt-3 text-xs py-2">{t("auth.verify")}</PrimaryButton>
          <GhostButton onClick={() => reject(w.id)} className="mt-2 text-xs py-2">{t("business.reject")}</GhostButton>
        </div>
      ))}
    </div>
  );
}

function AdminAmenitySuggestions({ token, showError, showOk }) {
  const { t } = useLang();
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setPending(await apiFetch("/AmenitySuggestions/pending", token)); } catch (e) { showError(e); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function approve(id) {
    try { await apiFetch(`/AmenitySuggestions/${id}/approve`, token, { method: "PUT" }); showOk(t("business.suggestionApproved")); load(); }
    catch (e) { showError(e); }
  }

  async function reject(id) {
    try { await apiFetch(`/AmenitySuggestions/${id}/reject`, token, { method: "PUT" }); showOk(t("business.suggestionRejected")); load(); }
    catch (e) { showError(e); }
  }

  if (loading) return <p className="text-center text-sm text-slate-400 py-16">{t("common.loading")}</p>;
  if (pending.length === 0) return <div className="text-center py-16 px-8"><CheckCircle2 size={28} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" /><p className="text-sm text-slate-500 dark:text-slate-400">{t("business.amenitySuggestionsEmpty")}</p></div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {pending.map((s) => (
        <div key={s.id} className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
          <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{s.suggestion}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t("business.suggestedBy", { company: s.companyEmri })}</p>
          <div className="flex gap-2 mt-3">
            <PrimaryButton onClick={() => approve(s.id)} className="text-xs py-2">{t("business.approveSuggestion")}</PrimaryButton>
            <GhostButton onClick={() => reject(s.id)} className="text-xs py-2">{t("business.reject")}</GhostButton>
          </div>
        </div>
      ))}
    </div>
  );
}
