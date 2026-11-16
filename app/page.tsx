
import Link from "next/link";

const features = [
  {
    number: "01",
    title: "Student management",
    description: "Organise student records, class lists and academic information in one place.",
  },
  {
    number: "02",
    title: "Marks and calculations",
    description: "Make marks entry, subject averages, coefficients and totals easier and more accurate.",
  },
  {
    number: "03",
    title: "Class monitoring",
    description: "Give Class Masters a clear view of their classes and students' academic progress.",
  },
  {
    number: "04",
    title: "Progress reports",
    description: "Prepare professional student progress records ready for review and printing.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-white text-[#14233d]">
      <header className="relative z-10 border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#14233d] text-xl font-black text-white">
              S
            </div>
            <div>
              <p className="text-base font-extrabold tracking-tight">SCHOLARFLOW</p>
              <p className="text-[10px] font-medium tracking-[2px] text-slate-400">SCHOOL MANAGEMENT</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#features" className="transition hover:text-blue-600">Features</a>
            <a href="#how-it-works" className="transition hover:text-blue-600">How it works</a>
            <a href="#about" className="transition hover:text-blue-600">About</a>
          </nav>

          <Link
            href="/login"
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
          >
            Sign in <span className="ml-1">→</span>
          </Link>
        </div>
      </header>

      <section className="relative bg-[#101e37]">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(#8eb5ff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-2 lg:py-32">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-4 py-2 text-xs font-semibold text-blue-200">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              A smarter way to manage school results
            </div>

            <h1 className="max-w-2xl text-4xl font-black leading-[1.12] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Better school records.
              <span className="block text-blue-400">Better decisions.</span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
              Bring student records, marks entry, academic calculations and progress reports together in one simple school management platform.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className="rounded-xl bg-blue-500 px-7 py-4 text-center text-sm font-bold text-white shadow-xl shadow-blue-950/30 transition hover:bg-blue-400">
                Access your school portal →
              </Link>
              <a href="#features" className="rounded-xl border border-white/20 px-7 py-4 text-center text-sm font-semibold text-white transition hover:bg-white/10">
                Explore features
              </a>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-xs font-medium text-slate-400">
              <span>✓ Organised school records</span>
              <span>✓ Accurate calculations</span>
              <span>✓ Printable reports</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-5 rounded-[2rem] bg-blue-500/20 blur-3xl" />
            <div className="relative rounded-2xl border border-white/10 bg-white p-4 shadow-2xl sm:p-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="text-sm font-extrabold text-[#14233d]">School overview</p>
                  <p className="mt-1 text-xs text-slate-400">Academic management dashboard</p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-bold text-blue-700">LIVE VIEW</span>
              </div>

              <div className="grid grid-cols-2 gap-3 py-5 sm:grid-cols-3">
                {[
                  ["Students", "1,248"],
                  ["Teachers", "48"],
                  ["Classes", "24"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className="mt-2 text-2xl font-black text-[#14233d]">{value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-slate-100 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-bold text-[#14233d]">Class performance</p>
                  <span className="text-xs text-slate-400">Sample data</span>
                </div>
                {[
                  ["Form 1", "66%", "blue"],
                  ["Form 2", "42%", "red"],
                  ["Form 3", "82%", "blue"],
                ].map(([name, percentage, colour]) => (
                  <div key={name} className="mb-4 last:mb-0">
                    <div className="mb-2 flex justify-between text-xs">
                      <span className="font-semibold text-slate-600">{name}</span>
                      <span className="font-bold text-slate-700">{percentage}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${colour === "blue" ? "bg-blue-500" : "bg-red-500"}`} style={{ width: percentage }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-3 rounded-xl bg-[#14233d] p-4 text-white">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-lg">✓</div>
                <div>
                  <p className="text-xs font-bold">One organised workspace</p>
                  <p className="mt-1 text-[10px] text-slate-300">Records, results and reports together</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[3px] text-blue-600">Everything connected</p>
          <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">The tools schools need, in one place.</h2>
          <p className="mt-4 leading-7 text-slate-500">Simplify everyday academic administration and give school teams a clearer way to work.</p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <article key={feature.number} className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-slate-200/50">
              <p className="text-sm font-black text-blue-600">{feature.number}</p>
              <h3 className="mt-7 text-lg font-extrabold">{feature.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-500">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="bg-[#f4f7fc] py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[3px] text-blue-600">A connected workflow</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">From marks entry to progress reports.</h2>
            <p className="mt-4 leading-7 text-slate-500">Each school team member has a clear responsibility within the academic workflow.</p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              ["01", "Teachers", "Enter marks for their assigned subjects and classes."],
              ["02", "Class Masters", "Monitor class results and follow students' progress."],
              ["03", "Technical Administrator", "Manage school settings, assignments and academic records."],
            ].map(([number, title, description]) => (
              <div key={number} className="rounded-2xl border border-slate-200 bg-white p-7">
                <span className="text-sm font-black text-blue-600">{number}</span>
                <h3 className="mt-5 text-xl font-extrabold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-500">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="bg-white px-5 py-20 text-center sm:px-8">
        <p className="text-xs font-bold uppercase tracking-[3px] text-blue-600">Built for schools</p>
        <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">Make academic administration simpler.</h2>
        <p className="mx-auto mt-5 max-w-2xl leading-7 text-slate-500">A school-focused platform designed to support organised records, transparent workflows and reliable academic reporting.</p>
        <Link href="/login" className="mt-8 inline-flex rounded-xl bg-blue-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700">
          Sign in to your portal →
        </Link>
      </section>

      <footer className="bg-[#101e37] px-5 py-8 text-center text-xs text-slate-400 sm:px-8">
        <p className="font-bold tracking-wider text-white">SCHOLARFLOW</p>
        <p className="mt-2">School Management System · © 2026</p>
      </footer>
    </main>
  );
}
