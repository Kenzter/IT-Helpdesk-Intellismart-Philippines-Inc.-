import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api, { errorMessage, hasStaffAccess, requesterName, type Status, type TicketDetail, type User } from "../api/client";
import { useAuth } from "../App";
import StatusBadge from "../components/StatusBadge";
import PriorityBadge, { PRIORITIES } from "../components/PriorityBadge";
import { CATEGORIES, DEPARTMENTS } from "../constants";

const fmt = (iso: string) => new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isStaff = hasStaffAccess(user);
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [agents, setAgents] = useState<User[]>([]);
  const [techId, setTechId] = useState<string | null>(null); // null = admin has not changed the dropdown
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editingInfo, setEditingInfo] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDepartment, setEditDepartment] = useState("");

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<TicketDetail>(`/tickets/${id}`);
      setTicket(data);
    } catch (err) {
      setError(errorMessage(err, "Ticket not found."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Pick up new comments and status changes every 30 seconds while this tab is visible.
  useEffect(() => {
    if (busy) return;
    const timer = setInterval(() => { if (document.visibilityState === "visible") load(); }, 30000);
    return () => clearInterval(timer);
  }, [load, busy]);

  useEffect(() => {
    if (isStaff) api.get<User[]>("/users", { params: { staff: true } }).then((r) => setAgents(r.data)).catch(() => {});
  }, [isStaff]);

  const sendPatch = async (body: { status?: Status; assigned_to_id?: number | null }) => {
    if (Object.keys(body).length) await api.patch(`/tickets/${id}`, body);
  };

  // Edit only the employee-submitted ticket information. Agent controls remain separate.
  const startEditingInfo = () => {
    setEditTitle(ticket!.title);
    setEditDescription(ticket!.description);
    setEditCategory(ticket!.category);
    setEditDepartment(ticket!.department ?? "");
    setEditingInfo(true);
  };

  const saveTicketInfo = async (e: FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim() || !editDescription.trim() || !editCategory) return;
    setError("");
    setBusy(true);
    try {
      await api.patch(`/tickets/${id}`, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        category: editCategory,
        department: editDepartment || null,
      });
      setEditingInfo(false);
      await load();
      window.dispatchEvent(new Event("helpdesk:tickets-updated"));
    } catch (err) {
      setError(errorMessage(err, "Could not update the ticket information."));
    } finally {
      setBusy(false);
    }
  };

  // Everything the admin has chosen but not saved yet.
  const pendingBody = (t: TicketDetail) => {
    const body: { status?: Status; assigned_to_id?: number | null } = {};
    const chosen = techId ?? String(t.assigned_to_id ?? "");
    const newId = chosen ? Number(chosen) : null;
    if (newId !== t.assigned_to_id) body.assigned_to_id = newId;
    if (newId && t.status === "OPEN") body.status = "IN_PROGRESS"; // assigning a technician starts the work
    return body;
  };

  const run = async (action: () => Promise<void>, fallback: string) => {
    setError("");
    setBusy(true);
    try { await action(); } catch (err) { setError(errorMessage(err, fallback)); setBusy(false); }
  };

  // Done: save the technician, then go back to the Tickets list.
  const done = () => run(async () => {
    await sendPatch(pendingBody(ticket!));
    navigate("/tickets");
  }, "Could not save the assignment.");

  // Resolved: mark resolved, then jump to the Resolved tab.
  const resolve = () => run(async () => {
    await sendPatch({ ...pendingBody(ticket!), status: "RESOLVED" });
    navigate("/tickets?tab=RESOLVED");
  }, "Could not mark the ticket as resolved.");

  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteTicket = () => run(async () => {
    await api.delete(`/tickets/${id}`);
    navigate("/tickets?tab=RESOLVED");
  }, "Could not delete the ticket.");

  const changeStatus = async (status: Status) => {
    setError("");
    setBusy(true);
    try { await sendPatch({ status }); await load(); }
    catch (err) { setError(errorMessage(err, "Could not update the status.")); }
    finally { setBusy(false); }
  };

  // Staff choose the priority level (P1-P4). Saves right away, like "Change status".
  const changePriority = async (value: string) => {
    setError("");
    setBusy(true);
    try { await api.patch(`/tickets/${id}`, { priority_level: value || null }); await load(); }
    catch (err) { setError(errorMessage(err, "Could not update the priority.")); }
    finally { setBusy(false); }
  };

  const addComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setError("");
    setBusy(true);
    try {
      await api.post(`/tickets/${id}/comments`, { content: comment.trim(), is_internal: false });
      setComment("");
      await load();
    } catch (err) {
      setError(errorMessage(err, "Could not post your comment."));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="text-slate-500">Loading ticket...</p>;
  if (!ticket) {
    return (
      <div>
        <p role="alert" className="mb-3 text-red-700">{error || "Ticket not found."}</p>
        <Link to="/" className="font-semibold text-brand underline">Back to tickets</Link>
      </div>
    );
  }

  const backTo = isStaff ? "/tickets" : "/";
  const selectedTech = techId ?? String(ticket.assigned_to_id ?? "");
  const finished = ticket.status === "RESOLVED" || ticket.status === "CLOSED";

  return (
    <div>
      <Link to={backTo} className="mb-4 inline-block text-sm font-semibold text-brand hover:underline">Back to tickets</Link>
      {error && <p role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className={`grid gap-6 ${isStaff ? "lg:grid-cols-[1fr_320px]" : ""}`}>
        <div className="space-y-6">
          <section className="card p-6">
            <p className="text-sm font-medium text-slate-500">Ticket #{ticket.id}</p>

            {editingInfo ? (
              <form onSubmit={saveTicketInfo} className="mt-4 space-y-4">
                <div>
                  <label htmlFor="edit-ticket-title" className="label">Ticket Title</label>
                  <input id="edit-ticket-title" className="input" maxLength={255} required
                         value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="edit-ticket-description" className="label">Description / Reported Problem</label>
                  <textarea id="edit-ticket-description" className="input" rows={5} maxLength={5000} required
                            value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="edit-ticket-category" className="label">Support Category</label>
                  <select id="edit-ticket-category" className="input" required value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}>
                    <option value="">Select category</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="edit-ticket-department" className="label">Department</label>
                  <select id="edit-ticket-department" className="input" value={editDepartment}
                          onChange={(e) => setEditDepartment(e.target.value)}>
                    <option value="">Not specified</option>
                    {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <button type="button" className="btn-ghost" disabled={busy}
                          onClick={() => setEditingInfo(false)}>Cancel</button>
                  <button type="submit" className="btn-primary"
                          disabled={busy || !editTitle.trim() || !editDescription.trim() || !editCategory}>
                    {busy ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <h1 className="mt-1 text-2xl font-bold">{ticket.title}</h1>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StatusBadge status={ticket.status} />
                  {ticket.priority_level && <PriorityBadge level={ticket.priority_level} />}
                  <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand-dark">{ticket.category}</span>
                  {ticket.department && (
                    <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent-dark">{ticket.department}</span>
                  )}
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{ticket.description}</p>
              </>
            )}

            <p className="mt-4 text-xs text-slate-500">
              Submitted by {requesterName(ticket)} on {fmt(ticket.created_at)}
              {" - "}Assigned to {ticket.assigned_to?.full_name ?? "no one yet"}
            </p>

            {ticket.last_edited_by && ticket.last_edited_at && (
              <p className="mt-1 text-xs text-slate-500">
                Last edited by <span className="font-semibold text-slate-700">{ticket.last_edited_by.full_name}</span>
                {" on "}{fmt(ticket.last_edited_at)}
              </p>
            )}

            {isStaff && !editingInfo && (
              <div className="mt-5 flex justify-end border-t border-slate-200 pt-4">
                <button type="button" className="btn-blue" disabled={busy} onClick={startEditingInfo}>
                  Edit Ticket Information
                </button>
              </div>
            )}
          </section>

          <section className="card p-6">
            <h2 className="mb-4 text-lg font-semibold">Notes</h2>
            {ticket.comments.length === 0 && <p className="mb-4 text-sm text-slate-500">No notes yet.</p>}
            <ul className="mb-6 space-y-4">
              {ticket.comments.map((c) => (
                <li key={c.id}
                    className={`rounded-md border p-3 text-sm ${c.is_internal ? "border-orange-300 bg-accent-soft" : "border-brand/15 bg-white/60"}`}>
                  <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    <span className="font-semibold text-ink">{c.user.full_name}</span>
                    {hasStaffAccess(c.user) && <span className="rounded bg-brand-soft px-1.5 py-0.5 font-semibold text-brand">IT agent</span>}
                    {c.is_internal && <span className="rounded bg-orange-200 px-1.5 py-0.5 font-semibold text-orange-900">Internal note</span>}
                    <span>{fmt(c.created_at)}</span>
                  </div>
                  <p className="whitespace-pre-wrap">{c.content}</p>
                </li>
              ))}
            </ul>

            <form onSubmit={addComment} className="space-y-3">
              <label htmlFor="comment" className="label">Add a note for the IT team</label>
              <textarea id="comment" rows={3} className="input" value={comment} onChange={(e) => setComment(e.target.value)}
                        placeholder="Write a note..." />
              <div className="flex justify-end">
                <button type="submit" className="btn-blue" disabled={busy || !comment.trim()}>Post note</button>
              </div>
            </form>
          </section>
        </div>

        {isStaff && (
          <aside className="card h-fit space-y-4 p-6">
            <h2 className="text-lg font-semibold">IT agent controls</h2>

            <div>
              <label htmlFor="assignee" className="label">Assigned technician</label>
              <select id="assignee" className="input" disabled={busy} value={selectedTech} onChange={(e) => setTechId(e.target.value)}>
                <option value="">Unassigned</option>
                {ticket.assigned_to && !agents.some((a) => a.id === ticket.assigned_to!.id) && (
                  <option value={ticket.assigned_to.id} disabled>
                    {ticket.assigned_to.full_name}{ticket.assigned_to.role === "ADMIN" ? " (IT admin)" : ""}
                  </option>
                )}
                {agents.map((a) => <option key={a.id} value={a.id}>{a.full_name}</option>)}
              </select>
              {selectedTech !== String(user!.id) && (
                <button type="button" className="mt-2 text-sm font-semibold text-brand underline" disabled={busy}
                        onClick={() => setTechId(String(user!.id))}>
                  Assign to me
                </button>
              )}
            </div>

            <button className="btn-primary w-full" disabled={busy} onClick={done}>
              {busy ? "Saving..." : "Done"}
            </button>

            <hr className="border-slate-200" />

            <button className="btn-blue w-full" disabled={busy || finished} onClick={resolve}>
              {finished ? "Already resolved" : "Mark as Resolved"}
            </button>

            <div>
              <label htmlFor="status" className="label">Change status</label>
              <select id="status" className="input" disabled={busy} value={ticket.status}
                      onChange={(e) => changeStatus(e.target.value as Status)}>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="label">Priority level</label>
              <select id="priority" className="input" disabled={busy} value={ticket.priority_level ?? ""}
                      onChange={(e) => changePriority(e.target.value)}>
                <option value="">Not set</option>
                {PRIORITIES.map((p) => <option key={p.key} value={p.key}>{p.key} - {p.label}</option>)}
              </select>
            </div>

            {user?.role === "ADMIN" && ticket.status === "RESOLVED" && (
              <>
                <hr className="border-slate-200" />
                {confirmDelete ? (
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-red-800">Permanently delete this ticket and its comments? This cannot be undone.</p>
                    <div className="flex gap-2">
                      <button className="btn bg-red-700 text-white hover:bg-red-800" disabled={busy} onClick={deleteTicket}>Yes, delete</button>
                      <button className="btn-ghost" disabled={busy} onClick={() => setConfirmDelete(false)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button className="btn bg-red-700 text-white hover:bg-red-800" onClick={() => setConfirmDelete(true)}>
                    Delete ticket
                  </button>
                )}
              </>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
