
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



type ReportLabels = {
  studentName: string;
  academicYear: string;
  speciality: string;
  stream: string;
  dateOfBirth: string;
  class: string;
  admissionNumber: string;
  repeater: string;
  studentNumber: string;
  department: string;
  subject: string;
  teacher: string;
  firstSequence: string;
  secondSequence: string;
  average: string;
  coefficient: string;
  totalMarks: string;
  gradeRemarks: string;
  finalized: string;
  previewNotFinalized: string;
  incompleteReport: string;
  resultsAvailable: string;
  selectedTerm: string;
  incompleteWarning: string;
  noAssignmentsMessage: string;
  categoryTotalAverage: string;
  grandAverage: string;
  currentAverage: string;
  classPerformance: string;
  classAverage: string;
  studentPosition: string;
  passion: string;
  generalCertificate: string;
  performanceIndicators: string;
  recapitulation: string;
  firstTermAverage: string;
 classCouncilDecision: string;

// First and second term
passed: string;
needsImprovement: string;
failed: string;

// End-of-year
promoted: string;
repeat: string;
dismissed: string;
cannotTriple: string;

discipline: string;
  principalSignature: string;
  signatureAndStamp: string;
  generatedFooter: string;
};

type GradeBand = {
  label: string;
  range: string;
};

type SchoolSettings = {
  identity?: {
    schoolName?: string;
    abbreviation?: string;
    address?: string;
    town?: string;
    region?: string;
    country?: string;
  };
  branding?: {
    logoUrl?: string;
    motto?: string;
  };
  report?: {
    title?: string;
    authorityHeaderLeft?: string;
    authorityHeaderRight?: string;
    principalTitle?: string;
    footerText?: string;
    showAdmissionNumber?: boolean;
    showSpeciality?: boolean;
    showDepartment?: boolean;
    showStream?: boolean;
    showDateOfBirth?: boolean;
    labels?: Partial<ReportLabels>;
    gradeBands?: GradeBand[];
  };
};

const DEFAULT_REPORT_LABELS: ReportLabels = {
  studentName: "Name:",
  academicYear: "Academic Year:",
  speciality: "Speciality:",
  stream: "Stream:",
  dateOfBirth: "Date of Birth:",
  class: "Class:",
  admissionNumber: "Admission No:",
  repeater: "Repeater (Y/N):",
  studentNumber: "Student's No:",
  department: "Department:",
  subject: "SUBJECT",
  teacher: "TEACHER",
  firstSequence: "1st Seq",
  secondSequence: "2nd Seq",
  average: "AVRG",
  coefficient: "COEFF.",
  totalMarks: "TOTAL MARKS",
  gradeRemarks: "GRADE / REMARKS",
  finalized: "FINALIZED RESULTS",
  previewNotFinalized: "PREVIEW — NOT FINALIZED",
  incompleteReport: "INCOMPLETE REPORT",
  resultsAvailable: "RESULTS AVAILABLE",
  selectedTerm: "Selected Term:",
  incompleteWarning:
    "Some marks, assessment configurations or subject coefficients are incomplete. Missing results are not treated as final zero marks.",
  noAssignmentsMessage:
    "No active teacher subject assignments were found for this student's class.",
  categoryTotalAverage: "TOTAL / AVERAGE",
  grandAverage: "GRAND AVERAGE",
  currentAverage: "CURRENT:",
  classPerformance: "CLASS PERFORMANCE",
  classAverage: "Class Average:",
  studentPosition: "Student's Position:",
  passion: "Passion:",
  generalCertificate: "General Certificate:",
  performanceIndicators: "PERFORMANCE INDICATORS",
  recapitulation: "RECAPITULATION",
  firstTermAverage: "First Term Average:",
  classCouncilDecision: "CLASS COUNCIL DECISION",

passed: "PASSED:",
needsImprovement: "NEEDS IMPROVEMENT:",
failed: "FAILED:",

promoted: "PROMOTED:",
repeat: "REPEAT:",
dismissed: "DISMISSED:",
cannotTriple: "CANNOT REPEAT AGAIN:",

discipline: "DISCIPLINE",
  principalSignature: "THE PRINCIPAL",
  signatureAndStamp: "Signature and Official Stamp",
  generatedFooter:
    "Generated from the school results management system.",
};

