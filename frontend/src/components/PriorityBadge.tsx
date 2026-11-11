import type { PriorityLevel } from "../api/client";

// Same badge look as StatusBadge (rounded pill, ring) with the same colour families.
const styles: Record<PriorityLevel, string> = {
  P1: "bg-red-600 text-white ring-red-700",
  P2: "bg-orange-500 text-white ring-orange-600",
  P3: "bg-blue-600 text-white ring-blue-700",
  P4: "bg-slate-500 text-white ring-slate-600",
};

export const PRIORITIES: { key: PriorityLevel; label: string; meaning: string }[] = [
  { key: "P1", label: "Critical", meaning: "Emergency / outage" },
  { key: "P2", label: "High", meaning: "Urgent attention" },
  { key: "P3", label: "Medium", meaning: "Can be done anytime of the day" },
  { key: "P4", label: "Low", meaning: "Minor / no immediate deadline" },
];

export default function PriorityBadge({ level }: { level?: PriorityLevel | null }) {
  const p = PRIORITIES.find((x) => x.key === level);
  if (!p) return <span className="text-slate-400">-</span>;
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${styles[p.key]}`}>
      {p.key} {p.label}
    </span>
  );
}
