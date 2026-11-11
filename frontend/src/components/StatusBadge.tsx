import type { Status } from "../api/client";

const styles: Record<Status, string> = {
  OPEN: "bg-blue-100 text-blue-800 ring-blue-200",
  IN_PROGRESS: "bg-orange-100 text-orange-800 ring-orange-200",
  RESOLVED: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  CLOSED: "bg-slate-200 text-slate-700 ring-slate-300",
};
export const statusLabels: Record<Status, string> = {
  OPEN: "Open", IN_PROGRESS: "In Progress", RESOLVED: "Resolved", CLOSED: "Closed",
};

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${styles[status]}`}>
      {statusLabels[status]}
    </span>
  );
}
