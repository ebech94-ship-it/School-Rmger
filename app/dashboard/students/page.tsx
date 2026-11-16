
"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
   writeBatch,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type SchoolClass = {
  id: string;
  name: string;
  level: string;
  department: string;
  stream: string;
  status: string;
};

type AcademicYear = {
  id: string;
  name: string;
};

type Student = {
  id: string;
  admissionNumber: string;
  fullName: string;
  gender: string;
  status: "active" | "transferred" | "withdrawn" | "graduated";
};

type Enrollment = {
  id: string;
  studentId: string;
  classId: string;
  className: string;
  status: string;
};

export default function StudentsPage() {
  const [schoolId, setSchoolId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [years, setYears] = useState<AcademicYear[]>([]);
  const [selectedYear, setSelectedYear] = useState("");

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollmentData, setEnrollmentData] = useState<{
  yearId: string;
  records: Enrollment[];
}>({ yearId: "", records: [] });
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState("Male");
  const [classId, setClassId] = useState("");

  useEffect(() => {
    let stopYears: (() => void) | undefined;
    let stopClasses: (() => void) | undefined;

    const stopAuth = onAuthStateChanged(auth, async (user) => {
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

        const data = profile.data();

        if (
          data.active !== true ||
          data.role !== "technical_admin" ||
          !data.schoolId
        ) {
          window.location.replace("/login");
          return;
        }

        const currentSchoolId = data.schoolId as string;
        setSchoolId(currentSchoolId);

        stopYears = onSnapshot(
          collection(db, "schools", currentSchoolId, "academicYears"),
          (snapshot) => {
            const records = snapshot.docs.map((item) => ({
              id: item.id,
              name: item.data().name || "",
            }));

            records.sort((a, b) => a.name.localeCompare(b.name));
            setYears(records);

            setSelectedYear((current) =>
              current && records.some((year) => year.id === current)
                ? current
                : records[0]?.id || ""
            );

            setLoading(false);
          },
          () => {
            setError("Could not load academic years.");
            setLoading(false);
          }
        );

        stopClasses = onSnapshot(
          collection(db, "schools", currentSchoolId, "classes"),
          (snapshot) => {
            const records = snapshot.docs.map((item) => ({
              id: item.id,
              name: item.data().name || "",
              level: item.data().level || "",
              department: item.data().department || "",
              stream: item.data().stream || "",
              status: item.data().status || "active",
            })) as SchoolClass[];

            records.sort((a, b) => a.name.localeCompare(b.name));
            setClasses(records);
          },
          () => setError("Could not load school classes.")
        );
      } catch {
        setError("Unable to verify your administrator account.");
        setLoading(false);
      }
    });

    return () => {
      stopAuth();
      stopYears?.();
      stopClasses?.();
    };
  }, []);

  useEffect(() => {
    if (!schoolId || !selectedYear) {
      
      return;
    }

    const enrollmentsRef = collection(
      db,
      "schools",
      schoolId,
      "academicYears",
      selectedYear,
      "enrollments"
    );

    const stopEnrollments = onSnapshot(
      enrollmentsRef,
      (snapshot) => {
        const records = snapshot.docs.map((item) => ({
          id: item.id,
          studentId: item.data().studentId || item.id,
          classId: item.data().classId || "",
          className: item.data().className || "",
          status: item.data().status || "active",
        })) as Enrollment[];

       setEnrollmentData({
  yearId: selectedYear,
  records,
});
      },
      () => setError("Could not load student enrolments for this year.")
    );

    return () => stopEnrollments();
  }, [schoolId, selectedYear]);

  useEffect(() => {
    if (!schoolId) return;

    const stopStudents = onSnapshot(
      collection(db, "schools", schoolId, "students"),
      (snapshot) => {
        const records = snapshot.docs.map((item) => ({
          id: item.id,
          admissionNumber: item.data().admissionNumber || "",
          fullName: item.data().fullName || "",
          gender: item.data().gender || "",
          status: item.data().status || "active",
        })) as Student[];

        records.sort((a, b) => a.fullName.localeCompare(b.fullName));
        setStudents(records);
      },
      () => setError("Could not load the student register.")
    );

    return () => stopStudents();
  }, [schoolId]);

