
"use client";

import { useMemo, useState } from "react";
import {
  collection,
  doc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type SchoolClass = {
  id: string;
  name: string;
  status: string;
};

type ExistingStudent = {
  id: string;
  admissionNumber: string;
};

type ImportRow = {
  admissionNumber: string;
  fullName: string;
  gender: string;
};

type Props = {
  schoolId: string;
  selectedYear: string;
  classes: SchoolClass[];
  existingStudents: ExistingStudent[];
  onImported: () => void;
};

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '"' && insideQuotes && text[i + 1] === '"') {
      cell += '"';
      i++;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(cell.trim());
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell.trim());
  if (row.some((value) => value !== "")) rows.push(row);

  return rows;
}

function findColumn(headers: string[], names: string[]) {
  return headers.findIndex((header) =>
    names.includes(header.toLowerCase().replace(/[^a-z0-9]/g, ""))
  );
}

export default function StudentBulkImport({
  schoolId,
  selectedYear,
  classes,
  existingStudents,
  onImported,
}: Props) {
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [classId, setClassId] = useState("");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedClass = classes.find(
    (schoolClass) => schoolClass.id === classId
  );

  const validation = useMemo(() => {
    const existingNumbers = new Set(
      existingStudents.map((student) =>
        student.admissionNumber.trim().toUpperCase()
      )
    );

    const seen = new Set<string>();

    return rows.map((row) => {
      const admission = row.admissionNumber.trim().toUpperCase();
      const issues: string[] = [];

      if (!admission) issues.push("Missing admission number");
      if (!row.fullName.trim()) issues.push("Missing student name");

      if (admission && existingNumbers.has(admission)) {
        issues.push("Admission number already exists");
      }

      if (admission && seen.has(admission)) {
        issues.push("Duplicate in this file");
      }

      if (admission) seen.add(admission);

      if (
        row.gender.trim() &&
        !["male", "female"].includes(row.gender.trim().toLowerCase())
      ) {
        issues.push("Gender must be Male or Female");
      }

      return issues;
    });
  }, [rows, existingStudents]);

  const validCount = validation.filter((issues) => issues.length === 0).length;
  const invalidCount = rows.length - validCount;

  async function handleFile(file?: File) {
    setError("");
    setMessage("");
    setRows([]);
    setFileName("");

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError(
        "Unsupported file. This importer currently accepts CSV files only."
      );
      return;
    }

    try {
      const text = await file.text();
      const parsed = parseCSV(text);

      if (parsed.length < 2) {
        setError("The CSV must contain a header row and at least one student.");
        return;
      }

      const headers = parsed[0].map((header) =>
        header.replace(/^\uFEFF/, "").trim()
      );

      const admissionIndex = findColumn(headers, [
        "admissionnumber",
        "admissionno",
        "admission",
        "registrationnumber",
        "regnumber",
        "matriculenumber",
        "matricule",
      ]);

      const nameIndex = findColumn(headers, [
        "fullname",
        "studentname",
        "name",
        "names",
      ]);

      const genderIndex = findColumn(headers, ["gender", "sex"]);

      if (admissionIndex < 0 || nameIndex < 0) {
        setError(
          "Required columns not found. Your CSV needs Admission Number and Full Name columns."
        );
        return;
      }

      const imported = parsed.slice(1).map((record) => ({
        admissionNumber: record[admissionIndex] || "",
        fullName: record[nameIndex] || "",
        gender:
          genderIndex >= 0 && record[genderIndex]
            ? record[genderIndex]
            : "Male",
      }));

      setRows(imported);
      setFileName(file.name);
      setMessage(`${imported.length} student records loaded for review.`);
    } catch {
      setError("Could not read this CSV file.");
    }
  }

  function updateRow(
    index: number,
    field: keyof ImportRow,
    value: string
  ) {
    setRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row
      )
    );
  }

  async function confirmImport() {
    setError("");
    setMessage("");

    if (!schoolId || !selectedYear) {
      setError("Select an academic year before importing students.");
      return;
    }

    if (!selectedClass || selectedClass.status !== "active") {
      setError("Select an active class for these students.");
      return;
    }

    if (rows.length === 0 || invalidCount > 0) {
      setError("Correct all invalid records before importing.");
      return;
    }

    if (
      !window.confirm(
        `Import ${rows.length} students into ${selectedClass.name}? This will create student and enrolment records.`
      )
    ) {
      return;
    }

    setSaving(true);
    let importedCount = 0;

    try {
      const studentsRef = collection(
        db,
        "schools",
        schoolId,
        "students"
      );

      const enrollmentsRef = collection(
        db,
        "schools",
        schoolId,
        "academicYears",
        selectedYear,
        "enrollments"
      );

      // 200 students = 400 Firestore writes per batch.
      for (let start = 0; start < rows.length; start += 200) {
        const batch = writeBatch(db);
        const group = rows.slice(start, start + 200);

        for (const row of group) {
          const studentRef = doc(studentsRef);
          const enrollmentRef = doc(enrollmentsRef, studentRef.id);

          batch.set(studentRef, {
            admissionNumber: row.admissionNumber.trim().toUpperCase(),
            fullName: row.fullName.trim(),
            gender: row.gender.trim()
              ? row.gender.trim().toLowerCase() === "female"
                ? "Female"
                : "Male"
              : "Male",
            status: "active",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          batch.set(enrollmentRef, {
            studentId: studentRef.id,
            classId: selectedClass.id,
            className: selectedClass.name,
            status: "active",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        await batch.commit();
        importedCount += group.length;
      }

      setMessage(
        `Successfully imported ${importedCount} students into ${selectedClass.name}.`
      );
      setRows([]);
      setFileName("");
      onImported();
    } catch {
      setError(
        `${importedCount} students were imported before an error occurred. Please check the register before retrying, to avoid duplicates.`
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-blue-700">
          Bulk registration
        </p>
        <h2 className="mt-2 text-xl font-bold text-slate-950">
          Import students from a spreadsheet
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Upload a CSV class list, review the extracted records, correct any
          errors and approve the import.
        </p>
      </div>

      <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
        Required CSV columns: <strong>Admission Number</strong> and{" "}
        <strong>Full Name</strong>. Gender is optional. Save Excel files as CSV
        before uploading.
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Select destination class
          </label>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="min-h-12 w-full rounded-xl border-2 border-slate-300 bg-white px-3"
          >
            <option value="">Choose a class</option>
            {classes
              .filter((item) => item.status === "active")
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Choose CSV file
          </label>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => handleFile(e.target.files?.[0])}
            className="block min-h-12 w-full rounded-xl border border-slate-300 p-2 text-sm"
          />
        </div>
      </div>

      {fileName && (
        <p className="mt-3 text-sm text-slate-600">
          Selected file: <strong>{fileName}</strong>
        </p>
      )}

      {message && (
        <p role="status" className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">
          {message}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {rows.length > 0 && (
        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900">Review imported records</h3>
              <p className="mt-1 text-sm text-slate-600">
                {validCount} valid · {invalidCount} need correction · {rows.length} total
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setRows([]);
                setFileName("");
                setMessage("");
                setError("");
              }}
              className="text-sm font-semibold text-slate-600 underline"
            >
              Clear import
            </button>
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="p-3">Admission number</th>
                  <th className="p-3">Full name</th>
                  <th className="p-3">Gender</th>
                  <th className="p-3">Validation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rows.map((row, index) => (
                  <tr key={index}>
                    <td className="p-2">
                      <input
                        value={row.admissionNumber}
                        onChange={(e) =>
                          updateRow(index, "admissionNumber", e.target.value)
                        }
                        className="w-full rounded-lg border border-slate-300 p-2"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        value={row.fullName}
                        onChange={(e) =>
                          updateRow(index, "fullName", e.target.value)
                        }
                        className="w-full rounded-lg border border-slate-300 p-2"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={row.gender}
                        onChange={(e) =>
                          updateRow(index, "gender", e.target.value)
                        }
                        className="w-full rounded-lg border border-slate-300 p-2"
                      >
                        <option>Male</option>
                        <option>Female</option>
                      </select>
                    </td>
                    <td className="p-3">
                      {validation[index].length === 0 ? (
                        <span className="font-semibold text-green-700">Valid</span>
                      ) : (
                        <span className="font-medium text-red-700">
                          {validation[index].join("; ")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={confirmImport}
            disabled={
              saving ||
              invalidCount > 0 ||
              !classId ||
              !selectedYear
            }
            className="mt-5 min-h-12 rounded-xl bg-blue-800 px-6 py-3 font-bold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Importing students..." : `Approve and import ${rows.length} students`}
          </button>
        </div>
      )}
    </section>
  );
}
