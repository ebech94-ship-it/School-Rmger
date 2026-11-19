
"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

type AcademicYear = {
  id: string;
  name: string;
  isActive: boolean;
};

type Term = {
  id: string;
  name: string;
  order: number;
  status: string;
};

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
  code: string;
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
  admissionNumber: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  sequence1: number | null;
  sequence2: number | null;
  average: number | null;
  status: string;
};

type ReportSubject = {
  subjectId: string;
  name: string;
  teacherName: string;
  category: string;
  coefficient: number | null;
  sequence1: number | null;
  sequence2: number | null;
  average: number | null;
  total: number | null;
  status: string;
};

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : null;
}

function display(value: number | null | undefined): string {
  return value === null || value === undefined
    ? "—"
    : value.toFixed(2);
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

function calculateAverage(
  marks: ReportSubject[],
  sequence: 1 | 2 | null = null
): number | null {
  let total = 0;
  let coefficients = 0;

  marks.forEach((subject) => {
    if (subject.coefficient === null) return;

    const score =
      sequence === 1
        ? subject.sequence1
        : sequence === 2
          ? subject.sequence2
          : subject.average;

    if (score === null) return;

    total += score * subject.coefficient;
    coefficients += subject.coefficient;
  });

  return coefficients > 0
    ? total / coefficients / 2
    : null;
}

export default function ReportsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState("");

  const [schoolId, setSchoolId] = useState("");
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
  const [selectedStudent, setSelectedStudent] = useState("");

  // Load school data
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
          throw new Error("You are not authorized to access reports.");
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
        setAcademicYears(years);
        setClasses(
          classesSnap.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          })) as SchoolClass[]
        );
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

        if (activeYear) {
          setSelectedYear(activeYear.id);
        } else if (years.length > 0) {
          setSelectedYear(years[0].id);
        } else {
          setError("No academic year has been created yet.");
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load school data."
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

  // Load terms for selected academic year
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

        const loadedTerms = snapshot.docs
          .map((item) => ({
            id: item.id,
            ...item.data(),
          }) as Term)
          .sort((a, b) => a.order - b.order);

        setTerms(loadedTerms);

        const openTerm = loadedTerms.find(
          (term) => term.status === "open"
        );

        setSelectedTerm(openTerm?.id || loadedTerms[0]?.id || "");
      } catch {
        if (active) setError("Unable to load academic terms.");
      }
    }

    loadTerms();

    return () => {
      active = false;
    };
  }, [schoolId, selectedYear]);

  // Load enrollments and marks for selected year and term
  useEffect(() => {
    let active = true;

    async function loadReportData() {
      if (!schoolId || !selectedYear || !selectedTerm) return;

      try {
        setReportLoading(true);
        setError("");

        const [enrollmentSnap, marksSnap] = await Promise.all([
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
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load marks and enrollments."
          );
        }
      } finally {
        if (active) setReportLoading(false);
      }
    }

    loadReportData();

    return () => {
      active = false;
    };
  }, [schoolId, selectedYear, selectedTerm]);

  const activeStudents = useMemo(() => {
    return enrollments
      .filter((enrollment) => enrollment.status === "active")
      .map((enrollment) => {
        const student = students.find(
          (item) => item.id === enrollment.studentId
        );

        if (
          !student ||
          student.status === "transferred" ||
          student.status === "withdrawn" ||
          student.status === "graduated"
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
  }, [enrollments, students]);

  

   const currentStudent =
    activeStudents.find((student) => student.id === selectedStudent) ||
    activeStudents[0];

  const currentClass = classes.find(
    (schoolClass) => schoolClass.id === currentStudent?.classId
  );

  const currentYear = academicYears.find(
    (year) => year.id === selectedYear
  );

  const currentTerm = terms.find(
    (term) => term.id === selectedTerm
  );

  const reportSubjects = useMemo((): ReportSubject[] => {
    if (!currentStudent || !currentClass) return [];

    const classAssignments = assignments.filter(
      (assignment) =>
        assignment.status === "active" &&
        assignment.academicYearId === selectedYear &&
        assignment.classId === currentStudent.classId
    );

    const uniqueAssignments = Array.from(
      new Map(
        classAssignments.map((assignment) => [
          assignment.subjectId,
          assignment,
        ])
      ).values()
    );

    return uniqueAssignments
      .map((assignment) => {
        const subject = subjects.find(
          (item) => item.id === assignment.subjectId
        );

        const mark = marks.find(
          (item) =>
            item.studentId === currentStudent.id &&
            item.subjectId === assignment.subjectId &&
            item.classId === currentStudent.classId
        );

        const sequence1 = numberOrNull(mark?.sequence1);
        const sequence2 = numberOrNull(mark?.sequence2);

        const average =
          sequence1 !== null && sequence2 !== null
            ? (sequence1 + sequence2) / 2
            : null;

        const coefficient = getCoefficient(subject, currentClass);

        return {
          subjectId: assignment.subjectId,
          name: subject?.name || assignment.subjectName,
          teacherName: assignment.teacherName || "—",
          category: subject?.category || "Unclassified",
          coefficient,
          sequence1,
          sequence2,
          average,
          total:
            average !== null && coefficient !== null
              ? average * coefficient
              : null,
          status: mark?.status || "missing",
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [
    assignments,
    currentStudent,
    currentClass,
    selectedYear,
    subjects,
    marks,
  ]);

  const sections = useMemo(() => {
    const categories = ["A", "B", "PE", "C", "Manual Labour"];

    return categories.map((category) => ({
      name: category,
      subjects: reportSubjects.filter(
        (subject) => subject.category.toUpperCase() === category.toUpperCase()
      ),
    }));
  }, [reportSubjects]);

  const grandSubjects = reportSubjects.filter(
    (subject) =>
      subject.category.toUpperCase() !== "PE" &&
      subject.category.toUpperCase() !== "MANUAL LABOUR"
  );

  const grandAverage = calculateAverage(grandSubjects);
  const sequenceOneAverage = calculateAverage(grandSubjects, 1);
  const sequenceTwoAverage = calculateAverage(grandSubjects, 2);

  const classStudents = activeStudents.filter(
    (student) => student.classId === currentStudent?.classId
  );

  function getStudentAverage(studentId: string): number | null {
    if (!currentClass || !currentStudent) return null;

    const studentMarks = reportSubjects.map((subject) => {
      const mark = marks.find(
        (item) =>
          item.studentId === studentId &&
          item.subjectId === subject.subjectId &&
          item.classId === currentStudent.classId
      );

      const sequence1 = numberOrNull(mark?.sequence1);
      const sequence2 = numberOrNull(mark?.sequence2);

      return {
        ...subject,
        sequence1,
        sequence2,
        average:
          sequence1 !== null && sequence2 !== null
            ? (sequence1 + sequence2) / 2
            : null,
      };
    });

    return calculateAverage(
      studentMarks.filter(
        (subject) =>
          subject.category.toUpperCase() !== "PE" &&
          subject.category.toUpperCase() !== "MANUAL LABOUR"
      )
    );
  }

  const ranking = classStudents
    .map((student) => ({
      id: student.id,
      average: getStudentAverage(student.id),
    }))
    .filter(
      (item): item is { id: string; average: number } =>
        item.average !== null
    )
    .sort((a, b) => b.average - a.average);

  const position =
    ranking.findIndex((item) => item.id === selectedStudent) + 1;

  const classAverage =
    ranking.length > 0
      ? ranking.reduce((sum, item) => sum + item.average, 0) /
        ranking.length
      : null;

  const hasMissingMarks = reportSubjects.some(
    (subject) => subject.average === null
  );

  const hasUnconfiguredCoefficients = reportSubjects.some(
    (subject) => subject.coefficient === null
  );

  const allFinalized =
    reportSubjects.length > 0 &&
    reportSubjects.every(
      (subject) =>
        subject.status === "finalized" &&
        subject.average !== null &&
        subject.coefficient !== null
    );

  const reportIsIncomplete =
    hasMissingMarks || hasUnconfiguredCoefficients;

  if (loading) {
    return (
      <main className="p-8 text-center">
        Loading report data...
      </main>
    );
  }

  return (
    <main className="space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-bold">Student Reports</h1>
          <p className="text-sm text-gray-500">
            Live academic results and progress records
          </p>
        </div>

        <button
          onClick={() => window.print()}
          disabled={!currentStudent || reportLoading}
          className="rounded bg-blue-700 px-5 py-2 text-white disabled:opacity-50"
        >
          Print Report
        </button>
      </div>

      {error && (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-3 print:hidden">
        <label className="text-sm font-medium">
          Academic Year
          <select
            value={selectedYear}
            onChange={(event) => setSelectedYear(event.target.value)}
            className="mt-1 w-full rounded border p-2"
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
            className="mt-1 w-full rounded border p-2"
          >
            {terms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium">
          Student
          <select
            value={selectedStudent}
            onChange={(event) => setSelectedStudent(event.target.value)}
            className="mt-1 w-full rounded border p-2"
          >
            {activeStudents.map((student) => (
              <option key={student.id} value={student.id}>
                {student.fullName} — {student.className}
              </option>
            ))}
          </select>
        </label>
      </div>

      {reportLoading && (
        <p className="text-sm text-gray-500 print:hidden">
          Loading marks...
        </p>
      )}

      {!currentStudent || !currentClass ? (
        <div className="rounded border p-6 text-center text-gray-600">
          No enrolled student is available for this academic year.
        </div>
      ) : (
        <div className="report-sheet mx-auto max-w-5xl bg-white p-6 text-black shadow print:max-w-none print:p-0 print:shadow-none">
          <div className="border-b-2 border-black pb-3 text-center">
            <h2 className="text-xl font-bold uppercase">
              Government Technical High School Kumbo
            </h2>
            <p className="text-sm">
              NORTH-WEST REGION — CAMEROON
            </p>
            <h3 className="mt-3 text-lg font-bold uppercase">
              Student Progress Record
            </h3>
            <p className="font-semibold">
              {currentYear?.name || "—"} | {currentTerm?.name || "—"}
            </p>
            <p className="text-sm">
              {currentClass.level} {currentClass.name}
            </p>
          </div>

          <div className="my-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
            <p>
              <strong>Student:</strong> {currentStudent.fullName}
            </p>
            <p>
              <strong>Admission No:</strong>{" "}
              {currentStudent.admissionNumber || "—"}
            </p>
            <p>
              <strong>Gender:</strong> {currentStudent.gender || "—"}
            </p>
            <p>
              <strong>Class:</strong> {currentStudent.className}
            </p>
            <p>
              <strong>Department:</strong>{" "}
              {currentClass.department || "—"}
            </p>
            <p>
              <strong>Stream:</strong> {currentClass.stream || "—"}
            </p>
          </div>

          <div className="mb-4 border-y border-black py-2 text-center text-sm font-bold">
            {allFinalized
              ? "FINALIZED RESULTS"
              : "PREVIEW — NOT FINALIZED"}
          </div>

          {reportIsIncomplete && (
            <div className="mb-3 border border-amber-500 bg-amber-50 p-2 text-sm text-amber-900 print:bg-white">
              Incomplete report: some marks are missing or subject
              coefficients need configuration.
            </div>
          )}

          {sections.map((section) =>
            section.subjects.length > 0 ? (
              <div key={section.name} className="mb-4">
                <h4 className="border border-black bg-gray-100 px-2 py-1 text-sm font-bold print:bg-gray-100">
                  SECTION {section.name}
                </h4>

                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      {[
                        "Subject",
                        "Teacher",
                        "Seq 1 /40",
                        "Seq 2 /40",
                        "Average /40",
                        "Coeff.",
                        "Total",
                        "Status",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="border border-black p-1"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section.subjects.map((subject) => (
                      <tr key={subject.subjectId}>
                        <td className="border border-black p-1">
                          {subject.name}
                        </td>
                        <td className="border border-black p-1">
                          {subject.teacherName}
                        </td>
                        <td className="border border-black p-1 text-center">
                          {display(subject.sequence1)}
                        </td>
                        <td className="border border-black p-1 text-center">
                          {display(subject.sequence2)}
                        </td>
                        <td className="border border-black p-1 text-center">
                          {display(subject.average)}
                        </td>
                        <td className="border border-black p-1 text-center">
                          {subject.coefficient ?? "—"}
                        </td>
                        <td className="border border-black p-1 text-center">
                          {display(subject.total)}
                        </td>
                        <td className="border border-black p-1 text-center">
                          {subject.coefficient === null
                            ? "Configure"
                            : subject.status === "missing"
                              ? "No marks"
                              : subject.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null
          )}

          <div className="mt-5 grid gap-4 border border-black p-3 text-sm md:grid-cols-2">
            <div>
              <h4 className="mb-2 font-bold">Performance Summary</h4>
              <p>
                Sequence 1 Average: {display(sequenceOneAverage)} /20
              </p>
              <p>
                Sequence 2 Average: {display(sequenceTwoAverage)} /20
              </p>
              <p>
                Term Average: {display(grandAverage)} /20
              </p>
              <p>
                Class Average: {display(classAverage)} /20
              </p>
            </div>

            <div>
              <h4 className="mb-2 font-bold">Class Ranking</h4>
              <p>
                Position: {position > 0 ? position : "—"} /{" "}
                {classStudents.length}
              </p>
              <p>
                Students Ranked: {ranking.length}
              </p>
              <p>
                Subjects: {reportSubjects.length}
              </p>
              <p>
                Result Status: {allFinalized ? "Finalized" : "Preview"}
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-8 text-center text-sm">
            <div>
              <p className="font-bold">Class Master</p>
              <p className="mt-10 border-t border-black pt-1">
                Signature
              </p>
            </div>
            <div>
              <p className="font-bold">Principal</p>
              <p className="mt-10 border-t border-black pt-1">
                Signature and Stamp
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-xs">
            Generated from the school results management system.
          </p>
        </div>
      )}

      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm;
          }

          body {
            background: white !important;
          }

          .report-sheet {
            width: 100% !important;
            max-width: none !important;
            box-shadow: none !important;
          }

          .report-sheet table {
            page-break-inside: auto;
          }

          .report-sheet tr {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </main>
  );
}
