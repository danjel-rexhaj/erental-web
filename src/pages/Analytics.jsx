import { useState, useEffect } from "react";
import { Eye, Calendar as CalendarIcon, TrendingUp, Users as UsersIcon, Building2, Car as CarIcon, Clock, ShieldAlert, Receipt, Pencil, X, Check, Wallet, ChevronLeft, Trash2 } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { apiFetch } from "../api";
import { inputClass, StatusPill, PrimaryButton, GhostButton } from "../components";
import { useLang } from "../useLang";
import { monthShort, formatLocaleDate } from "../dateFormat";
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

  return (
    <div className={`flex flex-col gap-6 transition-opacity ${loading ? "opacity-50" : ""}`}>
      <div className="flex justify-end">
        <PeriodSelect period={period} setPeriod={setPeriod} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Eye} label={t("analytics.totalViews")} value={data.totals.totalViews} active={showViews} onClick={() => setShowViews((s) => !s)} />
        <StatCard icon={CalendarIcon} label={t("analytics.totalBookings")} value={data.totals.totalBookings} onClick={onGoBookings} />
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

      <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-4">{t("analytics.viewsPerCar")}</h3>
        {viewsChart.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">{t("analytics.noViewsYet")}</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={viewsChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="makina" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="shikime" fill="#047857" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
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

// Full-page view reached only by clicking the revenue StatCard — pulled out of the dashboard
// (used to be an inline section at the bottom, requiring a scroll past everything else) so
// reviewing transactions reads as its own task instead of digging through the whole dashboard.
// Same billing-window sizes as the dashboard's own PeriodSelect (days:7/14, months:3/6/12) —
// reused here so "pick a period" always means the same thing across the whole analytics area.
function periodCutoffDate(period) {
  const d = new Date();
  if (period.unit === "days") d.setDate(d.getDate() - period.value);
  else d.setMonth(d.getMonth() - period.value);
  return d;
}

function toCsvValue(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function TransactionsPage({ token, showError, admin, businessName, onBack }) {
  const { t, lang } = useLang();
  const [payments, setPayments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(DEFAULT_PERIOD);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiFetch(admin ? "/Payments/admin" : "/Payments/my-company", token)
      .then(setPayments)
      .catch((e) => showError && showError(e))
      .finally(() => setLoading(false));
  }, [token, admin]);

  const cutoff = periodCutoffDate(period);
  const filtered = (payments || []).filter((p) => p.dataPageses && new Date(p.dataPageses) >= cutoff);

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
      await generateStatementPdf({ payments: filtered, admin, periodLabel: t(period.labelKey), businessName, lang });
    } catch (e) { showError && showError(e); } finally { setDownloading(false); }
  }

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 mb-6"><ChevronLeft size={16} /> {t("common.back")}</button>
      <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
        <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
          <Receipt size={18} /> {admin ? t("analytics.platformTransactionsAllBusinesses") : t("analytics.transactions")}
        </h2>
        <PeriodSelect period={period} setPeriod={setPeriod} />
      </div>

      {loading && !payments ? (
        <p className="text-sm text-slate-400 text-center py-8">{t("common.loading")}</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">{t("analytics.noTransactionsYet")}</p>
      ) : (
        <>
          <div className="flex gap-2 mb-4">
            <GhostButton type="button" onClick={exportCsv} className="w-fit text-xs py-2 px-3.5">{t("analytics.exportCsv")}</GhostButton>
            <PrimaryButton type="button" onClick={downloadStatement} disabled={downloading} className="w-fit text-xs py-2 px-3.5">
              {downloading ? t("common.loading") : t("analytics.downloadStatement")}
            </PrimaryButton>
          </div>
          <TransactionsTable payments={filtered} admin={admin} />
        </>
      )}
    </div>
  );
}

const PAGE_SIZE = 15;

