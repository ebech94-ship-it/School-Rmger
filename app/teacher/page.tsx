
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type Assignment = {
  id: string;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  academicYearId: string;
  academicYearName: string;
  status: string;
};

type AssignmentProgress = {
  total: number;
  completed: number;
  returned: boolean;
};
export default function TeacherDashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [teacherName, setTeacherName] = useState("Teacher");
 const [assignments, setAssignments] = useState<Assignment[]>([]);
const [activeTerm, setActiveTerm] = useState("");
const [activeTermId, setActiveTermId] = useState("");
const [assignmentProgress, setAssignmentProgress] =
  useState<Record<string, AssignmentProgress>>({});
  const [isClassMaster, setIsClassMaster] = useState(false);
  const [academicYear, setAcademicYear] = useState("");
  const [error, setError] = useState("");

const [schoolId, setSchoolId] = useState("");
const [activeYearId, setActiveYearId] = useState("");

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          throw new Error("Your user profile could not be found.");
        }

        const userData = userSnap.data();

        if (
          userData.role !== "teacher" ||
          userData.active !== true ||
          !userData.schoolId
        ) {
          throw new Error("Your teacher account is not active.");
        }

     const currentSchoolId = userData.schoolId as string;
setSchoolId(currentSchoolId);
const academicYearsRef = collection(
  db,
  "schools",
  currentSchoolId,
  "academicYears"
);

const academicYearsSnap = await getDocs(academicYearsRef);

const activeYearDoc = academicYearsSnap.docs.find(
  (item) => item.data().isActive === true
);

if (!activeYearDoc) {
  throw new Error("Your school has not selected a current academic year.");
}

const currentYearId = activeYearDoc.id;
setActiveYearId(currentYearId);
const activeYearName = activeYearDoc.data().name || "Current academic year";

setAcademicYear(activeYearName);

        const teachersRef = collection(
          db,
          "schools",
         currentSchoolId,
          "teachers"
        );

        const teacherQuery = query(
          teachersRef,
          where("authUid", "==", user.uid)
        );

        const teacherSnap = await getDocs(teacherQuery);

        if (teacherSnap.empty) {
          throw new Error("Your teacher record could not be found.");
        }

        const teacherData = teacherSnap.docs[0].data();

        if (teacherData.status === "archived") {
          throw new Error("Your teacher account has been archived.");
        }
       
const classesRef = collection(
  db,
  "schools",
  currentSchoolId,
  "classes"
);

const classMasterQuery = query(
  classesRef,
  where("classMasterUid", "==", user.uid)
);

const classMasterSnap = await getDocs(classMasterQuery);

if (!cancelled) {
  setIsClassMaster(!classMasterSnap.empty);
}

        const assignmentsRef = collection(
          db,
          "schools",
          currentSchoolId,
          "teacherAssignments"
        );

        const assignmentsQuery = query(
          assignmentsRef,
          where("teacherUid", "==", user.uid),
          where("status", "==", "active")
        );

        const assignmentsSnap = await getDocs(assignmentsQuery);

        const loadedAssignments: Assignment[] =
          assignmentsSnap.docs.map((item) => {
            const data = item.data();

          return {
  id: item.id,
  subjectId: data.subjectId || "",
  subjectName: data.subjectName || "Unnamed subject",
  classId: data.classId || "",
  className: data.className || "Unnamed class",
  academicYearId: data.academicYearId || "",
  academicYearName: data.academicYearName || "",
  status: data.status || "active",
};
          });

        const uniqueAssignments = Array.from(
          new Map(
            loadedAssignments.map((item) => [item.id, item])
          ).values()
        );

        if (cancelled) return;

        setTeacherName(
          teacherData.name ||
            userData.name ||
            user.displayName ||
            "Teacher"
        );

 const currentYearAssignments = uniqueAssignments.filter(
 (item) => item.academicYearId === currentYearId
);

setAssignments(currentYearAssignments);

const termsRef = collection(
  db,
  "schools",
  currentSchoolId,
  "academicYears",
  currentYearId,
  "terms"
);

const termsSnap = await getDocs(termsRef);

const openTerm = termsSnap.docs.find(
  (item) => item.data().status === "open"
);

if (!cancelled) {
  setActiveTerm(openTerm?.data().name || "");
  setActiveTermId(openTerm?.id || "");
}

      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load your dashboard."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [router]);

