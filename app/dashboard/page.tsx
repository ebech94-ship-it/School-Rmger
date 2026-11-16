
export default function Home() {
  return (
    <div className="mx-auto max-w-[1500px]">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#152440] sm:text-3xl">
            School overview
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Welcome back. Here&apos;s what&apos;s happening in your school.
          </p>
        </div>

        <a
          href="/dashboard/students"
          className="rounded-xl bg-blue-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
        >
          + Add new student
        </a>
      </div>

      <div className="mb-7 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: "Total Students", value: "—", note: "Registered students", icon: "♙" },
          { label: "Teachers", value: "—", note: "Registered teachers", icon: "♧" },
          { label: "Classes", value: "—", note: "Active classes", icon: "▦" },
          { label: "Subjects", value: "—", note: "Configured subjects", icon: "▤" },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500 sm:text-sm">{item.label}</p>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-lg text-blue-600">
                {item.icon}
              </span>
            </div>
            <p className="mt-4 text-2xl font-bold tracking-tight text-[#152440] sm:text-3xl">{item.value}</p>
            <p className="mt-1 text-[11px] text-slate-400 sm:text-xs">{item.note}</p>
          </div>
        ))}
      </div>

      <div className="mb-7 grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-[#152440]">Academic session</h3>
              <p className="mt-1 text-xs text-slate-500">Current school calendar</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">
              Not configured
            </span>
          </div>

          <div className="mt-6 rounded-xl bg-[#f4f7fc] p-4 sm:p-5">
            <p className="text-xs font-medium text-slate-500">Academic year</p>
            <p className="mt-1 text-xl font-bold text-[#152440]">Not configured</p>
            <p className="mt-2 text-sm text-slate-500">
              Set up the academic year and terms in Academic Calendar.
            </p>
            <a href="/dashboard/academic-calendar" className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700">
              Configure academic calendar →
            </a>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="font-bold text-[#152440]">Quick actions</h3>
          <p className="mt-1 text-xs text-slate-500">Common administrative tasks</p>

          <div className="mt-5 space-y-2">
            {[
              ["＋", "Register a student", "/dashboard/students"],
              ["♧", "Manage teachers", "/dashboard/teachers"],
              ["▦", "Manage classes", "/dashboard/classes"],
              ["⚙", "Academic settings", "/dashboard/settings"],
            ].map(([icon, label, href]) => (
              <a
                key={label}
                href={href}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-100 p-3 text-sm font-medium transition hover:border-blue-200 hover:bg-blue-50"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-blue-700">
                  {icon}
                </span>
                {label}
                <span className="ml-auto text-slate-400">→</span>
              </a>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-bold text-[#152440]">Class performance overview</h3>
            <p className="mt-1 text-xs text-slate-500">
              Results will appear here when marks are entered and processed.
            </p>
          </div>
          <a href="/dashboard/results" className="text-left text-xs font-semibold text-blue-600 sm:text-right">
            View all results →
          </a>
        </div>

        <div className="py-12 text-center">
          <p className="text-sm font-medium text-slate-600">No results available yet</p>
          <p className="mt-1 text-xs text-slate-400">
            Class performance summaries will be calculated from recorded marks.
          </p>
        </div>
      </section>

      <footer className="py-7 text-center text-xs text-slate-400">
        ScholarFlow · School Results Management
      </footer>
    </div>
  );
}