
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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


type SubjectAssignment = {
  id: string;
  classId: string;
  className: string;
  subjectName: string;
  teacherName: string;
  status: string;
};

type ClassSummary = {
  id: string;
  name: string;
  studentCount: number;
  subjects: SubjectAssignment[];
};

export default function ClassMasterDashboard() {
  const [teacherName, setTeacherName] = useState("");
  const [yearName, setYearName] = useState("");
  const [termName, setTermName] = useState("");
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

 

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.replace("/login");
        return;
      }

      try {
        const profileSnapshot = await getDoc(
          doc(db, "users", user.uid)
        );

        if (!profileSnapshot.exists()) {
          window.location.replace("/login");
          return;
        }

        const profile = profileSnapshot.data();

        if (
          profile.active !== true ||
          profile.role !== "teacher" ||
          !profile.schoolId
        ) {
          throw new Error("Your account is not authorized as an active teacher.");
        }

        const schoolId = profile.schoolId;

        const teacherSnapshot = await getDocs(
          query(
            collection(db, "schools", schoolId, "teachers"),
            where("authUid", "==", user.uid)
          )
        );

        if (teacherSnapshot.empty) {
          throw new Error("Your teacher profile could not be found.");
        }

        const teacherDoc = teacherSnapshot.docs[0];
        const teacher = teacherDoc.data();

        if (teacher.status === "archived") {
          throw new Error("Your teacher account has been archived.");
        }

        const [classesSnapshot, yearsSnapshot] = await Promise.all([
          getDocs(collection(db, "schools", schoolId, "classes")),
          getDocs(collection(db, "schools", schoolId, "academicYears")),
        ]);

        const assignedClasses = classesSnapshot.docs
  .filter(
    (item) => item.data().classMasterUid === user.uid
  );
        const activeYearDoc = yearsSnapshot.docs.find(
          (item) => item.data().isActive === true
        );

        if (!activeYearDoc) {
          throw new Error("Your school has not selected a current academic year.");
        }

        const activeYearId = activeYearDoc.id;
        const activeYearName = activeYearDoc.data().name || "";

        const termsSnapshot = await getDocs(
          collection(
            db,
            "schools",
            schoolId,
            "academicYears",
            activeYearId,
            "terms"
          )
        );

        const openTerm = termsSnapshot.docs.find(
          (item) => item.data().status === "open"
        );

        const assignmentsSnapshot = await getDocs(
          query(
            collection(db, "schools", schoolId, "teacherAssignments"),
            where("academicYearId", "==", activeYearId)
          )
        );

       const activeAssignments: SubjectAssignment[] =
  assignmentsSnapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  })) as SubjectAssignment[];

const filteredAssignments = activeAssignments.filter(
  (item) =>
    item.status === "active" &&
    assignedClasses.some((cls) => cls.id === item.classId)
);

        const classSummaries = await Promise.all(
          assignedClasses.map(async (schoolClass) => {
            const enrollmentSnapshot = await getDocs(
              query(
                collection(
                  db,
                  "schools",
                  schoolId,
                  "academicYears",
                  activeYearId,
                  "enrollments"
                ),
                where("classId", "==", schoolClass.id)
              )
            );

            const studentCount = enrollmentSnapshot.docs.filter(
              (item) =>
                item.data().status !== "transferred" &&
                item.data().status !== "withdrawn"
            ).length;

            return {
              id: schoolClass.id,
              name: schoolClass.data().name || "Unnamed class",
              studentCount,
              subjects: filteredAssignments.filter(
  (item) => item.classId === schoolClass.id
),
            };
          })
        );

        if (!cancelled) {
          setTeacherName(teacher.name || "");
          setYearName(activeYearName);
          setTermName(openTerm?.data().name || "No open term");
          setClasses(classSummaries);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load your Class Master workspace."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const totalStudents = classes.reduce(
    (total, item) => total + item.studentCount,
    0
  );

  const totalSubjects = classes.reduce(
    (total, item) => total + item.subjects.length,
    0
  );

  async function handleSignOut() {
    await signOut(auth);
    window.location.replace("/login");
  }

  if (loading) {
    return (
      <p className="p-8 text-center text-slate-500">
        Loading Class Master workspace...
      </p>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <header className="flex items-center justify-between border-b bg-white px-4 py-4 md:px-8">
        <div>
          <h1 className="text-xl font-bold text-blue-950">GS SCHOOL</h1>
          <p className="text-xs text-slate-500">Class Master Workspace</p>
        </div>

        <button
          onClick={handleSignOut}
          className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50"
        >
          Sign out
        </button>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <p className="text-sm font-semibold text-blue-700">
          CLASS MASTER DASHBOARD
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">
          Welcome back, {teacherName}
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Monitor your assigned classes and academic progress.
        </p>

        {error && (
          <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {!error && (
          <>
            <section className="mt-7 rounded-2xl bg-blue-950 p-6 text-white md:p-8">
              <p className="text-sm text-blue-200">
                CURRENT ACADEMIC YEAR
              </p>
              <h3 className="mt-3 text-3xl font-bold">
                {yearName}
              </h3>
              <p className="mt-2 text-sm text-blue-200">
                {termName}
              </p>
            </section>

            <section className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Assigned classes</p>
                <p className="mt-2 text-3xl font-bold text-blue-950">
                  {classes.length}
                </p>
              </div>

              <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Total enrolled students</p>
                <p className="mt-2 text-3xl font-bold text-blue-950">
                  {totalStudents}
                </p>
              </div>

              <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Assigned subjects</p>
                <p className="mt-2 text-3xl font-bold text-blue-950">
                  {totalSubjects}
                </p>
              </div>

              <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Current term</p>
                <p className="mt-2 text-xl font-bold text-blue-950">
                  {termName}
                </p>
              </div>
            </section>

            <section className="mt-8 rounded-2xl border bg-white p-5 shadow-sm md:p-7">
              <h3 className="text-lg font-bold">
                Your assigned classes
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Live class and subject assignment information.
              </p>

              {classes.length === 0 ? (
                <p className="mt-5 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
                  No classes have been assigned to you as Class Master yet.
                </p>
              ) : (
                <div className="mt-5 space-y-5">
                  {classes.map((schoolClass) => (
                    <div
                      key={schoolClass.id}
                      className="rounded-xl border p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h4 className="text-lg font-bold text-blue-950">
                            {schoolClass.name}
                          </h4>
                          <p className="mt-1 text-sm text-slate-500">
                            {schoolClass.studentCount} enrolled students
                          </p>
                        </div>

                        <Link
                          href="/class-master/results"
                          className="rounded-lg bg-blue-950 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900"
                        >
                          Review class results
                        </Link>
                      </div>

                      <div className="mt-5 border-t pt-4">
                        <p className="mb-3 text-sm font-semibold">
                          Assigned subjects and teachers
                        </p>

                        {schoolClass.subjects.length === 0 ? (
                          <p className="text-sm text-slate-500">
                            No subject assignments found for this class.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {schoolClass.subjects.map((subject) => (
                              <div
                                key={subject.id}
                                className="flex flex-wrap justify-between gap-2 rounded-lg bg-slate-50 p-3"
                              >
                                <div>
                                  <p className="font-medium">
                                    {subject.subjectName}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {subject.teacherName}
                                  </p>
                                </div>
                                <span className="text-xs text-slate-500">
                                  Assigned
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        <p className="mt-8 text-center text-xs text-slate-400">
          GS SCHOOL · School Results Management
        </p>
      </div>
    </main>
  );
}