useEffect(() => {
  if (
    !schoolId ||
    !activeYearId ||
    !activeTermId ||
    assignments.length === 0
  ) {
   
    return;
  }

  let cancelled = false;

  async function loadAssignmentProgress() {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const basePath = [
        "schools",
        schoolId,
        "academicYears",
        activeYearId,
      ] as const;

      const [enrollmentSnap, studentSnap, marksSnap, classSubjectsSnap] =
  await Promise.all([
    getDocs(
      query(
        collection(db, ...basePath, "enrollments"),
        where("status", "==", "active")
      )
    ),
    getDocs(
      collection(db, "schools", schoolId, "students")
    ),
    getDocs(
      query(
        collection(
          db,
          ...basePath,
          "terms",
          activeTermId,
          "marks"
        ),
        where("teacherUid", "==", user.uid)
      )
    ),
    getDocs(
      collection(db, "schools", schoolId, "classSubjects")
    ),
  ]);
      if (cancelled) return;

      const activeStudentIds = new Set(
        studentSnap.docs
          .filter((item) => item.data().status === "active")
          .map((item) => item.id)
      );

      const progress: Record<string, AssignmentProgress> = {};

      assignments.forEach((assignment) => {
        const enrolledIds = enrollmentSnap.docs
          .filter(
            (item) =>
              item.data().classId === assignment.classId &&
              activeStudentIds.has(
                String(item.data().studentId || "")
              )
          )
          .map((item) => String(item.data().studentId || ""));

        const classMarks = marksSnap.docs
          .map((item) => item.data())
          .filter(
            (mark) =>
              mark.classId === assignment.classId &&
              mark.subjectId === assignment.subjectId
          );

        const marksByStudent = new Map(
          classMarks.map((mark) => [
            String(mark.studentId || ""),
            mark,
          ])
        );

      const classSubject = classSubjectsSnap.docs.find((item) => {
  const data = item.data();

  return (
    data.classId === assignment.classId &&
    data.subjectId === assignment.subjectId &&
    data.status !== "inactive"
  );
});

const configuredAssessments = Array.isArray(
  classSubject?.data().assessments
)
  ? classSubject.data().assessments
  : [];

const completed = enrolledIds.filter((studentId) => {
  const mark = marksByStudent.get(studentId);

  if (
    !mark ||
    configuredAssessments.length === 0 ||
    !Array.isArray(mark.assessmentMarks)
  ) {
    return false;
  }

  return configuredAssessments.every((assessment: {
    id: string;
    maxMark: number;
  }) => {
    const entry = mark.assessmentMarks.find(
      (item: { assessmentId: string }) =>
        item.assessmentId === assessment.id
    );

    return (
      entry?.mark !== null &&
      entry?.mark !== undefined &&
      typeof entry.mark === "number" &&
      Number.isFinite(entry.mark) &&
      entry.mark >= 0 &&
      entry.mark <= assessment.maxMark
    );
  });
}).length;
        const returned = classMarks.some(
          (mark) =>
            mark.status === "draft" && Boolean(mark.returnedAt)
        );

        progress[assignment.id] = {
          total: enrolledIds.length,
          completed,
          returned,
        };
      });

      if (!cancelled) {
        setAssignmentProgress(progress);
      }
    } catch (err) {
      console.error("Teacher assignment progress error:", err);
    }
  }

  loadAssignmentProgress();

  return () => {
    cancelled = true;
  };
}, [
  schoolId,
  activeYearId,
  activeTermId,
  assignments,
]);
  async function handleSignOut() {
    await signOut(auth);
    router.replace("/login");
  }

  const assignedSubjects = new Set(
    assignments.map((item) => item.subjectName)
  ).size;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">
          Loading your teacher dashboard...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <header className="flex items-center justify-between border-b bg-white px-5 py-4 md:px-10">
        <div>
          <h1 className="text-xl font-bold text-blue-950">
            ScholarFlow
          </h1>
          <p className="text-xs text-slate-500">
            Teacher Workspace
          </p>
        </div>

        <button
          onClick={handleSignOut}
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Sign out
        </button>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <section className="mb-8">
          <p className="text-sm font-medium text-blue-700">
            TEACHER DASHBOARD
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">
            Welcome back, {teacherName}
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Manage your teaching assignments and students’ academic records.
          </p>
        </section>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Assigned classes
            </p>
            <p className="mt-2 text-3xl font-bold text-blue-900">
              {new Set(assignments.map((item) => item.className)).size}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Subjects assigned
            </p>
            <p className="mt-2 text-3xl font-bold text-blue-900">
              {assignedSubjects}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Active assignments
            </p>
            <p className="mt-2 text-3xl font-bold text-blue-900">
              {assignments.length}
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border bg-white p-5 shadow-sm md:p-7">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">
                My teaching assignments
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Your active subjects and classes
              </p>
            </div>

            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {activeTerm || "No open term"}
              {academicYear ? ` · ${academicYear}` : ""}
            </span>
          </div>

          {assignments.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <p className="font-semibold text-slate-700">
                No active assignments yet
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Contact your school administrator to assign your classes and subjects.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
            {assignments.map((item) => {
  const progress = assignmentProgress[item.id] || {
    total: 0,
    completed: 0,
    returned: false,
  };

  const percentage =
    progress.total > 0
      ? Math.round(
          (progress.completed / progress.total) * 100
        )
      : 0;

  const completed =
    progress.total > 0 &&
    progress.completed === progress.total;

  const status = progress.returned
    ? "Returned for correction"
    : completed
      ? "Completed"
      : progress.completed > 0
        ? "In progress"
        : "Not started";

  const color = progress.returned
    ? "bg-red-500"
    : completed
      ? "bg-blue-600"
      : progress.completed > 0
        ? "bg-amber-500"
        : "bg-slate-300";

  const statusColor = progress.returned
    ? "text-red-700"
    : completed
      ? "text-blue-700"
      : progress.completed > 0
        ? "text-amber-700"
        : "text-slate-500";

  return (
    <div
      key={item.id}
      className="rounded-xl border p-4"
    >
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex-1">
          <h4 className="font-semibold text-slate-900">
            {item.subjectName}
          </h4>

          <p className="mt-1 text-sm text-slate-500">
            {item.className}
          </p>

          <div className="mt-3 flex items-center justify-between gap-3">
            <span className={`text-sm font-semibold ${statusColor}`}>
              {status}
            </span>

            <span className="text-sm font-bold text-slate-700">
              {progress.completed}/{progress.total}
            </span>
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${color}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        <Link
          href="/teacher/marks"
          className="rounded-lg bg-blue-900 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-800"
        >
          Enter marks
        </Link>
      </div>
    </div>
  );
})}
            </div>
          )}
        </section>

