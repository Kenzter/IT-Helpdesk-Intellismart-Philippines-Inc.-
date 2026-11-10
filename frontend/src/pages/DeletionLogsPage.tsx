import { useEffect, useState } from "react";
import { errorMessage, fetchDeletionLogs, type TicketDeletionLog } from "../api/client";
import StatusBadge from "../components/StatusBadge";

const fmt = (iso: string) => new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

export default function DeletionLogsPage() {
  const [logs, setLogs] = useState<TicketDeletionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewing, setViewing] = useState<TicketDeletionLog | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchDeletionLogs()
      .then((data) => { if (!cancelled) setLogs(data); })
      .catch((err) => { if (!cancelled) setError(errorMessage(err, "Could not load the deletion logs.")); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Escape closes the details window.
  useEffect(() => {
    if (!viewing) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setViewing(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewing]);

  const cols = ["Ticket ID", "Ticket Title", "Requester", "Category", "Department", "Previous Status", "Deleted By", "Date Deleted", "Action"];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-brand">Deletion Logs</h1>
      </div>

      {error && <p role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="table-wrap">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="table-head">
            <tr>{cols.map((h) => <th key={h} scope="col" className="px-4 py-3">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && <tr><td colSpan={cols.length} className="px-4 py-10 text-center text-slate-500">Loading deletion logs...</td></tr>}
            {!loading && logs.length === 0 && (
              <tr><td colSpan={cols.length} className="px-4 py-10 text-center text-slate-500">No tickets have been deleted yet.</td></tr>
            )}
            {!loading && logs.map((l) => (
              <tr key={l.id} className="hover:bg-accent-bright/25">
                <td className="px-4 py-3 font-medium text-slate-500">#{l.original_ticket_id}</td>
                <td className="max-w-xs px-4 py-3 font-semibold text-brand">{l.ticket_title}</td>
                <td className="px-4 py-3">{l.requester_name ?? "Unknown"}</td>
                <td className="px-4 py-3">{l.ticket_category}</td>
                <td className="px-4 py-3">{l.ticket_department ?? <span className="text-slate-400">-</span>}</td>
                <td className="px-4 py-3"><StatusBadge status={l.ticket_status} /></td>
                <td className="px-4 py-3">{l.deleted_by_name}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{fmt(l.deleted_at)}</td>
                <td className="px-4 py-3">
                  <button className="font-semibold text-brand underline" onClick={() => setViewing(l)}>View Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
             role="dialog" aria-modal="true" aria-labelledby="deleted-ticket-title" onClick={() => setViewing(null)}>
          <div className="card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-medium text-slate-500">Deleted ticket #{viewing.original_ticket_id}</p>
            <h2 id="deleted-ticket-title" className="mt-1 text-2xl font-bold">{viewing.ticket_title}</h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={viewing.ticket_status} />
              <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand-dark">{viewing.ticket_category}</span>
              {viewing.ticket_department && (
                <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent-dark">{viewing.ticket_department}</span>
              )}
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{viewing.ticket_description}</p>

            <dl className="mt-5 space-y-1 border-t border-slate-200 pt-4 text-xs text-slate-500">
              <div>Submitted by <span className="font-semibold text-slate-700">{viewing.requester_name ?? "Unknown"}</span>
                {viewing.ticket_created_at && <> on {fmt(viewing.ticket_created_at)}</>}</div>
              <div>Assigned technician: <span className="font-semibold text-slate-700">{viewing.assigned_to_name ?? "Unassigned"}</span></div>
              <div>Previous status: <span className="font-semibold text-slate-700">{viewing.ticket_status.replace("_", " ")}</span></div>
              <div>Deleted by <span className="font-semibold text-slate-700">{viewing.deleted_by_name}</span> on {fmt(viewing.deleted_at)}</div>
            </dl>

            <div className="mt-5 flex justify-end">
              <button autoFocus className="btn-primary" onClick={() => setViewing(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
