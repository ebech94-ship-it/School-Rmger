
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

function positionLabel(position: number | null): string {
  if (position === null) return "—";
  if (position % 100 >= 11 && position % 100 <= 13) {
    return `${position}th`;
  }

  switch (position % 10) {
    case 1:
      return `${position}st`;
    case 2:
      return `${position}nd`;
    case 3:
      return `${position}rd`;
    default:
      return `${position}th`;
  }
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
  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);

  // Load school records and verify Technical Admin access.
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
          getDocs(
            collection(db, "schools", currentSchoolId, "teacherAssignments")
          ),
        ]);

        if (!active) return;

        const years = yearsSnap.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })) as AcademicYear[];

        const loadedClasses = classesSnap.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })) as SchoolClass[];

        setSchoolId(currentSchoolId);
        setUserId(user.uid);
        setAcademicYears(years);
        setClasses(loadedClasses);
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
        setSelectedClass(loadedClasses[0]?.id || "");

        if (years.length === 0) {
          setError("No academic year has been created yet.");
        }

        if (loadedClasses.length === 0) {
          setError("No classes have been created for this school.");
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

  // Load terms for the selected academic year.
  useEffect(() => {
    let active = true;

    async function loadTerms() {
      if (!schoolId || !selectedYear) {
        setTerms([]);
        setSelectedTerm("");
        return;
      }

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

        if (loaded.length === 0) {
          setError("No terms have been created for this academic year.");
        }
      } catch {
        if (active) setError("Unable to load academic terms.");
      }
    }

    loadTerms();

    return () => {
      active = false;
    };
  }, [schoolId, selectedYear]);

  // Load enrollments, marks and saved council record.
  useEffect(() => {
    let active = true;

    async function loadClassData() {
      if (!schoolId || !selectedYear || !selectedTerm || !selectedClass) {
        setEnrollments([]);
        setMarks([]);
        setEdits({});
        setGeneralRemark("");
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
              }
            );
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
      .filter(
        (
          student
        ): student is Student & {
          classId: string;
          className: string;
        } => student !== null
      )
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [enrollments, students, selectedClass]);

  const studentResults = useMemo(() => {
    return classStudents.map((student) => {
      let weightedTotal = 0;
      let coefficientTotal = 0;
      let complete = classAssignments.length > 0;
      const issues: string[] = [];

      classAssignments.forEach((assignment) => {
        const subject = subjects.find(
          (item) => item.id === assignment.subjectId
        );

        const subjectName =
          subject?.name || assignment.subjectName || "Unknown subject";

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

        if (!mark) {
          complete = false;
          issues.push(`${subjectName}: marks not entered`);
          return;
        }

        if (mark.status !== "finalized") {
          complete = false;
          issues.push(`${subjectName}: not finalized`);
          return;
        }

        if (sequence1 === null || sequence2 === null) {
          complete = false;
          issues.push(`${subjectName}: sequence mark missing`);
          return;
        }

        if (coefficient === null) {
          complete = false;
          issues.push(`${subjectName}: coefficient needs attention`);
          return;
        }

        const category = (subject?.category || "").toUpperCase();

        // Existing calculation policy preserved.
        if (category === "PE" || category === "MANUAL LABOUR") {
          return;
        }

        const subjectAverage = (sequence1 + sequence2) / 2;

        weightedTotal += subjectAverage * coefficient;
        coefficientTotal += coefficient;
      });

      if (classAssignments.length === 0) {
        issues.push("No active teacher subject assignments found");
      }

      const average =
        complete && coefficientTotal > 0
          ? weightedTotal / coefficientTotal / 2
          : null;

      if (complete && coefficientTotal === 0) {
        issues.push("No academic subject coefficients available");
      }

      return {
        ...student,
        average,
        complete: complete && average !== null,
        issues,
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
    return studentResults
      .map((student) => ({
        ...student,
        position:
          student.average === null
            ? null
            : ranking.findIndex((item) => item.id === student.id) + 1,
      }))
      .sort((a, b) => {
        if (a.average === null && b.average === null) {
          return a.fullName.localeCompare(b.fullName);
        }
        if (a.average === null) return 1;
        if (b.average === null) return -1;
        return b.average - a.average;
      });
  }, [studentResults, ranking]);

  const classAverage =
    ranking.length > 0
      ? ranking.reduce((sum, student) => sum + student.average, 0) /
        ranking.length
      : null;

  const incompleteStudents = studentResults.filter(
    (student) => !student.complete
  );

  const allResultsFinalized =
    studentResults.length > 0 &&
    studentResults.every((student) => student.complete);

  const displayedStudents = showIncompleteOnly
    ? rankedStudents.filter((student) => !student.complete)
    : rankedStudents;

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

    setMessage("");
  }

  async function saveCouncil() {
    if (!allResultsFinalized) {
      setError(
        "Council cannot be saved yet. Check the incomplete students and resolve their outstanding subject results."
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
    return (
      <main className="flex min-h-[50vh] items-center justify-center p-8">
        <p className="text-sm text-gray-500">Loading Class Council...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen space-y-6 bg-slate-50 p-4 md:p-8">
      {/* Page heading and actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
            Academic Administration
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">
            Class Council
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review finalized results, record decisions and prepare council
            records.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => window.print()}
            disabled={studentResults.length === 0 || dataLoading}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Print Register
          </button>

          <button
            onClick={saveCouncil}
            disabled={saving || dataLoading || !allResultsFinalized}
            className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Council"}
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 print:hidden">
          <strong>Attention:</strong> {error}
        </div>
      )}

      {message && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 print:hidden">
          <strong>Saved:</strong> {message}
        </div>
      )}

      {/* Workflow guidance */}
      <section className="rounded-xl border border-blue-200 bg-blue-50 p-4 print:hidden">
        <h2 className="font-bold text-blue-950">
          Technical Admin — Workflow Guide
        </h2>

        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-white p-3">
            <p className="font-bold text-slate-800">1. Teacher</p>
            <p className="mt-1 text-slate-600">
              Enters and submits subject marks.
            </p>
          </div>
          <div className="rounded-lg bg-white p-3">
            <p className="font-bold text-slate-800">2. Class Master</p>
            <p className="mt-1 text-slate-600">
              Reviews submitted marks and returns corrections where necessary.
            </p>
          </div>
          <div className="rounded-lg bg-white p-3">
            <p className="font-bold text-slate-800">3. Technical Admin</p>
            <p className="mt-1 text-slate-600">
              Finalizes reviewed subject results, then conducts Class Council.
            </p>
          </div>
          <div className="rounded-lg bg-white p-3">
            <p className="font-bold text-slate-800">4. Next: Principal</p>
            <p className="mt-1 text-slate-600">
              Reviews and signs off council records before results publication
              and report-card issuance.
            </p>
          </div>
        </div>

        <p className="mt-3 text-xs text-blue-900">
          This page currently saves and prints council records. Principal
          approval and results publication are subsequent workflow stages.
        </p>
      </section>

      {/* Selection filters */}
      <section className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3 print:hidden">
        <label className="text-sm font-semibold text-slate-700">
          Academic Year
          <select
            value={selectedYear}
            onChange={(event) => setSelectedYear(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white p-2.5 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {academicYears.map((year) => (
              <option key={year.id} value={year.id}>
                {year.name}{year.isActive ? " (Active)" : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-semibold text-slate-700">
          Term
          <select
            value={selectedTerm}
            onChange={(event) => setSelectedTerm(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white p-2.5 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {terms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.name}
                {term.status === "open" ? " (Open)" : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-semibold text-slate-700">
          Class
          <select
            value={selectedClass}
            onChange={(event) => setSelectedClass(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white p-2.5 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {classes.map((schoolClass) => (
              <option key={schoolClass.id} value={schoolClass.id}>
                {schoolClass.level} {schoolClass.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      {dataLoading && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800 print:hidden">
          Loading the selected class records...
        </div>
      )}

      {/* Summary cards */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Enrolled Students
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {classStudents.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">Active class enrolments</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Students Ranked
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {ranking.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Students with calculated averages
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Class Average</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {display(classAverage)}
            <span className="ml-1 text-base font-medium text-slate-500">
              /20
            </span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Based on ranked students
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Incomplete Results</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {incompleteStudents.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Students requiring attention
          </p>
        </div>
      </section>

      {/* Completion status */}
      <section
        className={`rounded-xl border p-4 print:hidden ${
          allResultsFinalized
            ? "border-green-200 bg-green-50"
            : "border-amber-200 bg-amber-50"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2
              className={`font-bold ${
                allResultsFinalized ? "text-green-900" : "text-amber-900"
              }`}
            >
              {allResultsFinalized
                ? "Class results are ready for council"
                : "Class council is not ready"}
            </h2>
            <p
              className={`mt-1 text-sm ${
                allResultsFinalized ? "text-green-800" : "text-amber-800"
              }`}
            >
              {allResultsFinalized
                ? "All enrolled students have complete finalized results. You can record and save council decisions."
                : "Resolve the outstanding subject results before saving the council record."}
            </p>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              allResultsFinalized
                ? "bg-green-100 text-green-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {allResultsFinalized ? "READY" : "ACTION REQUIRED"}
          </span>
        </div>

        {!allResultsFinalized && classStudents.length > 0 && (
          <button
            onClick={() => setShowIncompleteOnly((value) => !value)}
            className="mt-3 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100"
          >
            {showIncompleteOnly
              ? "Show all students"
              : `Show incomplete students (${incompleteStudents.length})`}
          </button>
        )}
      </section>

      {/* Council register */}
      {classStudents.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <h2 className="font-bold text-slate-800">No enrolled students</h2>
          <p className="mt-2 text-sm text-slate-500">
            No active students were found in this class for the selected
            academic year.
          </p>
        </div>
      ) : (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
            <div>
              <h2 className="font-bold text-slate-900">
                {currentClass?.level} {currentClass?.name} — Council Register
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {currentYear?.name} · {currentTerm?.name}
              </p>
            </div>

            <p className="text-xs text-slate-500">
              {displayedStudents.length} of {classStudents.length} students
              displayed
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="p-3">No.</th>
                  <th className="p-3">Student</th>
                  <th className="p-3">Admission No.</th>
                  <th className="p-3">Average /20</th>
                  <th className="p-3">Position</th>
                  <th className="p-3">Class Remark</th>
                  <th className="p-3">Decision</th>
                  <th className="p-3">Result Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {displayedStudents.map((student, index) => (
                  <tr
                    key={student.id}
                    className={`align-middle hover:bg-slate-50 ${
                      !student.complete ? "bg-amber-50/40" : ""
                    }`}
                  >
                    <td className="p-3 text-slate-500">{index + 1}</td>

                    <td className="p-3">
                      <p className="font-semibold text-slate-900">
                        {student.fullName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {student.gender || "Gender not recorded"}
                      </p>
                    </td>

                    <td className="p-3 text-slate-600">
                      {student.admissionNumber || "—"}
                    </td>

                    <td className="p-3 font-bold text-slate-900">
                      {display(student.average)}
                    </td>

                    <td className="p-3 font-semibold text-slate-700">
                      {positionLabel(student.position)}
                    </td>

                    <td className="p-3">
                      <select
                        value={edits[student.id]?.remark || "Good"}
                        onChange={(event) =>
                          updateStudent(
                            student.id,
                            "remark",
                            event.target.value
                          )
                        }
                        disabled={!student.complete}
                        className="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm disabled:bg-slate-100 disabled:text-slate-400 print:hidden"
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
                        disabled={!student.complete}
                        className="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm disabled:bg-slate-100 disabled:text-slate-400 print:hidden"
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
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          student.complete
                            ? "bg-green-100 text-green-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {student.complete ? "Complete" : "Incomplete"}
                      </span>

                      {!student.complete && (
                        <div className="mt-2 max-w-[220px] space-y-1 text-xs text-amber-800 print:hidden">
                          {student.issues.map((issue, issueIndex) => (
                            <p key={`${student.id}-${issueIndex}`}>• {issue}</p>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}

                {displayedStudents.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="p-8 text-center text-sm text-slate-500"
                    >
                      No incomplete students found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-200 bg-slate-50 p-3 text-xs text-slate-500 print:hidden">
            Incomplete students are highlighted. Their outstanding subject
            requirements are displayed in the Result Status column.
          </div>
        </section>
      )}

      {/* General council remarks */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="font-bold text-slate-900">General Council Remarks</h2>
        <p className="mt-1 text-sm text-slate-500 print:hidden">
          Record general observations, recommendations or matters arising
          during the council meeting.
        </p>

        <textarea
          value={generalRemark}
          onChange={(event) => {
            setGeneralRemark(event.target.value);
            setMessage("");
          }}
          rows={4}
          placeholder="Enter general observations, recommendations or council notes..."
          className="mt-3 w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 print:hidden"
        />

        <p className="hidden whitespace-pre-wrap print:block">
          {generalRemark || "—"}
        </p>
      </section>

      {/* Next workflow stage */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 print:hidden">
        <h2 className="font-bold text-slate-900">What happens after Class Council?</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-600">
          <li>Save the completed Class Council record.</li>
          <li>Print the register for the necessary signatures.</li>
          <li>
            Submit the council record to the Principal or School Administration
            for review and sign-off.
          </li>
          <li>
            After approval, proceed to results publication and report-card
            issuance.
          </li>
        </ol>
        <p className="mt-3 text-xs text-slate-500">
          Principal approval and publication are not performed by this page.
        </p>
      </section>

      {/* Print signatures */}
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

          section {
            box-shadow: none !important;
          }
        }
      `}</style>
    </main>
  );
}
