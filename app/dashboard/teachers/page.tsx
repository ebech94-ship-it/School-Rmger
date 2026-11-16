
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

type Teacher = {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  status: "active" | "archived";
  accountStatus: "not_created" | "invited" | "active";
  authUid: string | null;
};

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schoolId, setSchoolId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [invitingId, setInvitingId] = useState<string | null>(null);
const [invitationLink, setInvitationLink] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("active");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
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

        unsubscribeTeachers = onSnapshot(
          collection(db, "schools", currentSchoolId, "teachers"),
          (snapshot) => {
            const records = snapshot.docs.map((item) => {
              const data = item.data();

            return {
  id: item.id,
  name: data.name || "",
  email: data.email || "",
  phone: data.phone || "",
  department: data.department || "",

  status:
    data.status === "archived" ? "archived" : "active",

  accountStatus:
    data.accountStatus === "active"
      ? "active"
      : data.accountStatus === "invited"
        ? "invited"
        : "not_created",

  authUid: data.authUid || null,
} as Teacher;
              
            });

            records.sort((a, b) => a.name.localeCompare(b.name));
            setTeachers(records);
            setLoading(false);
          },
          (err) => {
            console.error(err);
            setError("Unable to load teachers. Check Firestore permissions.");
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
      unsubscribeTeachers?.();
    };
  }, []);

  function resetForm() {
    setName("");
    setEmail("");
    setPhone("");
    setDepartment("");
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(teacher: Teacher) {
    setName(teacher.name);
    setEmail(teacher.email);
    setPhone(teacher.phone);
    setDepartment(teacher.department);
    setEditingId(teacher.id);
    setShowForm(true);
    setMessage("");
    setError("");
  }

  async function saveTeacher(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!schoolId || saving) return;

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanDepartment = department.trim();

    if (!cleanName || !cleanEmail || !cleanDepartment) {
      setError("Please complete the required fields.");
      return;
    }

    const duplicate = teachers.find(
      (teacher) =>
        teacher.id !== editingId &&
        teacher.status === "active" &&
        teacher.email.toLowerCase() === cleanEmail
    );

    if (duplicate) {
      setError("A teacher with this email is already registered.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const teacherData = {
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        department: cleanDepartment,
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(
          doc(db, "schools", schoolId, "teachers", editingId),
          teacherData
        );

        setMessage("Teacher record updated successfully.");
      } else {
        await addDoc(
          collection(db, "schools", schoolId, "teachers"),
          {
            ...teacherData,
            status: "active",
            accountStatus: "not_created",
            authUid: null,
            createdAt: serverTimestamp(),
          }
        );

        setMessage("Teacher registered successfully.");
      }

      resetForm();
    } catch (err) {
      console.error(err);
      setError("Unable to save teacher. Check Firestore permissions.");
    } finally {
      setSaving(false);
    }
  }

  async function generateInvitation(teacher: Teacher) {
  if (invitingId || !auth.currentUser) {
    setError("Please sign in again before generating an invitation.");
    return;
  }

  if (teacher.accountStatus === "active") {
    setError("This teacher already has an active account.");
    return;
  }

  setInvitingId(teacher.id);
  setError("");
  setMessage("");
  setInvitationLink("");

  try {
    const idToken = await auth.currentUser.getIdToken();

    const response = await fetch("/api/teachers/invite", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        teacherId: teacher.id,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to generate invitation.");
    }

    setInvitationLink(data.invitationUrl);
    setMessage(`Invitation generated for ${teacher.name}. It expires in 48 hours.`);
  } catch (err) {
    console.error(err);
    setError(
      err instanceof Error
        ? err.message
        : "Unable to generate invitation."
    );
  } finally {
    setInvitingId(null);
  }
}

