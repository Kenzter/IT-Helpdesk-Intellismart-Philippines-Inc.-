import { useEffect, useState } from "react";
import api, { errorMessage, type Stats, type Summary } from "../api/client";

const monthLabel = (m: string) => {
  const [y, mo] = m.split("-").map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString([], { month: "long", year: "numeric" });
};
const shortMonth = (m: string) => {
  const [y, mo] = m.split("-").map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString([], { month: "short" });
};

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`rounded-xl bg-gradient-to-br p-4 shadow-lg ${tone}`}>
      <p className="text-3xl font-extrabold">{value}</p>
      <p className="text-sm font-medium opacity-90">{label}</p>
    </div>
  );
}

function Bar({ label, value, pct, text, color }: { label: string; value: number; pct: number; text: string; color: string }) {
  return (
    <li>
      <div className="mb-1 flex justify-between gap-3 text-sm">
        <span>{label}</span>
        <span className="whitespace-nowrap font-semibold">{text}</span>
      </div>
      <div className="h-2.5 rounded-full bg-brand/10" role="img" aria-label={`${label}: ${text}`}>
        <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${value === 0 ? 0 : Math.max(pct, 2)}%` }} />
      </div>
    </li>
  );
}

function SummaryPanel({ s, emptyText }: { s: Summary; emptyText: string }) {
  if (s.total === 0) return <p className="card text-sm text-slate-500">{emptyText}</p>;
  const maxDept = Math.max(...s.departments.map((d) => d.count), 1);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Total tickets" value={s.total} tone="from-brand to-[#2f6bc9] text-white shadow-brand/30" />
        <Stat label="Open" value={s.open} tone="from-sky-200 to-blue-400 text-blue-900 shadow-blue-300/40" />
        <Stat label="In Progress" value={s.in_progress} tone="from-accent to-accent-dark text-white shadow-accent/30" />
        <Stat label="Resolved" value={s.resolved} tone="from-emerald-100 to-emerald-400 text-emerald-900 shadow-emerald-300/40" />
        <Stat label="Closed" value={s.closed} tone="from-slate-100 to-slate-400 text-slate-800 shadow-slate-300/40" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card">
          <h3 className="mb-4 font-semibold">Share by support category</h3>
          <ul className="space-y-3">
            {s.categories.map((c) => (
              <Bar key={c.name} label={c.name} value={c.count} pct={c.percent} text={`${c.percent}% (${c.count})`} color="bg-gradient-to-r from-brand to-[#3b82f6]" />
            ))}
          </ul>
        </section>
        <section className="card">
          <h3 className="mb-4 font-semibold">Support requests per department</h3>
          <ul className="max-h-96 space-y-3 overflow-y-auto pr-2">
            {s.departments.map((d) => (
              <Bar key={d.name} label={d.name} value={d.count} pct={(d.count / maxDept) * 100}
                   text={`${d.count} ${d.count === 1 ? "request" : "requests"}`} color="bg-gradient-to-r from-accent-bright to-accent" />
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [month, setMonth] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  // Refresh by itself every 30 seconds while this tab is visible.
  useEffect(() => {
    const id = setInterval(() => { if (document.visibilityState === "visible") setTick((t) => t + 1); }, 30000);
    return () => clearInterval(id);
  }, []);

  // Refresh dashboard when new ticket data is detected.
  useEffect(() => {
    const refreshDashboard = () => {
      setTick((t) => t + 1);
    };

    window.addEventListener("helpdesk:tickets-updated", refreshDashboard);

    return () => {
      window.removeEventListener("helpdesk:tickets-updated", refreshDashboard);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const params: { month?: string; year?: number } = {};
    if (month) params.month = month;
    if (year) params.year = Number(year);

    api.get<Stats>("/stats", { params })
      .then((r) => {
        if (cancelled) return;
        setStats(r.data);
        setError("");
        if (!month) setMonth(r.data.months[0]);
        if (!year) setYear(String(r.data.years[0]));
      })
      .catch((err) => { if (!cancelled) setError(errorMessage(err, "Could not load the dashboard.")); });
    return () => { cancelled = true; };
  }, [month, year, tick]);

  if (error && !stats) return <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>;
  if (!stats) return <p className="text-slate-500">Loading dashboard...</p>;

  const maxTrend = Math.max(...stats.trend.map((t) => t.count), 1);

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold text-brand">Dashboard</h1>

      <section aria-labelledby="monthly">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="monthly" className="text-xl font-semibold">Monthly breakdown</h2>
            <p className="text-sm text-slate-600">Pick a month, or click a bar below.</p>
          </div>
          <div>
            <label htmlFor="month" className="label">Month</label>
            <select id="month" className="input" value={month} onChange={(e) => setMonth(e.target.value)}>
              {stats.months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
            </select>
          </div>
        </div>
        {stats.monthly && (
          <SummaryPanel s={stats.monthly} emptyText={`No tickets were submitted in ${monthLabel(month)}.`} />
        )}

        <section aria-labelledby="trend" className="card mt-4">
          <h2 id="trend" className="mb-4 text-lg font-semibold">Tickets per month, last 12 months</h2>
          <div className="flex h-40 items-end gap-2">
            {stats.trend.map((t) => (
              <button key={t.month} onClick={() => setMonth(t.month)} title={`${monthLabel(t.month)}: ${t.count}`}
                      className="flex h-full flex-1 flex-col items-center justify-end gap-1 text-xs">
                <span className="font-semibold">{t.count}</span>
                <span className={`w-full rounded-t ${t.month === month ? "bg-gradient-to-t from-accent to-accent-bright" : "bg-gradient-to-t from-brand to-[#3b82f6] opacity-80 hover:opacity-100"}`}
                      style={{ height: `${(t.count / maxTrend) * 100}%`, minHeight: t.count ? 4 : 1 }} />
                <span className="text-slate-600">{shortMonth(t.month)}</span>
              </button>
            ))}
          </div>
        </section>
      </section>

      <section aria-labelledby="yearly">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="yearly" className="text-xl font-semibold">Yearly breakdown</h2>
            <p className="text-sm text-slate-600">Select a year to view its ticket summary.</p>
          </div>
          <div>
            <label htmlFor="year" className="label">Year</label>
            <select id="year" className="input" value={year} onChange={(e) => setYear(e.target.value)}>
              {stats.years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        {stats.yearly && (
          <SummaryPanel s={stats.yearly} emptyText={`No tickets were submitted in ${year}.`} />
        )}
      </section>

      <section aria-labelledby="overall">
        <h2 id="overall" className="mb-1 text-xl font-semibold">Overall summary</h2>
        <p className="mb-4 text-sm text-slate-600">Every ticket ever submitted.</p>
        <SummaryPanel s={stats.overall} emptyText="No tickets have been submitted yet." />
      </section>
    </div>
  );
}