<section className="mt-8 grid gap-4 md:grid-cols-2">
  <Link
    href="/teacher/marks"
    className="rounded-2xl bg-blue-950 p-6 text-white transition hover:bg-blue-900"
  >
    <p className="text-sm text-blue-200">
      MARKS MANAGEMENT
    </p>
    <h3 className="mt-2 text-xl font-bold">
      Enter students’ marks
    </h3>
    <p className="mt-2 text-sm text-blue-100">
      Record and update sequence marks for your assigned subjects.
    </p>
    <p className="mt-5 text-sm font-semibold">
      Open marks entry →
    </p>
  </Link>

  {isClassMaster && (
    <Link
      href="/class-master"
      className="rounded-2xl bg-emerald-800 p-6 text-white transition hover:bg-emerald-700"
    >
      <p className="text-sm text-emerald-200">
        CLASS MASTER WORKSPACE
      </p>
      <h3 className="mt-2 text-xl font-bold">
        Manage your assigned class
      </h3>
      <p className="mt-2 text-sm text-emerald-100">
        Review marks, monitor class performance and manage class records.
      </p>
      <p className="mt-5 text-sm font-semibold">
        Open Class Master workspace →
      </p>
    </Link>
  )}

  <div className="rounded-2xl border bg-white p-6">
    <p className="text-sm font-medium text-slate-500">
      TEACHER SUPPORT
    </p>
    <h3 className="mt-2 text-xl font-bold">
      Your responsibilities
    </h3>
    <p className="mt-2 text-sm text-slate-500">
      Enter accurate marks, review your entries and submit them for school review.
    </p>
  </div>
</section>

        <p className="mt-8 text-center text-xs text-slate-400">
          ScholarFlow · School Results Management
        </p>
      </div>
    </main>
  );
}
