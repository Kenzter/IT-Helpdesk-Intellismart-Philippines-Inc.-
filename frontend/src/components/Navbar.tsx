import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import api, { hasStaffAccess } from "../api/client";
import LiveTicketAlerts from "./LiveTicketAlerts";

const ICONS = {
  dashboard: "M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z",
  ticket: "M3 9a2 2 0 0 0 0 6v3a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-3a2 2 0 0 1 0-6V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1z",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  plus: "M12 5v14M5 12h14",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  menu: "M4 6h16M4 12h16M4 18h16",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16v-4M12 8h.01",
  trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6",
};

function Icon({ d }: { d: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
  );
}

function Badge({ n, label }: { n: number; label: string }) {
  if (n <= 0) return null;
  return (
    <span className="ml-auto rounded-full bg-accent-bright px-2 py-0.5 text-xs font-bold text-white" title={label}>
      {n}<span className="sr-only"> {label}</span>
    </span>
  );
}

function Item({ to, end, icon, label, badge, onClick }:
  { to: string; end?: boolean; icon: string; label: string; badge?: ReactNode; onClick: () => void }) {
  return (
    <NavLink to={to} end={end} onClick={onClick}
             className={({ isActive }) =>
               `flex items-center gap-3 border-l-4 px-4 py-2.5 text-sm font-medium ${
                 isActive ? "border-accent-bright bg-gradient-to-r from-white/25 to-white/5 text-white" : "border-transparent text-white/80 hover:bg-white/10 hover:text-white"}`}>
      <Icon d={icon} /> <span>{label}</span> {badge}
    </NavLink>
  );
}

const initials = (name?: string) =>
  (name ?? "?").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);          // side bar on phones
  const [confirmOut, setConfirmOut] = useState(false);
  const [assigned, setAssigned] = useState(0);      // open tickets assigned to me (IT staff)
  const navigate = useNavigate();
  const location = useLocation();
  const isStaff = hasStaffAccess(user);
  const isMainAdmin = user?.role === "ADMIN";
  const roleLabel = user?.role === "ADMIN" ? "IT Admin" : user?.role === "ASSISTANT" ? "IT Assistant" : "Employee";

  // Refresh the indicators every 30 seconds, and again on every page change
  // (so the number drops right after you resolve a ticket).
  useEffect(() => {
    if (!isStaff) return;
    const check = () => {
      api.get<{ count: number }>("/tickets/assigned-count").then((r) => setAssigned(r.data.count)).catch(() => {});
    };
    check();
    const id = setInterval(() => { if (document.visibilityState === "visible") check(); }, 30000);
    return () => clearInterval(id);
  }, [isStaff, isMainAdmin, location.key]);

  // Escape closes the sign-out question (or the phone menu).
  useEffect(() => {
    if (!confirmOut && !open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setConfirmOut(false); setOpen(false); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmOut, open]);

  const close = () => setOpen(false);
  const signOut = () => { setConfirmOut(false); logout(); navigate("/login"); };

  return (
    <>
      {/* Left side bar */}
      {open && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={close} aria-hidden="true" />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-52 flex-col overflow-hidden bg-gradient-to-b from-brand-dark via-brand to-[#2f6bc9] shadow-xl transition-transform md:visible md:translate-x-0 ${open ? "translate-x-0" : "invisible -translate-x-full"}`}>
        <Link to="/" onClick={close} className="flex h-14 items-center border-b-4 border-accent-bright bg-gradient-to-r from-black/20 to-transparent px-4 text-lg font-bold tracking-tight text-white">
          ITI HelpDesk
        </Link>
        <nav aria-label="Main" className="flex-1 space-y-1 py-4">
          <Item to="/" end icon={ICONS.dashboard} label="Dashboard" onClick={close} />
          <Item to="/tickets" icon={ICONS.ticket} label="Tickets" onClick={close}
                badge={<Badge n={assigned} label="assigned to you" />} />
          {isMainAdmin && <Item to="/accounts" icon={ICONS.users} label="IT Staff" onClick={close} />}
          {isMainAdmin && <Item to="/deletion-logs" icon={ICONS.trash} label="Deletion Logs" onClick={close} />}
          <Item to="/about" icon={ICONS.info} label="About Us" onClick={close} />
        </nav>
        {/* On phones the name is not in the top strip, so show it in the menu */}
        <div className="relative border-t border-white/15 p-4 text-sm text-white md:hidden">
          <p className="font-semibold [overflow-wrap:anywhere]">{user?.full_name}</p>
          <p className="text-xs text-white/70">{roleLabel}{user?.department ? ` - ${user.department}` : ""}</p>
        </div>
      </aside>

      {/* Top strip: account name and sign out stay on the upper right */}
      <header className="fixed left-0 right-0 top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-brand/10 bg-gradient-to-r from-[#e9f1ff]/90 via-[#dbe8fb]/90 to-[#ffd3a6]/95 px-4 shadow-sm backdrop-blur md:left-52">
        <button className="rounded-md p-2 text-brand md:hidden" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}>
          <Icon d={ICONS.menu} />
        </button>
        <span className="font-bold text-brand md:hidden">ITI HelpDesk</span>
        <p className="hidden min-w-0 truncate bg-gradient-to-r from-brand-dark via-brand to-accent bg-clip-text text-base font-bold text-transparent md:block">
          Intellismart IT Department at Your Service!
        </p>

        <div className="ml-auto flex shrink-0 items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-dark text-sm font-bold text-white shadow" aria-hidden="true">
            {initials(user?.full_name)}
          </span>
          <div className="hidden max-w-[20rem] text-right leading-tight sm:block">
            <p className="text-sm font-semibold text-ink [overflow-wrap:anywhere]">{user?.full_name}</p>
            <p className="text-xs text-slate-500">{roleLabel}{user?.department ? ` - ${user.department}` : ""}</p>
          </div>
          <button onClick={() => setConfirmOut(true)} className="btn-ghost gap-2 px-3 py-1.5">
            <Icon d={ICONS.logout} /> Sign out
          </button>
        </div>
      </header>

      {confirmOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
             role="dialog" aria-modal="true" aria-labelledby="signout-title" onClick={() => setConfirmOut(false)}>
          <div className="card w-full max-w-sm p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 id="signout-title" className="text-lg font-semibold text-ink">Sign out?</h2>
            <p className="mt-2 text-sm text-slate-600">Are you sure you want to sign out?</p>
            <div className="mt-5 flex justify-end gap-3">
              <button autoFocus className="btn-ghost" onClick={() => setConfirmOut(false)}>Cancel</button>
              <button className="btn-primary" onClick={signOut}>Yes, sign out</button>
            </div>
          </div>
        </div>
      )}
      <LiveTicketAlerts />
    </>
  );
}
