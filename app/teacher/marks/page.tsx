
"use client";

import { useState } from "react";
import Link from "next/link";

const students = [
  { id: "ST001", name: "Student One" },
  { id: "ST002", name: "Student Two" },
  { id: "ST003", name: "Student Three" },
  { id: "ST004", name: "Student Four" },
  { id: "ST005", name: "Student Five" },
];

export default function MarksEntryPage() {
  const [className, setClassName] = useState("Form 4");
  const [subject, setSubject] = useState("Electrical Installation");
  const [marks, setMarks] = useState<Record<string, { first: string; second: string }>>({});
  const [message, setMessage] = useState("");

  function updateMark(id: string, field: "first" | "second", value: string) {
    if (value !== "" && (!/^\d+(\.\d{0,2})?$/.test(value) || Number(value) > 40)) return;

    setMarks((previous) => ({
      ...previous,
      [id]: {
        first: previous[id]?.first ?? "",
        second: previous[id]?.second ?? "",
        [field]: value,
      },
    }));

    setMessage("");
  }

  function average(id: string) {
    const first = marks[id]?.first;
    const second = marks[id]?.second;

    if (first === undefined || first === "" || second === undefined || second === "") {
      return null;
    }

    return (Number(first) + Number(second)) / 2;
  }

  function reviewEntries() {
    const incomplete = students.filter((student) => {
      const entry = marks[student.id];
      return !entry?.first || !entry?.second;
    });

    if (incomplete.length > 0) {
      setMessage(`${incomplete.length} student(s) still have missing marks.`);
      return;
    }

    setMessage("All marks are entered. Database saving will be connected later.");
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <header className="flex items-center justify-between border-b bg-white px-4 py-4 md:px-8">
        <div>
          <h1 className="text-xl font-bold text-blue-950">ScholarFlow</h1>
          <p className="text-xs text-slate-500">Marks Management</p>
        </div>
        <Link href="/teacher" className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50">
          Back to dashboard
        </Link>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-7 md:px-8">
        <p className="text-sm font-semibold text-blue-700">TEACHER WORKSPACE</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">Enter student&apos;s marks</h2>
        <p className="mt-2 text-sm text-slate-500">
          Record both sequence marks. Each mark must be out of 40.
        </p>

        <section className="mt-7 grid gap-4 rounded-2xl border bg-white p-5 shadow-sm md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold">Select class</label>
            <select
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 outline-none focus:border-blue-600"
            >
              <option>Form 3</option>
              <option>Form 4</option>
              <option>Form 5</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Select subject</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 outline-none focus:border-blue-600"
            >
              <option>Electrical Installation</option>
              <option>Electrical Power Systems</option>
              <option>Basic Electricity</option>
            </select>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="border-b p-5">
            <h3 className="font-bold text-slate-900">{className} · {subject}</h3>
            <p className="mt-1 text-sm text-slate-500">
              First Term · 2026/2027 · {students.length} sample students
            </p>
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">Student</th>
                  <th className="px-5 py-4">Sequence 1 /40</th>
                  <th className="px-5 py-4">Sequence 2 /40</th>
                  <th className="px-5 py-4">Average /40</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {students.map((student) => (
                  <tr key={student.id}>
                    <td className="px-5 py-4">
                      <p className="font-semibold">{student.name}</p>
                      <p className="text-xs text-slate-400">{student.id}</p>
                    </td>
                    <td className="px-5 py-4">
                      <input
                        type="number" min="0" max="40" step="0.5"
                        value={marks[student.id]?.first ?? ""}
                        onChange={(e) => updateMark(student.id, "first", e.target.value)}
                        className="w-24 rounded-lg border p-2 outline-none focus:border-blue-600"
                        placeholder="0–40"
                      />
                    </td>
                    <td className="px-5 py-4">
                      <input
                        type="number" min="0" max="40" step="0.5"
                        value={marks[student.id]?.second ?? ""}
                        onChange={(e) => updateMark(student.id, "second", e.target.value)}
                        className="w-24 rounded-lg border p-2 outline-none focus:border-blue-600"
                        placeholder="0–40"
                      />
                    </td>
                    <td className="px-5 py-4 font-bold">
                      {average(student.id) === null ? "—" : average(student.id)?.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-4 p-4 md:hidden">
            {students.map((student) => (
              <div key={student.id} className="rounded-xl border p-4">
                <div className="mb-4">
                  <p className="font-semibold">{student.name}</p>
                  <p className="text-xs text-slate-400">{student.id}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Sequence 1 /40</label>
                    <input
                      type="number" min="0" max="40" step="0.5"
                      value={marks[student.id]?.first ?? ""}
                      onChange={(e) => updateMark(student.id, "first", e.target.value)}
                      className="w-full rounded-lg border p-3 outline-none focus:border-blue-600"
                      placeholder="0–40"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Sequence 2 /40</label>
                    <input
                      type="number" min="0" max="40" step="0.5"
                      value={marks[student.id]?.second ?? ""}
                      onChange={(e) => updateMark(student.id, "second", e.target.value)}
                      className="w-full rounded-lg border p-3 outline-none focus:border-blue-600"
                      placeholder="0–40"
                    />
                  </div>
                </div>
                <div className="mt-3 flex justify-between border-t pt-3 text-sm">
                  <span className="text-slate-500">Average</span>
                  <strong>{average(student.id) === null ? "—" : average(student.id)?.toFixed(1) + " / 40"}</strong>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t bg-slate-50 p-5">
            {message && (
              <p className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
                {message}
              </p>
            )}
            <button
              onClick={reviewEntries}
              className="w-full rounded-xl bg-blue-950 px-6 py-3 font-semibold text-white hover:bg-blue-900 md:w-auto"
            >
              Review marks
            </button>
            <p className="mt-3 text-xs text-slate-400">
              Prototype only: marks are not yet saved to a database.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
