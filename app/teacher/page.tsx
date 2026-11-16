
import Link from "next/link";

const assignments = [
  { subject: "Electrical Installation", className: "Form 4", students: 32, status: "Pending" },
  { subject: "Electrical Power Systems", className: "Form 5", students: 28, status: "In progress" },
  { subject: "Basic Electricity", className: "Form 3", students: 35, status: "Completed" },
];

export default function TeacherDashboard() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <header className="flex items-center justify-between border-b bg-white px-5 py-4 md:px-10">
        <div>
          <h1 className="text-xl font-bold text-blue-950">ScholarFlow</h1>
          <p className="text-xs text-slate-500">Teacher Workspace</p>
        </div>
        <Link href="/login" className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50">
          Sign out
        </Link>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <section className="mb-8">
          <p className="text-sm font-medium text-blue-700">TEACHER DASHBOARD</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">
            Welcome back, Teacher
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Manage your teaching assignments and students’ academic records.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Assigned classes</p>
            <p className="mt-2 text-3xl font-bold text-blue-900">3</p>
          </div>
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Subjects assigned</p>
            <p className="mt-2 text-3xl font-bold text-blue-900">3</p>
          </div>
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Pending mark entries</p>
            <p className="mt-2 text-3xl font-bold text-red-600">1</p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border bg-white p-5 shadow-sm md:p-7">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">My teaching assignments</h3>
              <p className="mt-1 text-sm text-slate-500">Your assigned subjects and classes</p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              First Term · 2026/2027
            </span>
          </div>

          <div className="space-y-3">
            {assignments.map((item) => (
              <div key={item.subject} className="flex flex-col justify-between gap-4 rounded-xl border p-4 md:flex-row md:items-center">
                <div>
                  <h4 className="font-semibold text-slate-900">{item.subject}</h4>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.className} · {item.students} students
                  </p>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    item.status === "Completed"
                      ? "bg-blue-50 text-blue-700"
                      : item.status === "Pending"
                      ? "bg-red-50 text-red-600"
                      : "bg-amber-50 text-amber-700"
                  }`}>
                    {item.status}
                  </span>
                  <Link
                    href="/teacher/marks"
                    className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                  >
                    Enter marks
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <Link href="/teacher/marks" className="rounded-2xl bg-blue-950 p-6 text-white transition hover:bg-blue-900">
            <p className="text-sm text-blue-200">MARKS MANAGEMENT</p>
            <h3 className="mt-2 text-xl font-bold">Enter students’ marks</h3>
            <p className="mt-2 text-sm text-blue-100">Record sequence marks for your assigned subjects.</p>
            <p className="mt-5 text-sm font-semibold">Open marks entry →</p>
          </Link>

          <div className="rounded-2xl border bg-white p-6">
            <p className="text-sm font-medium text-slate-500">TEACHER SUPPORT</p>
            <h3 className="mt-2 text-xl font-bold">Your responsibilities</h3>
            <p className="mt-2 text-sm text-slate-500">
              Enter accurate marks, check your entries and submit them for review.
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
