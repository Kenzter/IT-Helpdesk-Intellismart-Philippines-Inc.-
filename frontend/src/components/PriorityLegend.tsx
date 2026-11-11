import { useEffect, useState } from "react";
import PriorityBadge, { PRIORITIES } from "./PriorityBadge";

// Button + small window that explains the priority colours (same dialog look as the sign-out question).
export default function PriorityLegend() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button type="button" className="btn border border-brand/25 bg-white/60 text-brand-dark hover:bg-white"
              onClick={() => setOpen(true)}>
        Priority legend
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
             role="dialog" aria-modal="true" aria-labelledby="priority-legend-title" onClick={() => setOpen(false)}>
          <div className="card w-full max-w-sm p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 id="priority-legend-title" className="text-lg font-semibold text-ink">Priority legend</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {PRIORITIES.map((p) => (
                <li key={p.key} className="flex items-center gap-3">
                  <span className="w-28 shrink-0"><PriorityBadge level={p.key} /></span>
                  <span className="text-slate-600">{p.meaning}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex justify-end">
              <button autoFocus className="btn-primary" onClick={() => setOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
