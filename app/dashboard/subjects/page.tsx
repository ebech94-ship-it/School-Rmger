
"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";

type Subject = {
  id: string;
  name: string;
  code: string;
  category: string;
  coefficient: number;
  status: "active" | "archived";
};

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schoolId, setSchoolId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("active");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [category, setCategory] = useState("General");
  const [coefficient, setCoefficient] = useState("1");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let unsubscribeSubjects: (() => void) | undefined;

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

        unsubscribeSubjects = onSnapshot(
          collection(db, "schools", currentSchoolId, "subjects"),
          (snapshot) => {
            const records = snapshot.docs.map((item) => {
              const data = item.data();

              return {
                id: item.id,
                name: data.name || "",
                code: data.code || "",
                category: data.category || "General",
                coefficient: Number(data.coefficient) || 1,
                status: data.status === "archived" ? "archived" : "active",
              } as Subject;
            });

            records.sort((a, b) => a.name.localeCompare(b.name));
            setSubjects(records);
            setLoading(false);
          },
          (err) => {
            console.error(err);
            setError("Unable to load subjects. Check Firestore permissions.");
            setLoading(false);
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
      unsubscribeSubjects?.();
    };
  }, []);

  function resetForm() {
    setName("");
    setCode("");
    setCategory("General");
    setCoefficient("1");
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(subject: Subject) {
    setName(subject.name);
    setCode(subject.code);
    setCategory(subject.category);
    setCoefficient(String(subject.coefficient));
    setEditingId(subject.id);
    setShowForm(true);
    setMessage("");
    setError("");
  }

  async function saveSubject(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!schoolId || saving) return;

    const cleanName = name.trim();
    const cleanCode = code.trim().toUpperCase();
    const cleanCategory = category.trim();
    const numericCoefficient = Number(coefficient);

    if (!cleanName || !cleanCode || !cleanCategory) {
      setError("Please complete all subject fields.");
      return;
    }

    if (!Number.isFinite(numericCoefficient) || numericCoefficient <= 0) {
      setError("Coefficient must be greater than zero.");
      return;
    }

    const duplicate = subjects.find(
      (subject) =>
        subject.id !== editingId &&
        subject.status === "active" &&
        (subject.name.toLowerCase() === cleanName.toLowerCase() ||
          subject.code.toLowerCase() === cleanCode.toLowerCase())
    );

    if (duplicate) {
      setError("An active subject with this name or code already exists.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const subjectData = {
        name: cleanName,
        code: cleanCode,
        category: cleanCategory,
        coefficient: numericCoefficient,
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(
          doc(db, "schools", schoolId, "subjects", editingId),
          subjectData
        );
        setMessage("Subject updated successfully.");
      } else {
        await addDoc(
          collection(db, "schools", schoolId, "subjects"),
          {
            ...subjectData,
            status: "active",
            createdAt: serverTimestamp(),
          }
        );
        setMessage("Subject registered successfully.");
      }

      resetForm();
    } catch (err) {
      console.error(err);
      setError("Unable to save subject. Check Firestore permissions.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleArchive(subject: Subject) {
    if (!schoolId) return;

    const nextStatus =
      subject.status === "active" ? "archived" : "active";

    if (
      nextStatus === "archived" &&
      !window.confirm(`Archive ${subject.name}?`)
    ) {
      return;
    }

    try {
      await updateDoc(
        doc(db, "schools", schoolId, "subjects", subject.id),
        {
          status: nextStatus,
          updatedAt: serverTimestamp(),
        }
      );

      setMessage(
        nextStatus === "archived"
          ? "Subject archived."
          : "Subject restored."
      );
      setError("");
    } catch (err) {
      console.error(err);
      setError("Unable to update subject status. Check permissions.");
    }
  }

  const activeSubjects = subjects.filter(
    (subject) => subject.status === "active"
  );

  const generalCount = activeSubjects.filter(
    (subject) => subject.category.toLowerCase() === "general"
  ).length;

  const professionalCount = activeSubjects.filter(
    (subject) => subject.category.toLowerCase() === "professional"
  ).length;

  const filteredSubjects = subjects.filter((subject) => {
    const matchesSearch =
      subject.name.toLowerCase().includes(search.toLowerCase()) ||
      subject.code.toLowerCase().includes(search.toLowerCase()) ||
      subject.category.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      filter === "all" || subject.status === filter;

    return matchesSearch && matchesStatus;
  });

  return (
    <main className="space-y-6 text-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-wider text-blue-700">
            ACADEMIC CONFIGURATION
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Subjects
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Register school subjects and configure their default coefficients.
          </p>
        </div>

        <button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
              setMessage("");
              setError("");
            }
          }}
          className="rounded-xl bg-blue-950 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-900"
        >
          {showForm ? "Close form" : "+ Add subject"}
        </button>
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

      {showForm && (
        <form
          onSubmit={saveSubject}
          className="rounded-2xl border bg-white p-5 shadow-sm"
        >
          <h2 className="mb-4 font-bold text-slate-900">
            {editingId ? "Edit subject" : "Register a subject"}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Subject name
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Electrical Power Systems"
                className="w-full rounded-xl border p-3 text-sm outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Subject code
              </label>
              <input
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. EPS"
                className="w-full rounded-xl border p-3 text-sm uppercase outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Category
              </label>
              <input
                required
                list="subject-categories"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Choose or enter category"
                className="w-full rounded-xl border p-3 text-sm outline-none focus:border-blue-600"
              />
              <datalist id="subject-categories">
                <option value="General" />
                <option value="Professional" />
                <option value="Practical" />
                <option value="Optional" />
                <option value="Other" />
              </datalist>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Default coefficient
              </label>
              <input
                required
                type="number"
                min="0.1"
                step="0.1"
                value={coefficient}
                onChange={(e) => setCoefficient(e.target.value)}
                className="w-full rounded-xl border p-3 text-sm outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              disabled={saving}
              className="rounded-xl bg-blue-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId ? "Update subject" : "Save subject"}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border px-5 py-3 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Active subjects</p>
          <p className="mt-2 text-2xl font-bold text-blue-950">
            {activeSubjects.length}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">General education</p>
          <p className="mt-2 text-2xl font-bold text-blue-700">
            {generalCount}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Professional education</p>
          <p className="mt-2 text-2xl font-bold text-blue-700">
            {professionalCount}
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5">
          <div>
            <h2 className="font-bold text-slate-900">Subject register</h2>
            <p className="mt-1 text-xs text-slate-500">
              Manage subjects and their default coefficients.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subjects..."
              className="w-full rounded-lg border px-3 py-2 text-sm sm:w-48"
            />

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg border bg-white px-3 py-2 text-sm"
            >
              <option value="active">Active</option>
              <option value="archived">Archived</option>
              <option value="all">All subjects</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="p-8 text-center text-sm text-slate-500">
            Loading subjects...
          </p>
        ) : filteredSubjects.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-semibold text-slate-700">
              No subjects found
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Add a subject to begin building your school subject register.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Subject</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Coefficient</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {filteredSubjects.map((subject) => (
                  <tr key={subject.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-semibold">
                      {subject.code}
                    </td>
                    <td className="px-5 py-3">{subject.name}</td>
                    <td className="px-5 py-3">{subject.category}</td>
                    <td className="px-5 py-3 font-bold text-blue-800">
                      {subject.coefficient}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          subject.status === "active"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {subject.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-3 whitespace-nowrap">
                        <button
                          onClick={() => startEdit(subject)}
                          className="font-medium text-blue-700 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => toggleArchive(subject)}
                          className="font-medium text-slate-600 hover:underline"
                        >
                          {subject.status === "active" ? "Archive" : "Restore"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t bg-slate-50 px-5 py-3 text-xs text-slate-500">
          Subject records are saved under this school. Archived subjects are
          retained for historical records.
        </div>
      </section>
    </main>
  );
}
