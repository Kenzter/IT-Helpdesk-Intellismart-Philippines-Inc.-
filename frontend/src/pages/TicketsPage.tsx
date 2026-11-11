import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api, { errorMessage, hasStaffAccess, requesterName, type Status, type Ticket } from "../api/client";
import { useAuth } from "../App";
import { CATEGORIES, DEPARTMENTS } from "../constants";
import StatusBadge from "../components/StatusBadge";
<<<<<<< HEAD
import PriorityBadge from "../components/PriorityBadge";
import PriorityLegend from "../components/PriorityLegend";
=======
>>>>>>> 8ea02deb3a1965e435a46fafed7de5339cfc65fe

const TABS: { key: "ALL" | Status; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "OPEN", label: "Open" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "RESOLVED", label: "Resolved" },
  { key: "CLOSED", label: "Closed" },
];

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString([], { dateStyle: "medium" });

<<<<<<< HEAD
// Month filter: a key like "2026-11" means tickets submitted in November 2026 (in the viewer's local time).
const monthKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const monthLabel = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString([], { month: "long", year: "numeric" });
};

=======
>>>>>>> 8ea02deb3a1965e435a46fafed7de5339cfc65fe
export default function TicketsPage() {
  const { user } = useAuth();
  const isStaff = hasStaffAccess(user);
  const canDelete = user?.role === "ADMIN"; // IT assistants cannot delete
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const requested = params.get("tab");
  const tab = TABS.some((t) => t.key === requested) ? (requested as "ALL" | Status) : "ALL";

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [department, setDepartment] = useState("");
<<<<<<< HEAD
  const [month, setMonth] = useState(""); // "" = all months, otherwise "YYYY-MM"
=======
>>>>>>> 8ea02deb3a1965e435a46fafed7de5339cfc65fe
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setQuery(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Refresh by itself every 30 seconds while this tab is visible.
  const [tick, setTick] = useState(0);
  const silentRef = useRef(false);
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") { silentRef.current = true; setTick((t) => t + 1); }
    }, 30000);
    return () => clearInterval(id);
  }, []);

    // Refresh ticket list when new ticket data is detected.

  // Refresh silently when new ticket data is detected.
  useEffect(() => {
    const refreshTickets = () => {
      silentRef.current = true;
      setTick((t) => t + 1);
    };

    window.addEventListener("helpdesk:tickets-updated", refreshTickets);

    return () => {
      window.removeEventListener("helpdesk:tickets-updated", refreshTickets);
    };
  }, []);


  useEffect(() => {
    let cancelled = false;
    const silent = silentRef.current;
    silentRef.current = false;
    if (!silent) { setLoading(true); setError(""); }
    const p: Record<string, string> = {};
    if (query) p.q = query;
    if (category) p.category = category;
    if (department) p.department = department;
    api.get<Ticket[]>("/tickets", { params: p })
      .then((res) => { if (!cancelled) setTickets(res.data); })
      .catch((err) => { if (!cancelled && !silent) setError(errorMessage(err, "Could not load tickets.")); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isStaff, query, category, department, tick]);

  // Admin-only: select Resolved tickets and delete them for good.
  const [selected, setSelected] = useState<number[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => { setSelected([]); setConfirming(false); }, [tab]);

  const [mine, setMine] = useState(false); // staff: show only tickets assigned to me
  const myActive = tickets.filter((t) => t.assigned_to_id === user?.id && (t.status === "OPEN" || t.status === "IN_PROGRESS")).length;
<<<<<<< HEAD
    // Months that have tickets, newest first (the chosen month always stays in the list).
  const monthOptions = Array.from(new Set([...tickets.map((t) => monthKey(t.created_at)), ...(month ? [month] : [])])).sort().reverse();
  const inMonth = (t: Ticket) => !month || monthKey(t.created_at) === month;
  const base = (mine ? tickets.filter((t) => t.assigned_to_id === user?.id) : tickets).filter(inMonth);
=======
  const base = mine ? tickets.filter((t) => t.assigned_to_id === user?.id) : tickets;
>>>>>>> 8ea02deb3a1965e435a46fafed7de5339cfc65fe
  const count = (k: "ALL" | Status) => (k === "ALL" ? base.length : base.filter((t) => t.status === k).length);
  const shown = tab === "ALL" ? base : base.filter((t) => t.status === tab);
  const canSelect = canDelete && tab === "RESOLVED";
  const selectedShown = selected.filter((id) => shown.some((t) => t.id === id));
  const allSelected = shown.length > 0 && selectedShown.length === shown.length;
  const toggle = (id: number) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const deleteSelected = async () => {
    setDeleting(true);
    setError("");
    try {
      await api.post("/tickets/bulk-delete", { ids: selectedShown });
      setSelected([]);
      setConfirming(false);
      setTick((t) => t + 1);
    } catch (err) {
      setError(errorMessage(err, "Could not delete the tickets."));
    } finally {
      setDeleting(false);
    }
  };
<<<<<<< HEAD
  const hasFilters = Boolean(query || category || department || month);
  const clear = () => { setSearch(""); setQuery(""); setCategory(""); setDepartment(""); setMonth(""); };
  const cols = ["ID", "Title", "Priority", "Category", "Department", "Status", "Employee", "Assigned to", "Submitted"];
=======
  const hasFilters = Boolean(query || category || department);
  const clear = () => { setSearch(""); setQuery(""); setCategory(""); setDepartment(""); };
  const cols = ["ID", "Title", "Category", "Department", "Status", "Employee", "Assigned to", "Submitted"];
>>>>>>> 8ea02deb3a1965e435a46fafed7de5339cfc65fe

  const colCount = cols.length + (canSelect ? 1 : 0);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-brand">Tickets</h1>
        {isStaff && (
          <button aria-pressed={mine} onClick={() => setMine((m) => !m)}
                  className={`btn border ${mine ? "border-accent-bright bg-accent-soft text-accent-dark" : "border-brand/25 bg-white/60 text-brand-dark hover:bg-white"}`}>
            Assigned to me
            <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-bold ${myActive > 0 ? "bg-accent-bright text-white" : "bg-slate-100 text-slate-600"}`}>{myActive}</span>
          </button>
        )}
      </div>

      <div role="tablist" aria-label="Ticket status" className="mb-4 flex flex-wrap gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key}
                  onClick={() => setParams(t.key === "ALL" ? {} : { tab: t.key })}
                  className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold ${tab === t.key ? "border-accent-bright text-accent" : "border-transparent text-slate-600 hover:text-brand"}`}>
            {t.label} <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{count(t.key)}</span>
          </button>
        ))}
      </div>

