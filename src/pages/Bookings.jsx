import { useState, useEffect, useCallback } from "react";
import { Calendar, Clock, Star } from "lucide-react";
import { apiFetch } from "../api";
import { GhostButton, PrimaryButton, StatusPill, inputClass } from "../components";

export default function Bookings({ token, showError, showOk, highlightBookingId, refreshKey }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);

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
    setActingId(id);
    try { await apiFetch(`/Bookings/${id}/cancel`, token, { method: "PUT" }); showOk("Rezervimi u anulua."); load(); }
    catch (e) { showError(e); } finally { setActingId(null); }
  }

  const days = (b) => Math.max(1, Math.round((new Date(b.dataPerfundimit) - new Date(b.dataFillimit)) / 86400000));

  if (loading) return <p className="text-center text-sm text-slate-400 py-16">Duke ngarkuar...</p>;
  if (bookings.length === 0) return <div className="text-center py-16 px-8"><Calendar size={28} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" /><p className="text-sm text-slate-500 dark:text-slate-400">Ende s'ke asnje rezervim.</p></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Rezervimet e mia</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {bookings.map((b) => (
        <div
          key={b.bookingId}
          id={`booking-${b.bookingId}`}
          className={`border rounded-2xl p-4 transition bg-white dark:bg-slate-800 ${highlightBookingId === b.bookingId ? "border-emerald-400 dark:border-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-900/40" : "border-slate-200 dark:border-slate-700"}`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{b.car?.marka} {b.car?.modeli}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{b.dataFillimit} → {b.dataPerfundimit} · {days(b)} dite</p>
            </div>
            <StatusPill status={b.statusi} />
          </div>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-2">{b.cmimiTotal}€</p>

          {b.statusi === "pending" && (
            <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 rounded-lg px-2 py-1.5 mt-2 flex items-center gap-1">
              <Clock size={12} /> Ne pritje te miratimit nga biznesi
            </p>
          )}

          {b.statusi === "cancelled" && b.arsyejaRefuzimit && (
            <p className="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 rounded-lg px-2 py-1.5 mt-2">
              <span className="font-semibold">Arsyeja e refuzimit:</span> {b.arsyejaRefuzimit}
            </p>
          )}

          <div className="flex gap-2 mt-3">
            {(b.statusi === "pending" || b.statusi === "confirmed") && (
              <GhostButton onClick={() => cancelBooking(b.bookingId)} disabled={actingId === b.bookingId} className="text-xs py-2">
                Anulo {b.statusi === "confirmed" ? "(brenda 24 oresh)" : ""}
              </GhostButton>
            )}
          </div>

          {b.statusi === "completed" && (
            (b.reviews && b.reviews.length > 0) ? (
              <p className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg px-2 py-1.5 mt-3">Faleminderit per vleresimin!</p>
            ) : (
              <ReviewForm bookingId={b.bookingId} token={token} showError={showError} onSubmitted={() => { showOk("Faleminderit per vleresimin!"); load(); }} />
            )
          )}
        </div>
        ))}
      </div>
    </div>
  );
}

function ReviewForm({ bookingId, token, onSubmitted, showError }) {
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
      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Lere nje vleresim</p>
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
        placeholder="Si ishte eksperienca? (opsionale)"
        value={koment}
        onChange={(e) => setKoment(e.target.value)}
      />
      <PrimaryButton type="button" onClick={submit} disabled={loading} className="mt-2 text-xs py-2">
        {loading ? "Duke dorezuar..." : "Dergo vleresimin"}
      </PrimaryButton>
    </div>
  );
}
