import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import api, { errorMessage, type User } from "../api/client";
import { useAuth } from "../App";
import { DEPARTMENTS } from "../constants";

const roleLabel = (r: string) => (r === "ADMIN" ? "IT Admin" : "IT Assistant");

// IT staff management (main admin only). Employees have no accounts any more.
export default function AccountsPage() {
  const { user } = useAuth();
  const [staff, setStaff] = useState<User[]>([]);
  const [tab, setTab] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [department, setDepartment] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fName, setFName] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fDept, setFDept] = useState("");
  const [fPassword, setFPassword] = useState("");

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<User[]>("/users/accounts");
      setStaff(data);
    } catch (err) {
      setError(errorMessage(err, "Could not load the IT staff list."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (user?.role !== "ADMIN") return <Navigate to="/" replace />;

  const decide = async (id: number, decision: "APPROVED" | "REJECTED") => {
    setBusyId(id);
    setError("");
    try {
      await api.post(`/users/${id}/decision`, { decision });
      await load();
    } catch (err) {
      setError(errorMessage(err, "Could not save your decision."));
    } finally {
      setBusyId(null);
    }
  };

  const addStaff = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    if (fName.trim().split(/\s+/).length < 2) { setError("Please enter the full name: first name and surname."); return; }
    setSaving(true);
    try {
      await api.post("/users/staff", { full_name: fName.trim(), email: fEmail.trim(), password: fPassword, department: fDept || null });
      setNotice(`Account created for ${fName.trim()}. Give them the email and password privately. They sign in on the login page.`);
      setFName(""); setFEmail(""); setFDept(""); setFPassword(""); setShowForm(false);
      await load();
    } catch (err) {
      setError(errorMessage(err, "Could not create the account."));
    } finally {
      setSaving(false);
    }
  };

  const inDept = department ? staff.filter((a) => a.department === department) : staff;
  const count = (k: "APPROVED" | "REJECTED") => inDept.filter((a) => a.account_status === k).length;
  const shown = inDept.filter((a) => a.account_status === tab);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-brand">IT Staff</h1>
          <p className="text-sm text-slate-600">IT Admins and IT Assistants who can sign in. Employees do not need an account.</p>
        </div>
        <button className="btn-primary" onClick={() => { setShowForm((s) => !s); setError(""); }}>
          {showForm ? "Cancel" : "Add IT Assistant"}
        </button>
      </div>

      {notice && <p role="status" className="mb-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p>}
      {error && <p role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {showForm && (
        <form onSubmit={addStaff} className="card mb-6 grid gap-4 p-6 sm:grid-cols-2">
          <div>
            <label htmlFor="s-name" className="label">Full name (first name and surname)</label>
            <input id="s-name" className="input" required value={fName} onChange={(e) => setFName(e.target.value)} />
          </div>
          <div>
            <label htmlFor="s-email" className="label">Company email</label>
            <input id="s-email" type="email" className="input" required placeholder="name@yourcompany.com" value={fEmail} onChange={(e) => setFEmail(e.target.value)} />
          </div>
          <div>
            <label htmlFor="s-dept" className="label">Department (optional)</label>
            <select id="s-dept" className="input" value={fDept} onChange={(e) => setFDept(e.target.value)}>
              <option value="">Not set</option>
              {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="s-pass" className="label">Temporary password (6 characters or more)</label>
            <input id="s-pass" type="text" minLength={6} maxLength={72} className="input" required autoComplete="off" value={fPassword} onChange={(e) => setFPassword(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-blue" disabled={saving}>{saving ? "Creating..." : "Create IT assistant account"}</button>
          </div>
        </form>
      )}

      <div role="tablist" className="mb-4 flex flex-wrap gap-1 border-b border-slate-200">
        {([["APPROVED", "Active"], ["REJECTED", "Access removed"]] as const).map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
                  className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold ${tab === k ? "border-accent-bright text-accent" : "border-transparent text-slate-600 hover:text-brand"}`}>
            {label} <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{count(k)}</span>
          </button>
        ))}
      </div>

      <div className="mb-4 max-w-xs">
        <label htmlFor="dept-filter" className="label">Filter by department</label>
        <select id="dept-filter" className="input" value={department} onChange={(e) => setDepartment(e.target.value)}>
          <option value="">All departments</option>
          {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>

      <div className="table-wrap">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="table-head">
            <tr>{["Name", "Email", "Department", "Role", "Action"].map((h) => <th key={h} scope="col" className="px-4 py-3">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">Loading...</td></tr>}
            {!loading && shown.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                {tab === "REJECTED" ? "Nobody has had their access removed." : "No IT staff to show."}
              </td></tr>
            )}
            {shown.map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-3 font-semibold">{a.full_name}</td>
                <td className="px-4 py-3">{a.email}</td>
                <td className="px-4 py-3">{a.department ?? <span className="text-slate-400">-</span>}</td>
                <td className="px-4 py-3">{roleLabel(a.role)}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  {a.role === "ADMIN" ? <span className="text-slate-400">-</span> : a.account_status === "APPROVED" ? (
                    <button className="btn border border-red-300 bg-white/70 px-3 py-1 text-red-700 hover:bg-red-50" disabled={busyId === a.id}
                            onClick={() => decide(a.id, "REJECTED")}>Remove access</button>
                  ) : (
                    <button className="btn-blue px-3 py-1" disabled={busyId === a.id} onClick={() => decide(a.id, "APPROVED")}>Restore access</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
