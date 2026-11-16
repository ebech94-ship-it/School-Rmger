
import Link from "next/link";

const subjects = [
  { name: "Electrical Installation", teacher: "Teacher One", status: "Submitted" },
  { name: "Mathematics", teacher: "Teacher Two", status: "Pending" },
  { name: "English Language", teacher: "Teacher Three", status: "Submitted" },
  { name: "Electrical Power Systems", teacher: "Teacher Four", status: "In progress" },
];

const students = [
  { name: "Student One", average: 32 },
  { name: "Student Two", average: 18 },
  { name: "Student Three", average: 27 },
  { name: "Student Four", average: 14 },
];

export default function ClassMasterDashboard() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <header className="flex items-center justify-between border-b bg-white px-4 py-4 md:px-8">
        <div>
          <h1 className="text-xl font-bold text-blue-950">ScholarFlow</h1>
          <p className="text-xs text-slate-500">Class Master Workspace</p>
        </div>
        <Link href="/login" className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">
          Sign out
        </Link>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <p className="text-sm font-semibold text-blue-700">CLASS MASTER DASHBOARD</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">
          Welcome back, Class Master
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Monitor your class, review subject submissions and follow academic progress.
        </p>

        <section className="mt-7 rounded-2xl bg-blue-950 p-6 text-white md:p-8">
          <p className="text-sm text-blue-200">YOUR ASSIGNED CLASS</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h3 className="text-3xl font-bold">Form 4</h3>
              <p className="mt-2 text-sm text-blue-200">First Term · 2026/2027</p>
            </div>
            <div className="rounded-xl bg-white/10 px-5 py-3">
              <p className="text-sm text-blue-200">Enrolled students</p>
              <p className="text-2xl font-bold">32</p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total students</p>
            <p className="mt-2 text-3xl font-bold text-blue-950">32</p>
          </div>
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Subjects</p>
            <p className="mt-2 text-3xl font-bold text-blue-950">4</p>
          </div>
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Submitted</p>
            <p className="mt-2 text-3xl font-bold text-blue-700">2</p>
          </div>
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Awaiting submission</p>
            <p className="mt-2 text-3xl font-bold text-red-600">2</p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border bg-white p-5 shadow-sm md:p-7">
          <div className="mb-5">
            <h3 className="text-lg font-bold">Subject submission monitoring</h3>
            <p className="mt-1 text-sm text-slate-500">
              Track teacher&apos;s progress in submitting marks.
            </p>
          </div>

          <div className="space-y-3">
            {subjects.map((subject) => (
              <div key={subject.name} className="flex flex-col justify-between gap-3 rounded-xl border p-4 sm:flex-row sm:items-center">
                <div>
                  <p className="font-semibold">{subject.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{subject.teacher}</p>
                </div>
                <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                  subject.status === "Submitted"
                    ? "bg-blue-50 text-blue-700"
                    : subject.status === "Pending"
                    ? "bg-red-50 text-red-600"
                    : "bg-amber-50 text-amber-700"
                }`}>
                  {subject.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border bg-white p-5 shadow-sm md:p-7">
          <div className="mb-5">
            <h3 className="text-lg font-bold">Student performance overview</h3>
            <p className="mt-1 text-sm text-slate-500">
              Sample averages across subjects, out of 40.
            </p>
          </div>

          <div className="space-y-4">
            {students.map((student) => (
              <div key={student.name}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-medium">{student.name}</span>
                  <strong className={student.average < 20 ? "text-red-600" : "text-blue-700"}>
                    {student.average}/40
                  </strong>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${student.average < 20 ? "bg-red-500" : "bg-blue-600"}`}
                    style={{ width: `${(student.average / 40) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <Link href="/class-master/results" className="rounded-2xl bg-blue-950 p-6 text-white hover:bg-blue-900">
            <p className="text-sm text-blue-200">CLASS RESULTS</p>
            <h3 className="mt-2 text-xl font-bold">Review class results</h3>
            <p className="mt-2 text-sm text-blue-100">Inspect subject marks and student performance.</p>
            <p className="mt-5 text-sm font-semibold">Open results →</p>
          </Link>

          <div className="rounded-2xl border bg-white p-6">
            <p className="text-sm text-slate-500">CLASS RESPONSIBILITIES</p>
            <h3 className="mt-2 text-xl font-bold">Class monitoring</h3>
            <p className="mt-2 text-sm text-slate-500">
              Follow up on missing marks, monitor performance and prepare class-council information.
            </p>
          </div>
        </section>

        <p className="mt-8 text-center text-xs text-slate-400">
          ScholarFlow · School Results Management
        </p>
      </div>
    </main>
  );
}
