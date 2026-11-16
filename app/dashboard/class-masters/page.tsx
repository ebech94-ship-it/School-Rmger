
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";

type SchoolClass = {
  id: string;
  name: string;
  level: string;
  department: string;
  stream: string;
  status: string;
  classMasterTeacherId?: string | null;
};

type Teacher = {
  id: string;
  name: string;
  email: string;
  department: string;
  status: string;
};

export default function ClassMastersPage() {
  const [schoolId, setSchoolId] = useState("");
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let unsubscribeClasses: (() => void) | undefined;
    let unsubscribeTeachers: (() => void) | undefined;

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

        const data = profile.data();

        if (
          data.active !== true ||
          data.role !== "technical_admin" ||
          !data.schoolId
        ) {
          window.location.replace("/login");
          return;
        }

        const currentSchoolId = data.schoolId;
        setSchoolId(currentSchoolId);

        unsubscribeClasses = onSnapshot(
          collection(db, "schools", currentSchoolId, "classes"),
          (snapshot) => {
            const records = snapshot.docs.map((item) => {
              const data = item.data();

              return {
                id: item.id,
                name: data.name || "",
                level: data.level || "",
                department: data.department || "",
                stream: data.stream || "",
                status: data.status || "active",
                classMasterTeacherId: data.classMasterTeacherId || null,
              } as SchoolClass;
            });

            records.sort((a, b) => a.name.localeCompare(b.name));
            setClasses(records);
            setLoading(false);
          },
          (err) => {
            console.error(err);
            setError("Unable to load classes. Check Firestore permissions.");
            setLoading(false);
          }
        );

        unsubscribeTeachers = onSnapshot(
          collection(db, "schools", currentSchoolId, "teachers"),
          (snapshot) => {
            const records = snapshot.docs.map((item) => {
              const data = item.data();

              return {
                id: item.id,
                name: data.name || "",
                email: data.email || "",
                department: data.department || "",
                status: data.status || "active",
              } as Teacher;
            });

            records.sort((a, b) => a.name.localeCompare(b.name));
            setTeachers(records);
          },
          (err) => {
            console.error(err);
            setError("Unable to load teachers. Check Firestore permissions.");
          }
        );
      } catch (err) {
        console.error(err);
        setError("Unable to verify your administrator account.");
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeClasses?.();
      unsubscribeTeachers?.();
    };
  }, []);

  const activeClasses = useMemo(
    () => classes.filter((item) => item.status === "active"),
    [classes]
  );

  const activeTeachers = useMemo(
    () => teachers.filter((item) => item.status === "active"),
    [teachers]
  );

  const assigned = activeClasses.filter(
    (item) =>
      item.classMasterTeacherId &&
      activeTeachers.some(
        (teacher) => teacher.id === item.classMasterTeacherId
      )
  ).length;

  const unassigned = activeClasses.length - assigned;

  const filteredClasses = activeClasses.filter((item) => {
    const teacher = teachers.find(
      (person) => person.id === item.classMasterTeacherId
    );

    const searchText = search.toLowerCase();

    return (
      item.name.toLowerCase().includes(searchText) ||
      item.level.toLowerCase().includes(searchText) ||
      item.department.toLowerCase().includes(searchText) ||
      item.stream.toLowerCase().includes(searchText) ||
      (teacher?.name || "").toLowerCase().includes(searchText)
    );
  });

  function chooseClass(classId: string) {
    setSelectedClass(classId);

    const classRecord = classes.find((item) => item.id === classId);

    setSelectedTeacher(classRecord?.classMasterTeacherId || "");
    setMessage("");
    setError("");
  }

  async function saveAssignment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!schoolId || !selectedClass || saving) {
      setError("Please select a class.");
      return;
    }

    if (selectedTeacher) {
      const teacherExists = activeTeachers.some(
        (teacher) => teacher.id === selectedTeacher
      );

      if (!teacherExists) {
        setError("Please select an active teacher.");
        return;
      }
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await updateDoc(
        doc(db, "schools", schoolId, "classes", selectedClass),
        {
          classMasterTeacherId: selectedTeacher || null,
          classMasterAssignedAt: selectedTeacher
            ? serverTimestamp()
            : null,
          updatedAt: serverTimestamp(),
        }
      );

      const classRecord = classes.find(
        (item) => item.id === selectedClass
      );

      const teacher = activeTeachers.find(
        (item) => item.id === selectedTeacher
      );

      if (teacher) {
        setMessage(`${teacher.name} assigned to ${classRecord?.name}.`);
      } else {
        setMessage(`Class Master removed from ${classRecord?.name}.`);
      }
    } catch (err) {
      console.error(err);
      setError("Unable to save assignment. Check Firestore permissions.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="space-y-6 text-slate-800">
      <div>
        <p className="text-xs font-bold tracking-wider text-blue-700">
          ADMINISTRATION / STAFF
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Class Master Assignment
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Assign teachers to supervise and coordinate their respective classes.
        </p>
      </div>

      {message && (
        <div className="rounded-xl bg-blue-50 p-3 text-sm text-blue-800">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm text-slate-500">Active classes</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {activeClasses.length}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm text-slate-500">Assigned</p>
          <p className="mt-2 text-2xl font-bold text-blue-700">
            {assigned}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm text-slate-500">Awaiting assignment</p>
          <p className="mt-2 text-2xl font-bold text-red-600">
            {unassigned}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-5 sm:p-6">
        <h2 className="font-bold text-slate-900">
          Assign a Class Master
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Choose an active class and an existing active teacher.
        </p>

        {loading ? (
          <p className="mt-5 text-sm text-slate-500">
            Loading school records...
          </p>
        ) : activeClasses.length === 0 ? (
          <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            No active classes found. Create classes before assigning Class Masters.
          </p>
        ) : activeTeachers.length === 0 ? (
          <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            No active teachers found. Register teachers before making assignments.
          </p>
        ) : (
          <form
            onSubmit={saveAssignment}
            className="mt-5 grid gap-4 md:grid-cols-3"
          >
            <div>
              <label className="mb-2 block text-sm font-medium">
                Class
              </label>
              <select
                required
                value={selectedClass}
                onChange={(e) => chooseClass(e.target.value)}
                className="w-full rounded-xl border bg-white p-3 text-sm outline-none focus:border-blue-600"
              >
                <option value="">Choose a class</option>
                {activeClasses.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                    {item.department ? ` - ${item.department}` : ""}
                    {item.stream ? ` (${item.stream})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Select teacher
              </label>
              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="w-full rounded-xl border bg-white p-3 text-sm outline-none focus:border-blue-600"
              >
                <option value="">No Class Master</option>
                {activeTeachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name} - {teacher.department || teacher.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                disabled={saving || !selectedClass}
                className="w-full rounded-xl bg-blue-950 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save assignment"}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5">
          <div>
            <h2 className="font-bold text-slate-900">
              Class Master Register
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Current assignments across active classes.
            </p>
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search classes or teachers..."
            className="w-full rounded-lg border px-3 py-2 text-sm sm:w-64"
          />
        </div>

        {loading ? (
          <p className="p-8 text-center text-sm text-slate-500">
            Loading assignments...
          </p>
        ) : filteredClasses.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No matching class records found.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredClasses.map((item) => {
              const teacher = teachers.find(
                (person) => person.id === item.classMasterTeacherId
              );

              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {item.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {[item.level, item.department, item.stream]
                        .filter(Boolean)
                        .join(" • ") || "Class details not specified"}
                    </p>
                  </div>

                  <div className="sm:min-w-64">
                    {teacher ? (
                      <>
                        <p className="text-sm font-medium text-slate-800">
                          {teacher.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {teacher.email}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-slate-400">
                        No Class Master assigned
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                        teacher
                          ? "bg-blue-50 text-blue-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {teacher ? "Assigned" : "Not assigned"}
                    </span>

                    <button
                      onClick={() => chooseClass(item.id)}
                      className="text-sm font-medium text-blue-700 hover:underline"
                    >
                      Manage
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
