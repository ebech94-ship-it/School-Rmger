
"use client";

import { useMemo, useState } from "react";

type Subject = {
  name: string;
  teacher: string;
  category: "A" | "B" | "PE" | "C";
  coefficient: number;
  s1: number | null;
  s2: number | null;
};

const students = [
  {
    id: "ST001",
    admissionNumber: "GTHS/2026/001",
    name: "Daniel Mbah",
    className: "Form 4",
    specialty: "Electrical Power Systems",
    stream: "Industrial",
    gender: "M",
    dateOfBirth: "12/04/2010",
    repeater: "No",
  },
  {
    id: "ST002",
    admissionNumber: "GTHS/2026/002",
    name: "Grace Nfor",
    className: "Form 4",
    specialty: "Electrical Power Systems",
    stream: "Industrial",
    gender: "F",
    dateOfBirth: "08/09/2010",
    repeater: "No",
  },
  {
    id: "ST003",
    admissionNumber: "GTHS/2026/003",
    name: "Samuel Ako",
    className: "Form 5",
    specialty: "Electrical Power Systems",
    stream: "Industrial",
    gender: "M",
    dateOfBirth: "21/01/2009",
    repeater: "Yes",
  },
];

const subjects: Subject[] = [
  {
    name: "Mathematics",
    teacher: "Mrs. Nfor",
    category: "A",
    coefficient: 4,
    s1: 28,
    s2: 32,
  },
  {
    name: "English Language",
    teacher: "Mr. Ako",
    category: "A",
    coefficient: 3,
    s1: 30,
    s2: 26,
  },
  {
    name: "Electrical Power Systems",
    teacher: "Mr. Mbah",
    category: "B",
    coefficient: 5,
    s1: 34,
    s2: 31,
  },
  {
    name: "Electrical Installation",
    teacher: "Mr. Mbah",
    category: "B",
    coefficient: 4,
    s1: 25,
    s2: 29,
  },
  {
    name: "Physical Education",
    teacher: "Mr. Fong",
    category: "PE",
    coefficient: 1,
    s1: 35,
    s2: 36,
  },
];

const performance = [
  ["Excellent", "18–20"],
  ["Very Good", "16–17"],
  ["Good", "14–15"],
  ["Satisfactory", "12–13"],
  ["Passable", "10–11"],
  ["Poor", "08–09"],
  ["Very Weak", "06–07"],
  ["Insufficient", "00–05"],
];

const discipline = [
  "Excellent",
  "Very Good",
  "Good",
  "Satisfactory",
  "Fair",
  "Poor",
];

function average(s: Subject) {
  if (s.s1 === null || s.s2 === null) return null;
  return (s.s1 + s.s2) / 2;
}

function sectionTotals(rows: Subject[]) {
  const completed = rows.filter(
    (s) => average(s) !== null
  );

  const coefficient = completed.reduce(
    (sum, s) => sum + s.coefficient,
    0
  );

  const total = completed.reduce(
    (sum, s) => sum + (average(s) ?? 0) * s.coefficient,
    0
  );

  return {
    coefficient,
    total,
    average: coefficient ? total / coefficient : null,
  };
}

