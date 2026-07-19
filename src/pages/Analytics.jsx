import { useState, useEffect } from "react";
import { Eye, Calendar as CalendarIcon, TrendingUp, Users as UsersIcon, Building2, Car as CarIcon, Clock, ShieldAlert } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { apiFetch } from "../api";

const MUAJT = ["Jan", "Shk", "Mar", "Pri", "Maj", "Qer", "Kor", "Gsh", "Sht", "Tet", "Nen", "Dhj"];
const entryLabel = (m) => (m.day ? `${m.day} ${MUAJT[m.month - 1]}` : `${MUAJT[m.month - 1]} ${m.year}`);

const PERIODS = [
  { key: "days:7", unit: "days", value: 7, label: "7 ditet e fundit" },
  { key: "days:14", unit: "days", value: 14, label: "14 ditet e fundit" },
  { key: "months:3", unit: "months", value: 3, label: "3 muajt e fundit" },
  { key: "months:6", unit: "months", value: 6, label: "6 muajt e fundit" },
  { key: "months:12", unit: "months", value: 12, label: "12 muajt e fundit" },
];
const DEFAULT_PERIOD = PERIODS.find((p) => p.key === "months:6");

function PeriodSelect({ period, setPeriod }) {
  return (
    <select
      value={period.key}
      onChange={(e) => setPeriod(PERIODS.find((p) => p.key === e.target.value) || DEFAULT_PERIOD)}
      className="text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800"
    >
      {PERIODS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
    </select>
  );
}

function periodQuery(period) {
  return period.unit === "days" ? { days: period.value } : { months: period.value };
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
        <Icon size={18} className="text-emerald-700 dark:text-emerald-400" />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-none truncate">{value}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</p>
      </div>
    </div>
  );
}

