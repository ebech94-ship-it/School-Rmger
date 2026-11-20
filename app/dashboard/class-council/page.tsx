
"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

type AcademicYear = { id: string; name: string; isActive: boolean };
type Term = { id: string; name: string; order: number; status: string };
type SchoolClass = {
  id: string;
  name: string;
  level: string;
  department: string;
  stream: string;
  status: string;
};
type Student = {
  id: string;
  admissionNumber: string;
  fullName: string;
  gender: string;
  status: string;
};
type Enrollment = {
  id: string;
  studentId: string;
  classId: string;
  className: string;
  status: string;
};
type TeacherAssignment = {
  id: string;
  teacherId: string;
  teacherName: string;
  academicYearId: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  status: string;
};
type Subject = {
  id: string;
  name: string;
  category: string;
  coefficient?: number;
  coefficientsByForm?: Record<string, number>;
  coefficientNeedsReview?: boolean;
  status: string;
};
type Mark = {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  subjectId: string;
  sequence1: number | null;
  sequence2: number | null;
  status: string;
};

type CouncilEdit = {
  remark: string;
  decision: string;
};

const remarkOptions = [
  "Excellent",
  "Very Good",
  "Good",
  "Fair",
  "Needs improvement",
  "Poor",
  "Very Poor",
];

const decisionOptions = [
  "Promoted",
  "To Repeat",
  "Conditional Promotion",
  "Pending",
];

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : null;
}

function display(value: number | null): string {
  return value === null ? "—" : value.toFixed(2);
}

function getFormKey(schoolClass: SchoolClass): string {
  const text = `${schoolClass.level} ${schoolClass.name}`;
  const match = text.match(/form\s*([1-5])/i);

  if (match) return `Form${match[1]}`;

  const numberMatch = text.match(/\b([1-5])\b/);
  return numberMatch ? `Form${numberMatch[1]}` : "";
}

function getCoefficient(
  subject: Subject | undefined,
  schoolClass: SchoolClass
): number | null {
  if (!subject || subject.coefficientNeedsReview) return null;

  const formKey = getFormKey(schoolClass);
  const formCoefficient = formKey
    ? subject.coefficientsByForm?.[formKey]
    : undefined;

  const coefficient =
    typeof formCoefficient === "number"
      ? formCoefficient
      : subject.coefficient;

  return typeof coefficient === "number" &&
    Number.isFinite(coefficient) &&
    coefficient > 0
    ? coefficient
    : null;
}

export default function ClassCouncilPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [schoolId, setSchoolId] = useState("");
  const [userId, setUserId] = useState("");

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);

  const [selectedYear, setSelectedYear] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("");

  const [edits, setEdits] = useState<Record<string, CouncilEdit>>({});
  const [generalRemark, setGeneralRemark] = useState("");

  // Load school records
  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const profileSnap = await getDoc(doc(db, "users", user.uid));

        if (!profileSnap.exists()) {
          throw new Error("User profile was not found.");
        }

        const profile = profileSnap.data();

        if (
          profile.role !== "technical_admin" ||
          profile.active !== true ||
          !profile.schoolId
        ) {
          throw new Error("You are not authorized to access Class Council.");
        }

        const currentSchoolId = profile.schoolId;

        const [
          yearsSnap,
          classesSnap,
          studentsSnap,
          subjectsSnap,
          assignmentsSnap,
        ] = await Promise.all([
          getDocs(collection(db, "schools", currentSchoolId, "academicYears")),
          getDocs(collection(db, "schools", currentSchoolId, "classes")),
          getDocs(collection(db, "schools", currentSchoolId, "students")),
          getDocs(collection(db, "schools", currentSchoolId, "subjects")),
          getDocs(collection(db, "schools", currentSchoolId, "teacherAssignments")),
        ]);

        if (!active) return;

        const years = yearsSnap.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })) as AcademicYear[];

        setSchoolId(currentSchoolId);
        setUserId(user.uid);
        setAcademicYears(years);

        const loadedClasses = classesSnap.docs.map((item) => ({
  id: item.id,
  ...item.data(),
})) as SchoolClass[];

