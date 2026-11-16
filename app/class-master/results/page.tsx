
import Link from "next/link";

const subjects = [
  { name: "Electrical Installation", coefficient: 5 },
  { name: "Mathematics", coefficient: 4 },
  { name: "English Language", coefficient: 3 },
];

const students = [
  {
    id: "ST001",
    name: "Student One",
    marks: [[32, 30], [28, 30], [25, 27]],
  },
  {
    id: "ST002",
    name: "Student Two",
    marks: [[18, 20], [22, 19], [24, 20]],
  },
  {
    id: "ST003",
    name: "Student Three",
    marks: [[35, 34], [32, 30], [30, 32]],
  },
  {
    id: "ST004",
    name: "Student Four",
    marks: [[14, 16], [18, 15], [20, 17]],
  },
];

const results = students
  .map((student) => {
    const averages = student.marks.map(
      ([first, second]) => (first + second) / 2
    );

    const totalMarks = averages.reduce(
      (total, average, index) =>
        total + average * subjects[index].coefficient,
      0
    );

    const totalCoefficients = subjects.reduce(
      (total, subject) => total + subject.coefficient,
      0
    );

    return {
      ...student,
      averages,
      totalMarks,
      overallAverage: totalMarks / totalCoefficients,
    };
  })
  .sort((a, b) => b.totalMarks - a.totalMarks)
  .map((student, index) => ({
    ...student,
    position: index + 1,
  }));

export default function ClassResultsPage() {
  const classAverage =
    results.reduce((total, student) => total + student.overallAverage, 0) /
    results.length;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <header className="flex items-center justify-between border-b bg-white px-4 py-4 md:px-8">
        <div>
          <h1 className="text-xl font-bold text-blue-950">ScholarFlow</h1>
          <p className="text-xs text-slate-500">Class Results Review</p>
        </div>
        <Link href="/class-master" className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">
          Back to dashboard
        </Link>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <p className="text-sm font-semibold text-blue-700">CLASS MASTER WORKSPACE</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">
          Class results review
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Review calculated averages, weighted totals and student positions.
        </p>

        <section className="mt-7 rounded-2xl bg-blue-950 p-6 text-white">
          <p className="text-sm text-blue-200">FORM 4 · FIRST TERM · 2026/2027</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            <div>
              <p className="text-sm text-blue-200">Students</p>
              <p className="mt-1 text-3xl font-bold">{results.length}</p>
            </div>
            <div>
              <p className="text-sm text-blue-200">Subjects</p>
              <p className="mt-1 text-3xl font-bold">{subjects.length}</p>
            </div>
            <div>
              <p className="text-sm text-blue-200">Class average</p>
              <p className="mt-1 text-3xl font-bold">{classAverage.toFixed(2)}/40</p>
            </div>
          </div>
        </section>

        <section className="mt-7 rounded-2xl border bg-white p-5 shadow-sm">
          <h3 className="font-bold">Subject coefficients</h3>
          <div className="mt-4 flex flex-wrap gap-3">
            {subjects.map((subject) => (
              <div key={subject.name} className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-sm font-medium">{subject.name}</p>
                <p className="mt-1 text-sm text-slate-500">
                  Coefficient: <strong>{subject.coefficient}</strong>
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-7 overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="border-b p-5">
            <h3 className="font-bold">Student ranking</h3>
            <p className="mt-1 text-sm text-slate-500">
              Sorted automatically by total weighted marks.
            </p>
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-4">Position</th>
                  <th className="px-4 py-4">Student</th>
                  {subjects.map((subject) => (
                    <th key={subject.name} className="px-4 py-4">
                      {subject.name}
                    </th>
                  ))}
                  <th className="px-4 py-4">Total</th>
                  <th className="px-4 py-4">Average /40</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {results.map((student) => (
                  <tr key={student.id}>
                    <td className="px-4 py-4 font-bold">#{student.position}</td>
                    <td className="px-4 py-4">
                      <p className="font-semibold">{student.name}</p>
                      <p className="text-xs text-slate-400">{student.id}</p>
                    </td>
                    {student.averages.map((average, index) => (
                      <td key={index} className="px-4 py-4">
                        {average.toFixed(1)}
                      </td>
                    ))}
                    <td className="px-4 py-4 font-semibold">
                      {student.totalMarks.toFixed(1)}
                    </td>
                    <td className={`px-4 py-4 font-bold ${
                      student.overallAverage < classAverage ? "text-red-600" : "text-blue-700"
                    }`}>
                      {student.overallAverage.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 p-4 md:hidden">
            {results.map((student) => (
              <div key={student.id} className="rounded-xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{student.name}</p>
                    <p className="text-xs text-slate-400">{student.id}</p>
                  </div>
                  <span className="rounded-lg bg-blue-50 px-3 py-1 text-sm font-bold text-blue-800">
                    #{student.position}
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  {subjects.map((subject, index) => (
                    <div key={subject.name} className="flex justify-between text-sm">
                      <span className="text-slate-500">{subject.name}</span>
                      <strong>{student.averages[index].toFixed(1)}/40</strong>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex justify-between border-t pt-3">
                  <div>
                    <p className="text-xs text-slate-500">Weighted total</p>
                    <strong>{student.totalMarks.toFixed(1)}</strong>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Overall average</p>
                    <strong className={student.overallAverage < classAverage ? "text-red-600" : "text-blue-700"}>
                      {student.overallAverage.toFixed(2)}/40
                    </strong>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t bg-slate-50 p-4 text-xs text-slate-500">
            Sample results only. Actual student records, coefficients and school grading rules will come from the database.
          </div>
        </section>
      </div>
    </main>
  );
}
