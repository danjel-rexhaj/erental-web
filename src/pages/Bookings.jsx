import { useState, useEffect, useCallback } from "react";
import { Calendar, Clock, Star, Phone, MessageCircle, Mail, CheckCircle2, CreditCard, ChevronDown, Download } from "lucide-react";
import { apiFetch, toWhatsappNumber, decodeJwt } from "../api";
import { GhostButton, PrimaryButton, StatusPill, inputClass } from "../components";
import { generateInvoicePdf } from "../invoicePdf";
import { useLang } from "../useLang";

export default function Bookings({ token, showError, showOk, highlightBookingId, refreshKey }) {
  const { t, lang } = useLang();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelInfo, setCancelInfo] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setBookings(await apiFetch("/Bookings", token)); } catch (e) { showError(e); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (refreshKey) load(); }, [refreshKey]);

  useEffect(() => {
    if (!highlightBookingId) return;
    const el = document.getElementById(`booking-${highlightBookingId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightBookingId, bookings]);

  async function cancelBooking(id) {
    if (!cancelReason.trim()) { showError(new Error(t("booking.needReasonError"))); return; }
    setActingId(id);
    try {
      await apiFetch(`/Bookings/${id}/cancel`, token, { method: "PUT", body: JSON.stringify({ reason: cancelReason }) });
      showOk(t("booking.cancelled"));
      setCancellingId(null);
      setCancelInfo(null);
      setCancelReason("");
      load();
    } catch (e) { showError(e); } finally { setActingId(null); }
  }

  // Mirrors BookingsController.CancelBooking's rule: the 10% deposit is a non-refundable holding
  // fee no matter when/why it's cancelled -- only a full online payment has a refund window at
  // all (refund window counts from business confirmation, not booking creation; a pending
  // full-payment booking is always fully refundable). Computed once when the cancel form opens
  // (not inline in render) since it reads the clock.
  function computeRefundInfo(b) {
    if (!b.paymentMethod || b.paymentMethod === "cash") return null;
    if (b.paymentMethod === "paypal_deposit") return { ok: false, text: t("booking.refundNoneDeposit") };
    if (b.statusi === "pending") return { ok: true, text: t("booking.refundFullPending") };
    if (b.statusi === "confirmed" && b.dataKonfirmimit) {
      const oreQeKaluan = (Date.now() - new Date(b.dataKonfirmimit).getTime()) / 3600000;
      if (oreQeKaluan <= 12) return { ok: true, text: t("booking.refundFullWindow") };
      return { ok: false, text: t("booking.refundNoneGeneric") };
    }
    return null;
  }

  async function removeBooking(id) {
    setActingId(id);
    try { await apiFetch(`/Bookings/${id}`, token, { method: "DELETE" }); showOk(t("booking.deleted")); setDeletingId(null); load(); }
    catch (e) { showError(e); } finally { setActingId(null); }
  }

  const days = (b) => Math.max(1, Math.round((new Date(b.dataPerfundimit) - new Date(b.dataFillimit)) / 86400000));

  async function downloadInvoice(b) {
    await generateInvoicePdf({
      bookingId: b.bookingId,
      carMakeModel: `${b.car?.marka} ${b.car?.modeli}`,
      dataFillimit: b.dataFillimit,
      dataPerfundimit: b.dataPerfundimit,
      cmimiPerDite: b.car?.cmimiDites,
      dite: days(b),
      totalPrice: b.cmimiTotal,
      amountPaid: b.payments?.[0]?.shumaPaguarOnline ?? 0,
      eshtePagesePlote: b.paymentMethod === "paypal_full",
      serviceFee: b.paymentMethod?.startsWith("paypal_") ? (b.payments?.[0]?.komisioni ?? 0) : 0,
      insuranceFee: b.cmimiSigurimit ?? 0,
      clientLabel: decodeJwt(token)?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] || "",
      company: b.car?.company,
      cardLast4: b.payments?.[0]?.cardLast4,
      transactionId: b.payments?.[0]?.paypalCaptureId,
      lang,
    });
  }

  if (loading) return <p className="text-center text-sm text-slate-400 py-16">{t("common.loading")}</p>;
  if (bookings.length === 0) return <div className="text-center py-16 px-8"><Calendar size={28} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" /><p className="text-sm text-slate-500 dark:text-slate-400">{t("booking.emptyTitle")}</p></div>;

  // A completed booking stays in the active list until reviewed (so the review prompt
  // doesn't get buried in history), then moves alongside cancelled ones once done.
  const isReviewed = (b) => b.reviews && b.reviews.length > 0;
  const STATUS_PRIORITY = { confirmed: 0, completed: 1, pending: 2 };
  const activeBookings = bookings
    .filter((b) => b.statusi !== "cancelled" && !(b.statusi === "completed" && isReviewed(b)))
    .sort((a, b) => (STATUS_PRIORITY[a.statusi] ?? 3) - (STATUS_PRIORITY[b.statusi] ?? 3));
  const historyBookings = bookings.filter((b) => b.statusi === "cancelled" || (b.statusi === "completed" && isReviewed(b)));

  const renderCard = (b) => (
        <div
          key={b.bookingId}
          id={`booking-${b.bookingId}`}
          className={`border rounded-2xl p-4 transition bg-white dark:bg-slate-800 ${highlightBookingId === b.bookingId ? "border-sky-400 dark:border-emerald-500 ring-2 ring-sky-200 dark:ring-emerald-900/40" : "border-slate-200 dark:border-slate-700"}`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{b.car?.marka} {b.car?.modeli}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{b.dataFillimit} → {b.dataPerfundimit} · {t("car.daysCount", { count: days(b) })}</p>
              {(b.oraMarrjes || b.oraKthimit) && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1">
                  <Clock size={10} /> {b.oraMarrjes || "—"} → {b.oraKthimit || "—"}
                </p>
              )}
            </div>
            <StatusPill status={b.statusi} />
          </div>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-2">{b.cmimiTotal}€</p>

          {b.paymentMethod && b.paymentMethod !== "cash" && (
            <>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                <CreditCard size={11} />
                {b.paymentMethod === "paypal_full"
                  ? t("booking.fullyPaidCard")
                  : t("booking.depositPaidRest", { amount: b.payments?.[0]?.shumaPaguarOnline ?? "", rest: (b.cmimiTotal - (b.payments?.[0]?.shumaPaguarOnline ?? 0)).toFixed(2) })}
              </p>
              <button
                type="button"
                onClick={() => downloadInvoice(b)}
                className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline underline-offset-2 mt-1"
              >
                <Download size={11} /> {t("paymentSuccess.downloadInvoice")}
              </button>
            </>
          )}

          {b.statusi === "pending" && (
            <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 rounded-lg px-2 py-1.5 mt-2 flex items-center gap-1">
              <Clock size={12} /> {t("booking.pendingApproval")}
            </p>
          )}

          {b.statusi === "cancelled" && b.arsyejaRefuzimit && (
            <p className="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 rounded-lg px-2 py-1.5 mt-2">
              <span className="font-semibold">{t("booking.rejectionReason")}</span> {b.arsyejaRefuzimit}
            </p>
          )}

          {b.statusi === "confirmed" && (
            <p className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg px-2 py-1.5 mt-2 flex items-center gap-1">
              <CheckCircle2 size={12} /> {t("booking.approvedBy", { business: b.car?.company?.emri || t("booking.businessFallback") })}
            </p>
          )}

          {b.statusi === "confirmed" && (
            b.idVerifikuar ? (
              <p className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg px-2 py-1.5 mt-2 flex items-center gap-1">
                <CheckCircle2 size={12} /> {t("booking.identityVerified")}
              </p>
            ) : (
              <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 rounded-lg px-2 py-1.5 mt-2">
                {t("booking.awaitingContract")}
              </p>
            )
          )}

          {(b.statusi === "confirmed" || b.statusi === "completed") && b.car?.company && (
            <div className="mt-3 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5">
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1.5">{t("booking.contactBusiness", { business: b.car.company.emri })}</p>
              <div className="flex items-center gap-3">
                {b.car.company.telefoni && (
                  <a href={`tel:${b.car.company.telefoni}`} className="flex items-center gap-1 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-slate-100">
                    <Phone size={13} /> {t("booking.call")}
                  </a>
                )}
                {b.car.company.telefoni && (
                  <a href={`https://wa.me/${toWhatsappNumber(b.car.company.telefoni)}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300">
                    <MessageCircle size={13} /> WhatsApp
                  </a>
                )}
                {b.car.company.email && (
                  <a href={`mailto:${b.car.company.email}`} className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
                    <Mail size={13} /> {t("booking.email")}
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1 mt-3">
            {(b.statusi === "pending" || b.statusi === "confirmed") && (
              cancellingId === b.bookingId ? (
                <div>
                  {cancelInfo && (
                    <p className={`text-[11px] rounded-lg px-2 py-1.5 mb-2 ${cancelInfo.ok ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30" : "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30"}`}>
                      {cancelInfo.text}
                    </p>
                  )}
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder={t("booking.cancelReasonPlaceholder")}
                    rows={2}
                    autoFocus
                    className="w-full text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg px-2 py-1.5 mb-2 outline-none focus:border-red-500"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => cancelBooking(b.bookingId)} disabled={actingId === b.bookingId} className="text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl px-3 py-2 disabled:opacity-50">
                      {actingId === b.bookingId ? t("booking.cancelling") : t("booking.confirmCancel")}
                    </button>
                    <GhostButton onClick={() => { setCancellingId(null); setCancelInfo(null); setCancelReason(""); }} className="text-xs py-2">{t("booking.dontCancel")}</GhostButton>
                  </div>
                </div>
              ) : (
                <GhostButton onClick={() => { setCancellingId(b.bookingId); setCancelInfo(computeRefundInfo(b)); }} className="text-xs py-2">
                  {t("booking.cancel")}
                </GhostButton>
              )
            )}
            {b.statusi === "cancelled" && (
              deletingId === b.bookingId ? (
                <div className="flex items-center gap-2">
                  <button onClick={() => removeBooking(b.bookingId)} disabled={actingId === b.bookingId} className="text-xs font-semibold text-red-600 dark:text-red-400 underline">
                    {actingId === b.bookingId ? t("booking.deleting") : t("booking.confirmDelete")}
                  </button>
                  <button onClick={() => setDeletingId(null)} className="text-xs text-slate-400 dark:text-slate-500 underline">{t("booking.cancel")}</button>
                </div>
              ) : (
                <div>
                  <button onClick={() => setDeletingId(b.bookingId)} className="text-xs text-slate-400 dark:text-slate-500 underline">{t("booking.delete")}</button>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{t("booking.autoDeleteNotice")}</p>
                </div>
              )
            )}
          </div>

          {b.statusi === "completed" && (
            (b.reviews && b.reviews.length > 0) ? (
              <p className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg px-2 py-1.5 mt-3">{t("booking.reviewThanks")}</p>
            ) : (
              <ReviewForm bookingId={b.bookingId} token={token} showError={showError} onSubmitted={() => { showOk(t("booking.reviewThanks")); load(); }} />
            )
          )}
        </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">{t("booking.myBookings")}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeBookings.map(renderCard)}
      </div>

      {historyBookings.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setShowHistory((s) => !s)}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          >
            <ChevronDown size={16} className={`transition-transform ${showHistory ? "rotate-180" : ""}`} />
            {t("booking.historySection", { count: historyBookings.length })}
          </button>
          {showHistory && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
              {historyBookings.map(renderCard)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReviewForm({ bookingId, token, onSubmitted, showError }) {
  const { t } = useLang();
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [koment, setKoment] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      await apiFetch("/Reviews", token, { method: "POST", body: JSON.stringify({ bookingId, rating, koment: koment || null }) });
      onSubmitted();
    } catch (e) { showError(e); } finally { setLoading(false); }
  }

  return (
    <div className="mt-3 border-t border-slate-100 dark:border-slate-700 pt-3">
      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t("booking.leaveReview")}</p>
      <div className="flex items-center gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => setRating(n)}>
            <Star size={18} className={(hover || rating) >= n ? "text-amber-400 fill-amber-400" : "text-slate-200 dark:text-slate-600 fill-slate-200 dark:fill-slate-600"} />
          </button>
        ))}
      </div>
      <textarea
        rows={2}
        className={inputClass}
        placeholder={t("booking.reviewPlaceholder")}
        value={koment}
        onChange={(e) => setKoment(e.target.value)}
      />
      <PrimaryButton type="button" onClick={submit} disabled={loading} className="mt-2 text-xs py-2">
        {loading ? t("booking.submitting") : t("booking.submitReview")}
      </PrimaryButton>
    </div>
  );
}