<<<<<<< HEAD
      <div className={`mb-4 grid gap-3 ${isStaff ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2"}`}>
=======
      <div className={`mb-4 grid gap-3 ${isStaff ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
>>>>>>> 8ea02deb3a1965e435a46fafed7de5339cfc65fe
        <input aria-label="Search tickets" placeholder="Search by ID, title or description" className="input"
               value={search} onChange={(e) => setSearch(e.target.value)} />
        <select aria-label="Filter by category" className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        {isStaff && (
          <select aria-label="Filter by department" className="input" value={department} onChange={(e) => setDepartment(e.target.value)}>
            <option value="">All departments</option>
            {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
          </select>
        )}
<<<<<<< HEAD
        
        <select aria-label="Filter by month and year" className="input" value={month} onChange={(e) => setMonth(e.target.value)}>
         <option value="">All months</option>
         {monthOptions.map((k) => <option key={k} value={k}>{monthLabel(k)}</option>)}
        </select>

=======
>>>>>>> 8ea02deb3a1965e435a46fafed7de5339cfc65fe
      </div>

      {error && <p role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {canSelect && selectedShown.length > 0 && (
        <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm">
          {confirming ? (
            <>
              <span className="font-medium text-red-800">
                Permanently delete {selectedShown.length} {selectedShown.length === 1 ? "ticket" : "tickets"} and their comments? This cannot be undone.
              </span>
              <span className="flex gap-2">
                <button className="btn bg-red-700 text-white hover:bg-red-800" disabled={deleting} onClick={deleteSelected}>
                  {deleting ? "Deleting..." : "Yes, delete"}
                </button>
                <button className="btn-ghost" disabled={deleting} onClick={() => setConfirming(false)}>Cancel</button>
              </span>
            </>
          ) : (
            <>
              <span className="font-medium text-red-800">{selectedShown.length} selected</span>
              <button className="btn bg-red-700 text-white hover:bg-red-800" onClick={() => setConfirming(true)}>
                Delete selected
              </button>
            </>
          )}
        </div>
      )}

<<<<<<< HEAD
      <div className="mb-3 flex justify-end"><PriorityLegend /></div>

=======
>>>>>>> 8ea02deb3a1965e435a46fafed7de5339cfc65fe
      <div className="table-wrap">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="table-head">
            <tr>
              {canSelect && (
                <th scope="col" className="w-10 px-4 py-3">
                  <input type="checkbox" aria-label="Select all resolved tickets" checked={allSelected}
                         onChange={() => setSelected(allSelected ? [] : shown.map((t) => t.id))} />
                </th>
              )}
              {cols.map((h) => <th key={h} scope="col" className="px-4 py-3">{h}</th>)}
<<<<<<< HEAD
              
=======
>>>>>>> 8ea02deb3a1965e435a46fafed7de5339cfc65fe
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && <tr><td colSpan={colCount} className="px-4 py-10 text-center text-slate-500">Loading tickets...</td></tr>}
            {!loading && shown.length === 0 && (
              <tr>
                <td colSpan={colCount} className="px-4 py-10 text-center text-slate-500">
                  {mine ? (
                    <>No tickets assigned to you here. <button className="font-semibold text-brand underline" onClick={() => setMine(false)}>Show all tickets</button></>
                  ) : hasFilters ? (
                    <>No tickets match these filters. <button className="font-semibold text-brand underline" onClick={clear}>Clear filters</button></>
                  ) : tab !== "ALL" ? (
                    <>No {TABS.find((t) => t.key === tab)?.label.toLowerCase()} tickets.</>
                  ) : (
                    <>No tickets have been submitted yet.</>
                  )}
                </td>
              </tr>
            )}
            {!loading && shown.map((t) => (
              <tr key={t.id} className="cursor-pointer hover:bg-accent-bright/25" onClick={() => navigate(`/tickets/${t.id}`)}>
                {canSelect && (
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" aria-label={`Select ticket ${t.id}`} checked={selected.includes(t.id)} onChange={() => toggle(t.id)} />
                  </td>
                )}
                <td className="px-4 py-3 font-medium text-slate-500">#{t.id}</td>
                <td className="max-w-xs px-4 py-3">
                  <Link to={`/tickets/${t.id}`} className="font-semibold text-brand hover:underline" onClick={(e) => e.stopPropagation()}>{t.title}</Link>
                </td>
<<<<<<< HEAD
                <td className="px-4 py-3"><PriorityBadge level={t.priority_level} /></td>
=======
>>>>>>> 8ea02deb3a1965e435a46fafed7de5339cfc65fe
                <td className="px-4 py-3">{t.category}</td>
                <td className="px-4 py-3">{t.department ?? <span className="text-slate-400">-</span>}</td>
                <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                <td className="px-4 py-3">{requesterName(t)}</td>
                <td className="px-4 py-3">
                  {t.assigned_to ? (
                    <>
                      {t.assigned_to.full_name}
                      {t.assigned_to_id === user?.id && (
                        <span className="ml-2 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent-dark">You</span>
                      )}
                    </>
                  ) : <span className="text-slate-400">Unassigned</span>}
                </td>
<<<<<<< HEAD
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{fmtDate(t.created_at)}</td>    
=======
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{fmtDate(t.created_at)}</td>
>>>>>>> 8ea02deb3a1965e435a46fafed7de5339cfc65fe
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
