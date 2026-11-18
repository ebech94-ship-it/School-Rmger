
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type Row = {
  id: string;
  [key: string]: unknown;
};

type ClassItem = {
  id: string;
  name: string;
  level: string;
};

type TermItem = {
  id: string;
  name: string;
  order: number;
  status: string;
};

type SubjectItem = {
  id: string;
  name: string;
  coefficient: number | null;
};

type StudentResult = {
  id: string;
  name: string;
  admissionNumber: string;
  averages: (number | null)[];
  totalMarks: number | null;
  overallAverage: number | null;
  complete: boolean;
  statuses: string[];
};

function textValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function numberValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : null;
}

function getCoefficient(
  subject: Row,
  classLevel: string
): number | null {
  const coefficients = subject.coefficientsByForm;

  if (coefficients && typeof coefficients === "object") {
    const formKey = classLevel.replace(/\s+/g, "");
    const value = numberValue(
      (coefficients as Record<string, unknown>)[formKey]
    );

    if (value !== null && value > 0) return value;
  }

  const fallback = numberValue(subject.coefficient);
  return fallback !== null && fallback > 0 ? fallback : null;
}

export default function ClassResultsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [academicYearId, setAcademicYearId] = useState("");
  const [academicYearName, setAcademicYearName] = useState("");
  const [terms, setTerms] = useState<TermItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedTermId, setSelectedTermId] = useState("");
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [students, setStudents] = useState<StudentResult[]>([]);
  const [marksLoading, setMarksLoading] = useState(false);
  const [markStatuses, setMarkStatuses] = useState<string[]>([]);

