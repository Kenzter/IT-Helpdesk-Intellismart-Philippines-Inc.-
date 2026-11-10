import { useState, type FormEvent } from "react";
import api from "../api/client";
import AuthShell from "../components/AuthShell";
import { CATEGORIES, DEPARTMENTS } from "../constants";

interface Created { id: number; title: string; status: string; created_at: string }

const FIELD_LABELS: Record<string, string> = {
  requester_name: "Employee name", department: "Department", category: "Issue category",
  title: "Subject", description: "Description",
};

function submitError(err: unknown): string {
  const res = (err as any)?.response;
  if (!res) return "Could not reach the helpdesk server. Please check your connection and try again.";
  const detail = res.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length) {
    const loc = detail[0]?.loc;
    const label = FIELD_LABELS[loc?.[loc.length - 1]];
    return label ? `${label}: please check this field and try again.` : "Please check the form and try again.";
  }
  return "Something went wrong and your ticket was not saved. Please try again.";
}

// Public page: employees submit a ticket with no account and no login.
export default function PublicTicketPage() {
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [trap, setTrap] = useState(""); // hidden spam trap: people never see or fill this
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<Created | null>(null);

  const reset = () => {
    setName(""); setDepartment(""); setCategory(""); setTitle(""); setDescription(""); setTrap("");
    setError(""); setCreated(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return; // blocks accidental double clicks
    setError("");
    if (name.trim().split(/\s+/).length < 2) {
      setError("Please enter your full name: first name and surname.");
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post<Created>("/public/tickets", {
        requester_name: name.trim(), department, category,
        title: title.trim(), description: description.trim(), website: trap,
      });
      setCreated(data); // only shown after the server confirms the ticket was saved
    } catch (err) {
      setError(submitError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell wide>
      {created ? (
        <div role="status" className="py-2 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-brand">Ticket submitted</h2>
          <p className="mt-2 text-sm text-slate-700">Thank you. The IT Department received your request.</p>
          <p className="mt-5 text-sm text-slate-600">Your ticket number</p>
          <p className="text-4xl font-extrabold text-accent">#{created.id}</p>
          <p className="mt-2 text-sm text-slate-600">Please keep this number in case you need to follow up with IT.</p>
          <button className="btn-primary mt-6 w-full" onClick={reset}>Submit another ticket</button>
        </div>
      ) : (
        <>
          <h2 className="mb-1 text-2xl font-bold text-brand">Submit an IT ticket</h2>
          <p className="mb-5 text-sm text-slate-700">Tell IT what is wrong. No account or login needed.</p>
          <form onSubmit={submit} className="space-y-4">
            {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div>
              <label htmlFor="name" className="label">Employee name</label>
              <input id="name" className="input" required maxLength={100} autoComplete="name" placeholder="First name and surname, e.g. Juan Dela Cruz"
                     value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="department" className="label">Department</label>
                <select id="department" className="input" required value={department} onChange={(e) => setDepartment(e.target.value)}>
                  <option value="" disabled>Select department</option>
                  {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="category" className="label">Issue category</label>
                <select id="category" className="input" required value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="" disabled>Select category</option>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="title" className="label">Subject</label>
              <input id="title" className="input" required maxLength={255} placeholder="e.g. Printer on the 2nd floor shows offline"
                     value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label htmlFor="description" className="label">Description of the issue</label>
              <textarea id="description" rows={5} className="input" required maxLength={5000}
                        placeholder="What happened, when it started, and anything you already tried."
                        value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            {/* Spam trap, hidden from people */}
            <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", height: 0, width: 0, overflow: "hidden" }}>
              <label>Leave this empty<input type="text" tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} /></label>
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? "Submitting..." : "Submit Ticket"}
            </button>
          </form>
        </>
      )}
    </AuthShell>
  );
}
