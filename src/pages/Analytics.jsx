import { useState, useEffect, useRef } from "react";
import { Eye, Calendar as CalendarIcon, TrendingUp, Users as UsersIcon, Building2, Car as CarIcon, Clock, ShieldAlert, Receipt, Pencil, X, Check, Wallet, ChevronDown } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { apiFetch } from "../api";
import { inputClass, StatusPill } from "../components";

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

function StatCard({ icon: Icon, label, value, onClick, active }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`border rounded-2xl p-4 flex items-center gap-3 text-left w-full ${
        active
          ? "border-emerald-400 dark:border-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/20"
          : "border-slate-200 dark:border-slate-700"
      } ${onClick ? "hover:border-emerald-300 dark:hover:border-emerald-600 transition cursor-pointer" : ""}`}
    >
      <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
        <Icon size={18} className="text-emerald-700 dark:text-emerald-400" />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-none truncate">{value}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</p>
      </div>
    </Tag>
  );
}

export function BusinessAnalytics({ token, showError, refreshKey, companyId, onGoBookings }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(DEFAULT_PERIOD);
  const [showViews, setShowViews] = useState(false);
  const transactionsRef = useRef(null);

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
        <StatCard icon={Eye} label="Shikime gjithsej" value={data.totals.totalViews} active={showViews} onClick={() => setShowViews((s) => !s)} />
        <StatCard icon={CalendarIcon} label="Rezervime gjithsej" value={data.totals.totalBookings} onClick={onGoBookings} />
        <StatCard icon={TrendingUp} label="Te ardhura gjithsej (pas komisionit)" value={`${data.totals.totalRevenue.toFixed(2)}€`} onClick={() => transactionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })} />
      </div>

      {showViews && (
        <div className="border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-3">Kush i ka pare me shume makinat</h3>
          {data.viewsPerCar.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">Ende s'ka shikime te regjistruara.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {data.viewsPerCar.map((v, i) => (
                <div key={v.carId} className="flex items-center justify-between text-sm border-b border-slate-50 dark:border-slate-800 last:border-0 py-1.5">
                  <span className="text-slate-700 dark:text-slate-300">{i + 1}. {v.makina}</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{v.shikime} shikime</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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

      <div ref={transactionsRef}>
        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-1.5"><Receipt size={15} /> Transaksionet</h3>
        <TransactionsTable token={token} showError={showError} />
      </div>
    </div>
  );
}

const PAGE_SIZE = 15;

function TransactionsTable({ token, showError, admin = false }) {
  const [payments, setPayments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setLoading(true);
    apiFetch(admin ? "/Payments/admin" : "/Payments/my-company", token)
      .then(setPayments)
      .catch((e) => showError && showError(e))
      .finally(() => setLoading(false));
  }, [token, admin]);

  if (loading && !payments) return <p className="text-sm text-slate-400 text-center py-8">Duke ngarkuar...</p>;
  if (!payments || payments.length === 0) return <p className="text-sm text-slate-400 text-center py-8">Ende s'ka transaksione.</p>;

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
      >
        <ChevronDown size={16} />
        Shfaq transaksionet ({payments.length})
      </button>
    );
  }

  const visible = payments.slice(0, visibleCount);

  return (
    <div>
      <button
        onClick={() => { setExpanded(false); setVisibleCount(PAGE_SIZE); }}
        className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 mb-3"
      >
        <ChevronDown size={16} className="rotate-180" />
        Fshih transaksionet ({payments.length})
      </button>
      <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase">
          <tr>
            <th className="text-left px-4 py-2.5">Data</th>
            <th className="text-left px-4 py-2.5">Referenca</th>
            <th className="text-left px-4 py-2.5">Klienti</th>
            <th className="text-left px-4 py-2.5">Makina</th>
            {admin && <th className="text-left px-4 py-2.5">Biznesi</th>}
            <th className="text-left px-4 py-2.5">Menyra</th>
            <th className="text-right px-4 py-2.5">Paguar</th>
            <th className="text-right px-4 py-2.5">Komisioni</th>
            <th className="text-right px-4 py-2.5">Neto biznesit</th>
            <th className="text-left px-4 py-2.5">Statusi</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((p) => (
            <tr key={p.paymentId} className="border-t border-slate-100 dark:border-slate-800">
              <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">{p.dataPageses ? new Date(p.dataPageses).toLocaleDateString("sq-AL") : "-"}</td>
              <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 font-mono text-xs">{p.paypalCaptureId ? `${p.paypalCaptureId.slice(0, 10)}…` : "-"}</td>
              <td className="px-4 py-2.5 text-slate-700 dark:text-slate-200 whitespace-nowrap">{p.klienti?.emri} {p.klienti?.mbiemri}</td>
              <td className="px-4 py-2.5 text-slate-700 dark:text-slate-200 whitespace-nowrap">{p.car?.marka} {p.car?.modeli}</td>
              {admin && <td className="px-4 py-2.5 text-slate-700 dark:text-slate-200 whitespace-nowrap">{p.biznesi?.emri}</td>}
              <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">{p.metodaPageses === "paypal_full" ? "E plote" : "Depozite"}</td>
              <td className="px-4 py-2.5 text-right text-slate-900 dark:text-slate-100 font-semibold whitespace-nowrap">{p.shumaPaguarOnline != null ? `${p.shumaPaguarOnline}€` : "-"}</td>
              <td className="px-4 py-2.5 text-right text-slate-500 dark:text-slate-400 whitespace-nowrap">{p.komisioni != null ? `${p.komisioni.toFixed(2)}€` : "-"}</td>
              <td className="px-4 py-2.5 text-right text-slate-900 dark:text-slate-100 font-semibold whitespace-nowrap">{p.shumaBiznesit != null ? `${p.shumaBiznesit.toFixed(2)}€` : "-"}</td>
              <td className="px-4 py-2.5">
                {p.statusi === "completed" ? (
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full whitespace-nowrap">Sukses</span>
                ) : p.statusi === "refunded" ? (
                  <span className="text-[11px] font-semibold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-full whitespace-nowrap">Rimbursuar</span>
                ) : p.statusi === "refund_failed" ? (
                  <span className="text-[11px] font-semibold text-red-800 dark:text-red-200 bg-red-100 dark:bg-red-900/50 px-2 py-0.5 rounded-full whitespace-nowrap">Rimbursimi dështoi</span>
                ) : p.statusi === "not_refunded" ? (
                  <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full whitespace-nowrap">Pa rimbursim</span>
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
          className="w-full text-center text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 mt-3"
        >
          Shfaq me shume ({payments.length - visibleCount} te tjera)
        </button>
      )}
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

export function AdminAnalytics({ token, showError, showOk, refreshKey, onGoPending }) {
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
        <StatCard icon={UsersIcon} label="Perdorues" value={data.totals.totalUsers} active={activePanel === "users"} onClick={() => togglePanel("users")} />
        <StatCard icon={Building2} label="Biznese" value={data.totals.totalCompanies} active={activePanel === "companies"} onClick={() => togglePanel("companies")} />
        <StatCard icon={CarIcon} label="Makina" value={data.totals.totalCars} active={activePanel === "cars"} onClick={() => togglePanel("cars")} />
        <StatCard icon={CalendarIcon} label="Rezervime" value={data.totals.totalBookings} active={activePanel === "bookings"} onClick={() => togglePanel("bookings")} />
        <StatCard icon={Clock} label="Ne pritje verifikimi" value={data.totals.pendingVerifications} onClick={onGoPending} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <StatCard icon={TrendingUp} label="Te ardhura komplet ne platforme" value={`${data.totals.totalPlatformRevenue.toFixed(2)}€`} />
        <StatCard icon={Wallet} label="Fitimi yne (komisioni 10%)" value={`${data.totals.totalPlatformProfit.toFixed(2)}€`} />
      </div>

      {activePanel === "users" && <AdminUsersPanel token={token} showError={showError} showOk={showOk} />}
      {activePanel === "companies" && <AdminCompaniesPanel token={token} showError={showError} showOk={showOk} />}
      {activePanel === "cars" && <AdminCarsPanel token={token} showError={showError} showOk={showOk} />}
      {activePanel === "bookings" && <AdminBookingsPanel token={token} showError={showError} showOk={showOk} />}

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
        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-1">Fitimet sipas biznesit</h3>
        <p className="text-xs text-slate-400 mb-4">Sa qera ka bere secili biznes gjithsej, dhe sa prej saj eshte fitimi yne (komisioni).</p>
        {(!data.companyBreakdown || data.companyBreakdown.length === 0) ? (
          <p className="text-sm text-slate-400 text-center py-4">Ende s'ka transaksione te perfunduara.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-500 dark:text-slate-400 text-xs uppercase">
                <tr>
                  <th className="text-left py-2">Biznesi</th>
                  <th className="text-right py-2">Qeraja gjithsej</th>
                  <th className="text-right py-2">Fitimi yne</th>
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

      <div>
        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-1.5"><Receipt size={15} /> Transaksionet e platformes (te gjitha bizneset)</h3>
        <TransactionsTable token={token} showError={showError} admin />
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

function AdminUsersPanel({ token, showError, showOk }) {
  const [users, setUsers] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => {
    apiFetch("/Users", token).then(setUsers).catch((e) => showError && showError(e));
  }, [token]);

  function startEdit(u) {
    setEditingId(u.userId);
    setForm({ emri: u.emri, mbiemri: u.mbiemri, telefoni: u.telefoni || "" });
  }

  async function save() {
    try {
      await apiFetch(`/Users/${editingId}`, token, { method: "PUT", body: JSON.stringify(form) });
      setUsers((list) => list.map((u) => (u.userId === editingId ? { ...u, ...form } : u)));
      setEditingId(null);
      showOk && showOk("Perdoruesi u perditesua.");
    } catch (e) { showError && showError(e); }
  }

  if (!users) return <p className="text-sm text-slate-400 text-center py-8">Duke ngarkuar...</p>;

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase">
          <tr>
            <th className="text-left px-4 py-2.5">Emri</th>
            <th className="text-left px-4 py-2.5">Email</th>
            <th className="text-left px-4 py-2.5">Telefoni</th>
            <th className="text-left px-4 py-2.5">Regjistruar</th>
            <th className="text-left px-4 py-2.5">Biznes</th>
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
                  <td className="px-4 py-2 text-slate-400 text-xs whitespace-nowrap">{u.email}</td>
                  <td className="px-4 py-2"><input className={inputClass + " text-xs py-1"} value={form.telefoni} onChange={(e) => setForm((f) => ({ ...f, telefoni: e.target.value }))} /></td>
                  <td className="px-4 py-2 text-slate-400 text-xs whitespace-nowrap">{u.dataRegjistrimit ? new Date(u.dataRegjistrimit).toLocaleDateString("sq-AL") : "-"}</td>
                  <td className="px-4 py-2 text-slate-400 text-xs">{u.hasCompany ? "Po" : "Jo"}</td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <button onClick={save} className="text-emerald-700 dark:text-emerald-400"><Check size={14} /></button>
                    <button onClick={() => setEditingId(null)} className="text-slate-400 ml-2"><X size={14} /></button>
                  </td>
                </>
              ) : (
                <>
                  <td className="px-4 py-2.5 text-slate-700 dark:text-slate-200 whitespace-nowrap">{u.emri} {u.mbiemri}</td>
                  <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">{u.email}</td>
                  <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">{u.telefoni || "-"}</td>
                  <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">{u.dataRegjistrimit ? new Date(u.dataRegjistrimit).toLocaleDateString("sq-AL") : "-"}</td>
                  <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-xs">{u.hasCompany ? "Po" : "Jo"}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => startEdit(u)} className="text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400"><Pencil size={13} /></button>
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
      showOk && showOk("Biznesi u perditesua.");
    } catch (e) { showError && showError(e); }
  }

  if (!companies) return <p className="text-sm text-slate-400 text-center py-8">Duke ngarkuar...</p>;

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase">
          <tr>
            <th className="text-left px-4 py-2.5">Emri</th>
            <th className="text-left px-4 py-2.5">Qyteti</th>
            <th className="text-left px-4 py-2.5">Telefoni</th>
            <th className="text-left px-4 py-2.5">Statusi</th>
            <th className="text-left px-4 py-2.5">Verifikuar</th>
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
                  <td className="px-4 py-2 text-slate-400 text-xs">{c.eshteVerifikuar ? "Po" : "Jo"}</td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <button onClick={save} className="text-emerald-700 dark:text-emerald-400"><Check size={14} /></button>
                    <button onClick={() => setEditingId(null)} className="text-slate-400 ml-2"><X size={14} /></button>
                  </td>
                </>
              ) : (
                <>
                  <td className="px-4 py-2.5 text-slate-700 dark:text-slate-200 whitespace-nowrap">{c.emri}</td>
                  <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-xs">{c.qyteti || "-"}</td>
                  <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">{c.telefoni || "-"}</td>
                  <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-xs">{c.statusi}</td>
                  <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-xs">{c.eshteVerifikuar ? "Po" : "Jo"}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => startEdit(c)} className="text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400"><Pencil size={13} /></button>
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
      showOk && showOk("Makina u perditesua.");
    } catch (e) { showError && showError(e); }
  }

  if (!cars) return <p className="text-sm text-slate-400 text-center py-8">Duke ngarkuar...</p>;

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase">
          <tr>
            <th className="text-left px-4 py-2.5">Makina</th>
            <th className="text-left px-4 py-2.5">Targa</th>
            <th className="text-left px-4 py-2.5">Biznesi</th>
            <th className="text-left px-4 py-2.5">Cmimi/dite</th>
            <th className="text-left px-4 py-2.5">Statusi</th>
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
                    <button onClick={save} className="text-emerald-700 dark:text-emerald-400"><Check size={14} /></button>
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
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => startEdit(c)} className="text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400"><Pencil size={13} /></button>
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
  const [bookings, setBookings] = useState(null);

  function load() {
    apiFetch("/Bookings/admin/all", token).then(setBookings).catch((e) => showError && showError(e));
  }

  useEffect(() => { load(); }, [token]);

  async function cancel(id) {
    const reason = window.prompt("Arsyeja e anulimit (admin):");
    if (!reason) return;
    try {
      await apiFetch(`/Bookings/${id}/cancel`, token, { method: "PUT", body: JSON.stringify({ reason }) });
      showOk && showOk("Rezervimi u anulua.");
      load();
    } catch (e) { showError && showError(e); }
  }

  if (!bookings) return <p className="text-sm text-slate-400 text-center py-8">Duke ngarkuar...</p>;
  if (bookings.length === 0) return <p className="text-sm text-slate-400 text-center py-8">Ende s'ka rezervime.</p>;

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase">
          <tr>
            <th className="text-left px-4 py-2.5">Data</th>
            <th className="text-left px-4 py-2.5">Makina</th>
            <th className="text-left px-4 py-2.5">Biznesi</th>
            <th className="text-left px-4 py-2.5">Klienti</th>
            <th className="text-right px-4 py-2.5">Cmimi</th>
            <th className="text-left px-4 py-2.5">Statusi</th>
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
              <td className="px-4 py-2.5"><StatusPill status={b.statusi} /></td>
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