const [reviewSaving, setReviewSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const profileSnap = await getDoc(doc(db, "users", user.uid));

        if (!profileSnap.exists()) {
          router.replace("/login");
          return;
        }

        const profile = profileSnap.data();

        if (
          profile.role !== "teacher" ||
          profile.active !== true ||
          !profile.schoolId
        ) {
          setError("Your account is not authorized for this workspace.");
          setLoading(false);
          return;
        }

        const currentSchoolId = profile.schoolId as string;
        setSchoolId(currentSchoolId);

        const schoolRef = collection(
          db,
          "schools",
          currentSchoolId,
          "classes"
        );

        const [classSnap, yearSnap] = await Promise.all([
          getDocs(schoolRef),
          getDocs(
            collection(
              db,
              "schools",
              currentSchoolId,
              "academicYears"
            )
          ),
        ]);

        const assignedClasses: ClassItem[] = classSnap.docs
          .filter((item) => item.data().classMasterUid === user.uid)
          .map((item) => ({
            id: item.id,
            name: textValue(item.data().name),
            level: textValue(item.data().level),
          }));

        setClasses(assignedClasses);

        const activeYear = yearSnap.docs.find(
          (item) => item.data().isActive === true
        );

        if (!activeYear) {
          setError("There is no active academic year.");
          setLoading(false);
          return;
        }

        setAcademicYearId(activeYear.id);
        setAcademicYearName(textValue(activeYear.data().name));

        if (assignedClasses.length > 0) {
          setSelectedClassId(assignedClasses[0].id);
        }

        setLoading(false);
      } catch (err) {
        console.error("Class Master results loading error:", err);
        setError("Unable to load your workspace. Check your access and try again.");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!schoolId || !academicYearId) return;

    let cancelled = false;

    async function loadTerms() {
      try {
        const snapshot = await getDocs(
          collection(
            db,
            "schools",
            schoolId,
            "academicYears",
            academicYearId,
            "terms"
          )
        );

        if (cancelled) return;

        const loadedTerms: TermItem[] = snapshot.docs
          .map((item) => ({
            id: item.id,
            name: textValue(item.data().name),
            order: numberValue(item.data().order) ?? 0,
            status: textValue(item.data().status),
          }))
          .sort((a, b) => a.order - b.order);

        setTerms(loadedTerms);

        const openTerm = loadedTerms.find(
          (term) => term.status === "open"
        );

        setSelectedTermId(
          openTerm?.id || loadedTerms[0]?.id || ""
        );
      } catch (err) {
        console.error("Terms loading error:", err);
        if (!cancelled) setError("Unable to load academic terms.");
      }
    }

    loadTerms();

    return () => {
      cancelled = true;
    };
  }, [schoolId, academicYearId]);

  useEffect(() => {
  if (
  !schoolId ||
  !academicYearId ||
  !selectedClassId ||
  !selectedTermId
) {
  return;
}

    let cancelled = false;

    async function loadClassResults() {
      try {
        setMarksLoading(true);
        setError("");

        const selectedClass = classes.find(
          (item) => item.id === selectedClassId
        );

        if (!selectedClass) return;

        const basePath = [
          "schools",
          schoolId,
          "academicYears",
          academicYearId,
        ] as const;

        const [assignmentSnap, subjectSnap, enrollmentSnap, studentSnap, marksSnap] =
          await Promise.all([
            getDocs(
              collection(db, "schools", schoolId, "teacherAssignments")
            ),
            getDocs(
              collection(db, "schools", schoolId, "subjects")
            ),
            getDocs(
              collection(
                db,
                ...basePath,
                "enrollments"
              )
            ),
            getDocs(
              collection(db, "schools", schoolId, "students")
            ),
            getDocs(
              collection(
                db,
                ...basePath,
                "terms",
                selectedTermId,
                "marks"
              )
            ),
          ]);

        if (cancelled) return;

        const assignments: Row[] = assignmentSnap.docs
  .map((item): Row => ({ id: item.id, ...item.data() }))
          .filter(
            (item) =>
              item.status === "active" &&
              item.academicYearId === academicYearId &&
              item.classId === selectedClassId
          );

        const subjectMap = new Map<string, Row>();

        subjectSnap.docs.forEach((item) => {
          subjectMap.set(item.id, {
            id: item.id,
            ...item.data(),
          });
        });

        const subjectMapById = new Map<string, SubjectItem>();

        assignments.forEach((assignment) => {
          const subjectId = textValue(assignment.subjectId);
          const subject = subjectMap.get(subjectId);

          if (!subject || subject.status !== "active") return;

          const coefficient = getCoefficient(
            subject,
            selectedClass.level
          );

          subjectMapById.set(subjectId, {
            id: subjectId,
            name: textValue(subject.name),
            coefficient,
          });
        });

        const loadedSubjects = Array.from(subjectMapById.values())
          .sort((a, b) => a.name.localeCompare(b.name));

        const studentMap = new Map<string, Row>();

        studentSnap.docs.forEach((item) => {
          studentMap.set(item.id, {
            id: item.id,
            ...item.data(),
          });
        });

       const enrolledStudents: Row[] = enrollmentSnap.docs
  .map((item): Row => ({
    id: item.id,
    ...item.data(),
  }))
          .filter((enrollment) => {
            const student = studentMap.get(
              textValue(enrollment.studentId)
            );

            return (
              enrollment.classId === selectedClassId &&
              enrollment.status === "active" &&
              student?.status === "active"
            );
          });

        const marksByStudentSubject = new Map<string, Row>();
        const statuses: string[] = [];

        marksSnap.docs.forEach((item) => {
          const mark: Row = {
  id: item.id,
  ...item.data(),
};

          if (
            mark.classId !== selectedClassId ||
            mark.termId !== selectedTermId
          ) {
            return;
          }

          const key = `${textValue(mark.studentId)}__${textValue(mark.subjectId)}`;
          marksByStudentSubject.set(key, mark);

          const status = textValue(mark.status);
          if (status && !statuses.includes(status)) {
            statuses.push(status);
          }
        });

        const results: StudentResult[] = enrolledStudents.map(
          (enrollment) => {
            const studentId = textValue(enrollment.studentId);
            const student = studentMap.get(studentId);

            const averages = loadedSubjects.map((subject) => {
              const mark = marksByStudentSubject.get(
                `${studentId}__${subject.id}`
              );

              if (!mark) return null;

              const sequence1 = numberValue(mark.sequence1);
              const sequence2 = numberValue(mark.sequence2);

              if (sequence1 === null || sequence2 === null) {
                return null;
              }

              return (sequence1 + sequence2) / 2;
            });

            const complete =
              loadedSubjects.length > 0 &&
              loadedSubjects.every(
                (subject, index) =>
                  subject.coefficient !== null &&
                  averages[index] !== null
              );

            let totalMarks: number | null = null;
            let overallAverage: number | null = null;

         if (complete) {
  const calculatedTotal = averages.reduce<number>(
    (total, average, index) =>
      total +
      (average ?? 0) *
        (loadedSubjects[index].coefficient ?? 0),
    0
  );

  const totalCoefficients = loadedSubjects.reduce(
    (total, subject) => total + (subject.coefficient ?? 0),
    0
  );

  if (totalCoefficients > 0) {
    totalMarks = calculatedTotal;
    overallAverage = calculatedTotal / totalCoefficients;
  }
}

            const studentStatuses = loadedSubjects.map((subject) => {
              const mark = marksByStudentSubject.get(
                `${studentId}__${subject.id}`
              );

              return textValue(mark?.status) || "missing";
            });

            return {
              id: studentId,
              name: textValue(student?.fullName) || "Unnamed student",
              admissionNumber:
                textValue(student?.admissionNumber),
              averages,
              totalMarks,
              overallAverage,
              complete,
              statuses: studentStatuses,
            };
          }
        );

        results.sort((a, b) => {
          if (a.overallAverage === null) return 1;
          if (b.overallAverage === null) return -1;
          return b.overallAverage - a.overallAverage;
        });

        setSubjects(loadedSubjects);
        setStudents(results);
        setMarkStatuses(statuses);
      } catch (err) {
        console.error("Class results loading error:", err);
        if (!cancelled) {
          setError(
            "Unable to load class results. Check your Firestore permissions."
          );
        }
      } finally {
        if (!cancelled) setMarksLoading(false);
      }
    }

    loadClassResults();

    return () => {
      cancelled = true;
    };
  }, [
    schoolId,
    academicYearId,
    selectedClassId,
    selectedTermId,
    classes,
  ]);

 const rankedStudents = useMemo(() => {
  return students.map((student) => ({
    ...student,
    position:
      student.overallAverage === null
        ? null
        : 1 +
          students.filter(
            (other) =>
              other.overallAverage !== null &&
              other.overallAverage > student.overallAverage!
          ).length,
  }));
}, [students]);

  const classAverage = useMemo(() => {
    const completeResults = students
      .map((student) => student.overallAverage)
      .filter((average): average is number => average !== null);

    if (completeResults.length === 0) return null;

    return (
      completeResults.reduce((total, average) => total + average, 0) /
      completeResults.length
    );
  }, [students]);

  const selectedClass = classes.find(
    (item) => item.id === selectedClassId
  );

  const selectedTerm = terms.find(
    (item) => item.id === selectedTermId
  );

  const submittedCount = students.filter((student) =>
    student.statuses.includes("submitted")
  ).length;
