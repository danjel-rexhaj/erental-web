import { useState, useEffect, useCallback } from "react";
import { Eye, Calendar as CalendarIcon, TrendingUp, Users as UsersIcon, Building2, Car as CarIcon, Clock, ShieldAlert, Receipt, Pencil, X, Check, Wallet, ChevronLeft, ChevronRight, Trash2, Search } from "lucide-react";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import { apiFetch } from "../api";
import { inputClass, StatusPill, PrimaryButton, GhostButton } from "../components";
import { useLang } from "../useLang";
import { monthShort, monthName, formatLocaleDate } from "../dateFormat";
import { generateStatementPdf } from "../statementPdf";

const entryLabel = (m, lang) => (m.day ? `${m.day} ${monthShort(m.month - 1, lang)}` : `${monthShort(m.month - 1, lang)} ${m.year}`);

const PERIODS = [
  { key: "days:7", unit: "days", value: 7, labelKey: "analytics.periodDays7" },
  { key: "days:14", unit: "days", value: 14, labelKey: "analytics.periodDays14" },
  { key: "months:3", unit: "months", value: 3, labelKey: "analytics.periodMonths3" },
  { key: "months:6", unit: "months", value: 6, labelKey: "analytics.periodMonths6" },
  { key: "months:12", unit: "months", value: 12, labelKey: "analytics.periodMonths12" },
];
const DEFAULT_PERIOD = PERIODS.find((p) => p.key === "months:6");

function PeriodSelect({ period, setPeriod }) {
  const { t } = useLang();
  return (
    <select
      value={period.key}
      onChange={(e) => setPeriod(PERIODS.find((p) => p.key === e.target.value) || DEFAULT_PERIOD)}
      className="text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800"
    >
      {PERIODS.map((p) => <option key={p.key} value={p.key}>{t(p.labelKey)}</option>)}
    </select>
  );
}

function periodQuery(period) {
  return period.unit === "days" ? { days: period.value } : { months: period.value };
}

const PAGE_SIZE_OPTIONS = [10, 40, 70];
const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[0];

// Matches the ER-000123 confirmation number shown on the client's contract/receipt
// (see components.jsx PaymentSuccess and invoicePdf.js) so admin search can look it up the same way.
const bookingRef = (id) => `ER-${String(id).padStart(6, "0")}`;

function pageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, 2, total - 1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push("…");
    result.push(p);
    prev = p;
  }
  return result;
}

function Pager({ page, totalPages, setPage }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-1 mt-4 flex-wrap">
      <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 disabled:opacity-30">
        <ChevronLeft size={14} />
      </button>
      {pageNumbers(page, totalPages).map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="w-7 h-7 flex items-center justify-center text-xs text-slate-300 dark:text-slate-600">…</span>
        ) : (
          <button
            key={p}
            onClick={() => setPage(p)}
            className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold ${
              p === page ? "bg-sky-600 dark:bg-emerald-600 text-white" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {p}
          </button>
        )
      )}
      <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 disabled:opacity-30">
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

function PageSizeSelect({ value, onChange }) {
  const { t } = useLang();
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 shrink-0"
    >
      {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{t("analytics.perPage", { count: n })}</option>)}
    </select>
  );
}

function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="relative w-full sm:w-64">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-8 pr-3 py-2 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800"
      />
    </div>
  );
}

const PIE_COLORS = ["#0284c7", "#059669", "#d97706", "#7c3aed", "#db2777", "#0891b2", "#65a30d", "#dc2626", "#4f46e5", "#ca8a04"];

function CarPieChart({ data, dataKey }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey={dataKey} nameKey="makina" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}>
          {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
        </Pie>
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function StatCard({ icon: Icon, label, value, onClick, active }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`border rounded-2xl p-4 flex items-center gap-3 text-left w-full ${
        active
          ? "border-sky-400 dark:border-emerald-600 bg-sky-50/50 dark:bg-emerald-900/20"
          : "border-slate-200 dark:border-slate-700"
      } ${onClick ? "hover:border-sky-300 dark:hover:border-emerald-600 transition cursor-pointer" : ""}`}
    >
      <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
        <Icon size={18} className="text-sky-600 dark:text-emerald-400" />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-none truncate">{value}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</p>
      </div>
    </Tag>
  );
}