export function BusinessAnalytics({ token, showError, refreshKey, companyId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(DEFAULT_PERIOD);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams({ ...periodQuery(period), ...(companyId ? { companyId } : {}) }).toString();
    apiFetch(`/Analytics/business?${qs}`, token)
      .then(setData)
      .catch((e) => showError && showError(e))
      .finally(() => setLoading(false));
  }, [token, refreshKey, period, companyId]);

  if (loading && !data) return <p className="text-center text-sm text-slate-400 py-16">Duke ngarkuar...</p>;
  if (!data) return null;

  const monthly = data.monthly.map((m) => ({ label: entryLabel(m), rezervime: m.rezervime, teArdhura: Math.round(m.teArdhura) }));
  const viewsChart = data.viewsPerCar.map((v) => ({ makina: v.makina, shikime: v.shikime }));

  return (
    <div className={`flex flex-col gap-6 transition-opacity ${loading ? "opacity-50" : ""}`}>
      <div className="flex justify-end">
        <PeriodSelect period={period} setPeriod={setPeriod} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Eye} label="Shikime gjithsej" value={data.totals.totalViews} />
        <StatCard icon={CalendarIcon} label="Rezervime gjithsej" value={data.totals.totalBookings} />
        <StatCard icon={TrendingUp} label="Te ardhura gjithsej" value={`${data.totals.totalRevenue.toFixed(2)}€`} />
      </div>

      <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-4">Shikimet per makine</h3>
        {viewsChart.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">Ende s'ka shikime te regjistruara.</p>
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
        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-4">Rezervime & te ardhura</h3>
        {monthly.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">Ende s'ka te dhena.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="rezervime" stroke="#047857" strokeWidth={2} name="Rezervime" />
              <Line type="monotone" dataKey="teArdhura" stroke="#1e3a8a" strokeWidth={2} name="Te ardhura (€)" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

const METRICS = [
  { key: "users", label: "Perdorues", color: "#047857" },
  { key: "companies", label: "Biznese", color: "#1e3a8a" },
  { key: "cars", label: "Makina", color: "#b45309" },
  { key: "bookings", label: "Rezervime", color: "#7c3aed" },
  { key: "verifications", label: "Kerkesa verifikimi", color: "#be185d" },
];

export function AdminAnalytics({ token, showError, refreshKey }) {
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

  if (loading && !data) return <p className="text-center text-sm text-slate-400 py-16">Duke ngarkuar...</p>;
  if (!data) return null;

  const activeMetric = METRICS.find((m) => m.key === metric) || METRICS[0];
  const series = (data.series?.[metric] || []).map((m) => ({ label: entryLabel(m), count: m.count }));

  return (
    <div className={`flex flex-col gap-6 transition-opacity ${loading ? "opacity-50" : ""}`}>
      <div className="flex justify-end">
        <PeriodSelect period={period} setPeriod={setPeriod} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard icon={UsersIcon} label="Perdorues" value={data.totals.totalUsers} />
        <StatCard icon={Building2} label="Biznese" value={data.totals.totalCompanies} />
        <StatCard icon={CarIcon} label="Makina" value={data.totals.totalCars} />
        <StatCard icon={CalendarIcon} label="Rezervime" value={data.totals.totalBookings} />
        <StatCard icon={Clock} label="Ne pritje verifikimi" value={data.totals.pendingVerifications} />
      </div>

      <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4 gap-2">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Rritja</h3>
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
            className="text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800"
          >
            {METRICS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
        </div>
        {series.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">Ende s'ka te dhena te mjaftueshme.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke={activeMetric.color} strokeWidth={2} name={activeMetric.label} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-4">Top 5 biznese sipas rezervimeve</h3>
        {data.topCompanies.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">Ende s'ka rezervime.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {data.topCompanies.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-sm border-b border-slate-50 dark:border-slate-800 last:border-0 py-2">
                <span className="text-slate-700 dark:text-slate-300">{i + 1}. {c.emri}</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{c.rezervime} rezervime</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-4">Statistikat e nje biznesi specifik</h3>
        <select
          value={selectedCompanyId}
          onChange={(e) => setSelectedCompanyId(e.target.value)}
          className="text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 w-full sm:w-64 mb-4"
        >
          <option value="">Zgjidh nje biznes...</option>
          {companies.map((c) => <option key={c.companyId} value={c.companyId}>{c.emri}</option>)}
        </select>
        {selectedCompanyId && (
          <BusinessAnalytics token={token} showError={showError} companyId={selectedCompanyId} refreshKey={refreshKey} />
        )}
      </div>
    </div>
  );
}

export function AdminLogins({ token, showError, refreshKey }) {
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

  if (loading && !data) return <p className="text-center text-sm text-slate-400 py-16">Duke ngarkuar...</p>;
  if (!data) return null;

  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <div className="flex flex-col gap-4">
      <div className="border border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-900/20 rounded-2xl p-4 flex items-center gap-3">
        <ShieldAlert size={20} className="text-amber-700 dark:text-amber-400 shrink-0" />
        <p className="text-sm text-amber-800 dark:text-amber-300"><strong>{data.failedLast24h}</strong> tentativa te deshtuara hyrjeje ne 24 oret e fundit.</p>
      </div>

      <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2.5">Data</th>
              <th className="text-left px-4 py-2.5">Email</th>
              <th className="text-left px-4 py-2.5">IP</th>
              <th className="text-left px-4 py-2.5">Statusi</th>
            </tr>
          </thead>
          <tbody>
            {data.logs.map((l) => (
              <tr key={l.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">{new Date(l.dataHyrjes).toLocaleString("sq-AL")}</td>
                <td className="px-4 py-2.5 text-slate-700 dark:text-slate-200">{l.email}</td>
                <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 font-mono text-xs">{l.ipAddress || "-"}</td>
                <td className="px-4 py-2.5">
                  {l.sukses ? (
                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">Sukses</span>
                  ) : (
                    <span className="text-[11px] font-semibold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-full">Deshtoi</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 disabled:text-slate-300 dark:disabled:text-slate-600">Prapa</button>
          <span className="text-xs text-slate-500 dark:text-slate-400">{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 disabled:text-slate-300 dark:disabled:text-slate-600">Perpara</button>
        </div>
      )}
    </div>
  );
}
