
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  doc,
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
  status: "active" | "archived";
};

const levelSuggestions = [
  "Primary",
  "Form 1",
  "Form 2",
  "Form 3",
  "Form 4",
  "Form 5",
  "Lower Sixth",
  "Upper Sixth",
  "Year 1",
  "Year 2",
  "Year 3",
];

const departmentSuggestions = [
  "General Education",
  "Commercial",
  "Industrial",
  "Technical",
  "Science",
  "Arts",
  "Humanities",
  "Agriculture",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Building Construction",
];

const streamSuggestions = [
  "A",
  "B",
  "C",
  "Science",
  "Arts",
  "Commercial",
  "Industrial",
  "General",
];

export default function ClassesPage() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [schoolId, setSchoolId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [level, setLevel] = useState("");
  const [department, setDepartment] = useState("");
  const [stream, setStream] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let unsubscribeClasses: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.replace("/login");
        return;
      }

      try {
        const { getDoc } = await import("firebase/firestore");
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
          profile.role !== "technical_admin" ||
          !profile.schoolId
        ) {
          window.location.replace("/login");
          return;
        }

        setSchoolId(profile.schoolId);

        unsubscribeClasses = onSnapshot(
          collection(db, "schools", profile.schoolId, "classes"),
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
            setLoading(false);
          },
          (snapshotError) => {
            console.error(snapshotError);
            setError("Unable to load classes. Check your access permissions.");
            setLoading(false);
          }
        );
      } catch (authError) {
        console.error(authError);
        setError("Unable to verify your school account.");
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeClasses?.();
    };
  }, []);

  const filteredClasses = useMemo(() => {
    return classes.filter((item) => {
      const matchesSearch = [
        item.name,
        item.level,
        item.department,
        item.stream,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [classes, search, statusFilter]);

  const activeCount = classes.filter(
    (item) => item.status === "active"
  ).length;

  const archivedCount = classes.filter(
    (item) => item.status === "archived"
  ).length;

  function resetForm() {
    setName("");
    setLevel("");
    setDepartment("");
    setStream("");
    setEditingId(null);
    setShowForm(false);
  }

  function startEditing(item: SchoolClass) {
    setName(item.name);
    setLevel(item.level);
    setDepartment(item.department);
    setStream(item.stream);
    setEditingId(item.id);
    setShowForm(true);
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveClass(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!schoolId || !name.trim() || !level.trim()) {
      setError("Enter a class name and education level.");
      return;
    }

    const duplicate = classes.some(
      (item) =>
        item.id !== editingId &&
        item.name.trim().toLowerCase() === name.trim().toLowerCase() &&
        item.status === "active"
    );

    if (duplicate) {
      setError("An active class with this name already exists.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    const classData = {
      name: name.trim(),
      level: level.trim(),
      department: department.trim(),
      stream: stream.trim(),
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingId) {
        await updateDoc(
          doc(db, "schools", schoolId, "classes", editingId),
          classData
        );
        setMessage("Class details updated successfully.");
      } else {
        await addDoc(
          collection(db, "schools", schoolId, "classes"),
          {
            ...classData,
            status: "active",
            createdAt: serverTimestamp(),
          }
        );
        setMessage("Class created successfully.");
      }

      resetForm();
    } catch (saveError) {
      console.error(saveError);
      setError("Unable to save this class. Check your Firestore permissions.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleArchive(item: SchoolClass) {
    if (!schoolId) return;

    const nextStatus =
      item.status === "active" ? "archived" : "active";

    const confirmed = window.confirm(
      nextStatus === "archived"
        ? `Archive ${item.name}?`
        : `Restore ${item.name}?`
    );

    if (!confirmed) return;

    try {
      await updateDoc(
        doc(db, "schools", schoolId, "classes", item.id),
        {
          status: nextStatus,
          updatedAt: serverTimestamp(),
        }
      );

      setMessage(
        nextStatus === "archived"
          ? "Class archived."
          : "Class restored."
      );
      setError("");
    } catch (archiveError) {
      console.error(archiveError);
      setError("Unable to update this class.");
    }
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
            School administration
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#152440] sm:text-3xl">
            Class management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Configure the levels, departments, trades and classes in your school.
          </p>
        </div>

        <button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setEditingId(null);
              setName("");
              setLevel("");
              setDepartment("");
              setStream("");
              setShowForm(true);
            }
          }}
          className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
        >
          {showForm ? "Close form" : "+ Create class"}
        </button>
      </div>

      {message && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {[
          { label: "Total classes", value: classes.length },
          { label: "Active classes", value: activeCount },
          { label: "Archived classes", value: archivedCount },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
          >
            <p className="text-xs font-medium text-slate-500 sm:text-sm">
              {item.label}
            </p>
            <p className="mt-2 text-2xl font-bold text-[#152440] sm:text-3xl">
              {loading ? "—" : item.value}
            </p>
          </div>
        ))}
      </div>

      {showForm && (
        <form
          onSubmit={saveClass}
          className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="mb-5">
            <h2 className="font-bold text-[#152440]">
              {editingId ? "Update class details" : "Create a school class"}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Select a suggestion or type your school&apos;s own structure.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Class name *
              </label>
              <input
                required
                list="class-levels"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Form 1A"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              />
              <datalist id="class-levels">
                {levelSuggestions.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Education level *
              </label>
              <input
                required
                list="education-levels"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                placeholder="e.g. Secondary"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              />
              <datalist id="education-levels">
                {levelSuggestions.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Department / Trade
              </label>
              <input
                list="departments"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Electrical"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              />
              <datalist id="departments">
                {departmentSuggestions.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Stream / Section
              </label>
              <input
                list="streams"
                value={stream}
                onChange={(e) => setStream(e.target.value)}
                placeholder="e.g. A, Science"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              />
              <datalist id="streams">
                {streamSuggestions.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId ? "Update class" : "Save class"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:p-5">
          <div>
            <h2 className="font-bold text-[#152440]">School class register</h2>
            <p className="mt-1 text-xs text-slate-500">
              Select a class when managing students, teachers or results.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search classes..."
              className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
            >
              <option value="active">Active classes</option>
              <option value="archived">Archived classes</option>
              <option value="all">All classes</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Class name</th>
                <th className="px-5 py-3">Level</th>
                <th className="px-5 py-3">Department / Trade</th>
                <th className="px-5 py-3">Stream / Section</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    Loading school classes...
                  </td>
                </tr>
              ) : filteredClasses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <p className="font-medium text-slate-600">No classes found</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Create a class or adjust your search.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredClasses.map((item) => (
                  <tr key={item.id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-3 font-semibold text-[#152440]">
                      {item.name}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{item.level}</td>
                    <td className="px-5 py-3 text-slate-600">
                      {item.department || "—"}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {item.stream || "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        item.status === "active"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-slate-100 text-slate-500"
                      }`}>
                        {item.status === "active" ? "Active" : "Archived"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => startEditing(item)}
                          className="text-xs font-semibold text-blue-700 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => toggleArchive(item)}
                          className="text-xs font-semibold text-slate-500 hover:underline"
                        >
                          {item.status === "active" ? "Archive" : "Restore"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs text-slate-500">
          {filteredClasses.length} class{filteredClasses.length === 1 ? "" : "es"} displayed
        </div>
      </section>
    </div>
  );
}