function TransactionsTable({ payments, admin = false }) {
  const { t, lang } = useLang();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const visible = payments.slice(0, visibleCount);

  return (
    <div>
      <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-x-auto">
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
              <td className="px-4 py-2.5">
                {p.statusi === "completed" ? (
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full whitespace-nowrap">{t("analytics.statusSuccess")}</span>
                ) : p.statusi === "refunded" ? (
                  <span className="text-[11px] font-semibold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-full whitespace-nowrap">{t("analytics.statusRefunded")}</span>
                ) : p.statusi === "refund_failed" ? (
                  <span className="text-[11px] font-semibold text-red-800 dark:text-red-200 bg-red-100 dark:bg-red-900/50 px-2 py-0.5 rounded-full whitespace-nowrap">{t("analytics.statusRefundFailed")}</span>
                ) : p.statusi === "not_refunded" ? (
                  <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full whitespace-nowrap">{t("analytics.statusNotRefunded")}</span>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full whitespace-nowrap">{p.statusi}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      {visibleCount < payments.length && (
        <button
          onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
          className="w-full text-center text-xs font-semibold text-sky-600 dark:text-emerald-400 hover:text-sky-700 dark:hover:text-emerald-300 mt-3"
        >
          {t("analytics.showMoreCount", { count: payments.length - visibleCount })}
        </button>
      )}
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

export function AdminAnalytics({ token, showError, showOk, refreshKey, onGoPending, onGoTransactions }) {
  const { t, lang } = useLang();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(DEFAULT_PERIOD);
  const [metric, setMetric] = useState("users");
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [activePanel, setActivePanel] = useState(null);

  function togglePanel(key) {
    setActivePanel((p) => (p === key ? null : key));
  }

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
        <StatCard icon={UsersIcon} label={t("analytics.metric.users")} value={data.totals.totalUsers} active={activePanel === "users"} onClick={() => togglePanel("users")} />
        <StatCard icon={Building2} label={t("analytics.metric.companies")} value={data.totals.totalCompanies} active={activePanel === "companies"} onClick={() => togglePanel("companies")} />
        <StatCard icon={CarIcon} label={t("analytics.metric.cars")} value={data.totals.totalCars} active={activePanel === "cars"} onClick={() => togglePanel("cars")} />
        <StatCard icon={CalendarIcon} label={t("analytics.metric.bookings")} value={data.totals.totalBookings} active={activePanel === "bookings"} onClick={() => togglePanel("bookings")} />
        <StatCard icon={Clock} label={t("analytics.pendingVerification")} value={data.totals.pendingVerifications} onClick={onGoPending} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <StatCard icon={TrendingUp} label={t("analytics.totalPlatformRevenue")} value={`${data.totals.totalPlatformRevenue.toFixed(2)}€`} onClick={onGoTransactions} />
        <StatCard icon={Wallet} label={t("analytics.ourProfit")} value={`${data.totals.totalPlatformProfit.toFixed(2)}€`} />
      </div>

      {activePanel === "users" && <AdminUsersPanel token={token} showError={showError} showOk={showOk} />}
      {activePanel === "companies" && <AdminCompaniesPanel token={token} showError={showError} showOk={showOk} />}
      {activePanel === "cars" && <AdminCarsPanel token={token} showError={showError} showOk={showOk} />}
      {activePanel === "bookings" && <AdminBookingsPanel token={token} showError={showError} showOk={showOk} />}

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
          <BusinessAnalytics token={token} showError={showError} companyId={selectedCompanyId} refreshKey={refreshKey} onGoTransactions={onGoTransactions} />
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

  useEffect(() => {
    apiFetch("/Users", token).then(setUsers).catch((e) => showError && showError(e));
  }, [token]);

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

  if (!users) return <p className="text-sm text-slate-400 text-center py-8">{t("common.loading")}</p>;

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-x-auto">
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
          {users.map((u) => (
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
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => startEdit(u)} className="text-slate-400 hover:text-sky-600 dark:hover:text-emerald-400"><Pencil size={13} /></button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdminCompaniesPanel({ token, showError, showOk }) {
  const { t } = useLang();
  const [companies, setCompanies] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => {
    apiFetch("/Companies", null).then(setCompanies).catch((e) => showError && showError(e));
  }, []);

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

  if (!companies) return <p className="text-sm text-slate-400 text-center py-8">{t("common.loading")}</p>;

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-x-auto">
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
          {companies.map((c) => (
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
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => startEdit(c)} className="text-slate-400 hover:text-sky-600 dark:hover:text-emerald-400"><Pencil size={13} /></button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdminCarsPanel({ token, showError, showOk }) {
  const { t } = useLang();
  const [cars, setCars] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => {
    apiFetch("/Cars", null).then(setCars).catch((e) => showError && showError(e));
  }, []);

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

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-x-auto">
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
          {cars.map((c) => (
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
  );
}

function AdminBookingsPanel({ token, showError, showOk }) {
  const { t } = useLang();
  const [bookings, setBookings] = useState(null);

  function load() {
    apiFetch("/Bookings/admin/all", token).then(setBookings).catch((e) => showError && showError(e));
  }

  useEffect(() => { load(); }, [token]);

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

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase">
          <tr>
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
          {bookings.map((b) => (
            <tr key={b.bookingId} className="border-t border-slate-100 dark:border-slate-800">
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
  );
}

export function AdminLogins({ token, showError, refreshKey }) {
  const { t, lang } = useLang();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    apiFetch(`/Analytics/admin/logins?page=${page}&pageSize=50`, token)
      .then(setData)
      .catch((e) => showError && showError(e))
      .finally(() => setLoading(false));
  }, [token, page, refreshKey]);

  if (loading && !data) return <p className="text-center text-sm text-slate-400 py-16">{t("common.loading")}</p>;
  if (!data) return null;

  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <div className="flex flex-col gap-4">
      <div className="border border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-900/20 rounded-2xl p-4 flex items-center gap-3">
        <ShieldAlert size={20} className="text-amber-700 dark:text-amber-400 shrink-0" />
        <p className="text-sm text-amber-800 dark:text-amber-300">{t("analytics.failedLoginsNotice", { count: data.failedLast24h })}</p>
      </div>

      <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-x-auto">
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

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="text-xs font-semibold text-sky-600 dark:text-emerald-400 disabled:text-slate-300 dark:disabled:text-slate-600">{t("analytics.back")}</button>
          <span className="text-xs text-slate-500 dark:text-slate-400">{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="text-xs font-semibold text-sky-600 dark:text-emerald-400 disabled:text-slate-300 dark:disabled:text-slate-600">{t("analytics.forward")}</button>
        </div>
      )}
    </div>
  );
}
