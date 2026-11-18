
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
  writeBatch,
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
  specialty?: string;
  coefficientsByForm?: Record<string, number | null>;
  coefficientNeedsReview?: boolean;
};
const EPS_CURRICULUM = [
  { name: "English", code: "ENG", category: "General", values: [4, 4, 3, 3, 3] },
  { name: "French", code: "FRE", category: "General", values: [4, 4, 3, 3, 3] },
  { name: "Mathematics", code: "MAT", category: "General", values: [4, 4, 3, 3, 3] },
  { name: "Physical Science", code: "PHY", category: "General", values: [2, 2, 2, 2, 2] },
  { name: "Civics and Moral Education", code: "CME", category: "General", values: [1, 1, 1, 1, 1] },
  { name: "Computer Science", code: "CSC", category: "General", values: [1, 1, 1, 1, 1] },
  { name: "Economic Geography", code: "EGE", category: "General", values: [null, null, 1, 1, 1] },
  { name: "Trade and Training", code: "TT", category: "General", values: [2, null, null, null, null] },
  { name: "Health, Safety and Environment", code: "HSE", category: "General", values: [1, 1, 1, 1, 1] },
  { name: "Entrepreneurship", code: "ENT", category: "General", values: [null, null, 1, 1, 1] },
  { name: "Technical Drawing", code: "TD", category: "Professional", values: [4, 2, 2, 2, 2] },
  { name: "Technology and Diagram", code: "TDI", category: "Professional", values: [3, 4, 4, 3, 2] },
  { name: "Practice Techno-Diagram", code: "PTD", category: "Practical", values: [6, 5, 5, 5, 3] },
  { name: "Electrical and Electronic Circuits", code: "EEC", category: "Professional", values: [null, 3, 3, 3, 3] },
  { name: "Test and Measurement", code: "TM", category: "Professional", values: [null, 3, 3, 3, 2] },
  { name: "Electrical Machines and Magnetism", code: "EMM", category: "Professional", values: [null, null, 2, 3, 3] },
  { name: "Sports and Physical Education", code: "SPE", category: "Other", values: [2, 2, 2, 2, null] },
  { name: "Manual Work", code: "MW", category: "Other", values: [1, 1, null, null, null] },
  {
    name: "Guidance Counselling",
    code: "GC",
    category: "Other",
    values: [null, null, null, null, null],
  },];
export default function SubjectsPage() {
const [importingCurriculum, setImportingCurriculum] = useState(false);
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
  specialty: data.specialty || "",
  coefficientsByForm: data.coefficientsByForm || undefined,
  coefficientNeedsReview: data.coefficientNeedsReview === true,
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

async function importElectricalPowerSystems() {
  if (!schoolId || importingCurriculum) return;

  if (
    !window.confirm(
      "Import the Electrical Power Systems curriculum for Forms 1–5? Existing subjects will not be overwritten."
    )
  ) {
    return;
  }

  setImportingCurriculum(true);
  setError("");
  setMessage("");

  try {
    const subjectsRef = collection(db, "schools", schoolId, "subjects");
    const batch = writeBatch(db);

    let added = 0;
    let skipped = 0;

    for (const item of EPS_CURRICULUM) {
      const exists = subjects.some(
        (subject) =>
          subject.code.toLowerCase() === item.code.toLowerCase() ||
          subject.name.toLowerCase() === item.name.toLowerCase()
      );

      if (exists) {
        skipped++;
        continue;
      }

      const coefficientsByForm = {
        Form1: item.values[0],
        Form2: item.values[1],
        Form3: item.values[2],
        Form4: item.values[3],
        Form5: item.values[4],
      };

      const defaultCoefficient =
        item.values.find((value) => value !== null) ?? 1;

      const newSubject = doc(subjectsRef);

      batch.set(newSubject, {
        name: item.name,
        code: item.code,
        category: item.category,
        specialty: "Electrical Power Systems",
        coefficientsByForm,
        coefficient: defaultCoefficient,
        coefficientNeedsReview:
  item.name === "Guidance Counselling",
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      added++;
    }

    if (added > 0) {
      await batch.commit();
    }

    setMessage(
      `Curriculum import complete: ${added} subjects added, ${skipped} existing subjects skipped.`
    );
  } catch (err) {
    console.error(err);
    setError("Unable to import curriculum. Please check your connection and permissions.");
  } finally {
    setImportingCurriculum(false);
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
      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-blue-950">
              Quick curriculum setup
            </h2>
            <p className="mt-1 text-sm text-blue-800">
              Load the supplied Electrical Power Systems curriculum,
              including its Form 1–5 subject coefficients.
            </p>
            <p className="mt-2 text-xs text-blue-700">
              Existing subjects are preserved. You can still add or edit
              subjects manually.
            </p>
          </div>

          <button
            type="button"
            onClick={importElectricalPowerSystems}
            disabled={importingCurriculum || loading}
            className="rounded-xl bg-blue-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {importingCurriculum
              ? "Importing..."
              : "Load Electrical Power Systems"}
          </button>
        </div>
      </section>

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
                  <th className="px-5 py-3">Coefficients</th>
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
  {subject.coefficientNeedsReview ? (
    <span className="text-amber-700">Needs configuration</span>
  ) : subject.coefficientsByForm ? (
    ["Form1", "Form2", "Form3", "Form4", "Form5"]
      .map((form) => subject.coefficientsByForm?.[form] ?? "—")
      .join(" / ")
  ) : (
    subject.coefficient
  )}
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