async function updateSubmittedMarks(action: "reviewed" | "draft") {
  if (
    !schoolId ||
    !academicYearId ||
    !selectedTermId ||
    !selectedClassId ||
    reviewSaving
  ) return;

  const actionLabel =
    action === "reviewed" ? "approve" : "return";

  if (!window.confirm(
    `Are you sure you want to ${actionLabel} all submitted marks for ${selectedClass?.name}?`
  )) return;

  setReviewSaving(true);
  setError("");

  try {
    const marksRef = collection(
      db,
      "schools",
      schoolId,
      "academicYears",
      academicYearId,
      "terms",
      selectedTermId,
      "marks"
    );

    const snapshot = await getDocs(marksRef);

    const submittedDocs = snapshot.docs.filter((item) => {
      const data = item.data();
      return (
        data.classId === selectedClassId &&
        data.status === "submitted"
      );
    });

    if (submittedDocs.length === 0) {
      setError("There are no submitted marks to process.");
      return;
    }

    for (let i = 0; i < submittedDocs.length; i += 450) {
      const batch = writeBatch(db);

      submittedDocs.slice(i, i + 450).forEach((item) => {
        batch.update(item.ref, {
          status: action,
          ...(action === "reviewed"
            ? {
                reviewedAt: serverTimestamp(),
                reviewedBy: auth.currentUser?.uid || null,
              }
            : {
                returnedAt: serverTimestamp(),
                returnedBy: auth.currentUser?.uid || null,
              }),
          updatedAt: serverTimestamp(),
        });
      });

      await batch.commit();
    }

    setError("");
  } catch (err) {
    console.error("Class Master review error:", err);
    setError("Unable to update marks. Check your Firestore permissions.");
  } finally {
    setReviewSaving(false);
  }
}

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-8 text-slate-600">
        Loading Class Master workspace...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <header className="flex items-center justify-between border-b bg-white px-4 py-4 md:px-8">
        <div>
          <h1 className="text-xl font-bold text-blue-950">
            GTHS Results
          </h1>
          <p className="text-xs text-slate-500">
            Class Master Results Review
          </p>
        </div>

        <Link
          href="/class-master"
          className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50"
        >
          Back to dashboard
        </Link>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <p className="text-sm font-semibold text-blue-700">
          CLASS MASTER WORKSPACE
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-900">
          Class results review
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Results are calculated from the actual student marks and configured subject coefficients.
        </p>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {classes.length === 0 ? (
          <div className="mt-7 rounded-xl border bg-white p-6 text-sm text-slate-600">
            No class has been assigned to you as Class Master for this account.
          </div>
        ) : (
          <>
            <section className="mt-7 rounded-2xl border bg-white p-5 shadow-sm">
              <h3 className="font-bold">Select results</h3>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Class
                  </label>
                  <select
                    value={selectedClassId}
                    onChange={(event) =>
                      setSelectedClassId(event.target.value)
                    }
                    className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
                  >
                    {classes.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Academic year
                  </label>
                  <input
                    value={academicYearName}
                    readOnly
                    className="w-full rounded-lg border bg-slate-50 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Term
                  </label>
                  <select
                    value={selectedTermId}
                    onChange={(event) =>
                      setSelectedTermId(event.target.value)
                    }
                    className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
                  >
                    {terms.map((term) => (
                      <option key={term.id} value={term.id}>
                        {term.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section className="mt-7 rounded-2xl bg-blue-950 p-6 text-white">
              <p className="text-sm text-blue-200">
                {selectedClass?.name || "Class"} ·{" "}
                {selectedTerm?.name || "Select a term"} ·{" "}
                {academicYearName}
              </p>

              <div className="mt-5 grid gap-5 sm:grid-cols-4">
                <div>
                  <p className="text-sm text-blue-200">Students</p>
                  <p className="mt-1 text-3xl font-bold">
                    {students.length}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-blue-200">Subjects</p>
                  <p className="mt-1 text-3xl font-bold">
                    {subjects.length}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-blue-200">
                    Class average
                  </p>
                  <p className="mt-1 text-3xl font-bold">
                    {classAverage === null
                      ? "—"
                      : `${classAverage.toFixed(2)}/40`}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-blue-200">
                    Submitted marks
                  </p>
                  <p className="mt-1 text-3xl font-bold">
                    {submittedCount}
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-7 rounded-2xl border bg-white p-5 shadow-sm">
              <h3 className="font-bold">Subject coefficients</h3>

              {subjects.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">
                  No active subject assignments were found for this class and academic year.
                </p>
              ) : (
                <div className="mt-4 flex flex-wrap gap-3">
                  {subjects.map((subject) => (
                    <div
                      key={subject.id}
                      className="rounded-xl bg-slate-50 px-4 py-3"
                    >
                      <p className="text-sm font-medium">
                        {subject.name}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Coefficient:{" "}
                        <strong>
                          {subject.coefficient ?? "Needs configuration"}
                        </strong>
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {subjects.some(
                (subject) => subject.coefficient === null
              ) && (
                <p className="mt-4 text-sm text-amber-700">
                  Some subject coefficients need configuration. Complete averages and rankings are withheld until they are corrected.
                </p>
              )}
            </section>

            <section className="mt-7 overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
  <div>
    <h3 className="font-bold">Student ranking</h3>
    <p className="mt-1 text-sm text-slate-500">
      Only students with complete marks and configured coefficients receive an overall average and position.
    </p>
  </div>

  <div className="flex flex-wrap gap-2">
    <button
      type="button"
      onClick={() => updateSubmittedMarks("draft")}
      disabled={reviewSaving || submittedCount === 0}
      className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-700 disabled:opacity-50"
    >
      Return for correction
    </button>

    <button
      type="button"
      onClick={() => updateSubmittedMarks("reviewed")}
      disabled={reviewSaving || submittedCount === 0}
      className="rounded-lg bg-blue-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
    >
      {reviewSaving ? "Processing..." : "Approve submitted marks"}
    </button>
  </div>
</div>

              {marksLoading ? (
                <p className="p-6 text-sm text-slate-500">
                  Loading student results...
                </p>
              ) : students.length === 0 ? (
                <p className="p-6 text-sm text-slate-500">
                  No active students are enrolled in this class for the selected academic year.
                </p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs text-slate-500">
                        <tr>
                          <th className="px-4 py-4">Position</th>
                          <th className="px-4 py-4">Student</th>
                          {subjects.map((subject) => (
                            <th key={subject.id} className="px-4 py-4">
                              {subject.name}
                            </th>
                          ))}
                          <th className="px-4 py-4">Total</th>
                          <th className="px-4 py-4">Average /40</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y">
                        {rankedStudents.map((student) => (
                          <tr key={student.id}>
                            <td className="px-4 py-4 font-bold">
                              {student.position === null
                                ? "—"
                                : `#${student.position}`}
                            </td>

                            <td className="px-4 py-4">
                              <p className="font-semibold">
                                {student.name}
                              </p>
                              <p className="text-xs text-slate-400">
                                {student.admissionNumber || student.id}
                              </p>
                            </td>

                            {student.averages.map((average, index) => (
                              <td
                                key={`${student.id}-${subjects[index]?.id}`}
                                className="px-4 py-4"
                              >
                                {average === null
                                  ? "—"
                                  : average.toFixed(2)}
                              </td>
                            ))}

                            <td className="px-4 py-4 font-semibold">
                              {student.totalMarks === null
                                ? "—"
                                : student.totalMarks.toFixed(2)}
                            </td>

                            <td className="px-4 py-4 font-bold text-blue-700">
                              {student.overallAverage === null
                                ? "—"
                                : student.overallAverage.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="border-t bg-slate-50 p-4 text-xs text-slate-500">
                    Mark statuses found:{" "}
                    {markStatuses.length > 0
                      ? markStatuses.join(", ")
                      : "No marks recorded yet"}
                  </div>
                </>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}