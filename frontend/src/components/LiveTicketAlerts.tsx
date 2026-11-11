
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { hasStaffAccess, type Ticket } from "../api/client";
import { useAuth } from "../App";

export default function LiveTicketAlerts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notice, setNotice] = useState<Ticket | null>(null);

  useEffect(() => {
    if (!hasStaffAccess(user)) return;

    let active = true;
    const storageKey = `helpdesk_last_ticket_${user?.id}`;

    const checkTickets = async () => {
      if (document.visibilityState !== "visible") return;

      try {
        const { data } = await api.get<Ticket[]>("/tickets");

        if (!active) return;

        const newestId = data.reduce(
          (max, ticket) => Math.max(max, ticket.id),
          0
        );

        const savedId = localStorage.getItem(storageKey);

        // First visit: remember existing tickets without generating alerts.
        if (savedId === null) {
          localStorage.setItem(storageKey, String(newestId));
        } else {
          const lastId = Number(savedId);

          const newTickets = data
            .filter(
              (ticket) =>
                ticket.id > lastId && ticket.status === "OPEN"
            )
            .sort((a, b) => a.id - b.id);

          if (newestId > lastId) {
            localStorage.setItem(storageKey, String(newestId));

            // Refresh only when a new ticket is detected.
            window.dispatchEvent(new Event("helpdesk:tickets-updated"));
          }

          if (newTickets.length > 0) {
            setNotice(newTickets[newTickets.length - 1]);
          }
        }
      } catch {
        // Retry automatically on the next polling cycle.
      }
    };

    checkTickets();

    const interval = window.setInterval(checkTickets, 5000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        checkTickets();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!notice) return;

    const timeout = window.setTimeout(() => {
      setNotice(null);
    }, 8000);

    return () => window.clearTimeout(timeout);
  }, [notice]);

  if (!notice) return null;

  return (
    <div className="fixed right-4 top-16 z-[100] w-full max-w-sm">
      <div
        role="alert"
        className="rounded-xl border border-blue-200 bg-white p-4 shadow-xl"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xl">
            🔔
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-bold text-brand">
              New IT Support Request!
            </p>

            <p className="mt-1 text-sm text-slate-600">
              A new ticket has been submitted.
            </p>

            <p className="mt-2 truncate text-sm font-semibold text-slate-800">
              #{notice.id} - {notice.title}
            </p>

            <button
              onClick={() => {
                const id = notice.id;
                setNotice(null);
                navigate(`/tickets/${id}`);
              }}
              className="mt-3 text-sm font-semibold text-blue-700 hover:underline"
            >
              View Ticket →
            </button>
          </div>

          <button
            onClick={() => setNotice(null)}
            aria-label="Dismiss notification"
            className="text-lg text-slate-400 hover:text-slate-700"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
