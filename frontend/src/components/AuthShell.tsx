import type { ReactNode } from "react";
import Footer from "./Footer";

// Minimalist tech backdrop: circuit traces with moving data pulses, glowing nodes,
// slow rotating rings and floating chips. Decorative only.
const TRACES = [
  "M0 150 H260 L320 210 H620 L680 270 H1000 L1060 210 H1600",
  "M0 430 H180 L240 370 H520 L580 430 H900 L960 490 H1600",
  "M0 720 H320 L380 780 H760 L820 720 H1200 L1260 780 H1600",
  "M240 0 V120 L300 180 V400 L360 460 V700",
  "M1320 0 V160 L1280 200 V420 L1340 480 V900",
  "M780 900 V800 L840 740 V600",
];
const NODES: [number, number][] = [
  [320, 210], [680, 270], [1060, 210], [240, 370], [580, 430], [960, 490], [380, 780],
  [820, 720], [1260, 780], [300, 180], [360, 460], [1280, 200], [1340, 480], [840, 740],
];

function TechBackdrop() {
  const soft = "rgba(255,255,255,.16)";
  return (
    <>
      <div aria-hidden="true" className="tech-grid absolute inset-0" />
      <svg aria-hidden="true" className="absolute inset-0 h-full w-full" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" fill="none">
        <circle cx="800" cy="450" r="170" stroke={soft} />
        <g className="tech-ring"><circle cx="800" cy="450" r="260" stroke={soft} strokeDasharray="4 10" /><circle cx="1060" cy="450" r="5" fill="#f58220" /></g>
        <g className="tech-ring-rev"><circle cx="800" cy="450" r="350" stroke="rgba(255,255,255,.10)" strokeDasharray="2 12" /><circle cx="450" cy="450" r="4" fill="#fff" opacity=".7" /></g>

        {TRACES.map((d, i) => (
          <g key={i}>
            <path d={d} stroke={soft} strokeWidth="1.5" />
            <path d={d} className="tech-flow" style={{ animationDelay: `${-i * 1.3}s` }}
                  stroke={i % 2 ? "#ffffff" : "#f58220"} strokeWidth="2" strokeLinecap="round" opacity=".85" />
          </g>
        ))}
        {NODES.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="4" className="tech-node" fill={i % 3 === 0 ? "#f58220" : "#ffffff"} style={{ animationDelay: `${-i * 0.7}s` }} />
        ))}

        <g className="tech-float" style={{ animationDelay: "-1s" }} stroke="rgba(255,255,255,.35)" strokeWidth="1.5">
          <rect x="110" y="540" width="48" height="48" rx="8" />
          <rect x="124" y="554" width="20" height="20" rx="3" stroke="#f58220" />
          <path d="M122 540v-10M134 540v-10M146 540v-10M122 588v10M134 588v10M146 588v10M110 552h-10M110 564h-10M110 576h-10M158 552h10M158 564h10M158 576h10" />
        </g>
        <g className="tech-float" style={{ animationDelay: "-4s" }} stroke="rgba(255,255,255,.3)" strokeWidth="1.5">
          <rect x="1440" y="600" width="42" height="42" rx="7" />
          <rect x="1452" y="612" width="18" height="18" rx="3" stroke="#f58220" />
          <path d="M1450 600v-9M1461 600v-9M1472 600v-9M1450 642v9M1461 642v9M1472 642v9" />
        </g>
        <g className="tech-float" style={{ animationDelay: "-3s" }} stroke="rgba(255,255,255,.4)" strokeWidth="1.5"><path d="M1500 90v24M1488 102h24" /></g>
        <g className="tech-float" style={{ animationDelay: "-5s" }} stroke="rgba(255,255,255,.3)" strokeWidth="1.5"><rect x="700" y="80" width="22" height="22" rx="4" /></g>
        <g className="tech-float" style={{ animationDelay: "-2s" }} stroke="rgba(245,130,32,.6)" strokeWidth="1.5"><path d="M80 820v20M70 830h20" /></g>
        <g className="tech-float" style={{ animationDelay: "-6s" }} stroke="rgba(255,255,255,.3)" strokeWidth="1.5"><rect x="1180" y="300" width="20" height="20" rx="4" /></g>
      </svg>
    </>
  );
}

/**
 * The blue ITI HelpDesk page used by the staff login and the public ticket form:
 * animated tech background, banner on the left, and a card on the right (children).
 */
export default function AuthShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-brand-dark via-brand to-[#2f6bc9] px-6 pb-28 pt-10">
      <TechBackdrop />
      {/* Soft fade to light behind the form side, so the form stands out. Edit this line to change the gradient. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#cfe0fa]/60 via-[#7aa5e6]/18 to-transparent backdrop-blur-md [-webkit-mask-image:linear-gradient(to_top,black,transparent)] [mask-image:linear-gradient(to_top,black,transparent)] lg:inset-x-auto lg:inset-y-0 lg:right-0 lg:h-auto lg:w-1/2 lg:bg-gradient-to-l lg:[-webkit-mask-image:linear-gradient(to_left,black,transparent)] lg:[mask-image:linear-gradient(to_left,black,transparent)]" />

      <div className="relative flex w-full max-w-5xl flex-col items-center gap-12 lg:flex-row lg:justify-center lg:gap-28 xl:gap-40">
        {/* Banner */}
        <div className="text-center text-white lg:text-left">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">ITI HelpDesk</h1>
          <div className="mx-auto mt-4 h-1 w-20 rounded bg-gradient-to-r from-accent-bright to-accent lg:mx-0" />
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.25em] text-white/85">Intellismart IT Services</p>
        </div>

        {/* Card */}
        <div className={`card w-full ${wide ? "max-w-md" : "max-w-sm"} p-6 shadow-2xl shadow-brand-dark/40`}>{children}</div>
      </div>

      <Footer onBackdrop />
    </div>
  );
}