export function BusinessAnalytics({ token, showError, refreshKey, companyId, onGoBookings, onGoTransactions }) {
  const { t, lang } = useLang();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(DEFAULT_PERIOD);
  const [showViews, setShowViews] = useState(false);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams({ ...periodQuery(period), ...(companyId ? { companyId } : {}) }).toString();
    apiFetch(`/Analytics/business?${qs}`, token)
      .then(setData)
      .catch((e) => showError && showError(e))
      .finally(() => setLoading(false));
  }, [token, refreshKey, period, companyId]);

  if (loading && !data) return <p className="text-center text-sm text-slate-400 py-16">{t("common.loading")}</p>;
  if (!data) return null;

  const monthly = data.monthly.map((m) => ({ label: entryLabel(m, lang), rezervime: m.rezervime, teArdhura: Math.round(m.teArdhura) }));
  const viewsChart = data.viewsPerCar.map((v) => ({ makina: v.makina, shikime: v.shikime }));
  const bookingsChart = (data.bookingsPerCar || []).map((v) => ({ makina: v.makina, rezervime: v.rezervime }));

  return (
    <div className={`flex flex-col gap-6 transition-opacity ${loading ? "opacity-50" : ""}`}>
      <div className="flex justify-end">
        <PeriodSelect period={period} setPeriod={setPeriod} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Eye} label={t("analytics.totalViews")} value={data.totals.totalViews} active={showViews} onClick={() => setShowViews((s) => !s)} />
        <StatCard icon={CalendarIcon} label={t("analytics.totalBookings")} value={data.totals.totalBookings} onClick={() => onGoBookings && onGoBookings(companyId)} />
        <StatCard icon={TrendingUp} label={t("analytics.totalRevenueAfterCommission")} value={`${data.totals.totalRevenue.toFixed(2)}€`} onClick={onGoTransactions} />
      </div>

      {showViews && (
        <div className="border border-sky-200 dark:border-emerald-800 rounded-2xl p-4">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-3">{t("analytics.mostViewedCars")}</h3>
          {data.viewsPerCar.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">{t("analytics.noViewsYet")}</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {data.viewsPerCar.map((v, i) => (
                <div key={v.carId} className="flex items-center justify-between text-sm border-b border-slate-50 dark:border-slate-800 last:border-0 py-1.5">
                  <span className="text-slate-700 dark:text-slate-300">{i + 1}. {v.makina}</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{t("analytics.viewsCount", { count: v.shikime })}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-4">{t("analytics.viewsPerCar")}</h3>
          {viewsChart.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">{t("analytics.noViewsYet")}</p>
          ) : (
            <CarPieChart data={viewsChart} dataKey="shikime" />
          )}
        </div>

        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-4">{t("analytics.bookingsPerCar")}</h3>
          {bookingsChart.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">{t("analytics.noBookingsYet")}</p>
          ) : (
            <CarPieChart data={bookingsChart} dataKey="rezervime" />
          )}
        </div>
      </div>

      <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-4">{t("analytics.bookingsAndRevenue")}</h3>
        {monthly.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">{t("analytics.noDataYet")}</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="rezervime" stroke="#047857" strokeWidth={2} name={t("analytics.bookingsLegend")} />
              <Line type="monotone" dataKey="teArdhura" stroke="#1e3a8a" strokeWidth={2} name={t("analytics.revenueLegend")} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// Same read-only record layout as the admin bookings panel (reference number, search,
// numbered pagination) but scoped to one business — reached as its own page (mirroring
// TransactionsPage) instead of the full booking-management workflow, which stays on its own tab.
export function BusinessBookingsPage({ token, showError, showOk, companyId, onBack }) {
  const { t } = useLang();
  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 mb-6"><ChevronLeft size={16} /> {t("common.back")}</button>
      <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-1.5 mb-4">
        <CalendarIcon size={18} /> {t("analytics.totalBookings")}
      </h2>
      <BusinessBookingsPanel token={token} showError={showError} showOk={showOk} companyId={companyId} />
    </div>
  );
}

function BusinessBookingsPanel({ token, showError, showOk, companyId }) {
  const { t } = useLang();
  const [bookings, setBookings] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const load = useCallback(() => {
    const url = companyId ? "/Bookings/admin/all" : "/Bookings/for-my-company";
    apiFetch(url, token)
      .then((data) => setBookings(companyId ? data.filter((b) => b.biznesi?.companyId === Number(companyId)) : data))
      .catch((e) => showError && showError(e));
  }, [token, companyId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, pageSize]);

  async function cancel(id) {
    const reason = window.prompt(t("analytics.cancelReasonPrompt"));
    if (!reason) return;
    try {
      await apiFetch(`/Bookings/${id}/cancel`, token, { method: "PUT", body: JSON.stringify({ reason }) });
      showOk && showOk(t("booking.cancelled"));
      load();
    } catch (e) { showError && showError(e); }
  }

  if (!bookings) return <p className="text-sm text-slate-400 text-center py-8">{t("common.loading")}</p>;
  if (bookings.length === 0) return <p className="text-sm text-slate-400 text-center py-8">{t("analytics.noBookingsYet")}</p>;

  const q = search.trim().toLowerCase().replace(/^er-/, "");
  const filteredBookings = q
    ? bookings.filter((b) => {
        const ref = String(b.bookingId).padStart(6, "0");
        const haystack = [ref, b.car?.marka, b.car?.modeli, b.klienti?.emri, b.klienti?.mbiemri].filter(Boolean).join(" ").toLowerCase();
        return haystack.includes(q);
      })
    : bookings;
  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / pageSize));
  const visibleBookings = filteredBookings.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      <div className="flex items-center gap-2 mb-3">
        <SearchBox value={search} onChange={setSearch} placeholder={t("analytics.searchBookings")} />
        <PageSizeSelect value={pageSize} onChange={setPageSize} />
      </div>
      {filteredBookings.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">{t("analytics.noSearchResults")}</p>
      ) : (
      <>
      <div className="hidden sm:block border border-slate-200 dark:border-slate-700 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2.5">{t("analytics.col.bookingRef")}</th>
              <th className="text-left px-4 py-2.5">{t("analytics.col.date")}</th>
              <th className="text-left px-4 py-2.5">{t("analytics.col.car")}</th>
              <th className="text-left px-4 py-2.5">{t("analytics.col.client")}</th>
              <th className="text-right px-4 py-2.5">{t("analytics.col.price")}</th>
              <th className="text-left px-4 py-2.5">{t("analytics.col.status")}</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {visibleBookings.map((b) => (
              <tr key={b.bookingId} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 font-mono text-xs whitespace-nowrap">{bookingRef(b.bookingId)}</td>
                <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">{b.dataFillimit} → {b.dataPerfundimit}</td>
                <td className="px-4 py-2.5 text-slate-700 dark:text-slate-200 whitespace-nowrap">{b.car?.marka} {b.car?.modeli}</td>
                <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">{b.klienti?.emri} {b.klienti?.mbiemri}</td>
                <td className="px-4 py-2.5 text-right text-slate-900 dark:text-slate-100 font-semibold whitespace-nowrap">{b.cmimiTotal}€</td>
                <td className="px-4 py-2.5">
                  <StatusPill status={b.statusi} />
                  {b.statusi === "cancelled" && b.arsyejaRefuzimit && (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 max-w-[220px]" title={b.arsyejaRefuzimit}>{b.arsyejaRefuzimit}</p>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {(b.statusi === "pending" || b.statusi === "confirmed") && (
                    <button onClick={() => cancel(b.bookingId)} className="text-slate-400 hover:text-red-600 dark:hover:text-red-400"><X size={14} /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sm:hidden flex flex-col gap-3">
        {visibleBookings.map((b) => (
          <div key={b.bookingId} className="border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="min-w-0">
                <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{b.car?.marka} {b.car?.modeli}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{b.klienti?.emri} {b.klienti?.mbiemri}</p>
              </div>
              <StatusPill status={b.statusi} />
            </div>
            <p className="text-xs font-mono text-slate-400">{bookingRef(b.bookingId)}</p>
            {b.statusi === "cancelled" && b.arsyejaRefuzimit && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{b.arsyejaRefuzimit}</p>
            )}
            <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>{b.dataFillimit} → {b.dataPerfundimit}</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">{b.cmimiTotal}€</span>
            </div>
            {(b.statusi === "pending" || b.statusi === "confirmed") && (
              <button onClick={() => cancel(b.bookingId)} className="text-red-500 dark:text-red-400 text-xs font-semibold flex items-center gap-1 mt-2"><X size={13} /> {t("booking.cancel")}</button>
            )}
          </div>
        ))}
      </div>
      <Pager page={page} totalPages={totalPages} setPage={setPage} />
      </>
      )}
    </>
  );
}

// Full-page view reached only by clicking the revenue StatCard — pulled out of the dashboard
// (used to be an inline section at the bottom, requiring a scroll past everything else) so
// reviewing transactions reads as its own task instead of digging through the whole dashboard.
// A calendar month/year range (not a rolling "last N days" window) — a business asking for
// "August's statement" or "last quarter" means specific calendar months, not a sliding cutoff.
function monthRange(fromMonth, toMonth) {
  const [fy, fm] = fromMonth.split("-").map(Number);
  const [ty, tm] = toMonth.split("-").map(Number);
  return { from: new Date(fy, fm - 1, 1), toExclusive: new Date(ty, tm, 1) };
}

function monthLabel(monthStr, lang) {
  const [y, m] = monthStr.split("-").map(Number);
  return `${monthName(m - 1, lang)} ${y}`;
}

function toCsvValue(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function TransactionsPage({ token, showError, admin, businessName, onBack }) {
  const { t, lang } = useLang();
  const [payments, setPayments] = useState(null);
  const [loading, setLoading] = useState(true);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const [fromMonth, setFromMonth] = useState(thisMonth);
  const [toMonth, setToMonth] = useState(thisMonth);
  const [downloading, setDownloading] = useState(false);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    setLoading(true);
    apiFetch(admin ? "/Payments/admin" : "/Payments/my-company", token)
      .then(setPayments)
      .catch((e) => showError && showError(e))
      .finally(() => setLoading(false));
  }, [token, admin]);

  function changeFromMonth(v) {
    setFromMonth(v);
    if (toMonth < v) setToMonth(v);
  }

  const { from, toExclusive } = monthRange(fromMonth, toMonth);
  const filtered = (payments || []).filter((p) => p.dataPageses && new Date(p.dataPageses) >= from && new Date(p.dataPageses) < toExclusive);
  const periodLabel = fromMonth === toMonth ? monthLabel(fromMonth, lang) : `${monthLabel(fromMonth, lang)} – ${monthLabel(toMonth, lang)}`;

  const q = search.trim().toLowerCase();
  const searched = q
    ? filtered.filter((p) => {
        const ref = p.booking?.bookingId ? bookingRef(p.booking.bookingId).toLowerCase() : "";
        const haystack = [
          ref,
          p.paypalCaptureId,
          p.klienti?.emri,
          p.klienti?.mbiemri,
          p.car?.marka,
          p.car?.modeli,
          p.biznesi?.emri,
        ].filter(Boolean).join(" ").toLowerCase();
        return haystack.includes(q);
      })
    : filtered;

  function exportCsv() {
    const headers = [t("analytics.col.date"), t("analytics.col.reference"), t("analytics.col.client"), t("analytics.col.car"), ...(admin ? [t("analytics.col.business")] : []), t("analytics.col.method"), t("analytics.col.paid"), t("analytics.col.commission"), t("analytics.col.netBusiness"), t("analytics.col.status")];
    const rows = filtered.map((p) => [
      p.dataPageses ? formatLocaleDate(p.dataPageses, lang) : "",
      p.paypalCaptureId || "",
      `${p.klienti?.emri || ""} ${p.klienti?.mbiemri || ""}`.trim(),
      `${p.car?.marka || ""} ${p.car?.modeli || ""}`.trim(),
      ...(admin ? [p.biznesi?.emri || ""] : []),
      p.metodaPageses === "paypal_full" ? t("analytics.methodFull") : t("analytics.methodDeposit"),
      p.shumaPaguarOnline ?? "",
      p.komisioni != null ? p.komisioni.toFixed(2) : "",
      p.shumaBiznesit != null ? p.shumaBiznesit.toFixed(2) : "",
      p.statusi || "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map(toCsvValue).join(",")).join("\n");
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transaksione-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function downloadStatement() {
    setDownloading(true);
    try {
      await generateStatementPdf({ payments: filtered, admin, periodLabel, businessName, lang });
    } catch (e) { showError && showError(e); } finally { setDownloading(false); }
  }

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 mb-6"><ChevronLeft size={16} /> {t("common.back")}</button>
      <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
        <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
          <Receipt size={18} /> {admin ? t("analytics.platformTransactionsAllBusinesses") : t("analytics.transactions")}
        </h2>
        <div className="flex items-center gap-1.5">
          <input
            type="month"
            value={fromMonth}
            onChange={(e) => changeFromMonth(e.target.value)}
            className="text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800"
          />
          <span className="text-slate-400 text-xs">–</span>
          <input
            type="month"
            value={toMonth}
            min={fromMonth}
            onChange={(e) => setToMonth(e.target.value)}
            className="text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800"
          />
        </div>
      </div>

      {loading && !payments ? (
        <p className="text-sm text-slate-400 text-center py-8">{t("common.loading")}</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">{t("analytics.noTransactionsYet")}</p>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
            <div className="flex gap-2">
              <GhostButton type="button" onClick={exportCsv} className="w-fit text-xs py-2 px-3.5">{t("analytics.exportCsv")}</GhostButton>
              <PrimaryButton type="button" onClick={downloadStatement} disabled={downloading} className="w-fit text-xs py-2 px-3.5">
                {downloading ? t("common.loading") : t("analytics.downloadStatement")}
              </PrimaryButton>
            </div>
            <div className="flex items-center gap-2">
              <SearchBox value={search} onChange={setSearch} placeholder={t("analytics.searchTransactions")} />
              <PageSizeSelect value={pageSize} onChange={setPageSize} />
            </div>
          </div>
          {searched.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">{t("analytics.noSearchResults")}</p>
          ) : (
            <TransactionsTable payments={searched} admin={admin} pageSize={pageSize} />
          )}
        </>
      )}
    </div>
  );
}

function AdminPanelPage({ icon: Icon, titleKey, onBack, children }) {
  const { t } = useLang();
  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 mb-6"><ChevronLeft size={16} /> {t("common.back")}</button>
      <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-1.5 mb-4">
        <Icon size={18} /> {t(titleKey)}
      </h2>
      {children}
    </div>
  );
}