async function copyInvitationLink() {
  if (!invitationLink) return;

  try {
    await navigator.clipboard.writeText(invitationLink);
    setMessage("Invitation link copied. You can now share it with the teacher.");
  } catch {
    setError("Unable to copy the link. Please copy it manually.");
  }
}
  async function toggleArchive(teacher: Teacher) {
    if (!schoolId) return;

    const nextStatus =
      teacher.status === "active" ? "archived" : "active";

    if (
      nextStatus === "archived" &&
      !window.confirm(`Archive ${teacher.name}?`)
    ) {
      return;
    }

    try {
      await updateDoc(
        doc(db, "schools", schoolId, "teachers", teacher.id),
        {
          status: nextStatus,
          updatedAt: serverTimestamp(),
        }
      );

      setMessage(
        nextStatus === "archived"
          ? "Teacher record archived."
          : "Teacher record restored."
      );
      setError("");
    } catch (err) {
      console.error(err);
      setError("Unable to update teacher status. Check permissions.");
    }
  }

  const activeTeachers = teachers.filter(
    (teacher) => teacher.status === "active"
  );

  const filteredTeachers = teachers.filter((teacher) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      teacher.name.toLowerCase().includes(searchText) ||
      teacher.email.toLowerCase().includes(searchText) ||
      teacher.department.toLowerCase().includes(searchText) ||
      teacher.phone.toLowerCase().includes(searchText);

    const matchesStatus =
      filter === "all" || teacher.status === filter;

    return matchesSearch && matchesStatus;
  });

  return (
    <main className="space-y-6 text-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-wider text-blue-700">
            STAFF ADMINISTRATION
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Teachers
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Register teachers and manage their school records.
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
          {showForm ? "Close form" : "+ Register teacher"}
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

{invitationLink && (
  <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
    <p className="font-semibold text-blue-950">
      Teacher invitation link
    </p>

    <p className="mt-2 break-all text-sm text-blue-800">
      {invitationLink}
    </p>

    <div className="mt-3 flex flex-wrap gap-3">
      <button
        type="button"
        onClick={copyInvitationLink}
        className="rounded-lg bg-blue-950 px-4 py-2 text-sm font-semibold text-white"
      >
        Copy invitation link
      </button>

      <a
        href={`https://wa.me/?text=${encodeURIComponent(
          `Hello, you have been registered as a teacher on GS SCHOOL. Please use this link to activate your account: ${invitationLink}`
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg border border-blue-300 px-4 py-2 text-sm font-semibold text-blue-900"
      >
        Share on WhatsApp
      </a>
    </div>

    <p className="mt-2 text-xs text-blue-700">
      This invitation expires after 48 hours. Generating another invitation
      will invalidate the previous pending link.
    </p>
  </div>
)}

      {showForm && (
        <form
          onSubmit={saveTeacher}
          className="rounded-2xl border bg-white p-5 shadow-sm"
        >
          <h2 className="mb-4 font-bold text-slate-900">
            {editingId ? "Edit teacher record" : "New teacher registration"}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Full name *
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Teacher's full name"
                className="w-full rounded-xl border p-3 text-sm outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Email address *
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@school.cm"
                className="w-full rounded-xl border p-3 text-sm outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Phone number
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="6XXXXXXXX"
                className="w-full rounded-xl border p-3 text-sm outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Department *
              </label>
              <input
                required
                list="teacher-departments"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Choose or enter department"
                className="w-full rounded-xl border p-3 text-sm outline-none focus:border-blue-600"
              />
              <datalist id="teacher-departments">
                <option value="EPS" />
                <option value="Mathematics" />
                <option value="English" />
                <option value="Science" />
                <option value="Humanities" />
                <option value="Commercial" />
                <option value="Electrical Engineering" />
                <option value="Mechanical Engineering" />
                <option value="Building Construction" />
                <option value="Other" />
              </datalist>
            </div>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            This creates a teacher record only. Login account invitations
            will be handled separately.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              disabled={saving}
              className="rounded-xl bg-blue-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Update teacher"
                  : "Save teacher"}
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

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Registered teachers</p>
          <p className="mt-2 text-2xl font-bold text-blue-950">
            {teachers.length}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Active teachers</p>
          <p className="mt-2 text-2xl font-bold text-blue-700">
            {activeTeachers.length}
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5">
          <div>
            <h2 className="font-bold text-slate-900">Staff register</h2>
            <p className="mt-1 text-xs text-slate-500">
              Teachers registered in this school.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search teachers..."
              className="w-full rounded-lg border px-3 py-2 text-sm sm:w-48"
            />

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg border bg-white px-3 py-2 text-sm"
            >
              <option value="active">Active</option>
              <option value="archived">Archived</option>
              <option value="all">All teachers</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="p-8 text-center text-sm text-slate-500">
            Loading teachers...
          </p>
        ) : filteredTeachers.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-semibold text-slate-700">
              No teachers found
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Register a teacher to begin building your staff register.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-3">Teacher</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">Department</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Account</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {filteredTeachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-semibold">
                      {teacher.name}
                    </td>

                    <td className="px-5 py-3">
                      <p>{teacher.email}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {teacher.phone || "No phone provided"}
                      </p>
                    </td>

                    <td className="px-5 py-3">{teacher.department}</td>

                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          teacher.status === "active"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {teacher.status}
                      </span>
                    </td>

<td className="px-5 py-3">
  <span
    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
      teacher.accountStatus === "active"
        ? "bg-green-50 text-green-700"
        : teacher.accountStatus === "invited"
          ? "bg-amber-50 text-amber-700"
          : "bg-slate-100 text-slate-600"
    }`}
  >
    {teacher.accountStatus === "active"
      ? "Account active"
      : teacher.accountStatus === "invited"
        ? "Invitation sent"
        : "Not created"}
  </span>
</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-3 whitespace-nowrap">
                     {teacher.status === "active" &&
  teacher.accountStatus !== "active" && (
    <button
      type="button"
      disabled={invitingId !== null}
      onClick={() => generateInvitation(teacher)}
      className="font-medium text-green-700 hover:underline disabled:opacity-50"
    >
      {invitingId === teacher.id
        ? "Generating..."
        : "Generate invitation"}
    </button>
  )}
                        <button
                          onClick={() => startEdit(teacher)}
                          className="font-medium text-blue-700 hover:underline"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => toggleArchive(teacher)}
                          className="font-medium text-slate-600 hover:underline"
                        >
                          {teacher.status === "active" ? "Archive" : "Restore"}
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
          Archived teacher records are retained for historical reference.
        </div>
      </section>
    </main>
  );
}