export default function ReportsPage() {
  const [studentId, setStudentId] = useState("ST001");
  const [term, setTerm] = useState("First Term");

  const student =
    students.find((s) => s.id === studentId) ?? students[0];

  const sections = useMemo(
    () => ({
      A: subjects.filter((s) => s.category === "A"),
      B: subjects.filter((s) => s.category === "B"),
      PE: subjects.filter((s) => s.category === "PE"),
      C: subjects.filter((s) => s.category === "C"),
    }),
    []
  );

  const totalA = sectionTotals(sections.A);
  const totalB = sectionTotals(sections.B);
  const totalPE = sectionTotals(sections.PE);
  const totalC = sectionTotals(sections.C);

  const allAcademicSubjects = [
    ...sections.A,
    ...sections.B,
    ...sections.C,
  ];

  const grand = sectionTotals(allAcademicSubjects);
  const termAverage = grand.average === null
    ? null
    : grand.average / 2;

  const categoryLabels = {
    A: "A. GENERAL EDUCATION",
    B: "B. PROFESSIONAL EDUCATION",
    PE: "SPORTS & PHYSICAL EDUCATION",
    C: "OTHER SUBJECTS (C)",
  };

  function subjectRows(rows: Subject[]) {
    return rows.map((s) => {
      const avg = average(s);
      const total = avg === null ? null : avg * s.coefficient;

      return (
        <tr key={s.name}>
          <td className="subject-name">{s.name}</td>
          <td>{s.teacher}</td>
          <td>{s.s1 ?? "—"}</td>
          <td>{s.s2 ?? "—"}</td>
          <td className="bold">
            {avg === null ? "—" : avg.toFixed(1)}
          </td>
          <td>{s.coefficient}</td>
          <td className="bold">
            {total === null ? "—" : total.toFixed(1)}
          </td>
          <td></td>
        </tr>
      );
    });
  }

  function sectionTable(
    label: string,
    rows: Subject[],
    totals: ReturnType<typeof sectionTotals>
  ) {
    return (
      <>
        <tr className="section-heading">
          <td colSpan={8}>{label}</td>
        </tr>

        {subjectRows(rows)}

        <tr className="section-total">
          <td colSpan={2}>SECTION TOTAL</td>
          <td colSpan={3}>
            TOTAL COEFFICIENT: {totals.coefficient || "—"}
          </td>
          <td colSpan={2}>
            TOTAL: {totals.total ? totals.total.toFixed(1) : "—"}
          </td>
          <td>
            AVG /20:{" "}
            {totals.average === null
              ? "—"
              : (totals.average / 2).toFixed(2)}
          </td>
        </tr>
      </>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-3 sm:p-5">
      <div className="mx-auto max-w-6xl space-y-4">

        <div className="print:hidden">
          <p className="text-sm font-semibold text-blue-700">
            ACADEMICS / REPORTS
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Student Progress Reports
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Select a student and academic period to preview and print the progress record.
          </p>
        </div>

        <section className="print:hidden rounded-xl border border-slate-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Student
              </label>
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.className})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Academic period
              </label>
              <select
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
              >
                <option>First Term</option>
                <option>Second Term</option>
                <option>Third Term</option>
                <option>Annual Report</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => window.print()}
                className="w-full rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
              >
                Print Progress Record
              </button>
            </div>
          </div>
        </section>

        <article className="report bg-white p-3 shadow-sm sm:p-5">

          {/* OFFICIAL LETTERHEAD */}
          <header className="letterhead">
            <div className="ministry">
              Ministère de l&apos; Enseignement
              <br />
              Secondaire
              <div className="ministry-line" />
            </div>

            <div className="school-title">
              <h2>GOVERNMENT TECHNICAL HIGH SCHOOL</h2>
              <h3>GTHS KUMBO</h3>
              <div className="progress-title">
                PROGRESS RECORD
              </div>
            </div>

            <div className="ministry">
              Ministry of Secondary
              <br />
              Education
              <div className="ministry-line" />
            </div>
          </header>

          {/* STUDENT INFORMATION */}
          <section className="student-info">
            <div className="cycle-line">
              <strong>1st CYCLE INDUSTRIAL</strong>
              <span>
                Academic Year: 2026 / 2027
              </span>
            </div>

            <div className="info-row">
              <div>
                <strong>Name:</strong>
                <span>{student.name}</span>
              </div>
              <div>
                <strong>Academic Year:</strong>
                <span>2026 / 2027</span>
              </div>
            </div>

            <div className="info-row">
              <div>
                <strong>Speciality:</strong>
                <span>{student.specialty}</span>
              </div>
              <div>
                <strong>Stream:</strong>
                <span>{student.stream}</span>
              </div>
            </div>

            <div className="info-row">
              <div>
                <strong>Date of Birth:</strong>
                <span>{student.dateOfBirth}</span>
              </div>
              <div>
                <strong>Class:</strong>
                <span>{student.className}</span>
                <strong className="repeater-label">Repeater (Y/N):</strong>
                <span>{student.repeater}</span>
              </div>
            </div>

            <div className="info-row">
              <div>
                <strong>Admission No / ID:</strong>
                <span>
                  {student.admissionNumber} / {student.id}
                </span>
              </div>
              <div>
                <strong>Student&apos;s No:</strong>
                <span>{student.id}</span>
              </div>
            </div>
          </section>

          {/* MAIN SUBJECT TABLE */}
          <section className="marks-section">
            <table className="marks-table">
              <thead>
                <tr>
                  <th className="subject-column">SUBJECT</th>
                  <th>TEACHER</th>
                  <th>SEQ. 1<br />/40</th>
                  <th>SEQ. 2<br />/40</th>
                  <th>AVERAGE<br />/40</th>
                  <th>COEFF.</th>
                  <th>T. MARKS</th>
                  <th>GRADE / REMARKS</th>
                </tr>
              </thead>

              <tbody>
                {sectionTable(
                  categoryLabels.A,
                  sections.A,
                  totalA
                )}

                {sectionTable(
                  categoryLabels.B,
                  sections.B,
                  totalB
                )}

                <tr className="section-heading">
                  <td colSpan={8}>
                    SPORTS AND PHYSICAL EDUCATION
                  </td>
                </tr>
                {subjectRows(sections.PE)}
                <tr className="section-total">
                  <td colSpan={2}>PHYSICAL EDUCATION</td>
                  <td colSpan={3}>TOTAL</td>
                  <td colSpan={2}>
                    {totalPE.total ? totalPE.total.toFixed(1) : "—"}
                  </td>
                  <td>Credit(s)</td>
                </tr>

                <tr className="section-heading">
                  <td colSpan={8}>MANUAL LABOUR</td>
                </tr>
                <tr>
                  <td colSpan={8} className="empty-row"></td>
                </tr>

                {sectionTable(
                  categoryLabels.C,
                  sections.C,
                  totalC
                )}

                <tr className="grand-total">
                  <td colSpan={2}>GRAND TOTAL (A+B+C)</td>
                  <td colSpan={3}>
                    {grand.total.toFixed(1)}
                  </td>
                  <td colSpan={2}>AVERAGE</td>
                  <td>
                    {termAverage === null
                      ? "—"
                      : termAverage.toFixed(2) + " /20"}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* CLASS SUMMARY AND RECAPITULATION */}
          <section className="summary-grid">
            <div className="summary-left">
              <div>
                <strong>Class Average:</strong>
                <span>________ /20</span>
              </div>
              <div>
                <strong>Student&apos;s Position:</strong>
                <span>________ / ________</span>
              </div>
              <div>
                <strong>Passion:</strong>
                <span>________________</span>
              </div>
              <div>
                <strong>General Certificate:</strong>
                <span>____________ out of _____</span>
              </div>
            </div>

            <div className="recap">
              <div className="recap-title">RECAPITULATION</div>
              <div className="recap-columns">
                <div>
                  <p>1st Sequence Average: <b>____ /20</b></p>
                  <p>2nd Sequence Average: <b>____ /20</b></p>
                  <p>Term Average: <b>____ /20</b></p>
                  <p>Annual Average: <b>____ /20</b></p>
                </div>
                <div>
                  <p>1st Term Average: <b>____ /20</b></p>
                  <p>2nd Term Average: <b>____ /20</b></p>
                  <p>3rd Term Average: <b>____ /20</b></p>
                  <p>Annual Average: <b>____ /20</b></p>
                </div>
              </div>
            </div>
          </section>

          {/* PERFORMANCE, DISCIPLINE, DECISION AND STAMP */}
          <section className="bottom-grid">

            <div className="performance-table">
              <table>
                <thead>
                  <tr>
                    <th colSpan={2}>PERFORMANCE INDICATOR</th>
                  </tr>
                </thead>
                <tbody>
                  {performance.map(([label, score]) => (
                    <tr key={label}>
                      <td>{label}</td>
                      <td>{score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="discipline-table">
              <table>
                <thead>
                  <tr>
                    <th>DISCIPLINE</th>
                  </tr>
                </thead>
                <tbody>
                  {discipline.map((item) => (
                    <tr key={item}>
                      <td>{item}</td>
                    </tr>
                  ))}
                  <tr><td>&nbsp;</td></tr>
                  <tr><td>&nbsp;</td></tr>
                </tbody>
              </table>
            </div>

            <div className="decision-table">
              <table>
                <thead>
                  <tr>
                    <th>CLASS COUNCIL DECISION</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>PROMOTED</td></tr>
                  <tr><td>REPEAT</td></tr>
                  <tr><td>DISMISSED</td></tr>
                  <tr><td>CANNOT TRIPPLE</td></tr>
                </tbody>
              </table>
            </div>

            <div className="stamp-box">
              <strong>OFFICIAL STAMP</strong>
            </div>
          </section>

          <footer className="report-footer">
            <span>Class Master&apos;s Signature: __________________</span>
            <span>Principal&apos;s Signature: __________________</span>
          </footer>
        </article>
      </div>

      <style jsx global>{`
        .report {
          color: #102d59;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 9px;
          line-height: 1.2;
          border: 1.5px solid #174b91;
        }

        .letterhead {
          display: grid;
          grid-template-columns: 1fr 1.8fr 1fr;
          align-items: start;
          gap: 8px;
          text-align: center;
          color: #174b91;
          padding: 2px 0 8px;
        }

        .ministry {
          font-size: 10px;
          font-weight: 700;
          line-height: 1.25;
        }

        .ministry-line {
          border-bottom: 2px solid #174b91;
          width: 80%;
          margin: 5px auto 0;
        }

        .school-title h2 {
          font-size: 14px;
          font-weight: 900;
          line-height: 1.2;
        }

        .school-title h3 {
          font-size: 13px;
          font-weight: 900;
        }

        .progress-title {
          display: inline-block;
          margin-top: 5px;
          padding: 3px 13px;
          border: 3px double #174b91;
          border-radius: 20px;
          font-size: 16px;
          font-weight: 900;
          letter-spacing: .5px;
        }

        .student-info {
          margin: 2px 0 8px;
        }

        .cycle-line {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10px;
          padding: 2px 0 3px;
        }

        .info-row {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 12px;
          min-height: 19px;
          align-items: end;
        }

        .info-row > div {
          display: flex;
          gap: 4px;
          align-items: baseline;
          min-width: 0;
          border-bottom: 1px dotted #174b91;
          padding-bottom: 2px;
        }

        .info-row strong {
          white-space: nowrap;
        }

        .info-row span {
          font-weight: 600;
          overflow-wrap: anywhere;
        }

        .repeater-label {
          margin-left: 5px;
        }

        .marks-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          font-size: 8px;
        }

        .marks-table th,
        .marks-table td {
          border: 1px solid #174b91;
          padding: 3px 3px;
          text-align: center;
          overflow-wrap: anywhere;
        }

        .marks-table th {
          background: #174b91;
          color: white;
          font-size: 8px;
          font-weight: 800;
        }

        .marks-table th:first-child {
          width: 22%;
        }

        .marks-table th:nth-child(2) { width: 13%; }
        .marks-table th:nth-child(3),
        .marks-table th:nth-child(4),
        .marks-table th:nth-child(5) { width: 8%; }
        .marks-table th:nth-child(6) { width: 7%; }
        .marks-table th:nth-child(7) { width: 9%; }
        .marks-table th:nth-child(8) { width: 17%; }

        .marks-table .subject-name {
          text-align: left;
          padding-left: 5px;
          font-weight: 600;
        }

        .section-heading td {
          background: #e8effa;
          color: #123c78;
          text-align: left;
          font-weight: 900;
          padding: 4px;
        }

        .section-total td {
          background: #edf2fa;
          font-weight: 800;
        }

        .grand-total td {
          background: #dce8f8;
          font-weight: 900;
          font-size: 9px;
        }

        .bold {
          font-weight: 800;
        }

        .empty-row {
          height: 17px;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          border: 1px solid #174b91;
          border-top: 0;
        }

        .summary-left {
          padding: 5px;
          border-right: 1px solid #174b91;
        }

        .summary-left div {
          display: flex;
          justify-content: space-between;
          gap: 5px;
          padding: 3px 0;
          border-bottom: 1px dotted #9aaac1;
        }

        .summary-left span {
          font-weight: 700;
        }

        .recap-title {
          text-align: center;
          font-weight: 900;
          border-bottom: 1px solid #174b91;
          padding: 4px;
          background: #e8effa;
        }

        .recap-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
        }

        .recap-columns > div:first-child {
          border-right: 1px solid #174b91;
        }

        .recap-columns p {
          display: flex;
          justify-content: space-between;
          gap: 3px;
          padding: 4px;
          border-bottom: 1px solid #d1dbea;
          font-size: 8px;
        }

        .bottom-grid {
          display: grid;
          grid-template-columns: 1fr .9fr 1.25fr 1fr;
          border: 1px solid #174b91;
          border-top: 0;
        }

        .bottom-grid > div {
          min-width: 0;
          border-right: 1px solid #174b91;
        }

        .bottom-grid > div:last-child {
          border-right: 0;
        }

        .bottom-grid table {
          width: 100%;
          height: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          font-size: 8px;
        }

        .bottom-grid th,
        .bottom-grid td {
          border: 1px solid #174b91;
          padding: 3px;
          text-align: center;
        }

        .bottom-grid th {
          background: #e8effa;
          font-weight: 900;
        }

        .performance-table td:first-child {
          text-align: left;
        }

        .decision-table td {
          height: 25px;
          font-weight: 900;
          font-size: 9px;
        }

        .stamp-box {
          min-height: 150px;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 6px;
          text-align: center;
        }

        .stamp-box strong {
          font-size: 8px;
        }

        .report-footer {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 3px 3px;
          font-size: 8px;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 7mm;
          }

          html,
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          body * {
            visibility: hidden;
          }

          .report,
          .report * {
            visibility: visible;
          }

          .report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 3mm;
            box-shadow: none !important;
            border: 1.5px solid #174b91;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .print\\:hidden {
            display: none !important;
          }

          .marks-table tr,
          .summary-grid,
          .bottom-grid {
            break-inside: avoid;
          }
        }

        @media screen and (max-width: 640px) {
          .report {
            min-width: 650px;
          }

          .report {
            transform-origin: top left;
          }
        }
      `}</style>
    </main>
  );
}
