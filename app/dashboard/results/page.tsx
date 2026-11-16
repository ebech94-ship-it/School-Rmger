
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  Timestamp,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";

type ResultStatus =
  | "awaiting_teacher"
  | "submitted"
  | "reviewed"
  | "finalized";

type ResultRecord = {
  id: string;
  className: string;
  department: string;
  subjectName: string;
  teacherName: string;
  academicYearName: string;
  termName: string;
  status: ResultStatus;
  submittedAt: Timestamp | null;
};

const statusLabels: Record<ResultStatus, string> = {
  awaiting_teacher: "Awaiting teacher",
  submitted: "Submitted",
  reviewed: "Reviewed",
  finalized: "Finalized",
};

const statusStyles: Record<ResultStatus, string> = {
  awaiting_teacher: "bg-red-50 text-red-700",
  submitted: "bg-amber-50 text-amber-700",
  reviewed: "bg-blue-50 text-blue-700",
  finalized: "bg-slate-100 text-slate-700",
};

export default function ResultsManagementPage() {
  const [schoolId, setSchoolId] = useState("");
  const [results, setResults] = useState<ResultRecord[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let unsubscribeResults: (() => void) | undefined;

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

        unsubscribeResults = onSnapshot(
          collection(db, "schools", currentSchoolId, "results"),
          (snapshot) => {
            const records = snapshot.docs.map((item) => {
              const data = item.data();

              return {
                id: item.id,
                className: data.className || "Class not specified",
                department: data.department || "",
                subjectName: data.subjectName || "Subject not specified",
                teacherName: data.teacherName || "Teacher not specified",
                academicYearName: data.academicYearName || "",
                termName: data.termName || "",
                status: data.status || "awaiting_teacher",
                submittedAt: data.submittedAt || null,
              } as ResultRecord;
            });

            records.sort((a, b) =>
              a.className.localeCompare(b.className)
            );

            setResults(records);
            setLoading(false);
            setError("");
          },
          (err) => {
            console.error(err);
            setError(
              "Unable to load results. Firestore permissions may need updating."
            );
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
      unsubscribeResults?.();
    };
  }, []);

  const counts = useMemo(() => ({
    awaiting: results.filter(r => r.status === "awaiting_teacher").length,
    submitted: results.filter(r => r.status === "submitted").length,
    reviewed: results.filter(r => r.status === "reviewed").length,
    finalized: results.filter(r => r.status === "finalized").length,
  }), [results]);

  const filteredResults = useMemo(() => {
    const term = search.toLowerCase();

    return results.filter((result) => {
      const matchesStatus =
        filter === "all" || result.status === filter;

      const matchesSearch = [
        result.className,
        result.department,
        result.subjectName,
        result.teacherName,
        result.academicYearName,
        result.termName,
      ].join(" ").toLowerCase().includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [results, filter, search]);

  async function finalizeResult(result: ResultRecord) {
    if (!schoolId || savingId) return;

    if (result.status !== "reviewed") return;

    const confirmed = window.confirm(
      `Finalize results for ${result.className} - ${result.subjectName}?\n\nFinalized results will be locked against normal editing.`
    );

    if (!confirmed) return;

    setSavingId(result.id);
    setError("");
    setMessage("");

    try {
      await updateDoc(
        doc(db, "schools", schoolId, "results", result.id),
        {
          status: "finalized",
          finalizedAt: serverTimestamp(),
          finalizedBy: auth.currentUser?.uid || null,
          updatedAt: serverTimestamp(),
        }
      );

      setMessage(
        `${result.subjectName} results for ${result.className} finalized successfully.`
      );
    } catch (err) {
      console.error(err);
      setError("Unable to finalize results. Check your Firestore permissions.");
    } finally {
      setSavingId("");
    }
  }

  function formatDate(value: Timestamp | null) {
    if (!value) return "Not submitted";

    return value.toDate().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <main className="space-y-5 text-slate-800">
      <div>
        <p className="text-xs font-bold tracking-wider text-blue-700">
          ACADEMICS / RESULTS
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Results Management
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Monitor teacher submissions, Class Master reviews and final approval.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
          {message}
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "Awaiting teacher",
            value: counts.awaiting,
            color: "text-red-600",
          },
          {
            label: "Submitted",
            value: counts.submitted,
            color: "text-amber-600",
          },
          {
            label: "Reviewed",
            value: counts.reviewed,
            color: "text-blue-700",
          },
          {
            label: "Finalized",
            value: counts.finalized,
            color: "text-slate-700",
          },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border bg-white p-4">
            <p className="text-xs text-slate-500">{item.label}</p>
            <p className={`mt-2 text-2xl font-bold ${item.color}`}>
              {item.value}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border bg-white p-4">
        <h2 className="font-semibold text-slate-900">
          Results approval workflow
        </h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            ["01", "Teacher entry", "Teacher records and submits marks."],
            ["02", "Class Master review", "Checks class results and completeness."],
            ["03", "Admin finalization", "Approves and locks reviewed results."],
          ].map(([number, title, detail]) => (
            <div key={number} className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs font-bold text-blue-700">{number}</p>
              <p className="mt-1 text-sm font-semibold">{title}</p>
              <p className="mt-1 text-xs text-slate-500">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border bg-white">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">
              Subject submission register
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Live records from your school&apos;s database.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search class, subject or teacher"
              className="w-full rounded-lg border px-3 py-2 text-sm sm:w-60"
            />

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg border bg-white px-3 py-2 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="awaiting_teacher">Awaiting teacher</option>
              <option value="submitted">Submitted</option>
              <option value="reviewed">Reviewed</option>
              <option value="finalized">Finalized</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="p-8 text-center text-sm text-slate-500">
            Loading results...
          </p>
        ) : filteredResults.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-slate-700">
              No result records found.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Results will appear here when teachers submit marks.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredResults.map((result) => (
              <div
                key={result.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    {result.subjectName}
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    {result.className}
                    {result.department ? ` · ${result.department}` : ""}
                    {" · "}
                    {result.teacherName}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {[result.academicYearName, result.termName]
                      .filter(Boolean)
                      .join(" · ")}
                    {" · Submitted: "}
                    {formatDate(result.submittedAt)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      statusStyles[result.status]
                    }`}
                  >
                    {statusLabels[result.status]}
                  </span>

                  {result.status === "reviewed" && (
                    <button
                      onClick={() => finalizeResult(result)}
                      disabled={savingId === result.id}
                      className="rounded-lg bg-blue-800 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-900 disabled:opacity-50"
                    >
                      {savingId === result.id ? "Finalizing..." : "Finalize"}
                    </button>
                  )}

                  {result.status === "finalized" && (
                    <span className="text-xs font-medium text-slate-500">
                      Locked
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
