
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";

type ResultStatus = "draft" | "submitted" | "reviewed" | "finalized";

type ResultRecord = {
  id: string;
  academicYearId: string;
  academicYearName: string;
  termId: string;
  termName: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  status: ResultStatus;
  submittedAt: Timestamp | null;
  markCount: number;
};

const statusLabels: Record<ResultStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  reviewed: "Reviewed",
  finalized: "Finalized",
};

const statusStyles: Record<ResultStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  submitted: "bg-amber-50 text-amber-700",
  reviewed: "bg-blue-50 text-blue-700",
  finalized: "bg-green-50 text-green-700",
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
    const listeners: (() => void)[] = [];
    let cancelled = false;

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
          profileData.role !== "technical_admin" ||
          !profileData.schoolId
        ) {
          window.location.replace("/login");
          return;
        }

        const currentSchoolId = profileData.schoolId;

        if (cancelled) return;

        setSchoolId(currentSchoolId);

        const yearsSnapshot = await getDocs(
          collection(db, "schools", currentSchoolId, "academicYears")
        );

        for (const yearDoc of yearsSnapshot.docs) {
          const yearId = yearDoc.id;
          const yearName = yearDoc.data().name || "";

          const termsSnapshot = await getDocs(
            collection(
              db,
              "schools",
              currentSchoolId,
              "academicYears",
              yearId,
              "terms"
            )
          );

          for (const termDoc of termsSnapshot.docs) {
            const termId = termDoc.id;
            const termName = termDoc.data().name || "";

            const marksRef = collection(
              db,
              "schools",
              currentSchoolId,
              "academicYears",
              yearId,
              "terms",
              termId,
              "marks"
            );

            const unsubscribe = onSnapshot(
              marksRef,
              (snapshot) => {
                if (cancelled) return;

                const grouped = new Map<string, ResultRecord>();

                snapshot.docs.forEach((item) => {
                  const data = item.data();

                  const classId = data.classId || "";
                  const subjectId = data.subjectId || "";
                  const teacherId = data.teacherId || "";

                  if (!classId || !subjectId) return;

                  const groupId = `${yearId}__${termId}__${classId}__${subjectId}__${teacherId}`;

                const validStatuses: ResultStatus[] = [
  "draft",
  "submitted",
  "reviewed",
  "finalized",
];

const status: ResultStatus = validStatuses.includes(data.status)
  ? data.status
  : "draft";
                  const existing = grouped.get(groupId);

                 if (existing) {
  existing.markCount += 1;

  const priority: Record<ResultStatus, number> = {
    draft: 0,
    submitted: 1,
    reviewed: 2,
    finalized: 3,
  };

  // The group takes the least-complete status.
  if (priority[status] < priority[existing.status]) {
    existing.status = status;
  }

  if (
    data.submittedAt instanceof Timestamp &&
    (!existing.submittedAt ||
      data.submittedAt.toMillis() >
        existing.submittedAt.toMillis())
  ) {
    existing.submittedAt = data.submittedAt;
  }
} else {
                    grouped.set(groupId, {
                      id: groupId,
                      academicYearId: yearId,
                      academicYearName: yearName,
                      termId,
                      termName,
                      classId,
                      className: data.className || "Class not specified",
                      subjectId,
                      subjectName: data.subjectName || "Subject not specified",
                      teacherId: data.teacherId || "Teacher not specified",
                      teacherName: data.teacherName || "Teacher not specified",
                      status,
                      submittedAt: data.submittedAt || null,
                      markCount: 1,
                    });
                  }
                });

                const newRecords = Array.from(grouped.values());

                setResults((previous) => {
                  const otherRecords = previous.filter(
                    (item) =>
                      item.academicYearId !== yearId ||
                      item.termId !== termId
                  );

                  return [...otherRecords, ...newRecords].sort((a, b) =>
                    a.className.localeCompare(b.className)
                  );
                });

                setLoading(false);
              },
              (err) => {
                console.error(err);
                setError("Unable to load marks. Check Firestore permissions.");
                setLoading(false);
              }
            );

            listeners.push(unsubscribe);
          }
        }

        if (!cancelled) setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Unable to load academic years, terms or marks.");
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      unsubscribeAuth();
      listeners.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  const counts = useMemo(
    () => ({
      draft: results.filter((r) => r.status === "draft").length,
      submitted: results.filter((r) => r.status === "submitted").length,
      reviewed: results.filter((r) => r.status === "reviewed").length,
      finalized: results.filter((r) => r.status === "finalized").length,
    }),
    [results]
  );

  const filteredResults = useMemo(() => {
    const term = search.toLowerCase();

    return results.filter((result) => {
      const matchesStatus = filter === "all" || result.status === filter;

      const matchesSearch = [
        result.className,
        result.subjectName,
        result.teacherName,
        result.academicYearName,
        result.termName,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [results, filter, search]);

  async function finalizeResult(result: ResultRecord) {
    if (!schoolId || savingId || result.status !== "reviewed") return;

    const confirmed = window.confirm(
      `Finalize results for ${result.className} - ${result.subjectName}?\n\nFinalized marks will be locked against normal editing.`
    );

    if (!confirmed) return;

    setSavingId(result.id);
    setError("");
    setMessage("");

    try {
      const marksRef = collection(
        db,
        "schools",
        schoolId,
        "academicYears",
        result.academicYearId,
        "terms",
        result.termId,
        "marks"
      );

      const snapshot = await getDocs(marksRef);

            const matchingDocs = snapshot.docs.filter((item) => {
        const data = item.data();

        return (
          data.classId === result.classId &&
          data.subjectId === result.subjectId &&
          data.teacherId === result.teacherId
        );
      });

      if (
  matchingDocs.length === 0 ||
  matchingDocs.length !== result.markCount ||
  matchingDocs.some((item) => item.data().status !== "reviewed")
) {
        setError(
          "These marks are not all reviewed. Refresh the page and check the Class Master review."
        );
        return;
      }

      for (let i = 0; i < matchingDocs.length; i += 450) {
        const batch = writeBatch(db);

        matchingDocs.slice(i, i + 450).forEach((item) => {
          batch.update(item.ref, {
            status: "finalized",
            finalizedAt: serverTimestamp(),
            finalizedBy: auth.currentUser?.uid || null,
            updatedAt: serverTimestamp(),
          });
        });

        await batch.commit();
      }

      setMessage(
        `${result.subjectName} results for ${result.className} finalized successfully.`
      );
    } catch (err) {
      console.error(err);
      setError("Unable to finalize marks. Check your Firestore permissions.");
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
          { label: "Draft", value: counts.draft, color: "text-slate-700" },
          { label: "Submitted", value: counts.submitted, color: "text-amber-600" },
          { label: "Reviewed", value: counts.reviewed, color: "text-blue-700" },
          { label: "Finalized", value: counts.finalized, color: "text-green-700" },
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
            ["03", "Admin finalization", "Approves and locks reviewed marks."],
          ].map(([number, title, detail]) => (
            <div key={number} className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs font-bold text-blue-700">{number}</p>
              <p className="mt-1 text-sm font-semibold">{title}</p>
              <p className="mt-1 text-xs text-slate-500">{detail}</p>
            </div>
          ))}
        </div>
      </section>
<section className="rounded-xl border border-blue-200 bg-blue-50 p-4">
  <h2 className="font-bold text-blue-950">
    What happens after finalization?
  </h2>

  <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-blue-900">
    <li>
      Teachers submit marks and Class Masters review them.
    </li>
    <li>
      Technical Admin finalizes all reviewed subject results.
    </li>
    <li>
      Technical Admin proceeds to Class Council to review averages,
      rankings and promotion decisions.
    </li>
    <li>
      The Principal or School Administration reviews and signs off
      the council records.
    </li>
    <li>
      Approved results proceed to publication and report-card issuance.
    </li>
  </ol>

  <p className="mt-3 text-xs text-blue-800">
    Finalization on this page does not publish results. It prepares
    finalized marks for Class Council.
  </p>
</section>
      <section className="overflow-hidden rounded-xl border bg-white">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">
              Subject submission register
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Live records from the actual marks collection.
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
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="reviewed">Reviewed</option>
              <option value="finalized">Finalized</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="p-8 text-center text-sm text-slate-500">
            Loading marks...
          </p>
        ) : filteredResults.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-slate-700">
              No mark records found.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Records will appear here when teachers save marks.
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
                    {result.className} · {result.teacherName}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {[result.academicYearName, result.termName]
                      .filter(Boolean)
                      .join(" · ")}
                    {" · "}
                    {result.markCount} student marks
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
                    <span className="text-xs font-medium text-green-700">
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