// Photo of the main developer. To replace the placeholder: put the picture inside frontend/public/
// (for example frontend/public/geo.jpg) and change null below to "/geo.jpg".
// The photo frame is passport-style (portrait, 7:9 like a 35 x 45 mm passport photo): use an upright photo.
const B = "font-semibold text-brand-dark"; // style for the bold words
const GEO_PHOTO: string | null = "/geo.jpg";

const QA_TEAM = ["Dheejay De Guzman", "Viggo Salvador"];

const initialsOf = (name: string) => {
  const parts = name.split(/\s+/).filter(Boolean);
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

function ProfilePhoto({ src, name }: { src: string | null; name: string }) {
  if (src) {
    return <img src={src} alt={name} className="aspect-[7/9] w-40 rounded-lg object-cover object-top shadow-lg ring-2 ring-accent-bright sm:w-44" />;
  }
  return (
    <div role="img" aria-label={`Photo placeholder for ${name}`}
         className="flex aspect-[7/9] w-40 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-brand/40 bg-white/60 text-center text-brand sm:w-44">
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
           strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
      </svg>
      <span className="text-xs font-semibold uppercase tracking-wide">Your photo here</span>
    </div>
  );
}

export default function AboutPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-brand">About Us</h1>

      <section aria-labelledby="developers-title">
        <h2 id="developers-title" className="mb-4 text-lg font-semibold text-ink">System Developers</h2>
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Main developer */}
          <div className="card flex flex-col items-center p-8 text-center lg:col-span-2">
            <ProfilePhoto src={GEO_PHOTO} name="Geo Kenzter Gutierrez" />
            <h3 className="mt-5 text-xl font-bold text-ink">Geo Kenzter Gutierrez</h3>
            <p className="mt-1 text-sm font-semibold text-accent-dark">AI-Assisted Full Stack Developer</p>
            <span className="mt-2 rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand-dark">Primary System Developer</span>
          </div>
          {/* Quality Assurance team */}
          <div className="card flex flex-col justify-center p-8 lg:col-span-3">
            <div className="text-center sm:text-left">
              <h3 className="text-xl font-bold text-ink">Quality Assurance (QA) Team</h3>
              <p className="mt-1 text-sm text-slate-600">Both members share the role of Quality Assurance.</p>
            </div>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {QA_TEAM.map((name) => (
                <li key={name} className="flex flex-col items-center rounded-xl border border-brand/10 bg-white/60 p-5 text-center shadow-sm">
                  <span aria-hidden="true"
                        className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-dark text-2xl font-bold text-white shadow">
                    {initialsOf(name)}
                  </span>
                  <p className="mt-3 font-semibold text-ink">{name}</p>
                  <span className="mt-2 rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand-dark">Quality Assurance</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section aria-labelledby="about-title" className="mt-10">
        <h2 id="about-title" className="mb-4 text-lg font-semibold text-ink">About the Developers</h2>
        <div className="card p-6 sm:p-8">

          <div className="mt-5 max-w-3xl space-y-4 text-sm leading-relaxed text-slate-700 sm:text-base sm:text-justify">
            <p>
              <strong className={B}>ITI HelpDesk</strong> is a helpdesk management system developed by <strong className={B}>Geo Kenzter
              Gutierrez</strong>, serving as the <strong className={B}>AI-Assisted Full Stack Developer</strong>, with <strong className={B}>Dheejay
              De Guzman</strong> and <strong className={B}>Viggo Salvador</strong> as the <strong className={B}>Quality Assurance (QA) team</strong>.
              We are <strong className={B}>4th Year Student Interns</strong> from the <strong className={B}>Technological University of the
              Philippines – Manila</strong>, taking up Bachelor of Engineering Technology, Major in Computer Engineering Technology.
            </p>
            <p>
              ITI HelpDesk was developed to provide a more organized, efficient, and accessible way of managing IT-related concerns,
              technical issues, and service requests. We came up with this system to address the challenges of traditional helpdesk
              processes, such as manual tracking, delayed responses, difficulty monitoring ticket progress, and maintaining records
              of reported issues. Through this platform, we aim to simplify ticket submission, improve communication between users
              and IT support personnel, streamline issue tracking, and ensure that every concern is properly documented and
              addressed. Our goal is to contribute to a more efficient IT support environment through technology, innovation, and
              continuous improvement.
            </p>
            <p className="border-l-4 border-accent-bright pl-4 font-semibold text-brand-dark">
              Developed with dedication by the ITI HelpDesk Development Team.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