setClasses(loadedClasses);
setSelectedClass(loadedClasses[0]?.id || "");

        setStudents(
          studentsSnap.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          })) as Student[]
        );

        setSubjects(
          subjectsSnap.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          })) as Subject[]
        );

        setAssignments(
          assignmentsSnap.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          })) as TeacherAssignment[]
        );

        const activeYear = years.find((year) => year.isActive);
        setSelectedYear(activeYear?.id || years[0]?.id || "");

        if (years.length === 0) {
          setError("No academic year has been created yet.");
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Unable to load school data."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [router]);

  // Load terms for selected year
  useEffect(() => {
    let active = true;

    async function loadTerms() {
      if (!schoolId || !selectedYear) return;

      try {
        const snapshot = await getDocs(
          collection(
            db,
            "schools",
            schoolId,
            "academicYears",
            selectedYear,
            "terms"
          )
        );

        if (!active) return;

        const loaded = snapshot.docs
          .map((item) => ({
            id: item.id,
            ...item.data(),
          }) as Term)
          .sort((a, b) => a.order - b.order);

        setTerms(loaded);

        const openTerm = loaded.find((term) => term.status === "open");
        setSelectedTerm(openTerm?.id || loaded[0]?.id || "");
      } catch {
        if (active) setError("Unable to load academic terms.");
      }
    }

    loadTerms();

    return () => {
      active = false;
    };
  }, [schoolId, selectedYear]);


  // Load enrollments, marks and previously saved council record
  useEffect(() => {
    let active = true;

    async function loadClassData() {
      if (!schoolId || !selectedYear || !selectedTerm || !selectedClass) {
        return;
      }

      try {
        setDataLoading(true);
        setError("");
        setMessage("");

        const [enrollmentSnap, marksSnap, councilSnap] = await Promise.all([
          getDocs(
            collection(
              db,
              "schools",
              schoolId,
              "academicYears",
              selectedYear,
              "enrollments"
            )
          ),
          getDocs(
            collection(
              db,
              "schools",
              schoolId,
              "academicYears",
              selectedYear,
              "terms",
              selectedTerm,
              "marks"
            )
          ),
          getDoc(
            doc(
              db,
              "schools",
              schoolId,
              "academicYears",
              selectedYear,
              "terms",
              selectedTerm,
              "classCouncils",
              selectedClass
            )
          ),
        ]);

        if (!active) return;

        setEnrollments(
          enrollmentSnap.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          })) as Enrollment[]
        );

        setMarks(
          marksSnap.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          })) as Mark[]
        );

        if (councilSnap.exists()) {
          const saved = councilSnap.data();

          const savedEdits: Record<string, CouncilEdit> = {};

          if (Array.isArray(saved.students)) {
           saved.students.forEach(
  (student: {
    studentId?: string;
    remark?: string;
    decision?: string;
  }) => {
              if (student.studentId) {
                savedEdits[student.studentId] = {
                  remark: student.remark || "Good",
                  decision: student.decision || "Pending",
                };
              }
            });
          }

          setEdits(savedEdits);
          setGeneralRemark(saved.generalRemark || "");
        } else {
          setEdits({});
          setGeneralRemark("");
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load class council data."
          );
        }
      } finally {
        if (active) setDataLoading(false);
      }
    }

    loadClassData();

    return () => {
      active = false;
    };
  }, [schoolId, selectedYear, selectedTerm, selectedClass]);

  const currentClass = classes.find((item) => item.id === selectedClass);
  const currentYear = academicYears.find((item) => item.id === selectedYear);
  const currentTerm = terms.find((item) => item.id === selectedTerm);

  const classAssignments = useMemo(() => {
    if (!currentClass) return [];

    const filtered = assignments.filter(
      (item) =>
        item.status === "active" &&
        item.academicYearId === selectedYear &&
        item.classId === selectedClass
    );

    return Array.from(
      new Map(filtered.map((item) => [item.subjectId, item])).values()
    );
  }, [assignments, currentClass, selectedYear, selectedClass]);

  const classStudents = useMemo(() => {
    return enrollments
      .filter(
        (enrollment) =>
          enrollment.status === "active" &&
          enrollment.classId === selectedClass
      )
      .map((enrollment) => {
        const student = students.find(
          (item) => item.id === enrollment.studentId
        );

        if (
          !student ||
          ["transferred", "withdrawn", "graduated"].includes(student.status)
        ) {
          return null;
        }

        return {
          ...student,
          classId: enrollment.classId,
          className: enrollment.className,
        };
      })
      .filter((student): student is Student & {
        classId: string;
        className: string;
      } => student !== null)
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [enrollments, students, selectedClass]);

  const studentResults = useMemo(() => {
    return classStudents.map((student) => {
      let weightedTotal = 0;
      let coefficientTotal = 0;
      let complete = classAssignments.length > 0;

      classAssignments.forEach((assignment) => {
        const subject = subjects.find(
          (item) => item.id === assignment.subjectId
        );

        const coefficient = currentClass
          ? getCoefficient(subject, currentClass)
          : null;

        const mark = marks.find(
          (item) =>
            item.studentId === student.id &&
            item.subjectId === assignment.subjectId &&
            item.classId === selectedClass
        );

        const sequence1 = numberOrNull(mark?.sequence1);
        const sequence2 = numberOrNull(mark?.sequence2);

        if (
          !mark ||
          mark.status !== "finalized" ||
          sequence1 === null ||
          sequence2 === null ||
          coefficient === null
        ) {
          complete = false;
          return;
        }

        const category = (subject?.category || "").toUpperCase();

        if (category === "PE" || category === "MANUAL LABOUR") {
          return;
        }

        const subjectAverage = (sequence1 + sequence2) / 2;

        weightedTotal += subjectAverage * coefficient;
        coefficientTotal += coefficient;
      });

      const average =
        complete && coefficientTotal > 0
          ? weightedTotal / coefficientTotal / 2
          : null;

      return {
        ...student,
        average,
        complete: complete && average !== null,
      };
    });
  }, [
    classStudents,
    classAssignments,
    subjects,
    marks,
    currentClass,
    selectedClass,
  ]);

  const ranking = useMemo(() => {
    return studentResults
      .filter(
        (student): student is typeof student & { average: number } =>
          student.average !== null
      )
      .sort((a, b) => b.average - a.average);
  }, [studentResults]);

  const rankedStudents = useMemo(() => {
    return studentResults.map((student) => ({
      ...student,
      position:
        student.average === null
          ? null
          : ranking.findIndex((item) => item.id === student.id) + 1,
    }));
  }, [studentResults, ranking]);

  const classAverage =
    ranking.length > 0
      ? ranking.reduce((sum, student) => sum + student.average, 0) /
        ranking.length
      : null;

  const allResultsFinalized =
    studentResults.length > 0 &&
    studentResults.every((student) => student.complete);

  function updateStudent(
    studentId: string,
    field: keyof CouncilEdit,
    value: string
  ) {
    setEdits((previous) => ({
      ...previous,
      [studentId]: {
        remark: previous[studentId]?.remark || "Good",
        decision: previous[studentId]?.decision || "Pending",
        [field]: value,
      },
    }));
  }

  async function saveCouncil() {
    if (!allResultsFinalized) {
      setError(
        "Council cannot be saved yet. Ensure every subject has finalized marks and configured coefficients."
      );
      return;
    }

    if (!currentClass || !currentYear || !currentTerm) {
      setError("Select an academic year, term and class.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const councilStudents = rankedStudents.map((student) => ({
        studentId: student.id,
        fullName: student.fullName,
        admissionNumber: student.admissionNumber || "",
        gender: student.gender || "",
        average: student.average,
        position: student.position,
        remark: edits[student.id]?.remark || "Good",
        decision: edits[student.id]?.decision || "Pending",
      }));

      await setDoc(
        doc(
          db,
          "schools",
          schoolId,
          "academicYears",
          selectedYear,
          "terms",
          selectedTerm,
          "classCouncils",
          selectedClass
        ),
        {
          schoolId,
          academicYearId: selectedYear,
          academicYearName: currentYear.name,
          termId: selectedTerm,
          termName: currentTerm.name,
          classId: selectedClass,
          className: `${currentClass.level} ${currentClass.name}`,
          students: councilStudents,
          generalRemark,
          classAverage,
          studentCount: councilStudents.length,
          status: "saved",
          updatedAt: serverTimestamp(),
          updatedBy: userId,
        },
        { merge: true }
      );

      setMessage("Class Council decisions saved successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save Class Council records."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <main className="p-8 text-center">Loading Class Council...</main>;
  }

  return (
    <main className="space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-bold">Class Council</h1>
          <p className="text-sm text-gray-500">
            Review finalized academic performance and record council decisions.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            disabled={studentResults.length === 0 || dataLoading}
            className="rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Print
          </button>

          <button
            onClick={saveCouncil}
            disabled={saving || dataLoading || !allResultsFinalized}
            className="rounded-lg bg-blue-700 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Council"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-700">
          {message}
        </div>
      )}

      <div className="grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-3 print:hidden">
        <label className="text-sm font-medium">
          Academic Year
          <select
            value={selectedYear}
            onChange={(event) => setSelectedYear(event.target.value)}
            className="mt-1 w-full rounded-lg border p-2"
          >
            {academicYears.map((year) => (
              <option key={year.id} value={year.id}>
                {year.name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium">
          Term
          <select
            value={selectedTerm}
            onChange={(event) => setSelectedTerm(event.target.value)}
            className="mt-1 w-full rounded-lg border p-2"
          >
            {terms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium">
          Class
          <select
            value={selectedClass}
            onChange={(event) => setSelectedClass(event.target.value)}
            className="mt-1 w-full rounded-lg border p-2"
          >
            {classes.map((schoolClass) => (
              <option key={schoolClass.id} value={schoolClass.id}>
                {schoolClass.level} {schoolClass.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {dataLoading && (
        <p className="text-sm text-gray-500 print:hidden">
          Loading class records...
        </p>
      )}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-gray-500">Enrolled Students</p>
          <p className="mt-1 text-2xl font-bold">{classStudents.length}</p>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-gray-500">Students Ranked</p>
          <p className="mt-1 text-2xl font-bold">{ranking.length}</p>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-gray-500">Class Average</p>
          <p className="mt-1 text-2xl font-bold">
            {display(classAverage)} /20
          </p>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-gray-500">Results Status</p>
          <p className="mt-1 text-lg font-bold">
            {allResultsFinalized ? "Finalized" : "Incomplete"}
          </p>
        </div>
      </section>

      {!allResultsFinalized && classStudents.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 print:hidden">
          Some students still have missing marks, unconfigured coefficients or
          results that are not finalized. Council saving is disabled until
          their results are complete.
        </div>
      )}

      {classStudents.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center text-gray-500">
          No active students are enrolled in this class for the selected
          academic year.
        </div>
      ) : (
        <section className="overflow-hidden rounded-xl border bg-white">
          <div className="border-b p-4">
            <h2 className="font-bold">
              {currentClass?.level} {currentClass?.name} — Council Register
            </h2>
            <p className="text-sm text-gray-500">
              {currentYear?.name} · {currentTerm?.name}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Student</th>
                  <th className="p-3">Admission No.</th>
                  <th className="p-3">Average /20</th>
                  <th className="p-3">Position</th>
                  <th className="p-3">Class Remark</th>
                  <th className="p-3">Decision</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {rankedStudents.map((student, index) => (
                  <tr key={student.id} className="align-middle">
                    <td className="p-3">{index + 1}</td>
                    <td className="p-3 font-semibold">{student.fullName}</td>
                    <td className="p-3">{student.admissionNumber || "—"}</td>
                    <td className="p-3 font-bold">
                      {display(student.average)}
                    </td>
                    <td className="p-3">
                      {student.position
                        ? `${student.position}${student.position === 1 ? "st" : student.position === 2 ? "nd" : student.position === 3 ? "rd" : "th"}`
                        : "—"}
                    </td>
                    <td className="p-3">
                      <select
                        value={edits[student.id]?.remark || "Good"}
                        onChange={(event) =>
                          updateStudent(student.id, "remark", event.target.value)
                        }
                        className="w-full rounded-lg border p-2 print:hidden"
                      >
                        {remarkOptions.map((remark) => (
                          <option key={remark} value={remark}>
                            {remark}
                          </option>
                        ))}
                      </select>
                      <span className="hidden print:inline">
                        {edits[student.id]?.remark || "Good"}
                      </span>
                    </td>
                    <td className="p-3">
                      <select
                        value={edits[student.id]?.decision || "Pending"}
                        onChange={(event) =>
                          updateStudent(
                            student.id,
                            "decision",
                            event.target.value
                          )
                        }
                        className="w-full rounded-lg border p-2 print:hidden"
                      >
                        {decisionOptions.map((decision) => (
                          <option key={decision} value={decision}>
                            {decision}
                          </option>
                        ))}
                      </select>
                      <span className="hidden print:inline">
                        {edits[student.id]?.decision || "Pending"}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={
                          student.complete
                            ? "font-semibold text-green-700"
                            : "font-semibold text-amber-700"
                        }
                      >
                        {student.complete ? "Complete" : "Incomplete"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="rounded-xl border bg-white p-4">
        <h2 className="font-bold">General Council Remarks</h2>
        <textarea
          value={generalRemark}
          onChange={(event) => setGeneralRemark(event.target.value)}
          rows={4}
          placeholder="Enter general observations, recommendations or council notes..."
          className="mt-3 w-full rounded-lg border p-3 text-sm print:hidden"
        />
        <p className="hidden whitespace-pre-wrap print:block">
          {generalRemark || "—"}
        </p>
      </section>

      <div className="hidden print:block">
        <div className="mt-10 grid grid-cols-2 gap-12 text-center text-sm">
          <div>
            <p className="font-bold">Class Master</p>
            <p className="mt-12 border-t border-black pt-2">Signature</p>
          </div>
          <div>
            <p className="font-bold">Principal</p>
            <p className="mt-12 border-t border-black pt-2">
              Signature and Stamp
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm;
          }

          body {
            background: white !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          .print\\:block {
            display: block !important;
          }

          table {
            page-break-inside: auto;
          }

          tr {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </main>
  );
}
