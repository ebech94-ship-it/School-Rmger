
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import {
  calculateSubjectResult,
  type AssessmentDefinition,
  type AssessmentMark,
} from "@/lib/results-calculation";

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
  department?: string;
  stream?: string;
  status: string;
};

type Student = {
  id: string;
  admissionNumber: string;
  fullName: string;
  gender: string;
  status: string;
  dateOfBirth?: string;
  specialty?: string;
  studentNumber?: string;
  repeater?: boolean;
};

type ActiveStudent = Student & {
  classId: string;
  className: string;
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
  status: string;
};

type ClassSubjectConfig = {
  id: string;
  classId: string;
  subjectId: string;
  coefficient: number | null;
  assessments: AssessmentDefinition[];
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
  assessmentMarks?: AssessmentMark[];
  status: string;
};

type TermSubjectResult = {
  average: number | null;
  totalMark: number;
  totalMaximum: number;
  assessmentMarks: AssessmentMark[];
  complete: boolean;
  status: string;
};

type ReportSubject = {
  subjectId: string;
  name: string;
  teacherName: string;
  category: string;
  coefficient: number | null;
  assessments: AssessmentDefinition[];
  termResults: Record<string, TermSubjectResult>;
};

type StudentReport = {
  student: ActiveStudent;
  schoolClass: SchoolClass | undefined;
  subjects: ReportSubject[];
  categories: {
    name: string;
    subjects: ReportSubject[];
  }[];
  termAverages: Record<string, number | null>;
  average: number | null;
  incomplete: boolean;
  unconfiguredCoefficients: boolean;
  finalized: boolean;
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

function calculateWeightedAverage(
  subjects: ReportSubject[],
  termId: string
): number | null {
  let weightedTotal = 0;
  let totalCoefficients = 0;

  subjects.forEach((subject) => {
    const result = subject.termResults[termId];

    if (
      subject.coefficient === null ||
      result?.average === null ||
      result?.average === undefined
    ) {
      return;
    }

    weightedTotal += result.average * subject.coefficient;
    totalCoefficients += subject.coefficient;
  });

  return totalCoefficients > 0
    ? weightedTotal / totalCoefficients
    : null;
}

function gradeFor(value: number | null): string {
  if (value === null) return "—";
  if (value >= 18) return "Excellent";
  if (value >= 16) return "Very Good";
  if (value >= 14) return "Good";
  if (value >= 12) return "Satisfactory";
  if (value >= 10) return "Passable";
  if (value >= 8) return "Poor";
  if (value >= 6) return "Very Weak";
  return "Insufficient";
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
  const [classSubjects, setClassSubjects] = useState<ClassSubjectConfig[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [marksByTerm, setMarksByTerm] = useState<Record<string, Mark[]>>({});

  const [selectedYear, setSelectedYear] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");

  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [focusedStudentId, setFocusedStudentId] = useState("");
  const [previewStudentIds, setPreviewStudentIds] = useState<string[]>([]);
  const [printRequested, setPrintRequested] = useState(false);
const [previewOpen, setPreviewOpen] = useState(false);

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
          classSubjectsSnap,
        ] = await Promise.all([
          getDocs(collection(db, "schools", currentSchoolId, "academicYears")),
          getDocs(collection(db, "schools", currentSchoolId, "classes")),
          getDocs(collection(db, "schools", currentSchoolId, "students")),
          getDocs(collection(db, "schools", currentSchoolId, "subjects")),
          getDocs(collection(db, "schools", currentSchoolId, "teacherAssignments")),
          getDocs(collection(db, "schools", currentSchoolId, "classSubjects")),
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

        setClassSubjects(
          classSubjectsSnap.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          })) as ClassSubjectConfig[]
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

  // Load enrollments and marks for all available terms
  useEffect(() => {
    let active = true;

    async function loadReportData() {
      if (!schoolId || !selectedYear || terms.length === 0) return;

      try {
        setReportLoading(true);
        setError("");

        const enrollmentPromise = getDocs(
          collection(
            db,
            "schools",
            schoolId,
            "academicYears",
            selectedYear,
            "enrollments"
          )
        );

        const termMarkPromises = terms.map((term) =>
          getDocs(
            collection(
              db,
              "schools",
              schoolId,
              "academicYears",
              selectedYear,
              "terms",
              term.id,
              "marks"
            )
          )
        );

        const [enrollmentSnap, ...termSnapshots] = await Promise.all([
          enrollmentPromise,
          ...termMarkPromises,
        ]);

        if (!active) return;

        setEnrollments(
          enrollmentSnap.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          })) as Enrollment[]
        );

        const nextMarks: Record<string, Mark[]> = {};

        terms.forEach((term, index) => {
          nextMarks[term.id] = termSnapshots[index].docs.map((item) => ({
            id: item.id,
            ...item.data(),
          })) as Mark[];
        });

        setMarksByTerm(nextMarks);
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
  }, [schoolId, selectedYear, terms]);

  const activeStudents = useMemo((): ActiveStudent[] => {
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
      .filter((student): student is ActiveStudent => student !== null)
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [enrollments, students]);

  const availableClasses = useMemo(() => {
    const classIds = new Set(activeStudents.map((student) => student.classId));

    return classes
      .filter((schoolClass) => classIds.has(schoolClass.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [classes, activeStudents]);

  // Select a valid class automatically
 const activeClassId = availableClasses.some(
  (item) => item.id === selectedClassId
)
  ? selectedClassId
  : availableClasses[0]?.id || "";

  const classStudents = useMemo(
  () =>
    activeStudents.filter(
      (student) => student.classId === activeClassId
    ),
  [activeStudents, activeClassId]
);
  

  const currentYear = academicYears.find(
    (year) => year.id === selectedYear
  );

  const currentTerm = terms.find(
    (term) => term.id === selectedTerm
  );

  const orderedTerms = useMemo(
    () => terms.slice().sort((a, b) => a.order - b.order).slice(0, 3),
    [terms]
  );

  // Reset student selection when the class or academic period changes


  // Build report data for any student
  const buildStudentReport = useCallback(
    (student: ActiveStudent): StudentReport => {
      const classAssignments = assignments.filter(
        (assignment) =>
          assignment.status === "active" &&
          assignment.academicYearId === selectedYear &&
          assignment.classId === student.classId
      );

      const uniqueAssignments = Array.from(
        new Map(
          classAssignments.map((assignment) => [
            assignment.subjectId,
            assignment,
          ])
        ).values()
      );

      const reportSubjects: ReportSubject[] = uniqueAssignments
        .map((assignment) => {
          const subject = subjects.find(
            (item) => item.id === assignment.subjectId
          );

          const config = classSubjects.find(
            (item) =>
              item.classId === student.classId &&
              item.subjectId === assignment.subjectId
          );

          const configuredAssessments = Array.isArray(config?.assessments)
            ? config.assessments
                .filter(
                  (assessment) =>
                    assessment &&
                    typeof assessment.id === "string" &&
                    typeof assessment.maxMark === "number" &&
                    assessment.maxMark > 0
                )
                .slice()
                .sort((a, b) => a.order - b.order)
            : [];

          const rawCoefficient = numberOrNull(config?.coefficient);

          const coefficient =
            rawCoefficient !== null && rawCoefficient > 0
              ? rawCoefficient
              : null;

          const termResults: Record<string, TermSubjectResult> = {};

          terms.forEach((term) => {
            const termMarks = marksByTerm[term.id] || [];

            const mark = termMarks.find(
              (item) =>
                item.studentId === student.id &&
                item.subjectId === assignment.subjectId &&
                item.classId === student.classId
            );

            const assessmentMarks: AssessmentMark[] = Array.isArray(
              mark?.assessmentMarks
            )
              ? mark.assessmentMarks
              : [];

            const result = calculateSubjectResult(
              assessmentMarks,
              configuredAssessments
            );

            termResults[term.id] = {
              average:
                result.complete && result.percentage !== null
                  ? result.percentage / 5
                  : null,
              totalMark: result.totalMark,
              totalMaximum: result.totalMaximum,
              assessmentMarks,
              complete: result.complete,
              status: mark?.status || "missing",
            };
          });

          return {
            subjectId: assignment.subjectId,
            name: subject?.name || assignment.subjectName,
            teacherName: assignment.teacherName || "—",
            category: subject?.category || "Unclassified",
            coefficient,
            assessments: configuredAssessments,
            termResults,
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));

      const categories = Array.from(
        new Set(reportSubjects.map((subject) => subject.category))
      )
        .sort((a, b) => a.localeCompare(b))
        .map((category) => ({
          name: category,
          subjects: reportSubjects.filter(
            (subject) => subject.category === category
          ),
        }));

      const termAverages: Record<string, number | null> = {};

      terms.forEach((term) => {
        termAverages[term.id] = calculateWeightedAverage(
          reportSubjects,
          term.id
        );
      });

      const selectedAverage = selectedTerm
        ? termAverages[selectedTerm] ?? null
        : null;

      const selectedResults = reportSubjects.map(
        (subject) => subject.termResults[selectedTerm]
      );

      const incomplete = reportSubjects.some(
        (subject) =>
          subject.assessments.length === 0 ||
          !subject.termResults[selectedTerm]?.complete
      );

      const unconfiguredCoefficients = reportSubjects.some(
        (subject) => subject.coefficient === null
      );

      const finalized =
        reportSubjects.length > 0 &&
        reportSubjects.every(
          (subject) =>
            subject.coefficient !== null &&
            subject.assessments.length > 0 &&
            subject.termResults[selectedTerm]?.complete === true &&
            subject.termResults[selectedTerm]?.status === "finalized"
        );

      return {
        student,
        schoolClass: classes.find(
          (schoolClass) => schoolClass.id === student.classId
        ),
        subjects: reportSubjects,
        categories,
        termAverages,
        average: selectedAverage,
        incomplete:
          incomplete ||
          selectedResults.some((result) => !result),
        unconfiguredCoefficients,
        finalized,
      };
    },
    [
      assignments,
      selectedYear,
      subjects,
      classSubjects,
      terms,
      marksByTerm,
      selectedTerm,
      classes,
    ]
  );

  const classRanking = useMemo(() => {
    return classStudents
      .map((student) => ({
        id: student.id,
        average: buildStudentReport(student).average,
      }))
      .filter(
        (item): item is { id: string; average: number } =>
          item.average !== null
      )
      .sort((a, b) => b.average - a.average);
  }, [classStudents, buildStudentReport]);

  const classAverage =
    classRanking.length > 0
      ? classRanking.reduce((sum, item) => sum + item.average, 0) /
        classRanking.length
      : null;


  const previewStudents = classStudents.filter((student) =>
    previewStudentIds.includes(student.id)
  );

  const previewReports = useMemo(
    () =>
      previewStudents.map((student) => {
        const report = buildStudentReport(student);
        const position =
          classRanking.findIndex((item) => item.id === student.id) + 1;

        return {
          ...report,
          position,
          classAverage,
          rankedCount: classRanking.length,
        };
      }),
    [
      previewStudents,
      buildStudentReport,
      classRanking,
      classAverage,
    ]
  );

  // Print only after the requested report cards have rendered
  useEffect(() => {
    if (!printRequested || previewStudentIds.length === 0) return;

    const frame = window.requestAnimationFrame(() => {
      window.print();
      setPrintRequested(false);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [printRequested, previewStudentIds]);

  const toggleStudent = (studentId: string) => {
    setSelectedStudentIds((previous) =>
      previous.includes(studentId)
        ? previous.filter((id) => id !== studentId)
        : [...previous, studentId]
    );

    setFocusedStudentId(studentId);
  };

  const selectAllStudents = () => {
    setSelectedStudentIds(classStudents.map((student) => student.id));
  };

  const clearSelection = () => {
    setSelectedStudentIds([]);
  };

  const getOneStudentId = () => {
    if (classStudents.some((student) => student.id === focusedStudentId)) {
      return focusedStudentId;
    }

    return selectedStudentIds[0] || classStudents[0]?.id || "";
  };

  const previewOne = () => {
  const id = getOneStudentId();
  if (!id) return;
  setPreviewStudentIds([id]);
  setPreviewOpen(true);
};

const previewSelected = () => {
  const ids = classStudents
    .filter((student) => selectedStudentIds.includes(student.id))
    .map((student) => student.id);

  if (!ids.length) return;
  setPreviewStudentIds(ids);
  setPreviewOpen(true);
};

const previewAll = () => {
  const ids = classStudents.map((student) => student.id);
  if (!ids.length) return;
  setPreviewStudentIds(ids);
  setPreviewOpen(true);
};

const printOne = () => {
  const id = getOneStudentId();
  if (!id) return;

  setPreviewStudentIds([id]);
  setPrintRequested(true);
};

const printSelected = () => {
  const ids = classStudents
    .filter((student) => selectedStudentIds.includes(student.id))
    .map((student) => student.id);

  if (!ids.length) return;

  setPreviewStudentIds(ids);
  setPrintRequested(true);
};

const printAll = () => {
  const ids = classStudents.map((student) => student.id);
  if (!ids.length) return;

  setPreviewStudentIds(ids);
  setPrintRequested(true);
};
  if (loading) {
    return (
      <main className="p-8 text-center">
        Loading report data...
      </main>
    );
  }

  return (
    <main className="space-y-5 p-4 md:p-6">
      {/* PAGE HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-bold">Progress Records</h1>
          <p className="text-sm text-gray-500">
            Select a class, manage student reports, preview and print.
          </p>
        </div>

        <div className="text-sm text-gray-600">
          {classStudents.length} students in selected class
        </div>
      </div>

      {error && (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-red-700 print:hidden">
          {error}
        </div>
      )}

      {/* ACADEMIC FILTERS */}
      <section className="grid gap-3 rounded-lg border bg-white p-4 shadow-sm md:grid-cols-3 print:hidden">
        <label className="text-sm font-semibold">
          Academic Year
          <select
            value={selectedYear}
           onChange={(event) => {
  setSelectedYear(event.target.value);
  setSelectedStudentIds([]);
  setFocusedStudentId("");
  setPreviewStudentIds([]);
  setPrintRequested(false);
}}
            className="mt-1 w-full rounded border p-2 font-normal"
          >
            {academicYears.map((year) => (
              <option key={year.id} value={year.id}>
                {year.name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-semibold">
          Term
          <select
            value={selectedTerm}
           onChange={(event) => {
  setSelectedTerm(event.target.value);
  setSelectedStudentIds([]);
  setFocusedStudentId("");
  setPreviewStudentIds([]);
  setPrintRequested(false);
}}
            className="mt-1 w-full rounded border p-2 font-normal"
          >
            {terms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-semibold">
          Class
          <select
            value={activeClassId}
           onChange={(event) => {
  setSelectedClassId(event.target.value);
  setSelectedStudentIds([]);
  setFocusedStudentId("");
  setPreviewStudentIds([]);
  setPrintRequested(false);
}}
            className="mt-1 w-full rounded border p-2 font-normal"
          >
            {availableClasses.map((schoolClass) => (
              <option key={schoolClass.id} value={schoolClass.id}>
                {schoolClass.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      {reportLoading && (
        <p className="text-sm text-blue-700 print:hidden">
          Loading student enrollments and term results...
        </p>
      )}

      {/* STUDENT SELECTION AND ACTIONS */}
      <section className="grid gap-4 lg:grid-cols-[minmax(260px,360px)_1fr] print:hidden">
        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <div className="border-b p-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-bold">Students</h2>
              <span className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-800">
                {selectedStudentIds.length} selected
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={selectAllStudents}
                disabled={classStudents.length === 0}
                className="rounded border px-3 py-1.5 text-xs font-semibold hover:bg-gray-50 disabled:opacity-40"
              >
                Select All
              </button>

              <button
                type="button"
                onClick={clearSelection}
                disabled={selectedStudentIds.length === 0}
                className="rounded border px-3 py-1.5 text-xs font-semibold hover:bg-gray-50 disabled:opacity-40"
              >
                Clear Selection
              </button>
            </div>
          </div>

          <div className="max-h-[520px] space-y-1 overflow-y-auto p-2">
            {classStudents.map((student, index) => {
              const checked = selectedStudentIds.includes(student.id);
              const focused = focusedStudentId === student.id;

              return (
                <div
                  key={student.id}
                  className={`flex items-center gap-2 rounded-md border p-2 ${
                    focused
                      ? "border-blue-500 bg-blue-50"
                      : "border-transparent hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleStudent(student.id)}
                    aria-label={`Select ${student.fullName}`}
                    className="h-4 w-4 shrink-0"
                  />

                  <button
                    type="button"
                    onClick={() => setFocusedStudentId(student.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block truncate text-sm font-semibold">
                      {index + 1}. {student.fullName}
                    </span>
                    <span className="block truncate text-xs text-gray-500">
                      {student.admissionNumber || "No admission number"}
                    </span>
                  </button>

                  {focused && (
                    <span className="text-xs font-semibold text-blue-700">
                      Viewing
                    </span>
                  )}
                </div>
              );
            })}

            {classStudents.length === 0 && (
              <p className="p-5 text-center text-sm text-gray-500">
                No active students are enrolled in this class.
              </p>
            )}
          </div>
        </div>

        {/* PREVIEW AND PRINT ACTIONS */}
        <div className="space-y-4">
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h2 className="mb-3 font-bold">Preview Reports</h2>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={previewOne}
                disabled={classStudents.length === 0}
                className="rounded bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-40"
              >
                Preview One
              </button>

              <button
                type="button"
                onClick={previewSelected}
                disabled={selectedStudentIds.length === 0}
                className="rounded bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-40"
              >
                Preview Selected ({selectedStudentIds.length})
              </button>

              <button
                type="button"
                onClick={previewAll}
                disabled={classStudents.length === 0}
                className="rounded bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-40"
              >
                Preview All ({classStudents.length})
              </button>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h2 className="mb-3 font-bold">Print Reports</h2>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={printOne}
                disabled={classStudents.length === 0 || reportLoading}
                className="rounded bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-40"
              >
                Print One
              </button>

              <button
                type="button"
                onClick={printSelected}
                disabled={selectedStudentIds.length === 0 || reportLoading}
                className="rounded bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-40"
              >
                Print Selected
              </button>

              <button
                type="button"
                onClick={printAll}
                disabled={classStudents.length === 0 || reportLoading}
                className="rounded bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-40"
              >
                Print All
              </button>
            </div>

            <p className="mt-3 text-xs text-gray-500">
              Each selected student&apos;s report will be printed on a separate A4 page.
            </p>
          </div>

          <div className="rounded-lg border bg-blue-50 p-4 text-sm text-blue-900">
            <strong>Current selection:</strong>{" "}
            {selectedStudentIds.length} student(s).
            <br />
            Select a student&apos;s name to focus on that student. Use the checkbox
            to include students in bulk preview or printing.
          </div>
        </div>
      </section>

      {/* REPORT PREVIEW */}
<section
  className={`print-area ${
    previewOpen
      ? "fixed inset-0 z-50 overflow-y-auto bg-gray-200 p-2 md:p-6"
      : "hidden"
  }`}
>
        {previewReports.length > 0 ? (
          <div className="space-y-6">
           <div className="sticky top-0 z-20 flex items-center justify-between gap-2 bg-white p-3 shadow print:hidden">
  <h2 className="text-lg font-bold">
    Report Preview ({previewReports.length})
  </h2>

  <div className="flex gap-2">
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded bg-blue-700 px-4 py-2 text-sm font-bold text-white"
    >
      Print
    </button>

    <button
      type="button"
      onClick={() => {
        setPreviewOpen(false);
        setPreviewStudentIds([]);
      }}
      className="rounded border px-3 py-2 text-sm hover:bg-gray-50"
    >
      Close
    </button>
  </div>
</div>

            <div className="max-h-[85vh] space-y-6 overflow-y-auto rounded-lg bg-gray-100 p-3 print:max-h-none print:space-y-0 print:overflow-visible print:bg-white print:p-0">
              {previewReports.map((report) => {
                const { student, schoolClass } = report;

                return (
                  <article
                    key={student.id}
                    className="report-sheet mx-auto max-w-[1100px] bg-white p-5 text-black shadow-md print:max-w-none print:p-0 print:shadow-none"
                  >
                    {/* SCHOOL HEADING */}
                    <header className="border-2 border-blue-800 p-2">
                      <div className="grid grid-cols-3 items-center gap-2 text-center text-[10px] font-bold text-blue-900 sm:text-xs">
                        <div>
                          MINISTÈRE DE L&apos;ENSEIGNEMENT
                          <br />
                          SECONDAIRE
                        </div>

                        <div className="text-sm sm:text-base">
                          GOVERNMENT TECHNICAL HIGH SCHOOL
                          <br />
                          GTHS KUMBO
                        </div>

                        <div>
                          MINISTRY OF SECONDARY
                          <br />
                          EDUCATION
                        </div>
                      </div>

                      <div className="mx-auto mt-2 w-fit rounded-full border-4 border-blue-800 px-5 py-1 text-center text-lg font-black text-blue-900 sm:text-xl">
                        PROGRESS RECORD
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] sm:text-xs">
                        <p>
                          <strong>Name:</strong> {student.fullName}
                        </p>
                        <p>
                          <strong>Academic Year:</strong> {currentYear?.name || "—"}
                        </p>

                        <p>
                          <strong>Speciality:</strong>{" "}
                          {student.specialty || schoolClass?.department || "—"}
                        </p>
                        <p>
                          <strong>Stream:</strong> {schoolClass?.stream || "—"}
                        </p>

                        <p>
                          <strong>Date of Birth:</strong>{" "}
                          {student.dateOfBirth || "—"}
                        </p>
                        <p>
                          <strong>Class:</strong> {student.className}
                        </p>

                        <p>
                          <strong>Admission No:</strong>{" "}
                          {student.admissionNumber || "—"}
                        </p>
                        <p>
                          <strong>Repeater (Y/N):</strong>{" "}
                          {student.repeater === undefined
                            ? "—"
                            : student.repeater
                              ? "YES"
                              : "NO"}
                        </p>

                        <p>
                          <strong>Student&apos;s No:</strong>{" "}
                          {student.studentNumber || "—"}
                        </p>
                        <p>
                          <strong>Department:</strong>{" "}
                          {schoolClass?.department || "—"}
                        </p>
                      </div>
                    </header>

                    <div className="my-2 flex flex-wrap items-center justify-between gap-2 border border-blue-800 px-2 py-1 text-[10px] font-bold sm:text-xs">
                      <span>
                        {report.finalized
                          ? "FINALIZED RESULTS"
                          : "PREVIEW — NOT FINALIZED"}
                      </span>
                      <span>
                        Selected Term: {currentTerm?.name || "—"}
                      </span>
                      <span>
                        {report.incomplete || report.unconfiguredCoefficients
                          ? "INCOMPLETE REPORT"
                          : "RESULTS AVAILABLE"}
                      </span>
                    </div>

                    {(report.incomplete ||
                      report.unconfiguredCoefficients) && (
                      <div className="mb-2 border border-amber-600 p-2 text-[10px] text-amber-900">
                        Some marks, assessment configurations or subject
                        coefficients are incomplete. Missing results are not
                        treated as final zero marks.
                      </div>
                    )}

                    {/* SUBJECT TABLES */}
                    {report.categories.length === 0 ? (
                      <div className="border border-blue-800 p-5 text-center text-sm">
                        No active teacher subject assignments were found for
                        this student&apos;s class.
                      </div>
                    ) : (
                      report.categories.map((category, categoryIndex) => (
                        <section
                          key={category.name}
                          className="mb-1"
                        >
                          <h3 className="border border-blue-800 bg-blue-100 px-2 py-1 text-[10px] font-black uppercase text-blue-900 sm:text-xs print:bg-blue-100">
                            {String.fromCharCode(65 + categoryIndex)}.{" "}
                            {category.name}
                          </h3>

                          <table className="w-full table-fixed border-collapse text-[9px] sm:text-[10px]">
                            <thead>
                              <tr className="bg-blue-800 text-white print:bg-blue-800">
                                <th className="w-[25%] border border-blue-900 p-1 text-left">
                                  SUBJECT
                                </th>
                                <th className="w-[17%] border border-blue-900 p-1">
                                  TEACHER
                                </th>

                                {orderedTerms.map((term) => (
                                  <th
                                    key={term.id}
                                    className="w-[12%] border border-blue-900 p-1"
                                  >
                                    {term.name}
                                    <br />
                                    /20
                                  </th>
                                ))}

                                <th className="w-[8%] border border-blue-900 p-1">
                                  COEFF.
                                </th>
                                <th className="w-[14%] border border-blue-900 p-1">
                                  GRADE / REMARKS
                                </th>
                              </tr>
                            </thead>

                            <tbody>
                              {category.subjects.map((subject) => {
                                const selectedResult =
                                  subject.termResults[selectedTerm];

                                const selectedAverage =
                                  selectedResult?.average ?? null;

                                return (
                                  <tr key={subject.subjectId}>
                                    <td className="border border-blue-800 p-1 font-semibold">
                                      {subject.name}
                                    </td>

                                    <td className="border border-blue-800 p-1">
                                      {subject.teacherName}
                                    </td>

                                    {orderedTerms.map((term) => {
                                      const result =
                                        subject.termResults[term.id];

                                      return (
                                        <td
                                          key={term.id}
                                          className="border border-blue-800 p-1 text-center"
                                        >
                                          <div className="font-bold">
                                            {display(result?.average)}
                                          </div>

                                          {term.id === selectedTerm &&
                                            subject.assessments.length > 0 && (
                                         <div className="text-[7px] leading-tight font-normal">
  {subject.assessments.map((assessment, index) => {
    const entry = result?.assessmentMarks.find(
      (item) => item.assessmentId === assessment.id
    );

    return (
      <span key={assessment.id}>
        {index > 0 ? " · " : ""}
        {assessment.name}: {display(entry?.mark)}/{assessment.maxMark}
      </span>
    );
  })}
</div>
                                            )}
                                        </td>
                                      );
                                    })}

                                    <td className="border border-blue-800 p-1 text-center">
                                      {subject.coefficient ?? "—"}
                                    </td>

                                    <td className="border border-blue-800 p-1 text-center">
                                      <strong>
                                        {gradeFor(selectedAverage)}
                                      </strong>
                                      <div className="text-[8px]">
                                        {selectedResult?.status === "finalized"
                                          ? "Finalized"
                                          : selectedAverage === null
                                            ? "Incomplete"
                                            : "Preview"}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}

                              <tr className="bg-blue-50 font-bold print:bg-blue-50">
                                <td
                                  colSpan={2}
                                  className="border border-blue-800 p-1"
                                >
                                  {category.name.toUpperCase()} TOTAL / AVERAGE
                                </td>

                                {orderedTerms.map((term) => (
                                  <td
                                    key={term.id}
                                    className="border border-blue-800 p-1 text-center"
                                  >
                                    {display(
                                      calculateWeightedAverage(
                                        category.subjects,
                                        term.id
                                      )
                                    )}
                                  </td>
                                ))}

                                <td className="border border-blue-800 p-1 text-center">
                                  {category.subjects.reduce(
                                    (sum, subject) =>
                                      sum + (subject.coefficient || 0),
                                    0
                                  )}
                                </td>

                                <td className="border border-blue-800 p-1 text-center">
                                  —
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </section>
                      ))
                    )}

                    {/* GRAND TOTAL */}
                    <table className="w-full border-collapse text-[10px] sm:text-xs">
                      <tbody>
                        <tr className="bg-blue-100 font-black print:bg-blue-100">
                          <td className="border border-blue-800 p-2">
                            GRAND AVERAGE
                          </td>

                          {orderedTerms.map((term) => (
                            <td
                              key={term.id}
                              className="border border-blue-800 p-2 text-center"
                            >
                              {display(report.termAverages[term.id])}/20
                            </td>
                          ))}

                          <td
                            colSpan={2}
                            className="border border-blue-800 p-2 text-center"
                          >
                            CURRENT: {display(report.average)}/20
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* SUMMARY AND RECAPITULATION */}
                    <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] sm:text-xs">
                      <div className="border border-blue-800 p-2">
                        <h4 className="mb-1 text-center font-black">
                          CLASS PERFORMANCE
                        </h4>

                        <p>
                          Class Average: {display(report.classAverage)}/20
                        </p>
                        <p>
                          Student&apos;s Position:{" "}
                          {report.position > 0 ? report.position : "—"} /{" "}
                          {report.rankedCount}
                        </p>
                        <p>
                          Passion: ____________________
                        </p>
                        <p>
                          General Certificate: __________
                        </p>
                      </div>

                      <div className="border border-blue-800 p-2">
                        <h4 className="mb-1 text-center font-black">
                          RECAPITULATION
                        </h4>

                        {orderedTerms.map((term) => (
                          <p key={term.id}>
                            {term.name} Average:{" "}
                            {display(report.termAverages[term.id])}/20
                          </p>
                        ))}

                        <p>
                          Annual Average:{" "}
                          {display(
                            (() => {
                              const values = terms
                                .map((term) => report.termAverages[term.id])
                                .filter(
                                  (value): value is number => value !== null
                                );

                              return values.length > 0
                                ? values.reduce((sum, value) => sum + value, 0) /
                                    values.length
                                : null;
                            })()
                          )}
                          /20
                        </p>
                      </div>
                    </div>

                   {/* PERFORMANCE INDICATORS */}
<div className="mt-1 grid grid-cols-2 gap-1 text-[8px] leading-tight">
  <div className="border border-blue-800">
    <h4 className="bg-blue-100 px-1 py-0.5 text-center font-black">
      PERFORMANCE INDICATOR
    </h4>

    {[
      ["Excellent", "18–20"],
      ["Very Good", "16–17"],
      ["Good", "14–15"],
      ["Satisfactory", "12–13"],
      ["Passable", "10–11"],
      ["Poor", "08–09"],
      ["Very Weak", "06–07"],
      ["Insufficient", "00–05"],
    ].map(([label, range]) => (
      <div
        key={label}
        className="flex justify-between border-t border-blue-800 px-1 py-[2px]"
      >
        <span>{label}</span>
        <strong>{range}</strong>
      </div>
    ))}
  </div>

  <div className="border border-blue-800">
    <h4 className="bg-blue-100 px-1 py-0.5 text-center font-black">
      CLASS COUNCIL DECISION
    </h4>

    <div className="space-y-1 p-2 text-center font-bold">
      <p>PROMOTED: ______________</p>
      <p>REPEAT: _________________</p>
      <p>DISMISSED: ______________</p>
      <p>CANNOT TRIPPLE: __________</p>
    </div>

    <div className="border-t border-blue-800 px-1 py-1 text-center">
      <p className="font-bold">DISCIPLINE</p>
      <p>________________________</p>
    </div>
  </div>
</div>

{/* SIGNATURES */}
<div className="mt-2 grid grid-cols-2 gap-4 text-center text-[9px]">
  <div>
    <p className="font-bold">CLASS MASTER</p>
    <p className="mt-4 border-t border-black pt-1">
      Signature
    </p>
  </div>

  <div>
    <p className="font-bold">PRINCIPAL</p>
    <p className="mt-4 border-t border-black pt-1">
      Signature and Stamp
    </p>
  </div>
</div>

<p className="mt-1 text-center text-[7px]">
  Generated from the school results management system.
</p>
                  </article>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed bg-white p-10 text-center text-gray-500 print:hidden">
            <p className="font-semibold">No report preview selected.</p>
            <p className="mt-1 text-sm">
              Select a student or students, then choose a preview option.
            </p>
          </div>
        )}
      </section>

      <style jsx global>{`
  @page {
    size: A4 portrait;
    margin: 5mm;
  }

  @media print {
    html,
    body {
      background: white !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    body * {
      visibility: hidden !important;
    }

    .print-area,
    .print-area * {
      visibility: visible !important;
    }

    .print-area {
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    .report-sheet {
      display: block !important;
      width: 100% !important;
      max-width: none !important;
      margin: 0 !important;
      padding: 0 !important;
      box-shadow: none !important;
      font-size: 8px !important;
      break-after: page;
      page-break-after: always;
    }

    .report-sheet:last-child {
      break-after: auto;
      page-break-after: auto;
    }

    .report-sheet table {
      width: 100% !important;
      border-collapse: collapse !important;
    }

    .report-sheet th,
    .report-sheet td {
      padding: 2px 3px !important;
      line-height: 1.15 !important;
    }

    .report-sheet tr,
    .report-sheet header,
    .report-sheet section {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .report-sheet * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }
`}</style>
    </main>
  );
}
