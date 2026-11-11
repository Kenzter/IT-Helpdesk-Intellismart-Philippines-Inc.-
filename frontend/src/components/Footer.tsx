// Credits and support hours shown at the bottom of every page.
//   <Footer />            bottom of the staff pages (App.tsx)
//   <Footer onBackdrop /> full-width bar at the bottom of the login / public ticket pages (AuthShell.tsx)
export default function Footer({ onBackdrop = false }: { onBackdrop?: boolean }) {
  const sep = <span aria-hidden="true" className={`mx-1.5 ${onBackdrop ? "text-white/40" : "text-brand/40"}`}>|</span>;
  return (
    <footer className={`text-center text-xs leading-relaxed ${
      onBackdrop
        ? "absolute inset-x-0 bottom-0 z-10 border-t-4 border-accent-bright bg-gradient-to-r from-brand-dark via-brand to-[#2f6bc9] px-4 py-3 text-white/90"
        : "mx-auto max-w-6xl border-t border-brand/15 px-4 py-5 text-slate-600"}`}>
      <p>
        &copy; 2026 ITI HelpDesk{sep}All rights reserved{sep}Designed &amp; Developed by{" "}
        <span className={`font-semibold ${onBackdrop ? "text-white" : "text-brand-dark"}`}>Geo Kenzter Gutierrez, Dheejay De Guzman, &amp; Viggo Salvador</span>
      </p>
      <p className={`mt-2 flex items-center justify-center gap-1.5 font-medium ${onBackdrop ? "text-white" : "text-brand-dark"}`}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
             strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
        <span>ITI HelpDesk Support Hours: Mon–Fri, 8:00 AM – 6:00 PM</span>
      </p>
    </footer>
  );
}