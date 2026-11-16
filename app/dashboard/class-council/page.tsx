
"use client";

import { useState } from "react";

const initialStudents = [
  { id: "ST001", name: "Daniel Mbah", average: 28.5, position: 1, decision: "Promoted", remark: "Very Good" },
  { id: "ST002", name: "Grace Nfor", average: 24.2, position: 2, decision: "Promoted", remark: "Good" },
  { id: "ST003", name: "Samuel Ako", average: 17.8, position: 3, decision: "To Repeat", remark: "Needs improvement" },
  { id: "ST004", name: "Mary Tanyi", average: 14.5, position: 4, decision: "To Repeat", remark: "Poor" },
];

const remarkOptions = ["Excellent", "Very Good", "Good", "Fair", "Needs improvement", "Poor", "Very Poor"];
const decisionOptions = ["Promoted", "To Repeat", "Conditional Promotion", "Pending"];

export default function ClassCouncilPage() {
  const [students, setStudents] = useState(initialStudents);
  const [className, setClassName] = useState("Form 4");
  const [generalRemark, setGeneralRemark] = useState("");
  const [meetingDate, setMeetingDate] = useState("2026-11-16");
  const [message, setMessage] = useState("");

  function updateStudent(id: string, field: "remark" | "decision", value: string) {
    setStudents(current => current.map(s => s.id === id ? { ...s, [field]: value } : s));
  }

  function saveCouncil() {
    setMessage("Class council records saved in this preview only. Database saving will be connected later.");
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <p className="text-sm font-semibold text-blue-700">ACADEMICS / CLASS COUNCIL</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Class Council</h1>
          <p className="mt-2 text-sm text-slate-500">Review student performance, record decisions and prepare council remarks.</p>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Class</label>
              <select value={className} onChange={e => setClassName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 text-sm">
                <option>Form 1</option><option>Form 2</option><option>Form 3</option>
                <option>Form 4</option><option>Form 5</option><option>Lower Sixth</option><option>Upper Sixth</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Council meeting date</label>
              <input type="date" value={meetingDate} onChange={e => setMeetingDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 text-sm" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Academic session</label>
              <input value="2026/2027 · First Term" readOnly
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600" />
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-5">
            <h2 className="font-bold text-slate-900">Student council assessment</h2>
            <p className="mt-1 text-sm text-slate-500">Review each student&apos;s average, position, remark and proposed decision.</p>
          </div>

          <div className="divide-y divide-slate-100">
            {students.map(student => (
              <div key={student.id} className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-[1.2fr_0.5fr_0.6fr_1fr_1fr] lg:items-center">
                <div>
                  <p className="font-semibold text-slate-900">{student.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{student.id} · {className}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Average</p>
                  <p className={`mt-1 font-bold ${student.average < 20 ? "text-red-600" : "text-blue-700"}`}>
                    {student.average.toFixed(2)}/40
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Position</p>
                  <p className="mt-1 font-semibold text-slate-800">{student.position}</p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Teacher&apos;s remark</label>
                  <select value={student.remark} onChange={e => updateStudent(student.id, "remark", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm">
                    {remarkOptions.map(option => <option key={option}>{option}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Council decision</label>
                  <select value={student.decision} onChange={e => updateStudent(student.id, "decision", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm">
                    {decisionOptions.map(option => <option key={option}>{option}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-900">General class council remarks</h2>
          <textarea value={generalRemark} onChange={e => setGeneralRemark(e.target.value)}
            rows={4} placeholder="Enter general observations, class performance and recommendations..."
            className="mt-3 w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-blue-600" />
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button onClick={() => window.print()}
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Print council record
            </button>
            <button onClick={saveCouncil}
              className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800">
              Save council record
            </button>
          </div>
          {message && <p className="mt-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-800">{message}</p>}
        </section>

        <p className="text-xs text-slate-400">Sample students and decisions only. Final promotion rules and council terminology will be configured to match the school&apos;s approved procedure.</p>
      </div>
      <style jsx global>{`@media print { body { background: white !important; } @page { size: A4 landscape; margin: 12mm; } }`}</style>
    </main>
  );
}
