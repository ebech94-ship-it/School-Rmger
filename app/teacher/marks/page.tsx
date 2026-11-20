
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type Teacher = {
  id: string;
  name: string;
  authUid: string;
};

type TeacherAssignment = {
  id: string;
  teacherId: string;
  academicYearId: string;
  academicYearName: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  status: "active" | "inactive";
};

type AcademicYear = {
  id: string;
  name: string;
  isActive: boolean;
};

type SchoolTerm = {
  id: string;
  name: string;
  status: string;
  order?: number;
};

type Student = {
  id: string;
  admissionNumber: string;
  fullName: string;
};

type MarkEntry = {
  first: string;
  second: string;
};

export default function MarksEntryPage() {
  const [schoolId, setSchoolId] = useState("");
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<SchoolTerm[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
 const [marks, setMarks] = useState<Record<string, MarkEntry>>({});
const [markStatus, setMarkStatus] = useState("draft");
const [wasReturned, setWasReturned] = useState(false);
const [showPreview, setShowPreview] = useState(false);
const [loadedMarksKey, setLoadedMarksKey] = useState("");

  const [selectedYear, setSelectedYear] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedAssignment, setSelectedAssignment] = useState("");

  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");


  // Verify teacher and load assignments and academic years.
  useEffect(() => {
    const listeners: (() => void)[] = [];

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.replace("/login");
        return;
      }

      try {
        const profile = await getDoc(doc(db, "users", user.uid));

        if (!profile.exists()) {
          window.location.replace("/login");
          return;
        }

        const profileData = profile.data();

        if (
          profileData.active !== true ||
          profileData.role !== "teacher" ||
          !profileData.schoolId
        ) {
          setError("Your account is not registered as an active teacher.");
          setLoading(false);
          return;
        }

        const currentSchoolId = profileData.schoolId;
        setSchoolId(currentSchoolId);

        const teacherQuery = query(
          collection(db, "schools", currentSchoolId, "teachers"),
          where("authUid", "==", user.uid)
        );

        const teacherSnapshot = await getDocs(teacherQuery);

        if (teacherSnapshot.empty) {
          setError("Your teacher profile could not be found. Contact your administrator.");
          setLoading(false);
          return;
        }

        const teacherDoc = teacherSnapshot.docs[0];
        const teacherData = teacherDoc.data();

        if (teacherData.status === "archived") {
          setError("Your teacher account has been archived. Contact your administrator.");
          setLoading(false);
          return;
        }

        setTeacher({
          id: teacherDoc.id,
          name: teacherData.name || "",
          authUid: user.uid,
        });

        listeners.push(
          onSnapshot(
            collection(db, "schools", currentSchoolId, "teacherAssignments"),
            (snapshot) => {
              const records = snapshot.docs.map((item) => ({
                id: item.id,
                ...item.data(),
              })) as TeacherAssignment[];

              setAssignments(
                records.filter(
                  (item) =>
                    item.teacherId === teacherDoc.id &&
                    item.status === "active"
                )
              );
            },
            (err) => {
              console.error(err);
              setError("Unable to load your teaching assignments.");
            }
          )
        );

        listeners.push(
          onSnapshot(
            collection(db, "schools", currentSchoolId, "academicYears"),
            (snapshot) => {
        const records = snapshot.docs.map((item) => ({
  id: item.id,
  name: item.data().name || "",
  isActive: item.data().isActive === true,
}));

const activeYear = records.find((item) => item.isActive);

setAcademicYears(records);
setSelectedYear(activeYear?.id || "");

if (!activeYear) {
  setError("Your school has not selected a current academic year.");
}
            },
            (err) => {
              console.error(err);
              setError("Unable to load academic years.");
            }
          )
        );
      } catch (err) {
        console.error(err);
        setError("Unable to load your teacher workspace.");
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      listeners.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  // Load terms belonging to the selected academic year.
  useEffect(() => {
   if (!schoolId || !selectedYear) {
  return;
}

    const termsRef = collection(
      db,
      "schools",
      schoolId,
      "academicYears",
      selectedYear,
      "terms"
    );

    return onSnapshot(
      termsRef,
      (snapshot) => {
        const records = snapshot.docs.map((item) => ({
          id: item.id,
          name: item.data().name || "",
          status: item.data().status || "upcoming",
          order: Number(item.data().order || 0),
        }));

        records.sort((a, b) => a.order - b.order);
        setTerms(records);

        const openTerm = records.find((item) => item.status === "open");
        setSelectedTerm(openTerm?.id || "");
      },
      (err) => {
        console.error(err);
        setError("Unable to load academic terms.");
      }
    );
  }, [schoolId, selectedYear]);

  const availableAssignments = assignments.filter(
    (item) => item.academicYearId === selectedYear
  );

  const activeTerm = terms.find(
    (item) => item.id === selectedTerm && item.status === "open"
  );

  const currentAssignment = availableAssignments.find(
    (item) => item.id === selectedAssignment
  );
const currentClassId = currentAssignment?.classId ?? "";
const currentSubjectId = currentAssignment?.subjectId ?? "";
const currentTeacherUid = teacher?.authUid ?? "";


const statusMessage =
  markStatus === "draft"
    ? {
        title: "Draft – Not yet submitted",
        description: "Save your marks, preview them and submit when everything is correct.",
        style: "bg-amber-50 border-amber-200 text-amber-900",
      }
    : markStatus === "submitted"
    ? {
        title: "Submitted – Awaiting Class Master",
        description: "Your marks have been submitted. Editing is locked while the Class Master reviews them.",
        style: "bg-blue-50 border-blue-200 text-blue-900",
      }
    : markStatus === "reviewed"
    ? {
        title: "Reviewed – Awaiting Finalization",
        description: "The Class Master has reviewed these marks. Contact the administrator if corrections are needed.",
        style: "bg-purple-50 border-purple-200 text-purple-900",
      }
    : {
        title: "Finalized – Marks Locked",
        description: "These marks have been finalized and can no longer be edited.",
        style: "bg-green-50 border-green-200 text-green-900",
      };

const marksKey = [
  schoolId,
  selectedYear,
  selectedTerm,
  currentClassId,
  currentSubjectId,
  currentTeacherUid,
].join("__");

const marksLoading = Boolean(
  currentAssignment &&
  selectedTerm &&
  loadedMarksKey !== marksKey
);
  // Load actual students enrolled in the selected class.
useEffect(() => {
  if (!schoolId || !selectedYear || !currentClassId) return;

  let cancelled = false;

  async function loadStudents() {
    setStudentsLoading(true);
    setStudents([]);
    setMarks({});
    setError("");

    try {
        const enrollmentsRef = collection(
          db,
          "schools",
          schoolId,
          "academicYears",
          selectedYear,
          "enrollments"
        );

        const enrollmentSnapshot = await getDocs(
          query(
            enrollmentsRef,
          where("classId", "==", currentClassId)
          )
        );

        const enrolled = enrollmentSnapshot.docs.filter(
          (item) => item.data().status !== "transferred" &&
            item.data().status !== "withdrawn"
        );

        const records = await Promise.all(
          enrolled.map(async (item) => {
            const enrollment = item.data();
            const studentId = enrollment.studentId || item.id;

            const studentSnapshot = await getDoc(
              doc(db, "schools", schoolId, "students", studentId)
            );

            if (!studentSnapshot.exists()) return null;

            const student = studentSnapshot.data();

            if (
              student.status === "transferred" ||
              student.status === "withdrawn" ||
              student.status === "graduated"
            ) {
              return null;
            }

            return {
              id: studentSnapshot.id,
              admissionNumber: student.admissionNumber || "",
              fullName: student.fullName || student.name || "",
            } as Student;
          })
        );

        if (!cancelled) {
          setStudents(
            records
              .filter((item): item is Student => item !== null)
              .sort((a, b) => a.fullName.localeCompare(b.fullName))
          );
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError("Unable to load students enrolled in this class.");
        }
      } finally {
        if (!cancelled) setStudentsLoading(false);
      }
    }

        void Promise.resolve().then(loadStudents);

    return () => {
      cancelled = true;
    };
  }, [schoolId, selectedYear, currentClassId]);

  // Load previously saved marks for this class and subject.
useEffect(() => {
  if (
    !schoolId ||
    !currentTeacherUid ||
    !selectedYear ||
    !selectedTerm ||
    !currentClassId ||
    !currentSubjectId
  ) {
    return;
  }

    const marksRef = collection(
      db,
      "schools",
      schoolId,
      "academicYears",
      selectedYear,
      "terms",
      selectedTerm,
      "marks"
    );

   return onSnapshot(
 query(marksRef, where("teacherUid", "==", currentTeacherUid)),
  (snapshot) => {
       const records: Record<string, MarkEntry> = {};
const statuses: string[] = [];
let hasReturnRecord = false;

        snapshot.docs.forEach((item) => {
          const data = item.data();

          if (
           data.classId !== currentClassId ||
data.subjectId !== currentSubjectId
          ) {
            return;
          }
statuses.push(data.status || "draft");
if (data.returnedAt) {
  hasReturnRecord = true;
}
          records[data.studentId] = {
            first: data.sequence1 === null || data.sequence1 === undefined
              ? ""
              : String(data.sequence1),
            second: data.sequence2 === null || data.sequence2 === undefined
              ? ""
              : String(data.sequence2),
          };
        });

        setMarks(records);

const statusPriority = ["draft", "submitted", "reviewed", "finalized"];
const highestStatus = statuses.reduce(
  (highest, status) =>
    statusPriority.indexOf(status) > statusPriority.indexOf(highest)
      ? status
      : highest,
  "draft"
);

setMarkStatus(highestStatus);
setWasReturned(
  highestStatus === "draft" && hasReturnRecord
);
setLoadedMarksKey(marksKey);
      },
      (err) => {
        console.error(err);
        setError("Unable to load previously saved marks.");
      }
    );
  }, [
  schoolId,
  selectedYear,
  selectedTerm,
  currentClassId,
  currentSubjectId,
  currentTeacherUid,
   marksKey,
]);

  function updateMark(
    studentId: string,
    field: "first" | "second",
    value: string
   ) {
    if (markStatus !== "draft") return;

    if (
      value !== "" &&
      (!/^\d+(\.\d{0,2})?$/.test(value) || Number(value) > 40)
    ) {
      return;
    }

    setMarks((previous) => ({
      ...previous,
      [studentId]: {
        first: previous[studentId]?.first ?? "",
        second: previous[studentId]?.second ?? "",
        [field]: value,
      },
    }));

    setMessage("");
    setError("");
  }

  function average(studentId: string): string {
    const entry = marks[studentId];

    if (!entry || entry.first === "" || entry.second === "") {
      return "—";
    }

    return (
      (Number(entry.first) + Number(entry.second)) / 2
    ).toFixed(2);
  }

  async function saveMarks() {
   if (
  !schoolId ||
  !teacher ||
  !currentAssignment ||
  !activeTerm ||
  !selectedYear ||
  marksLoading ||
  saving
) {
      setError("Select an assigned class, subject and open term first.");
      return;
    }

    if (students.length === 0) {
      setError("There are no enrolled students in this class.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const batch = writeBatch(db);

      const yearName =
        academicYears.find((item) => item.id === selectedYear)?.name || "";

      students.forEach((student) => {
        const entry = marks[student.id] || {
          first: "",
          second: "",
        };

        const first = entry.first === "" ? null : Number(entry.first);
        const second = entry.second === "" ? null : Number(entry.second);

        const calculatedAverage =
          first === null || second === null
            ? null
            : Number(((first + second) / 2).toFixed(2));

        const markId = `${encodeURIComponent(student.id)}__${encodeURIComponent(
          currentAssignment.subjectId
        )}`;

        const markRef = doc(
          db,
          "schools",
          schoolId,
          "academicYears",
          selectedYear,
          "terms",
          selectedTerm,
          "marks",
          markId
        );

        batch.set(
          markRef,
          {
            studentId: student.id,
            studentName: student.fullName,
            admissionNumber: student.admissionNumber,
          teacherId: teacher.id,
teacherUid: teacher.authUid,
teacherName: teacher.name,
            classId: currentAssignment.classId,
            className: currentAssignment.className,
            subjectId: currentAssignment.subjectId,
            subjectName: currentAssignment.subjectName,
            academicYearId: selectedYear,
            academicYearName: yearName,
            termId: selectedTerm,
            termName: activeTerm.name,
            sequence1: first,
            sequence2: second,
            average: calculatedAverage,
            status: "draft",
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      });

      await batch.commit();

      setMessage("Marks saved successfully. You can return and edit them later.");
    } catch (err) {
      console.error(err);
      setError("Unable to save marks. Check your Firestore permissions.");
    } finally {
      setSaving(false);
    }
  }
  async function submitForReview() {
    if (
      !schoolId ||
      !teacher ||
      !currentAssignment ||
      !activeTerm ||
      markStatus !== "draft" ||
      saving
    ) {
      return;
    }

    if (students.length === 0 || completedCount !== students.length) {
      setError("Complete both sequence marks for every student before submitting.");
      return;
    }

    if (!window.confirm("Submit these marks to the Class Master for review?")) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const marksRef = collection(
        db,
        "schools",
        schoolId,
        "academicYears",
        selectedYear,
        "terms",
        selectedTerm,
        "marks"
      );

      const snapshot = await getDocs(
        query(marksRef, where("teacherUid", "==", teacher?.authUid))
      );

      const subjectMarks = snapshot.docs.filter((item) => {
        const data = item.data();
        return (
          data.classId === currentAssignment.classId &&
          data.subjectId === currentAssignment.subjectId
        );
      });

      const savedStudentIds = new Set(
        subjectMarks.map((item) => item.data().studentId)
      );

      const allStudentsSaved = students.every((student) =>
        savedStudentIds.has(student.id)
      );

      const allSavedMarksComplete = subjectMarks.every((item) => {
        const data = item.data();
        return data.sequence1 !== null &&
          data.sequence1 !== undefined &&
          data.sequence2 !== null &&
          data.sequence2 !== undefined;
      });

      if (!allStudentsSaved || !allSavedMarksComplete) {
        setError("Save all completed marks first, then submit for review.");
        return;
      }

      const batch = writeBatch(db);

      subjectMarks.forEach((item) => {
        batch.update(item.ref, {
          status: "submitted",
          submittedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      await batch.commit();

      setMarkStatus("submitted");
      setMessage("Marks submitted successfully to the Class Master for review.");
    } catch (err) {
      console.error(err);
      setError("Unable to submit marks. Check your Firestore permissions.");
    } finally {
      setSaving(false);
    }
  }

  const completedCount = students.filter((student) => {
    const entry = marks[student.id];
    return entry?.first !== "" && entry?.first !== undefined &&
      entry?.second !== "" && entry?.second !== undefined;
  }).length;

  if (loading) {
    return <p className="p-8 text-center text-slate-500">Loading teacher workspace...</p>;
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <header className="flex items-center justify-between border-b bg-white px-4 py-4 md:px-8">
        <div>
          <h1 className="text-xl font-bold text-blue-950">GS SCHOOL</h1>
          <p className="text-xs text-slate-500">Teacher marks management</p>
        </div>

        <Link
          href="/teacher"
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Back to dashboard
        </Link>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-7 md:px-8">
        <p className="text-sm font-semibold text-blue-700">TEACHER WORKSPACE</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">
          Enter student marks
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          {teacher ? `Welcome, ${teacher.name}.` : "Record and manage your students' sequence marks."}
          {" "}Each sequence mark is out of 40.
        </p>

        {error && (
          <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {message && (
          <p className="mt-5 rounded-lg bg-green-50 p-3 text-sm text-green-800">
            {message}
          </p>
        )}
{wasReturned && markStatus === "draft" && (
  <div className="mt-5 rounded-xl border border-orange-300 bg-orange-50 p-4 text-orange-900">
    <p className="font-bold">Marks Returned for Correction</p>
    <p className="mt-1 text-sm">
      Your Class Master has returned these marks. Please correct them,
      save your changes and submit again.
    </p>
  </div>
)}

        {!error && assignments.length === 0 && (
          <div className="mt-6 rounded-xl border bg-white p-6">
            <h3 className="font-semibold text-slate-900">
              No teaching assignments yet
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Your administrator must assign your classes and subjects before you can enter marks.
            </p>
          </div>
        )}

        {assignments.length > 0 && (
          <>
            <section className="mt-7 grid gap-4 rounded-2xl border bg-white p-5 shadow-sm md:grid-cols-3">
             <div>
  <label className="mb-2 block text-sm font-semibold">
    Current academic year
  </label>
  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 font-medium">
    {academicYears.find((year) => year.id === selectedYear)?.name ||
      "No active academic year"}
  </div>
</div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Open term
                </label>
                <select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3"
                >
                  <option value="">Select open term</option>
                  {terms.filter((term) => term.status === "open").map((term) => (
                    <option key={term.id} value={term.id}>
                      {term.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Assigned class and subject
                </label>
                <select
                  value={selectedAssignment}
                  onChange={(e) => setSelectedAssignment(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3"
                >
                  <option value="">Select assignment</option>
                  {availableAssignments.map((assignment) => (
                    <option key={assignment.id} value={assignment.id}>
                      {assignment.className} — {assignment.subjectName}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            {selectedYear && terms.length > 0 && !activeTerm && (
              <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                There is no open term for this academic year. Contact your administrator.
              </p>
            )}

            {selectedYear && availableAssignments.length === 0 && (
              <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                You have no active assignments for this academic year.
              </p>
            )}

            {currentAssignment && activeTerm && (
              <section className="mt-6 overflow-hidden rounded-2xl border bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5">
                  <div>
                    <h3 className="font-bold text-slate-900">
                      {currentAssignment.className} · {currentAssignment.subjectName}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {activeTerm.name} · {students.length} enrolled students
                    </p>
                  </div>
<div className="text-sm text-slate-600">
  <p>
    Completed: <strong>{completedCount}/{students.length}</strong>
  </p>
  <p className="mt-1 font-semibold">
    {wasReturned ? "Returned for Correction" : statusMessage.title}
  </p>
</div>
                </div>

                {studentsLoading ? (
                  <p className="p-8 text-center text-sm text-slate-500">
                    Loading enrolled students...
                  </p>
                ) : students.length === 0 ? (
                  <p className="p-8 text-center text-sm text-slate-500">
                    No active students are enrolled in this class.
                  </p>
                ) : (
                  <>
                    <div className="hidden overflow-x-auto md:block">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                          <tr>
                            <th className="px-5 py-4">Student</th>
                            <th className="px-5 py-4">Sequence 1 /40</th>
                            <th className="px-5 py-4">Sequence 2 /40</th>
                            <th className="px-5 py-4">Average /40</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {students.map((student) => (
                            <tr key={student.id}>
                              <td className="px-5 py-4">
                                <p className="font-semibold">{student.fullName}</p>
                                <p className="text-xs text-slate-400">
                                  {student.admissionNumber || student.id}
                                </p>
                              </td>
                              <td className="px-5 py-4">
                                <input
  type="number"
  disabled={markStatus !== "draft"}
  min="0"
                                  max="40"
                                  step="0.01"
                                  value={marks[student.id]?.first ?? ""}
                                  onChange={(e) => updateMark(student.id, "first", e.target.value)}
                                  className="w-24 rounded-lg border p-2 outline-none focus:border-blue-600"
                                  placeholder="0–40"
                                />
                              </td>
                              <td className="px-5 py-4">
                                <input
  type="number"
  disabled={markStatus !== "draft"}
  min="0"
                                  max="40"
                                  step="0.01"
                                  value={marks[student.id]?.second ?? ""}
                                  onChange={(e) => updateMark(student.id, "second", e.target.value)}
                                  className="w-24 rounded-lg border p-2 outline-none focus:border-blue-600"
                                  placeholder="0–40"
                                />
                              </td>
                              <td className="px-5 py-4 font-bold">
                                {average(student.id)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="space-y-4 p-4 md:hidden">
                      {students.map((student) => (
                        <div key={student.id} className="rounded-xl border p-4">
                          <p className="font-semibold">{student.fullName}</p>
                          <p className="mb-4 text-xs text-slate-400">
                            {student.admissionNumber || student.id}
                          </p>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="mb-1 block text-xs text-slate-500">
                                Sequence 1 /40
                              </label>
                             <input
  type="number"
  disabled={markStatus !== "draft"}
  min="0"
                                max="40"
                                step="0.01"
                                value={marks[student.id]?.first ?? ""}
                                onChange={(e) => updateMark(student.id, "first", e.target.value)}
                                className="w-full rounded-lg border p-3"
                                placeholder="0–40"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-slate-500">
                                Sequence 2 /40
                              </label>
                             <input
  type="number"
  disabled={markStatus !== "draft"}
  min="0"
                                max="40"
                                step="0.01"
                                value={marks[student.id]?.second ?? ""}
                                onChange={(e) => updateMark(student.id, "second", e.target.value)}
                                className="w-full rounded-lg border p-3"
                                placeholder="0–40"
                              />
                            </div>
                          </div>

                          <div className="mt-3 flex justify-between border-t pt-3 text-sm">
                            <span className="text-slate-500">Average</span>
                            <strong>{average(student.id)} / 40</strong>
                          </div>
                        </div>
                      ))}
                    </div>

{showPreview && (
  <div className="m-5 overflow-auto rounded-xl border bg-white p-5 max-h-[650px]">
    <div className="mb-5 text-center">
      <h2 className="text-xl font-bold text-blue-950">
        GTHS KUMBO
      </h2>
      <h3 className="mt-2 font-semibold">
        STUDENT MARKS PREVIEW
      </h3>
      <p className="mt-2 text-sm">
        Academic Year: {academicYears.find((y) => y.id === selectedYear)?.name}
      </p>
      <p className="text-sm">
        {activeTerm.name} | {currentAssignment.className} | {currentAssignment.subjectName}
      </p>
      <p className="text-sm">
        Teacher: {teacher?.name}
      </p>
    </div>

   <table className="min-w-[850px] w-full border-collapse text-left text-sm">
      <thead>
        <tr className="bg-slate-100">
          <th className="border p-2">No.</th>
          <th className="border p-2">Admission No.</th>
          <th className="border p-2">Student Name</th>
          <th className="border p-2">Sequence 1 /40</th>
          <th className="border p-2">Sequence 2 /40</th>
          <th className="border p-2">Average /40</th>
        </tr>
      </thead>

      <tbody>
        {students.map((student, index) => (
          <tr key={student.id}>
            <td className="border p-2">{index + 1}</td>
            <td className="border p-2">{student.admissionNumber}</td>
            <td className="border p-2">{student.fullName}</td>
            <td className="border p-2">
              {marks[student.id]?.first || "—"}
            </td>
            <td className="border p-2">
              {marks[student.id]?.second || "—"}
            </td>
            <td className="border p-2">{average(student.id)}</td>
          </tr>
        ))}
      </tbody>
    </table>

    <p className="mt-4 text-sm font-semibold">
      Completed: {completedCount}/{students.length}
    </p>

    <div className="mt-12 flex justify-between text-sm">
      <p>Teacher&apos;s Signature: __________________</p>
      <p>Date: __________________</p>
    </div>
  </div>
)}
                   <div className="border-t bg-slate-50 p-5">
<div className={`mb-4 rounded-xl border p-4 ${statusMessage.style}`}>
  <p className="font-bold">{statusMessage.title}</p>
  <p className="mt-1 text-sm">{statusMessage.description}</p>
</div>

  <div className="flex flex-wrap gap-3">
 
    <button
      type="button"
      onClick={saveMarks}
      disabled={
        saving ||
        studentsLoading ||
        marksLoading ||
        markStatus !== "draft"
      }
      className="rounded-xl bg-blue-950 px-6 py-3 font-semibold text-white hover:bg-blue-900 disabled:opacity-50"
    >
      {saving ? "Processing..." : "Save marks"}
    </button>

 <button
  type="button"
  onClick={() => setShowPreview(!showPreview)}
  className="rounded-xl border border-blue-900 px-6 py-3 font-semibold text-blue-900 hover:bg-blue-50"
>
  {showPreview ? "Hide Preview" : "Preview Marks"}
</button>

    <button
      type="button"
      onClick={submitForReview}
      disabled={
        saving ||
        studentsLoading ||
        marksLoading ||
        markStatus !== "draft" ||
        completedCount !== students.length ||
        students.length === 0
      }
      className="rounded-xl bg-green-700 px-6 py-3 font-semibold text-white hover:bg-green-800 disabled:opacity-50"
    >
    {markStatus === "submitted"
  ? "Submitted ✓"
  : markStatus === "reviewed"
  ? "Reviewed ✓"
  : markStatus === "finalized"
  ? "Finalized ✓"
  : "Submit for Review"}
    </button>
  </div>

  <p className="mt-3 text-xs text-slate-500">
    Save your marks first. Once submitted, they remain locked until the Class Master returns them for correction.
  </p>
</div>
                  </>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