const DEFAULT_GRADE_BANDS: GradeBand[] = [
  { label: "Excellent", range: "18–20" },
  { label: "Very Good", range: "16–17" },
  { label: "Good", range: "14–15" },
  { label: "Satisfactory", range: "12–13" },
  { label: "Passable", range: "10–11" },
  { label: "Poor", range: "08–09" },
  { label: "Very Weak", range: "06–07" },
  { label: "Insufficient", range: "00–05" },
];

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
type CouncilOutcome = {
  decision: string;
  discipline: string;
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


function gradeFor(
  value: number | null,
  bands: GradeBand[] = DEFAULT_GRADE_BANDS
): string {
  if (value === null) return "—";

  for (const band of bands) {
    const numbers = band.range.match(/\d+(?:\.\d+)?/g);

    if (!numbers || numbers.length < 2) continue;

    const lower = Number(numbers[0]);
    const upper = Number(numbers[1]);

    if (value >= lower && value <= upper) {
      return band.label || "—";
    }
  }

  return "—";
}


export default function ReportsPage() {
  const router = useRouter();

  const [schoolSettings, setSchoolSettings] =
  useState<SchoolSettings | null>(null);
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
 
const [previewOpen, setPreviewOpen] = useState(false);
const [councilOutcomes, setCouncilOutcomes] = useState<
  Record<string, CouncilOutcome>
>({});

const labels: ReportLabels = {
  ...DEFAULT_REPORT_LABELS,
  ...Object.fromEntries(
    Object.entries(schoolSettings?.report?.labels || {}).filter(
      ([, value]) =>
        typeof value === "string" && value.trim().length > 0
    )
  ),
};

const gradeBands =
  schoolSettings?.report?.gradeBands?.length
    ? schoolSettings.report.gradeBands
    : DEFAULT_GRADE_BANDS;
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
        const settingsSnap = await getDoc(
  doc(db, "schools", currentSchoolId, "settings", "general")
);

if (active) {
  setSchoolSettings(
    settingsSnap.exists()
      ? (settingsSnap.data() as SchoolSettings)
      : null
  );
}

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
  
  useEffect(() => {
  let active = true;

  async function loadCouncilOutcomes() {
    if (!schoolId || !selectedYear || !selectedTerm || !activeClassId) {
      setCouncilOutcomes({});
      return;
    }

    setCouncilOutcomes({});

    try {
      const councilSnap = await getDoc(
        doc(
          db,
          "schools",
          schoolId,
          "academicYears",
          selectedYear,
          "terms",
          selectedTerm,
          "classCouncils",
          activeClassId
        )
      );

      if (!active) return;

      const outcomes: Record<string, CouncilOutcome> = {};

      if (councilSnap.exists()) {
        const savedStudents = councilSnap.data().students;

        if (Array.isArray(savedStudents)) {
          savedStudents.forEach(
            (item: {
              studentId?: string;
              decision?: string;
              discipline?: string;
            }) => {
              if (item.studentId) {
                outcomes[item.studentId] = {
                  decision:
                    item.decision && item.decision !== "Pending"
                      ? item.decision
                      : "",
                  discipline: item.discipline || "",
                };
              }
            }
          );
        }
      }

      setCouncilOutcomes(outcomes);
    } catch {
      if (active) setCouncilOutcomes({});
    }
  }

  loadCouncilOutcomes();

  return () => {
    active = false;
  };
}, [schoolId, selectedYear, selectedTerm, activeClassId]);

  const currentYear = academicYears.find(
    (year) => year.id === selectedYear
  );


 const orderedTerms = useMemo(
  () => terms.slice().sort((a, b) => a.order - b.order),
  [terms]
);
const finalTerm = terms.reduce<Term | null>(
  (latest, term) =>
    !latest || term.order > latest.order ? term : latest,
  null
);

const isFinalTerm = selectedTerm === finalTerm?.id;
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
                onClick={previewOne}
                disabled={classStudents.length === 0 || reportLoading}
                className="rounded bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-40"
              >
                Print One
              </button>

              <button
                type="button"
                onClick={previewSelected}
                disabled={selectedStudentIds.length === 0 || reportLoading}
                className="rounded bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-40"
              >
                Print Selected
              </button>

              <button
                type="button"
                onClick={previewAll}
                disabled={classStudents.length === 0 || reportLoading}
                className="rounded bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-40"
              >
                Print All
              </button>
            </div>

           <p className="mt-3 text-xs leading-relaxed text-gray-500">
  Each student&apos;s report is prepared on a separate A4 page.
  Open the preview, tap Print / Save PDF, then choose Save as PDF
  in your device&apos;s print options where available. You can then
  share the saved PDF through WhatsApp.
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
  Print / Save PDF
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


const selectedCouncilDecision =
  councilOutcomes[student.id]?.decision || "";

const decisionOptionsForReport: {
  value: string;
  label: string;
  tone: "green" | "amber" | "red";
}[] = isFinalTerm
  ? [
      {
        value: "Promoted",
        label: labels.promoted.replace(/:$/, ""),
        tone: "green",
      },
      {
        value: "Repeat",
        label: labels.repeat.replace(/:$/, ""),
        tone: "amber",
      },
      {
        value: "Dismissed",
        label: labels.dismissed.replace(/:$/, ""),
        tone: "red",
      },
      {
        value: "Cannot Repeat Again",
        label: labels.cannotTriple.replace(/:$/, ""),
        tone: "red",
      },
    ]
  : [
      {
        value: "Passed",
        label: labels.passed.replace(/:$/, ""),
        tone: "green",
      },
      {
        value: "Needs Improvement",
        label: labels.needsImprovement.replace(/:$/, ""),
        tone: "amber",
      },
      {
        value: "Failed",
        label: labels.failed.replace(/:$/, ""),
        tone: "red",
      },
    ];


                return (
                  <article
                    key={student.id}
                    className="report-sheet mx-auto max-w-[1100px] bg-white p-5 text-black shadow-md print:max-w-none print:p-0 print:shadow-none"
                  >

              {/* SCHOOL HEADING */}
<header className="border-2 border-blue-800 p-2">
  <div className="grid grid-cols-3 items-center gap-2 text-center text-[9px] font-bold text-blue-900 sm:text-xs">

    {/* Left authority heading */}
    <div className="leading-tight">
      {schoolSettings?.report?.authorityHeaderLeft ||
        "MINISTÈRE DE L'ENSEIGNEMENT SECONDAIRE"}
    </div>

    {/* School identity and compact logo */}
    <div className="flex min-w-0 items-center justify-center gap-1.5">
      {schoolSettings?.branding?.logoUrl && (
        <img
          src={schoolSettings.branding.logoUrl}
          alt="School logo"
          className="h-10 w-10 shrink-0 object-contain"
        />
      )}

      <div className="min-w-0 text-center text-[7px] font-black leading-tight sm:text-[9px]">
        <span className="block">
          {schoolSettings?.identity?.schoolName || "SCHOOL NAME"}
        </span>

        {schoolSettings?.identity?.abbreviation && (
          <span className="block">
            {schoolSettings.identity.abbreviation}
          </span>
        )}

       
        {schoolSettings?.branding?.motto && (
          <span className="mt-0.5 block text-[6px] font-normal italic">
            {schoolSettings.branding.motto}
          </span>
        )}
      </div>
    </div>

    {/* Right authority heading */}
    <div className="leading-tight">
      {schoolSettings?.report?.authorityHeaderRight ||
        "MINISTRY OF SECONDARY EDUCATION"}
    </div>
  </div>

  {/* Report title */}
  <div className="mx-auto mt-1 w-fit rounded-full border-2 border-blue-800 px-4 py-1 text-center text-base font-black text-blue-900 sm:text-lg">
    {schoolSettings?.report?.title || "PROGRESS RECORD"}
  </div>

  {/* Student information */}
  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[9px] sm:text-[10px]">

    <p>
      <strong>{labels.studentName}</strong> {student.fullName}
    </p>

    <p>
      <strong>{labels.academicYear}</strong> {currentYear?.name || "—"}
    </p>

    {schoolSettings?.report?.showSpeciality !== false && (
      <p>
        <strong>{labels.speciality}</strong>{" "}
        {student.specialty || schoolClass?.department || "—"}
      </p>
    )}

    {schoolSettings?.report?.showStream !== false && (
      <p>
        <strong>{labels.stream}</strong> {schoolClass?.stream || "—"}
      </p>
    )}

    {schoolSettings?.report?.showDateOfBirth === true && (
      <p>
        <strong>{labels.dateOfBirth}</strong>{" "}
        {student.dateOfBirth || "—"}
      </p>
    )}

    <p>
      <strong>{labels.class}</strong> {student.className}
    </p>

    {schoolSettings?.report?.showAdmissionNumber !== false && (
      <p>
        <strong>{labels.admissionNumber}</strong>{" "}
        {student.admissionNumber || "—"}
      </p>
    )}

    <p>
      <strong>{labels.repeater}</strong>{" "}
      {student.repeater === undefined
        ? "—"
        : student.repeater
          ? "YES"
          : "NO"}
    </p>

    <p>
      <strong>{labels.studentNumber}</strong>{" "}
      {student.studentNumber || "—"}
    </p>

    {schoolSettings?.report?.showDepartment !== false && (
      <p>
        <strong>{labels.department}</strong>{" "}
        {schoolClass?.department || "—"}
      </p>
    )}
  </div>
</header>

                 

                    {/* SUBJECT TABLES */}
                    {report.categories.length === 0 ? (
                     <div className="print:hidden border border-blue-800 p-5 text-center text-sm">
  {labels.noAssignmentsMessage}
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

                               <th className="w-[9%] border border-blue-900 p-1">
  1st Seq
</th>
<th className="w-[9%] border border-blue-900 p-1">
  2nd Seq
</th>
<th className="w-[9%] border border-blue-900 p-1">
  AVRG
</th>

                              <th className="w-[7%] border border-blue-900 p-1">
  COEFF.
</th>
<th className="w-[10%] border border-blue-900 p-1">
  TOTAL MARKS
</th>
<th className="w-[13%] border border-blue-900 p-1">
  GRADE / REMARKS
</th>
                              </tr>
                            </thead>

                            <tbody>
                              {category.subjects.map((subject) => {
                               const selectedResult = subject.termResults[selectedTerm];

const firstSequence = subject.assessments.find(
  (assessment) => /1st|first/i.test(assessment.name)
);

const secondSequence = subject.assessments.find(
  (assessment) => /2nd|second/i.test(assessment.name)
);

const firstMark = selectedResult?.assessmentMarks.find(
  (item) => item.assessmentId === firstSequence?.id
);

const secondMark = selectedResult?.assessmentMarks.find(
  (item) => item.assessmentId === secondSequence?.id
);

const selectedAverage = selectedResult?.average ?? null;

const totalMarks =
  selectedResult?.complete
    ? `${display(selectedResult.totalMark)}/${display(selectedResult.totalMaximum)}`
    : "—";
                     

                                return (
                                  <tr key={subject.subjectId}>
                                    <td className="border border-blue-800 p-1 font-semibold">
                                      {subject.name}
                                    </td>

                                    <td className="border border-blue-800 p-1">
                                      {subject.teacherName}
                                    </td>

                             <td className="border border-blue-800 p-1 text-center">
  {firstMark ? display(firstMark.mark) : "—"}
</td>

<td className="border border-blue-800 p-1 text-center">
  {secondMark ? display(secondMark.mark) : "—"}
</td>

<td className="border border-blue-800 p-1 text-center font-bold">
  {display(selectedAverage)}
</td>

                               <td className="border border-blue-800 p-1 text-center">
  {subject.coefficient ?? "—"}
</td>

<td className="border border-blue-800 p-1 text-center">
  {totalMarks}
</td>

                                    <td className="border border-blue-800 p-1 text-center">
                                      <strong>
                                       {gradeFor(selectedAverage, gradeBands)}
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

                               <td className="border border-blue-800 p-1 text-center">—</td>
<td className="border border-blue-800 p-1 text-center">—</td>
<td className="border border-blue-800 p-1 text-center">
  {display(calculateWeightedAverage(category.subjects, selectedTerm))}
</td>

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
                          <td className="border border-blue-800 p-1 text-center">
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

                
{/* BOTTOM LAYOUT - TWO MAIN COLUMNS */}
<div className="mt-2 mb-3 grid grid-cols-2 gap-2 text-[8px] leading-tight">

  {/* LEFT COLUMN: CLASS PERFORMANCE + PERFORMANCE INDICATORS */}
<div className="space-y-1 text-[9px] leading-normal">

    {/* CLASS PERFORMANCE */}
<div className="min-h-[80px] border border-blue-800 p-3 text-[10px] leading-relaxed">
      <h4 className="mb-1 border-b border-blue-800 pb-1 text-center font-black">
        CLASS PERFORMANCE
      </h4>

      <p>Class Average: {display(report.classAverage)}/20</p>
      <p>
        Student&apos;s Position:{" "}
        {report.position > 0 ? report.position : "—"} / {report.rankedCount}
      </p>
      <p>Passion: ____________________</p>
      <p>General Certificate: __________</p>
    </div>

    {/* PERFORMANCE INDICATORS */}
    <div className="min-h-[75px] border border-blue-800 text-[10px]">
      <h4 className="border-b border-blue-800 bg-blue-100 px-1 py-1 text-center font-black">
        PERFORMANCE INDICATORS
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
      className="flex justify-between border-t border-blue-800 px-2 py-[2px]"
        >
          <span>{label}</span>
          <strong>{range}</strong>
        </div>
      ))}
    </div>
  </div>

  {/* RIGHT COLUMN: RECAPITULATION + COUNCIL + PRINCIPAL */}
  <div className="space-y-1">

    {/* TOP RIGHT BOX: RECAPITULATION AND COUNCIL DECISION */}
    <div className="grid grid-cols-2 border border-blue-800">

      {/* RECAPITULATION */}
      <div className="border-r border-blue-800 p-2 text-[13px]">
        <h4 className="mb-1 border-b border-blue-800 pb-1 text-center font-black">
          RECAPITULATION
        </h4>

        {orderedTerms.map((term) => (
          <p key={term.id} className="mb-1">
            {term.name}: {display(report.termAverages[term.id])}/20
          </p>
        ))}

       <p className="mt-1 border-t border-blue-800 pt-1 font-black text-[9px]">
         First Term Average:{" "}
          {display(
            (() => {
              const values = terms
                .map((term) => report.termAverages[term.id])
                .filter((value): value is number => value !== null);

              return values.length > 0
                ? values.reduce((sum, value) => sum + value, 0) /
                    values.length
                : null;
            })()
          )}/20
        </p>
      </div>

      {/* CLASS COUNCIL DECISION */}
   <div className="space-y-3 p-2 text-center">

  {/* POSSIBLE COUNCIL DECISIONS — CONVENTIONAL REPORT STYLE */}
  <div className="space-y-1 text-left text-[9px] font-semibold text-slate-800">
    {decisionOptionsForReport.map((option) => (
      <div
        key={option.value}
        className="flex items-center justify-between gap-2 border-b border-dashed border-slate-400 pb-1"
      >
        <span>{option.label}:</span>
        <span className="inline-block w-16 border-b border-dashed border-slate-500" />
      </div>
    ))}
  </div>

  {/* ACTUAL COUNCIL DECISION */}
  <div
    className={`rounded border px-2 py-1 text-center leading-tight ${
      selectedCouncilDecision === "Passed" ||
      selectedCouncilDecision === "Promoted"
        ? "border-blue-700 bg-blue-50 text-blue-900"
        : selectedCouncilDecision === "Failed" ||
            selectedCouncilDecision === "Dismissed" ||
            selectedCouncilDecision === "Cannot Repeat Again"
          ? "border-red-700 bg-red-50 text-red-900"
          : selectedCouncilDecision === "Needs Improvement" ||
              selectedCouncilDecision === "Repeat"
            ? "border-amber-600 bg-amber-50 text-amber-900"
            : "border-slate-400 bg-slate-50 text-slate-600"
    }`}
  >
   <p className="text-[7px] font-bold uppercase tracking-wide">
      Council&apos;s Final Decision
    </p>
    <p className="mt-0.5 text-[9px] font-black">
      {selectedCouncilDecision || "Not yet recorded"}
    </p>
  </div>

  {/* DISCIPLINE */}
  <div className="border-t border-blue-800 px-1 py-1">
    <p className="text-[9px] font-bold">{labels.discipline}</p>
    <p className="mt-1 text-[9px] font-semibold">
      {councilOutcomes[student.id]?.discipline || "—"}
    </p>
  </div>

</div>
    </div>

    {/* BOTTOM RIGHT BOX: PRINCIPAL SIGNATURE */}
    <div className="flex min-h-[135px] flex-col justify-end border border-blue-800 p-2 text-center">
      <p className="font-bold">THE PRINCIPAL</p>
      <div className="h-20"></div>
      <p className="border-t border-black pt-1 font-semibold">
        Signature and Official Stamp
      </p>
    </div>

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