const studentRows = useMemo(() => {
  if (!schoolId || !selectedYear) return [];

  const enrollments =
    enrollmentData.yearId === selectedYear
      ? enrollmentData.records
      : [];

  return enrollments.map((enrollment) => {
    const student = students.find(
      (item) => item.id === enrollment.studentId
    );

    const schoolClass = classes.find(
      (item) => item.id === enrollment.classId
    );

    return {
      enrollment,
      student,
      className:
        schoolClass?.name ||
        enrollment.className ||
        "Class unavailable",
    };
  }).filter((row) => row.student);
}, [schoolId, selectedYear, enrollmentData, students, classes]);

  const filteredStudents = studentRows.filter((row) => {
    const student = row.student!;

    const matchesSearch = [
      student.fullName,
      student.admissionNumber,
      row.className,
    ].join(" ").toLowerCase().includes(search.toLowerCase());

    const matchesClass =
      classFilter === "all" || row.enrollment.classId === classFilter;

    const matchesStatus =
      statusFilter === "all" || student.status === statusFilter;

    return matchesSearch && matchesClass && matchesStatus;
  });

  const activeCount = studentRows.filter(
    (row) => row.student?.status === "active"
  ).length;

  function resetForm() {
    setEditingId("");
    setAdmissionNumber("");
    setFullName("");
    setGender("Male");
    setClassId("");
    setShowForm(false);
  }

  function openNewStudentForm() {
    setError("");
    setMessage("");
    setEditingId("");
    setAdmissionNumber("");
    setFullName("");
    setGender("Male");
    setClassId(classes.find((item) => item.status === "active")?.id || "");
    setShowForm(true);
  }

  function openEditForm(student: Student, currentClassId: string) {
    setEditingId(student.id);
    setAdmissionNumber(student.admissionNumber);
    setFullName(student.fullName);
    setGender(student.gender);
    setClassId(currentClassId);
    setShowForm(true);
    setError("");
    setMessage("");
  }

  async function saveStudent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!schoolId || !selectedYear) {
      setError("Create or select an academic year before registering students.");
      return;
    }

    if (!admissionNumber.trim() || !fullName.trim() || !classId) {
      setError("Please complete all required student details.");
      return;
    }

    const selectedClass = classes.find(
      (item) => item.id === classId && item.status === "active"
    );

    if (!selectedClass) {
      setError("Please select an available active class.");
      return;
    }

    setSaving(true);

    try {
      const normalizedAdmission = admissionNumber.trim().toUpperCase();

      const duplicateQuery = query(
        collection(db, "schools", schoolId, "students"),
        where("admissionNumber", "==", normalizedAdmission)
      );

      const duplicateResults = await getDocs(duplicateQuery);

      const duplicate = duplicateResults.docs.some(
        (item) => item.id !== editingId
      );

      if (duplicate) {
        setError("This admission number is already registered.");
        setSaving(false);
        return;
      }

      const studentData = {
        admissionNumber: normalizedAdmission,
        fullName: fullName.trim(),
        gender,
        updatedAt: serverTimestamp(),
      };

     if (editingId) {
  const enrollmentRef = doc(
    db,
    "schools",
    schoolId,
    "academicYears",
    selectedYear,
    "enrollments",
    editingId
  );

  await updateDoc(
    doc(db, "schools", schoolId, "students", editingId),
    studentData
  );

  await updateDoc(enrollmentRef, {
    classId: selectedClass.id,
    className: selectedClass.name,
    updatedAt: serverTimestamp(),
  });

  setMessage("Student details updated successfully.");
} else {
  const studentRef = doc(
    collection(db, "schools", schoolId, "students")
  );

  const enrollmentRef = doc(
    db,
    "schools",
    schoolId,
    "academicYears",
    selectedYear,
    "enrollments",
    studentRef.id
  );

  const batch = writeBatch(db);

  batch.set(studentRef, {
    ...studentData,
    status: "active",
    createdAt: serverTimestamp(),
  });

  batch.set(enrollmentRef, {
    studentId: studentRef.id,
    classId: selectedClass.id,
    className: selectedClass.name,
    status: "active",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await batch.commit();

  setMessage("Student registered successfully.");
}
      resetForm();
    } catch {
      setError("Could not save the student. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function changeStudentStatus(
    student: Student,
    status: Student["status"]
  ) {
    if (!schoolId) return;

    const actionText =
      status === "active"
        ? "restore this student to active status"
        : `mark this student as ${status}`;

    if (!window.confirm(`Are you sure you want to ${actionText}?`)) return;

    setError("");
    setMessage("");

    try {
      await updateDoc(
        doc(db, "schools", schoolId, "students", student.id),
        {
          status,
          updatedAt: serverTimestamp(),
        }
      );

      setMessage(`${student.fullName}'s status has been updated.`);
    } catch {
      setError("Could not update the student's status.");
    }
  }

  const activeClasses = classes.filter(
    (item) => item.status === "active"
  );

  return (
    <main className="mx-auto w-full max-w-7xl space-y-7 px-4 py-6 sm:px-6 lg:px-8">
      <header>
        <p className="text-sm font-bold uppercase tracking-wide text-blue-700">
          School administration
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">
          Student Register
        </h1>
        <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">
          Register students, assign them to classes and manage their school records.
        </p>
      </header>

      {message && (
        <div role="status" className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-base text-blue-900">
          {message}
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-base text-red-800">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2 sm:items-end">
          <div>
            <label className="mb-2 block text-base font-semibold text-slate-800">
              Academic year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setMessage("");
                setError("");
              }}
              className="min-h-14 w-full rounded-xl border-2 border-slate-300 bg-white px-4 text-lg"
            >
              <option value="">Select academic year</option>
              {years.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={openNewStudentForm}
            disabled={!selectedYear || activeClasses.length === 0}
            className="min-h-14 rounded-xl bg-blue-800 px-6 py-3 text-base font-bold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            + Register new student
          </button>
        </div>
      </section>

      {loading ? (
        <div className="rounded-xl border bg-white p-8 text-center text-lg text-slate-600">
          Loading student register...
        </div>
      ) : years.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <h2 className="text-xl font-bold text-slate-900">
            Academic year required
          </h2>
          <p className="mt-3 text-base leading-7 text-slate-600">
            Please create an academic year in Academic Calendar before registering students.
          </p>
        </section>
      ) : activeClasses.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <h2 className="text-xl font-bold text-slate-900">
            No active classes available
          </h2>
          <p className="mt-3 text-base leading-7 text-slate-600">
            Create or restore classes in the Classes section before registering students.
          </p>
        </section>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-base text-slate-600">
                Students enrolled this year
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-950">
                {studentRows.length}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-base text-slate-600">
                Active students
              </p>
              <p className="mt-2 text-3xl font-bold text-blue-800">
                {activeCount}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-base text-slate-600">
                Classes available
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-950">
                {activeClasses.length}
              </p>
            </div>
          </section>

          {showForm && (
            <section className="rounded-2xl border-2 border-blue-200 bg-white p-5 shadow-sm sm:p-7">
              <h2 className="text-2xl font-bold text-slate-950">
                {editingId ? "Update student record" : "New student registration"}
              </h2>
              <p className="mt-2 text-base leading-7 text-slate-600">
                Enter the student&apos;s details and select the class for this academic year.
              </p>

              <form onSubmit={saveStudent} className="mt-6 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-base font-semibold text-slate-800">
                      Admission number
                    </label>
                    <input
                      value={admissionNumber}
                      onChange={(e) => setAdmissionNumber(e.target.value)}
                      required
                      placeholder="Example: GTHS/2026/001"
                      className="min-h-14 w-full rounded-xl border-2 border-slate-300 px-4 text-base"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-base font-semibold text-slate-800">
                      Student&apos;s full name
                    </label>
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder="Enter full name"
                      className="min-h-14 w-full rounded-xl border-2 border-slate-300 px-4 text-base"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-base font-semibold text-slate-800">
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="min-h-14 w-full rounded-xl border-2 border-slate-300 bg-white px-4 text-base"
                    >
                      <option>Male</option>
                      <option>Female</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-base font-semibold text-slate-800">
                      Class for {years.find((year) => year.id === selectedYear)?.name}
                    </label>
                    <select
                      value={classId}
                      onChange={(e) => setClassId(e.target.value)}
                      required
                      className="min-h-14 w-full rounded-xl border-2 border-slate-300 bg-white px-4 text-base"
                    >
                      <option value="">Select class</option>
                      {activeClasses.map((schoolClass) => (
                        <option key={schoolClass.id} value={schoolClass.id}>
                          {schoolClass.name}
                          {schoolClass.department
                            ? ` — ${schoolClass.department}`
                            : ""}
                          {schoolClass.stream
                            ? ` — ${schoolClass.stream}`
                            : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="min-h-14 rounded-xl bg-blue-800 px-7 py-3 text-base font-bold text-white hover:bg-blue-900 disabled:opacity-60"
                  >
                    {saving
                      ? "Saving..."
                      : editingId
                      ? "Save changes"
                      : "Register student"}
                  </button>

                  <button
                    type="button"
                    onClick={resetForm}
                    className="min-h-14 rounded-xl border-2 border-slate-300 px-7 py-3 text-base font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5 sm:p-6">
              <h2 className="text-xl font-bold text-slate-950">
                Student register
              </h2>
              <p className="mt-2 text-base text-slate-600">
                Search and manage students enrolled in the selected academic year.
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-1">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Search students
                  </label>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Name or admission number"
                    className="min-h-13 w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-base"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Filter by class
                  </label>
                  <select
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                    className="min-h-13 w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-base"
                  >
                    <option value="all">All classes</option>
                    {activeClasses.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Filter by status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="min-h-13 w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-base"
                  >
                    <option value="all">All statuses</option>
                    <option value="active">Active</option>
                    <option value="transferred">Transferred</option>
                    <option value="withdrawn">Withdrawn</option>
                    <option value="graduated">Graduated</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-base">
                <thead className="bg-slate-50 text-sm text-slate-600">
                  <tr>
                    <th className="px-5 py-4">Admission number</th>
                    <th className="px-5 py-4">Student name</th>
                    <th className="px-5 py-4">Gender</th>
                    <th className="px-5 py-4">Class</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {filteredStudents.map((row) => {
                    const student = row.student!;

                    return (
                      <tr key={student.id} className="hover:bg-slate-50">
                        <td className="px-5 py-5 font-semibold text-slate-700">
                          {student.admissionNumber}
                        </td>
                        <td className="px-5 py-5 font-bold text-slate-950">
                          {student.fullName}
                        </td>
                        <td className="px-5 py-5 text-slate-700">
                          {student.gender}
                        </td>
                        <td className="px-5 py-5 text-slate-700">
                          {row.className}
                        </td>
                        <td className="px-5 py-5">
                          <span className={`inline-block rounded-full px-3 py-2 text-sm font-bold ${
                            student.status === "active"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-slate-100 text-slate-700"
                          }`}>
                            {student.status.charAt(0).toUpperCase() +
                              student.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-5 py-5">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() =>
                                openEditForm(student, row.enrollment.classId)
                              }
                              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100"
                            >
                              Edit
                            </button>

                            {student.status === "active" ? (
                              <button
                                onClick={() =>
                                  changeStudentStatus(student, "transferred")
                                }
                                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                              >
                                Mark transferred
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  changeStudentStatus(student, "active")
                                }
                                className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-50"
                              >
                                Restore
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredStudents.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-12 text-center text-base text-slate-600"
                      >
                        No students found for these search options.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600">
              Showing {filteredStudents.length} of {studentRows.length} enrolled students.
            </div>
          </section>
        </>
      )}
    </main>
  );
}