export function AdminUsersPage({ token, showError, showOk, onBack }) {
  return (
    <AdminPanelPage icon={UsersIcon} titleKey="analytics.metric.users" onBack={onBack}>
      <AdminUsersPanel token={token} showError={showError} showOk={showOk} />
    </AdminPanelPage>
  );
}

export function AdminCompaniesPage({ token, showError, showOk, onBack }) {
  return (
    <AdminPanelPage icon={Building2} titleKey="analytics.metric.companies" onBack={onBack}>
      <AdminCompaniesPanel token={token} showError={showError} showOk={showOk} />
    </AdminPanelPage>
  );
}

export function AdminCarsPage({ token, showError, showOk, onBack }) {
  return (
    <AdminPanelPage icon={CarIcon} titleKey="analytics.metric.cars" onBack={onBack}>
      <AdminCarsPanel token={token} showError={showError} showOk={showOk} />
    </AdminPanelPage>
  );
}

export function AdminBookingsPage({ token, showError, showOk, onBack }) {
  return (
    <AdminPanelPage icon={CalendarIcon} titleKey="analytics.metric.bookings" onBack={onBack}>
      <AdminBookingsPanel token={token} showError={showError} showOk={showOk} />
    </AdminPanelPage>
  );
}

function TransactionsTable({ payments, admin = false, pageSize }) {
  const { t, lang } = useLang();
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(payments.length / pageSize));
  // Depend on a content fingerprint, not the array reference, so paging isn't reset by
  // unrelated parent re-renders (e.g. toggling the PDF-download spinner) recomputing the same list.
  const depKey = payments.length ? `${payments.length}-${payments[0]?.paymentId}-${payments[payments.length - 1]?.paymentId}` : "0";

  useEffect(() => { setPage(1); }, [depKey, pageSize]);

  const visible = payments.slice((page - 1) * pageSize, page * pageSize);

  function statusPill(statusi) {
    if (statusi === "completed") return <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full whitespace-nowrap">{t("analytics.statusSuccess")}</span>;
    if (statusi === "refunded") return <span className="text-[11px] font-semibold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-full whitespace-nowrap">{t("analytics.statusRefunded")}</span>;
    if (statusi === "refund_failed") return <span className="text-[11px] font-semibold text-red-800 dark:text-red-200 bg-red-100 dark:bg-red-900/50 px-2 py-0.5 rounded-full whitespace-nowrap">{t("analytics.statusRefundFailed")}</span>;
    if (statusi === "not_refunded") return <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full whitespace-nowrap">{t("analytics.statusNotRefunded")}</span>;
    return <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full whitespace-nowrap">{statusi}</span>;
  }

  return (
    <div>
      <div className="hidden sm:block border border-slate-200 dark:border-slate-700 rounded-2xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase">
          <tr>
            <th className="text-left px-4 py-2.5">{t("analytics.col.date")}</th>
            <th className="text-left px-4 py-2.5">{t("analytics.col.reference")}</th>
            <th className="text-left px-4 py-2.5">{t("analytics.col.client")}</th>
            <th className="text-left px-4 py-2.5">{t("analytics.col.car")}</th>
            {admin && <th className="text-left px-4 py-2.5">{t("analytics.col.business")}</th>}
            <th className="text-left px-4 py-2.5">{t("analytics.col.method")}</th>
            <th className="text-right px-4 py-2.5">{t("analytics.col.paid")}</th>
            <th className="text-right px-4 py-2.5">{t("analytics.col.commission")}</th>
            <th className="text-right px-4 py-2.5">{t("analytics.col.netBusiness")}</th>
            <th className="text-left px-4 py-2.5">{t("analytics.col.status")}</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((p) => (
            <tr key={p.paymentId} className="border-t border-slate-100 dark:border-slate-800">
              <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">{p.dataPageses ? formatLocaleDate(p.dataPageses, lang) : "-"}</td>
              <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 font-mono text-xs">{p.paypalCaptureId ? `${p.paypalCaptureId.slice(0, 10)}…` : "-"}</td>
              <td className="px-4 py-2.5 text-slate-700 dark:text-slate-200 whitespace-nowrap">{p.klienti?.emri} {p.klienti?.mbiemri}</td>
              <td className="px-4 py-2.5 text-slate-700 dark:text-slate-200 whitespace-nowrap">{p.car?.marka} {p.car?.modeli}</td>
              {admin && <td className="px-4 py-2.5 text-slate-700 dark:text-slate-200 whitespace-nowrap">{p.biznesi?.emri}</td>}
              <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">{p.metodaPageses === "paypal_full" ? t("analytics.methodFull") : t("analytics.methodDeposit")}</td>
              <td className="px-4 py-2.5 text-right text-slate-900 dark:text-slate-100 font-semibold whitespace-nowrap">{p.shumaPaguarOnline != null ? `${p.shumaPaguarOnline}€` : "-"}</td>
              <td className="px-4 py-2.5 text-right text-slate-500 dark:text-slate-400 whitespace-nowrap">{p.komisioni != null ? `${p.komisioni.toFixed(2)}€` : "-"}</td>
              <td className="px-4 py-2.5 text-right text-slate-900 dark:text-slate-100 font-semibold whitespace-nowrap">{p.shumaBiznesit != null ? `${p.shumaBiznesit.toFixed(2)}€` : "-"}</td>
              <td className="px-4 py-2.5">{statusPill(p.statusi)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <div className="sm:hidden flex flex-col gap-3">
        {visible.map((p) => (
          <div key={p.paymentId} className="border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{p.klienti?.emri} {p.klienti?.mbiemri}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{p.car?.marka} {p.car?.modeli}{admin && p.biznesi?.emri ? ` · ${p.biznesi.emri}` : ""}</p>
              </div>
              {statusPill(p.statusi)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>{p.dataPageses ? formatLocaleDate(p.dataPageses, lang) : "-"}</span>
              <span>{p.metodaPageses === "paypal_full" ? t("analytics.methodFull") : t("analytics.methodDeposit")}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 border-t border-slate-100 dark:border-slate-800 pt-2">
              <div>
                <p className="text-[10px] uppercase text-slate-400">{t("analytics.col.paid")}</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{p.shumaPaguarOnline != null ? `${p.shumaPaguarOnline}€` : "-"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-400">{t("analytics.col.commission")}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">{p.komisioni != null ? `${p.komisioni.toFixed(2)}€` : "-"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-400">{t("analytics.col.netBusiness")}</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{p.shumaBiznesit != null ? `${p.shumaBiznesit.toFixed(2)}€` : "-"}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Pager page={page} totalPages={totalPages} setPage={setPage} />
    </div>
  );
}

const METRICS = [
  { key: "users", labelKey: "analytics.metric.users", color: "#047857" },
  { key: "companies", labelKey: "analytics.metric.companies", color: "#1e3a8a" },
  { key: "cars", labelKey: "analytics.metric.cars", color: "#b45309" },
  { key: "bookings", labelKey: "analytics.metric.bookings", color: "#7c3aed" },
  { key: "verifications", labelKey: "analytics.metric.verifications", color: "#be185d" },
];

export function AdminAnalytics({ token, showError, showOk, refreshKey, onGoPending, onGoTransactions, onGoBookings, onGoPanel }) {
  const { t, lang } = useLang();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(DEFAULT_PERIOD);
  const [metric, setMetric] = useState("users");
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams(periodQuery(period)).toString();
    apiFetch(`/Analytics/admin?${qs}`, token)
      .then(setData)
      .catch((e) => showError && showError(e))
      .finally(() => setLoading(false));
  }, [token, refreshKey, period]);

  useEffect(() => {
    apiFetch("/Companies", null).then(setCompanies).catch(() => {});
  }, []);

  if (loading && !data) return <p className="text-center text-sm text-slate-400 py-16">{t("common.loading")}</p>;
  if (!data) return null;

  const activeMetric = METRICS.find((m) => m.key === metric) || METRICS[0];
  const series = (data.series?.[metric] || []).map((m) => ({ label: entryLabel(m, lang), count: m.count }));

  return (
    <div className={`flex flex-col gap-6 transition-opacity ${loading ? "opacity-50" : ""}`}>
      <div className="flex justify-end">
        <PeriodSelect period={period} setPeriod={setPeriod} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard icon={UsersIcon} label={t("analytics.metric.users")} value={data.totals.totalUsers} onClick={() => onGoPanel("users")} />
        <StatCard icon={Building2} label={t("analytics.metric.companies")} value={data.totals.totalCompanies} onClick={() => onGoPanel("companies")} />
        <StatCard icon={CarIcon} label={t("analytics.metric.cars")} value={data.totals.totalCars} onClick={() => onGoPanel("cars")} />
        <StatCard icon={CalendarIcon} label={t("analytics.metric.bookings")} value={data.totals.totalBookings} onClick={() => onGoPanel("bookings")} />
        <StatCard icon={Clock} label={t("analytics.pendingVerification")} value={data.totals.pendingVerifications} onClick={onGoPending} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <StatCard icon={TrendingUp} label={t("analytics.totalPlatformRevenue")} value={`${data.totals.totalPlatformRevenue.toFixed(2)}€`} onClick={onGoTransactions} />
        <StatCard icon={Wallet} label={t("analytics.ourProfit")} value={`${data.totals.totalPlatformProfit.toFixed(2)}€`} />
      </div>

      <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4 gap-2">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{t("analytics.growth")}</h3>
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
            className="text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800"
          >
            {METRICS.map((m) => <option key={m.key} value={m.key}>{t(m.labelKey)}</option>)}
          </select>
        </div>
        {series.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">{t("analytics.notEnoughData")}</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke={activeMetric.color} strokeWidth={2} name={t(activeMetric.labelKey)} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-4">{t("analytics.top5Companies")}</h3>
        {data.topCompanies.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">{t("analytics.noBookingsYet")}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {data.topCompanies.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-sm border-b border-slate-50 dark:border-slate-800 last:border-0 py-2">
                <span className="text-slate-700 dark:text-slate-300">{i + 1}. {c.emri}</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{t("auth.bookingsCount", { count: c.rezervime })}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-1">{t("analytics.profitsByCompany")}</h3>
        <p className="text-xs text-slate-400 mb-4">{t("analytics.profitsByCompanyHint")}</p>
        {(!data.companyBreakdown || data.companyBreakdown.length === 0) ? (
          <p className="text-sm text-slate-400 text-center py-4">{t("analytics.noCompletedTransactions")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-500 dark:text-slate-400 text-xs uppercase">
                <tr>
                  <th className="text-left py-2">{t("analytics.col.business")}</th>
                  <th className="text-right py-2">{t("analytics.col.totalRent")}</th>
                  <th className="text-right py-2">{t("analytics.col.ourProfitShort")}</th>
                </tr>
              </thead>
              <tbody>
                {data.companyBreakdown.map((c, i) => (
                  <tr key={i} className="border-t border-slate-50 dark:border-slate-800">
                    <td className="py-2 text-slate-700 dark:text-slate-300">{c.emri}</td>
                    <td className="py-2 text-right text-slate-700 dark:text-slate-300">{c.teArdhura.toFixed(2)}€</td>
                    <td className="py-2 text-right font-semibold text-emerald-700 dark:text-emerald-400">{c.fitimi.toFixed(2)}€</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-4">{t("analytics.specificBusinessStats")}</h3>
        <select
          value={selectedCompanyId}
          onChange={(e) => setSelectedCompanyId(e.target.value)}
          className="text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 w-full sm:w-64 mb-4"
        >
          <option value="">{t("analytics.chooseBusiness")}</option>
          {companies.map((c) => <option key={c.companyId} value={c.companyId}>{c.emri}</option>)}
        </select>
        {selectedCompanyId && (
          <BusinessAnalytics token={token} showError={showError} companyId={selectedCompanyId} refreshKey={refreshKey} onGoBookings={onGoBookings} onGoTransactions={onGoTransactions} />
        )}
      </div>
    </div>
  );
}

function AdminUsersPanel({ token, showError, showOk }) {
  const { t, lang } = useLang();
  const [users, setUsers] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    apiFetch("/Users", token).then(setUsers).catch((e) => showError && showError(e));
  }, [token]);

  useEffect(() => { setPage(1); }, [search, pageSize]);

  function startEdit(u) {
    setEditingId(u.userId);
    setForm({ emri: u.emri, mbiemri: u.mbiemri, telefoni: u.telefoni || "", email: u.email });
  }

  async function save() {
    try {
      const updated = await apiFetch(`/Users/${editingId}`, token, { method: "PUT", body: JSON.stringify(form) });
      setUsers((list) => list.map((u) => (u.userId === editingId ? { ...u, ...updated } : u)));
      setEditingId(null);
      showOk && showOk(t("analytics.userUpdated"));
    } catch (e) { showError && showError(e); }
  }

  async function forceDelete(u) {
    if (!window.confirm(t("analytics.confirmDeleteUser", { user: `${u.emri} ${u.mbiemri}` }))) return;
    try {
      await apiFetch(`/Users/${u.userId}/force`, token, { method: "DELETE" });
      setUsers((list) => list.filter((x) => x.userId !== u.userId));
      showOk && showOk(t("analytics.userDeleted"));
    } catch (e) { showError && showError(e); }
  }

  if (!users) return <p className="text-sm text-slate-400 text-center py-8">{t("common.loading")}</p>;

  const q = search.trim().toLowerCase();
  const filteredUsers = q
    ? users.filter((u) => [u.emri, u.mbiemri, u.email, u.telefoni].filter(Boolean).join(" ").toLowerCase().includes(q))
    : users;
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const visibleUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      <div className="flex items-center gap-2 mb-3">
        <SearchBox value={search} onChange={setSearch} placeholder={t("analytics.searchUsers")} />
        <PageSizeSelect value={pageSize} onChange={setPageSize} />
      </div>
      {filteredUsers.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">{t("analytics.noSearchResults")}</p>
      ) : (
      <>
      <div className="hidden sm:block border border-slate-200 dark:border-slate-700 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2.5">{t("analytics.col.name")}</th>
              <th className="text-left px-4 py-2.5">Email</th>
              <th className="text-left px-4 py-2.5">{t("auth.phone")}</th>
              <th className="text-left px-4 py-2.5">{t("analytics.col.registered")}</th>
              <th className="text-left px-4 py-2.5">{t("analytics.col.businessShort")}</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {visibleUsers.map((u) => (
              <tr key={u.userId} className="border-t border-slate-100 dark:border-slate-800">
                {editingId === u.userId ? (
                  <>
                    <td className="px-4 py-2 flex gap-1">
                      <input className={inputClass + " text-xs py-1"} value={form.emri} onChange={(e) => setForm((f) => ({ ...f, emri: e.target.value }))} />
                      <input className={inputClass + " text-xs py-1"} value={form.mbiemri} onChange={(e) => setForm((f) => ({ ...f, mbiemri: e.target.value }))} />
                    </td>
                    <td className="px-4 py-2"><input type="email" className={inputClass + " text-xs py-1"} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></td>
                    <td className="px-4 py-2"><input className={inputClass + " text-xs py-1"} value={form.telefoni} onChange={(e) => setForm((f) => ({ ...f, telefoni: e.target.value }))} /></td>
                    <td className="px-4 py-2 text-slate-400 text-xs whitespace-nowrap">{u.dataRegjistrimit ? formatLocaleDate(u.dataRegjistrimit, lang) : "-"}</td>
                    <td className="px-4 py-2 text-slate-400 text-xs">{u.hasCompany ? t("common.yes") : t("common.no")}</td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      <button onClick={save} className="text-sky-600 dark:text-emerald-400"><Check size={14} /></button>
                      <button onClick={() => setEditingId(null)} className="text-slate-400 ml-2"><X size={14} /></button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2.5 text-slate-700 dark:text-slate-200 whitespace-nowrap">{u.emri} {u.mbiemri}</td>
                    <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">{u.email}</td>
                    <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">{u.telefoni || "-"}</td>
                    <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">{u.dataRegjistrimit ? formatLocaleDate(u.dataRegjistrimit, lang) : "-"}</td>
                    <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-xs">{u.hasCompany ? t("common.yes") : t("common.no")}</td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <button onClick={() => startEdit(u)} className="text-slate-400 hover:text-sky-600 dark:hover:text-emerald-400"><Pencil size={13} /></button>
                      <button onClick={() => forceDelete(u)} className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 ml-2"><Trash2 size={13} /></button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sm:hidden flex flex-col gap-3">
        {visibleUsers.map((u) => (
          <div key={u.userId} className="border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5">
            {editingId === u.userId ? (
              <div className="flex flex-col gap-2">
                <div className="flex gap-1.5">
                  <input className={inputClass + " text-xs py-1.5"} value={form.emri} onChange={(e) => setForm((f) => ({ ...f, emri: e.target.value }))} placeholder={t("analytics.col.name")} />
                  <input className={inputClass + " text-xs py-1.5"} value={form.mbiemri} onChange={(e) => setForm((f) => ({ ...f, mbiemri: e.target.value }))} />
                </div>
                <input type="email" className={inputClass + " text-xs py-1.5"} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="Email" />
                <input className={inputClass + " text-xs py-1.5"} value={form.telefoni} onChange={(e) => setForm((f) => ({ ...f, telefoni: e.target.value }))} placeholder={t("auth.phone")} />
                <div className="flex gap-3 mt-1">
                  <button onClick={save} className="text-sky-600 dark:text-emerald-400 flex items-center gap-1 text-xs font-semibold"><Check size={14} /> {t("common.save")}</button>
                  <button onClick={() => setEditingId(null)} className="text-slate-400 flex items-center gap-1 text-xs font-semibold"><X size={14} /> {t("common.cancel")}</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{u.emri} {u.mbiemri}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => startEdit(u)} className="text-slate-400 hover:text-sky-600 dark:hover:text-emerald-400"><Pencil size={14} /></button>
                    <button onClick={() => forceDelete(u)} className="text-slate-400 hover:text-red-600 dark:hover:text-red-400"><Trash2 size={14} /></button>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{u.email}</p>
                <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>{u.telefoni || "-"}</span>
                  <span>{u.dataRegjistrimit ? formatLocaleDate(u.dataRegjistrimit, lang) : "-"}</span>
                  <span>{t("analytics.col.businessShort")}: {u.hasCompany ? t("common.yes") : t("common.no")}</span>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      <Pager page={page} totalPages={totalPages} setPage={setPage} />
      </>
      )}
    </>
  );
}

function AdminCompaniesPanel({ token, showError, showOk }) {
  const { t } = useLang();
  const [companies, setCompanies] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    apiFetch("/Companies", null).then(setCompanies).catch((e) => showError && showError(e));
  }, []);

  useEffect(() => { setPage(1); }, [search, pageSize]);

  function startEdit(c) {
    setEditingId(c.companyId);
    setForm({ emri: c.emri, telefoni: c.telefoni || "", adresa: c.adresa || "", qyteti: c.qyteti || "", statusi: c.statusi || "active" });
  }

  async function save() {
    try {
      const updated = await apiFetch(`/Companies/${editingId}/admin`, token, { method: "PUT", body: JSON.stringify(form) });
      setCompanies((list) => list.map((c) => (c.companyId === editingId ? { ...c, ...updated } : c)));
      setEditingId(null);
      showOk && showOk(t("analytics.companyUpdated"));
    } catch (e) { showError && showError(e); }
  }

  async function forceDelete(c) {
    if (!window.confirm(t("analytics.confirmDeleteCompany", { company: c.emri }))) return;
    try {
      await apiFetch(`/Companies/${c.companyId}/force`, token, { method: "DELETE" });
      setCompanies((list) => list.filter((x) => x.companyId !== c.companyId));
      showOk && showOk(t("analytics.companyDeleted"));
    } catch (e) { showError && showError(e); }
  }

  if (!companies) return <p className="text-sm text-slate-400 text-center py-8">{t("common.loading")}</p>;

  const q = search.trim().toLowerCase();
  const filteredCompanies = q
    ? companies.filter((c) => [c.emri, c.qyteti, c.telefoni].filter(Boolean).join(" ").toLowerCase().includes(q))
    : companies;
  const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / pageSize));
  const visibleCompanies = filteredCompanies.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      <div className="flex items-center gap-2 mb-3">
        <SearchBox value={search} onChange={setSearch} placeholder={t("analytics.searchCompanies")} />
        <PageSizeSelect value={pageSize} onChange={setPageSize} />
      </div>
      {filteredCompanies.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">{t("analytics.noSearchResults")}</p>
      ) : (
      <>
      <div className="hidden sm:block border border-slate-200 dark:border-slate-700 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2.5">{t("analytics.col.name")}</th>
              <th className="text-left px-4 py-2.5">{t("analytics.col.city")}</th>
              <th className="text-left px-4 py-2.5">{t("auth.phone")}</th>
              <th className="text-left px-4 py-2.5">{t("analytics.col.status")}</th>
              <th className="text-left px-4 py-2.5">{t("analytics.col.verified")}</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {visibleCompanies.map((c) => (
              <tr key={c.companyId} className="border-t border-slate-100 dark:border-slate-800">
                {editingId === c.companyId ? (
                  <>
                    <td className="px-4 py-2"><input className={inputClass + " text-xs py-1"} value={form.emri} onChange={(e) => setForm((f) => ({ ...f, emri: e.target.value }))} /></td>
                    <td className="px-4 py-2"><input className={inputClass + " text-xs py-1"} value={form.qyteti} onChange={(e) => setForm((f) => ({ ...f, qyteti: e.target.value }))} /></td>
                    <td className="px-4 py-2"><input className={inputClass + " text-xs py-1"} value={form.telefoni} onChange={(e) => setForm((f) => ({ ...f, telefoni: e.target.value }))} /></td>
                    <td className="px-4 py-2">
                      <select className={inputClass + " text-xs py-1"} value={form.statusi} onChange={(e) => setForm((f) => ({ ...f, statusi: e.target.value }))}>
                        <option value="active">active</option>
                        <option value="inactive">inactive</option>
                        <option value="suspended">suspended</option>
                      </select>
                    </td>
                    <td className="px-4 py-2 text-slate-400 text-xs">{c.eshteVerifikuar ? t("common.yes") : t("common.no")}</td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      <button onClick={save} className="text-sky-600 dark:text-emerald-400"><Check size={14} /></button>
                      <button onClick={() => setEditingId(null)} className="text-slate-400 ml-2"><X size={14} /></button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2.5 text-slate-700 dark:text-slate-200 whitespace-nowrap">{c.emri}</td>
                    <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-xs">{c.qyteti || "-"}</td>
                    <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">{c.telefoni || "-"}</td>
                    <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-xs">{c.statusi}</td>
                    <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-xs">{c.eshteVerifikuar ? t("common.yes") : t("common.no")}</td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <button onClick={() => startEdit(c)} className="text-slate-400 hover:text-sky-600 dark:hover:text-emerald-400"><Pencil size={13} /></button>
                      <button onClick={() => forceDelete(c)} className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 ml-2"><Trash2 size={13} /></button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sm:hidden flex flex-col gap-3">
        {visibleCompanies.map((c) => (
          <div key={c.companyId} className="border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5">
            {editingId === c.companyId ? (
              <div className="flex flex-col gap-2">
                <input className={inputClass + " text-xs py-1.5"} value={form.emri} onChange={(e) => setForm((f) => ({ ...f, emri: e.target.value }))} placeholder={t("analytics.col.name")} />
                <input className={inputClass + " text-xs py-1.5"} value={form.qyteti} onChange={(e) => setForm((f) => ({ ...f, qyteti: e.target.value }))} placeholder={t("analytics.col.city")} />
                <input className={inputClass + " text-xs py-1.5"} value={form.telefoni} onChange={(e) => setForm((f) => ({ ...f, telefoni: e.target.value }))} placeholder={t("auth.phone")} />
                <select className={inputClass + " text-xs py-1.5"} value={form.statusi} onChange={(e) => setForm((f) => ({ ...f, statusi: e.target.value }))}>
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                  <option value="suspended">suspended</option>
                </select>
                <div className="flex gap-3 mt-1">
                  <button onClick={save} className="text-sky-600 dark:text-emerald-400 flex items-center gap-1 text-xs font-semibold"><Check size={14} /> {t("common.save")}</button>
                  <button onClick={() => setEditingId(null)} className="text-slate-400 flex items-center gap-1 text-xs font-semibold"><X size={14} /> {t("common.cancel")}</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{c.emri}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => startEdit(c)} className="text-slate-400 hover:text-sky-600 dark:hover:text-emerald-400"><Pencil size={14} /></button>
                    <button onClick={() => forceDelete(c)} className="text-slate-400 hover:text-red-600 dark:hover:text-red-400"><Trash2 size={14} /></button>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{c.qyteti || "-"} · {c.telefoni || "-"}</p>
                <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>{t("analytics.col.status")}: {c.statusi}</span>
                  <span>{t("analytics.col.verified")}: {c.eshteVerifikuar ? t("common.yes") : t("common.no")}</span>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      <Pager page={page} totalPages={totalPages} setPage={setPage} />
      </>
      )}
    </>
  );
}

function AdminCarsPanel({ token, showError, showOk }) {
  const { t } = useLang();
  const [cars, setCars] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    apiFetch("/Cars", null).then(setCars).catch((e) => showError && showError(e));
  }, []);

  useEffect(() => { setPage(1); }, [search, pageSize]);

  function startEdit(c) {
    setEditingId(c.carId);
    setForm({ cmimiDites: String(c.cmimiDites), statusi: c.statusi || "active" });
  }

  async function save() {
    try {
      await apiFetch(`/Cars/${editingId}/admin`, token, {
        method: "PUT",
        body: JSON.stringify({ cmimiDites: Number(form.cmimiDites), statusi: form.statusi }),
      });
      setCars((list) => list.map((c) => (c.carId === editingId ? { ...c, cmimiDites: Number(form.cmimiDites), statusi: form.statusi } : c)));
      setEditingId(null);
      showOk && showOk(t("business.carUpdated"));
    } catch (e) { showError && showError(e); }
  }

  async function remove(c) {
    if (!window.confirm(t("analytics.confirmDeleteCar", { car: `${c.marka} ${c.modeli}` }))) return;
    try {
      await apiFetch(`/Cars/${c.carId}`, token, { method: "DELETE" });
      setCars((list) => list.filter((x) => x.carId !== c.carId));
      showOk && showOk(t("analytics.carDeleted"));
    } catch (e) { showError && showError(e); }
  }

  if (!cars) return <p className="text-sm text-slate-400 text-center py-8">{t("common.loading")}</p>;

  const q = search.trim().toLowerCase();
  const filteredCars = q ? cars.filter((c) => (c.targa || "").toLowerCase().includes(q)) : cars;
  const totalPages = Math.max(1, Math.ceil(filteredCars.length / pageSize));
  const visibleCars = filteredCars.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      <div className="flex items-center gap-2 mb-3">
        <SearchBox value={search} onChange={setSearch} placeholder={t("analytics.searchCars")} />
        <PageSizeSelect value={pageSize} onChange={setPageSize} />
      </div>
      {filteredCars.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">{t("analytics.noSearchResults")}</p>
      ) : (
      <>
      <div className="hidden sm:block border border-slate-200 dark:border-slate-700 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2.5">{t("analytics.col.car")}</th>
              <th className="text-left px-4 py-2.5">{t("business.carField.plate")}</th>
              <th className="text-left px-4 py-2.5">{t("analytics.col.business")}</th>
              <th className="text-left px-4 py-2.5">{t("analytics.col.pricePerDay")}</th>
              <th className="text-left px-4 py-2.5">{t("analytics.col.status")}</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {visibleCars.map((c) => (
              <tr key={c.carId} className="border-t border-slate-100 dark:border-slate-800">
                {editingId === c.carId ? (
                  <>
                    <td className="px-4 py-2.5 text-slate-700 dark:text-slate-200 whitespace-nowrap">{c.marka} {c.modeli}</td>
                    <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-xs">{c.targa}</td>
                    <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">{c.company?.emri}</td>
                    <td className="px-4 py-2"><input type="number" className={inputClass + " text-xs py-1 w-20"} value={form.cmimiDites} onChange={(e) => setForm((f) => ({ ...f, cmimiDites: e.target.value }))} /></td>
                    <td className="px-4 py-2">
                      <select className={inputClass + " text-xs py-1"} value={form.statusi} onChange={(e) => setForm((f) => ({ ...f, statusi: e.target.value }))}>
                        <option value="active">active</option>
                        <option value="inactive">inactive</option>
                      </select>
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      <button onClick={save} className="text-sky-600 dark:text-emerald-400"><Check size={14} /></button>
                      <button onClick={() => setEditingId(null)} className="text-slate-400 ml-2"><X size={14} /></button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2.5 text-slate-700 dark:text-slate-200 whitespace-nowrap">{c.marka} {c.modeli}</td>
                    <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-xs">{c.targa}</td>
                    <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">{c.company?.emri}</td>
                    <td className="px-4 py-2.5 text-slate-700 dark:text-slate-200 text-xs whitespace-nowrap">{c.cmimiDites}€</td>
                    <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-xs">{c.statusi}</td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <button onClick={() => startEdit(c)} className="text-slate-400 hover:text-sky-600 dark:hover:text-emerald-400"><Pencil size={13} /></button>
                      <button onClick={() => remove(c)} className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 ml-2"><Trash2 size={13} /></button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sm:hidden flex flex-col gap-3">
        {visibleCars.map((c) => (
          <div key={c.carId} className="border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5">
            {editingId === c.carId ? (
              <div className="flex flex-col gap-2">
                <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{c.marka} {c.modeli}</p>
                <input type="number" className={inputClass + " text-xs py-1.5"} value={form.cmimiDites} onChange={(e) => setForm((f) => ({ ...f, cmimiDites: e.target.value }))} placeholder={t("analytics.col.pricePerDay")} />
                <select className={inputClass + " text-xs py-1.5"} value={form.statusi} onChange={(e) => setForm((f) => ({ ...f, statusi: e.target.value }))}>
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                </select>
                <div className="flex gap-3 mt-1">
                  <button onClick={save} className="text-sky-600 dark:text-emerald-400 flex items-center gap-1 text-xs font-semibold"><Check size={14} /> {t("common.save")}</button>
                  <button onClick={() => setEditingId(null)} className="text-slate-400 flex items-center gap-1 text-xs font-semibold"><X size={14} /> {t("common.cancel")}</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{c.marka} {c.modeli}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => startEdit(c)} className="text-slate-400 hover:text-sky-600 dark:hover:text-emerald-400"><Pencil size={14} /></button>
                    <button onClick={() => remove(c)} className="text-slate-400 hover:text-red-600 dark:hover:text-red-400"><Trash2 size={14} /></button>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{c.targa} · {c.company?.emri}</p>
                <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{c.cmimiDites}€{t("common.perDaySuffix")}</span>
                  <span>{c.statusi}</span>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      <Pager page={page} totalPages={totalPages} setPage={setPage} />
      </>
      )}
    </>
  );
}

function AdminBookingsPanel({ token, showError, showOk }) {
  const { t } = useLang();
  const [bookings, setBookings] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  function load() {
    apiFetch("/Bookings/admin/all", token).then(setBookings).catch((e) => showError && showError(e));
  }

  useEffect(() => { load(); }, [token]);

  useEffect(() => { setPage(1); }, [search, pageSize]);

  async function cancel(id) {
    const reason = window.prompt(t("analytics.cancelReasonPrompt"));
    if (!reason) return;
    try {
      await apiFetch(`/Bookings/${id}/cancel`, token, { method: "PUT", body: JSON.stringify({ reason }) });
      showOk && showOk(t("booking.cancelled"));
      load();
    } catch (e) { showError && showError(e); }
  }

  if (!bookings) return <p className="text-sm text-slate-400 text-center py-8">{t("common.loading")}</p>;
  if (bookings.length === 0) return <p className="text-sm text-slate-400 text-center py-8">{t("analytics.noBookingsYet")}</p>;

  const q = search.trim().toLowerCase().replace(/^er-/, "");
  const filteredBookings = q
    ? bookings.filter((b) => {
        const ref = String(b.bookingId).padStart(6, "0");
        const haystack = [ref, b.car?.marka, b.car?.modeli, b.biznesi?.emri, b.klienti?.emri, b.klienti?.mbiemri].filter(Boolean).join(" ").toLowerCase();
        return haystack.includes(q);
      })
    : bookings;
  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / pageSize));
  const visibleBookings = filteredBookings.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      <div className="flex items-center gap-2 mb-3">
        <SearchBox value={search} onChange={setSearch} placeholder={t("analytics.searchBookings")} />
        <PageSizeSelect value={pageSize} onChange={setPageSize} />
      </div>
      {filteredBookings.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">{t("analytics.noSearchResults")}</p>
      ) : (
      <>
      <div className="hidden sm:block border border-slate-200 dark:border-slate-700 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2.5">{t("analytics.col.bookingRef")}</th>
              <th className="text-left px-4 py-2.5">{t("analytics.col.date")}</th>
              <th className="text-left px-4 py-2.5">{t("analytics.col.car")}</th>
              <th className="text-left px-4 py-2.5">{t("analytics.col.business")}</th>
              <th className="text-left px-4 py-2.5">{t("analytics.col.client")}</th>
              <th className="text-right px-4 py-2.5">{t("analytics.col.price")}</th>
              <th className="text-left px-4 py-2.5">{t("analytics.col.status")}</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {visibleBookings.map((b) => (
              <tr key={b.bookingId} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 font-mono text-xs whitespace-nowrap">{bookingRef(b.bookingId)}</td>
                <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">{b.dataFillimit} → {b.dataPerfundimit}</td>
                <td className="px-4 py-2.5 text-slate-700 dark:text-slate-200 whitespace-nowrap">{b.car?.marka} {b.car?.modeli}</td>
                <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">{b.biznesi?.emri}</td>
                <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">{b.klienti?.emri} {b.klienti?.mbiemri}</td>
                <td className="px-4 py-2.5 text-right text-slate-900 dark:text-slate-100 font-semibold whitespace-nowrap">{b.cmimiTotal}€</td>
                <td className="px-4 py-2.5">
                  <StatusPill status={b.statusi} />
                  {b.statusi === "cancelled" && b.arsyejaRefuzimit && (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 max-w-[220px]" title={b.arsyejaRefuzimit}>{b.arsyejaRefuzimit}</p>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {(b.statusi === "pending" || b.statusi === "confirmed") && (
                    <button onClick={() => cancel(b.bookingId)} className="text-slate-400 hover:text-red-600 dark:hover:text-red-400"><X size={14} /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sm:hidden flex flex-col gap-3">
        {visibleBookings.map((b) => (
          <div key={b.bookingId} className="border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="min-w-0">
                <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{b.car?.marka} {b.car?.modeli}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{b.klienti?.emri} {b.klienti?.mbiemri} · {b.biznesi?.emri}</p>
              </div>
              <StatusPill status={b.statusi} />
            </div>
            <p className="text-xs font-mono text-slate-400">{bookingRef(b.bookingId)}</p>
            {b.statusi === "cancelled" && b.arsyejaRefuzimit && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{b.arsyejaRefuzimit}</p>
            )}
            <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>{b.dataFillimit} → {b.dataPerfundimit}</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">{b.cmimiTotal}€</span>
            </div>
            {(b.statusi === "pending" || b.statusi === "confirmed") && (
              <button onClick={() => cancel(b.bookingId)} className="text-red-500 dark:text-red-400 text-xs font-semibold flex items-center gap-1 mt-2"><X size={13} /> {t("booking.cancel")}</button>
            )}
          </div>
        ))}
      </div>
      <Pager page={page} totalPages={totalPages} setPage={setPage} />
      </>
      )}
    </>
  );
}

export function AdminLogins({ token, showError, refreshKey }) {
  const { t, lang } = useLang();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  useEffect(() => { setPage(1); }, [pageSize]);

  useEffect(() => {
    setLoading(true);
    apiFetch(`/Analytics/admin/logins?page=${page}&pageSize=${pageSize}`, token)
      .then(setData)
      .catch((e) => showError && showError(e))
      .finally(() => setLoading(false));
  }, [token, page, pageSize, refreshKey]);

  if (loading && !data) return <p className="text-center text-sm text-slate-400 py-16">{t("common.loading")}</p>;
  if (!data) return null;

  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <div className="flex flex-col gap-4">
      <div className="border border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-900/20 rounded-2xl p-4 flex items-center gap-3">
        <ShieldAlert size={20} className="text-amber-700 dark:text-amber-400 shrink-0" />
        <p className="text-sm text-amber-800 dark:text-amber-300">{t("analytics.failedLoginsNotice", { count: data.failedLast24h })}</p>
      </div>

      <div className="flex justify-end"><PageSizeSelect value={pageSize} onChange={setPageSize} /></div>

      <div className="hidden sm:block border border-slate-200 dark:border-slate-700 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2.5">{t("analytics.col.date")}</th>
              <th className="text-left px-4 py-2.5">Email</th>
              <th className="text-left px-4 py-2.5">{t("analytics.col.ip")}</th>
              <th className="text-left px-4 py-2.5">{t("analytics.col.status")}</th>
            </tr>
          </thead>
          <tbody>
            {data.logs.map((l) => (
              <tr key={l.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">{new Date(l.dataHyrjes).toLocaleString(lang === "en" ? "en-GB" : "sq-AL")}</td>
                <td className="px-4 py-2.5 text-slate-700 dark:text-slate-200">{l.email}</td>
                <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 font-mono text-xs">{l.ipAddress || "-"}</td>
                <td className="px-4 py-2.5">
                  {l.sukses ? (
                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">{t("analytics.statusSuccess")}</span>
                  ) : (
                    <span className="text-[11px] font-semibold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-full">{t("analytics.loginFailed")}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sm:hidden flex flex-col gap-2">
        {data.logs.map((l) => (
          <div key={l.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-slate-700 dark:text-slate-200 truncate">{l.email}</p>
              {l.sukses ? (
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full shrink-0">{t("analytics.statusSuccess")}</span>
              ) : (
                <span className="text-[11px] font-semibold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-full shrink-0">{t("analytics.loginFailed")}</span>
              )}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
              <span>{new Date(l.dataHyrjes).toLocaleString(lang === "en" ? "en-GB" : "sq-AL")}</span>
              <span className="font-mono">{l.ipAddress || "-"}</span>
            </div>
          </div>
        ))}
      </div>

      <Pager page={page} totalPages={totalPages} setPage={setPage} />
    </div>
  );
}
