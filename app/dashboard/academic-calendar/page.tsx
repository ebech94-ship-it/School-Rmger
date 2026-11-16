
"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
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
import { auth, db } from "@/lib/firebase";

type Term = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "upcoming" | "open" | "closed" | "archived";
  order: number;
};

type AcademicYear = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
};

export default function AcademicCalendarPage() {
  const [schoolId, setSchoolId] = useState("");
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [termsState, setTermsState] = useState<{
  yearId: string;
  records: Term[];
}>({
  yearId: "",
  records: [],
});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [showYearForm, setShowYearForm] = useState(false);
  const [yearName, setYearName] = useState("");
  const [yearStart, setYearStart] = useState("");
  const [yearEnd, setYearEnd] = useState("");
  const [termCount, setTermCount] = useState("3");

  const [newTermName, setNewTermName] = useState("");

  useEffect(() => {
    let unsubscribeYears: (() => void) | undefined;

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

        const currentSchoolId = data.schoolId as string;
        setSchoolId(currentSchoolId);

        unsubscribeYears = onSnapshot(
          collection(db, "schools", currentSchoolId, "academicYears"),
          (snapshot) => {
            const records = snapshot.docs.map((item) => ({
              id: item.id,
              name: item.data().name || "",
              startDate: item.data().startDate || "",
              endDate: item.data().endDate || "",
            }));

            records.sort((a, b) => a.name.localeCompare(b.name));
            setYears(records);

            setSelectedYear((current) => {
              if (current && records.some((year) => year.id === current)) {
                return current;
              }
              return records[0]?.id || "";
            });

            setLoading(false);
          },
          () => {
            setError("Unable to load academic years. Please check your access.");
            setLoading(false);
          }
        );
      } catch {
        setError("Unable to verify your administrator account.");
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeYears?.();
    };
  }, []);

 useEffect(() => {
  if (!schoolId || !selectedYear) return;

  const yearId = selectedYear;

  const unsubscribe = onSnapshot(
    collection(
      db,
      "schools",
      schoolId,
      "academicYears",
      yearId,
      "terms"
    ),
    (snapshot) => {
      const records = snapshot.docs.map((item) => ({
        id: item.id,
        name: item.data().name || "",
        startDate: item.data().startDate || "",
        endDate: item.data().endDate || "",
        status: item.data().status || "upcoming",
        order: item.data().order || 0,
      })) as Term[];

      records.sort((a, b) => a.order - b.order);

      setTermsState({
        yearId,
        records,
      });
    },
    () => setError("Unable to load the terms for this academic year.")
  );

  return () => unsubscribe();
}, [schoolId, selectedYear]);

const terms =
  termsState.yearId === selectedYear
    ? termsState.records
    : [];
  const activeYear = years.find((year) => year.id === selectedYear);

  async function createAcademicYear() {
    setError("");
    setMessage("");

    if (!schoolId || !yearName.trim() || !yearStart || !yearEnd) {
      setError("Please complete all academic year details.");
      return;
    }

    if (yearEnd <= yearStart) {
      setError("The closing date must be after the opening date.");
      return;
    }

    setSaving(true);

    try {
      const yearRef = await addDoc(
        collection(db, "schools", schoolId, "academicYears"),
        {
          name: yearName.trim(),
          startDate: yearStart,
          endDate: yearEnd,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );

      const batch = writeBatch(db);
      const count = Number(termCount);

      for (let i = 1; i <= count; i++) {
        const termRef = doc(
          collection(
            db,
            "schools",
            schoolId,
            "academicYears",
            yearRef.id,
            "terms"
          )
        );

        batch.set(termRef, {
          name: `${["First", "Second", "Third", "Fourth"][i - 1]} Term`,
          startDate: "",
          endDate: "",
          status: "upcoming",
          order: i,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      await batch.commit();

      setSelectedYear(yearRef.id);
      setShowYearForm(false);
      setYearName("");
      setYearStart("");
      setYearEnd("");
      setTermCount("3");
      setMessage("Academic year created. You can now configure its terms.");
    } catch {
      setError("Could not create the academic year. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function updateTerm(
    termId: string,
    field: "name" | "startDate" | "endDate",
    value: string
  ) {
    if (!schoolId || !selectedYear) return;

    setError("");
    setMessage("");

    const term = terms.find((item) => item.id === termId);
    if (!term) return;

    const updated = { ...term, [field]: value };

    if (
      updated.startDate &&
      updated.endDate &&
      updated.endDate < updated.startDate
    ) {
      setError("The closing date cannot be before the opening date.");
      return;
    }

    try {
      await updateDoc(
        doc(
          db,
          "schools",
          schoolId,
          "academicYears",
          selectedYear,
          "terms",
          termId
        ),
        {
          [field]: value,
          updatedAt: serverTimestamp(),
        }
      );
      setMessage("Term details saved.");
    } catch {
      setError("Could not save the term details.");
    }
  }

  async function changeTermStatus(termId: string, status: Term["status"]) {
    if (!schoolId || !selectedYear) return;

    const term = terms.find((item) => item.id === termId);
    if (!term) return;

    if (status === "open") {
      if (!term.startDate || !term.endDate) {
        setError("Enter the opening and closing dates before opening this term.");
        return;
      }

      if (
        !window.confirm(
          `Open ${term.name}? Any other open term in this academic year will be closed.`
        )
      ) return;
    }

    if (
      status === "closed" &&
      !window.confirm(
        `Close ${term.name}? Its saved results will be preserved.`
      )
    ) return;

    setError("");
    setMessage("");

    try {
      const batch = writeBatch(db);
      const termsRef = collection(
        db,
        "schools",
        schoolId,
        "academicYears",
        selectedYear,
        "terms"
      );

      if (status === "open") {
        terms
          .filter((item) => item.status === "open" && item.id !== termId)
          .forEach((item) => {
            batch.update(doc(termsRef, item.id), {
              status: "closed",
              updatedAt: serverTimestamp(),
            });
          });
      }

      batch.update(doc(termsRef, termId), {
        status,
        updatedAt: serverTimestamp(),
      });

      await batch.commit();
      setMessage(`${term.name} has been updated.`);
    } catch {
      setError("Could not update the term status.");
    }
  }

  async function addTerm() {
    if (!schoolId || !selectedYear || !newTermName.trim()) {
      setError("Enter a name for the new term.");
      return;
    }

    if (terms.filter((term) => term.status !== "archived").length >= 4) {
      setError("A school year can have a maximum of four active terms.");
      return;
    }

    try {
      await addDoc(
        collection(
          db,
          "schools",
          schoolId,
          "academicYears",
          selectedYear,
          "terms"
        ),
        {
          name: newTermName.trim(),
          startDate: "",
          endDate: "",
          status: "upcoming",
          order: terms.length + 1,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );

      setNewTermName("");
      setMessage("New term added.");
    } catch {
      setError("Could not add the new term.");
    }
  }

  async function archiveTerm(term: Term) {
    if (term.status === "open") {
      setError("Close the term before archiving it.");
      return;
    }

    if (
      !window.confirm(
        `Archive ${term.name}? It will be hidden from the active term list.`
      )
    ) return;

    await changeTermStatus(term.id, "archived");
  }

  const visibleTerms = terms.filter((term) => term.status !== "archived");
  const openTerm = visibleTerms.find((term) => term.status === "open");

  return (
    <main className="mx-auto w-full max-w-6xl space-y-7 px-4 py-6 sm:px-6 lg:px-8">
      <header>
        <p className="text-sm font-bold uppercase tracking-wide text-blue-700">
          School administration
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">
          Academic Calendar
        </h1>
        <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">
          Manage your school&apos;s academic years, terms and important dates.
          Choose the structure that suits your school.
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

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full max-w-md">
            <label className="mb-2 block text-base font-semibold text-slate-800">
              Select academic year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setMessage("");
                setError("");
              }}
              className="min-h-14 w-full rounded-xl border-2 border-slate-300 bg-white px-4 text-lg text-slate-900 focus:border-blue-600 focus:outline-none"
            >
              <option value="">Choose an academic year</option>
              {years.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowYearForm(!showYearForm)}
            className="min-h-14 rounded-xl bg-blue-700 px-6 py-3 text-base font-bold text-white hover:bg-blue-800"
          >
            {showYearForm ? "Cancel" : "+ Create academic year"}
          </button>
        </div>

        {showYearForm && (
          <div className="mt-7 rounded-xl border-2 border-blue-100 bg-blue-50/50 p-5 sm:p-6">
            <h2 className="text-xl font-bold text-slate-900">
              Create a new academic year
            </h2>
            <p className="mt-2 text-base text-slate-600">
              Enter the school year and choose how many terms your school uses.
            </p>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block font-semibold text-slate-800">
                  Academic year name
                </label>
                <input
                  value={yearName}
                  onChange={(e) => setYearName(e.target.value)}
                  placeholder="Example: 2026/2027"
                  className="min-h-14 w-full rounded-xl border border-slate-300 bg-white px-4 text-base"
                />
              </div>

              <div>
                <label className="mb-2 block font-semibold text-slate-800">
                  Number of terms
                </label>
                <select
                  value={termCount}
                  onChange={(e) => setTermCount(e.target.value)}
                  className="min-h-14 w-full rounded-xl border border-slate-300 bg-white px-4 text-base"
                >
                  <option value="2">2 terms</option>
                  <option value="3">3 terms</option>
                  <option value="4">4 terms</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block font-semibold text-slate-800">
                  School year opening date
                </label>
                <input
                  type="date"
                  value={yearStart}
                  onChange={(e) => setYearStart(e.target.value)}
                  className="min-h-14 w-full rounded-xl border border-slate-300 bg-white px-4 text-base"
                />
              </div>

              <div>
                <label className="mb-2 block font-semibold text-slate-800">
                  School year closing date
                </label>
                <input
                  type="date"
                  value={yearEnd}
                  onChange={(e) => setYearEnd(e.target.value)}
                  className="min-h-14 w-full rounded-xl border border-slate-300 bg-white px-4 text-base"
                />
              </div>
            </div>

            <button
              onClick={createAcademicYear}
              disabled={saving}
              className="mt-6 min-h-14 rounded-xl bg-blue-700 px-7 py-3 text-base font-bold text-white disabled:opacity-60"
            >
              {saving ? "Creating..." : "Create academic year"}
            </button>
          </div>
        )}
      </section>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-lg text-slate-600">
          Loading academic calendar...
        </div>
      ) : !activeYear ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <h2 className="text-xl font-bold text-slate-900">
            No academic year created yet
          </h2>
          <p className="mt-3 text-base leading-7 text-slate-600">
            Create your school&apos;s first academic year to begin setting up its terms.
          </p>
        </section>
      ) : (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Selected school year
                </p>
                <h2 className="mt-1 text-2xl font-bold text-slate-950">
                  {activeYear.name}
                </h2>
                <p className="mt-2 text-base text-slate-600">
                  {activeYear.startDate || "Opening date not set"}{" "}
                  <span className="px-2">to</span>
                  {activeYear.endDate || "Closing date not set"}
                </p>
              </div>

              <div className="rounded-xl bg-slate-100 px-5 py-4">
                <p className="text-sm font-medium text-slate-600">
                  Current open term
                </p>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  {openTerm?.name || "No term is open"}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">
                  Terms for this school year
                </h2>
                <p className="mt-2 text-base leading-7 text-slate-600">
                  Set each term&apos;s dates and use the action buttons to manage its status.
                </p>
              </div>
              <span className="w-fit rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-800">
                {visibleTerms.length} active terms
              </span>
            </div>

            <div className="mt-6 space-y-5">
              {visibleTerms.map((term, index) => (
                <article
                  key={term.id}
                  className="rounded-2xl border-2 border-slate-200 p-5 sm:p-6"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-800">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-slate-500">
                          Term {index + 1}
                        </p>
                        <input
                          aria-label="Term name"
                          defaultValue={term.name}
                          key={`${term.id}-${term.name}`}
                          onBlur={(e) => {
                            const value = e.target.value.trim();
                            if (value && value !== term.name) {
                              updateTerm(term.id, "name", value);
                            }
                          }}
                          className="mt-1 w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-lg font-bold text-slate-950"
                        />
                      </div>
                    </div>

                    <span className={`w-fit rounded-full px-4 py-2 text-sm font-bold ${
                      term.status === "open"
                        ? "bg-blue-100 text-blue-800"
                        : term.status === "closed"
                        ? "bg-slate-200 text-slate-700"
                        : "bg-amber-100 text-amber-900"
                    }`}>
                      {term.status === "open"
                        ? "Currently open"
                        : term.status === "closed"
                        ? "Closed"
                        : "Upcoming"}
                    </span>
                  </div>

                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-base font-semibold text-slate-800">
                        Opening date
                      </label>
                      <input
                        type="date"
                        value={term.startDate}
                        onChange={(e) =>
                          updateTerm(term.id, "startDate", e.target.value)
                        }
                        className="min-h-14 w-full rounded-xl border-2 border-slate-300 bg-white px-4 text-base"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-base font-semibold text-slate-800">
                        Closing date
                      </label>
                      <input
                        type="date"
                        value={term.endDate}
                        onChange={(e) =>
                          updateTerm(term.id, "endDate", e.target.value)
                        }
                        className="min-h-14 w-full rounded-xl border-2 border-slate-300 bg-white px-4 text-base"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    {term.status !== "open" && (
                      <button
                        onClick={() => changeTermStatus(term.id, "open")}
                        className="min-h-12 rounded-xl bg-blue-700 px-5 py-3 text-base font-bold text-white hover:bg-blue-800"
                      >
                        Open this term
                      </button>
                    )}

                    {term.status === "open" && (
                      <button
                        onClick={() => changeTermStatus(term.id, "closed")}
                        className="min-h-12 rounded-xl border-2 border-slate-300 px-5 py-3 text-base font-bold text-slate-800 hover:bg-slate-50"
                      >
                        Close this term
                      </button>
                    )}

                    {term.status === "closed" && (
                      <button
                        onClick={() => changeTermStatus(term.id, "upcoming")}
                        className="min-h-12 rounded-xl border-2 border-slate-300 px-5 py-3 text-base font-bold text-slate-800 hover:bg-slate-50"
                      >
                        Reopen as upcoming
                      </button>
                    )}

                    {term.status !== "open" && (
                      <button
                        onClick={() => archiveTerm(term)}
                        className="min-h-12 rounded-xl border-2 border-slate-300 px-5 py-3 text-base font-bold text-slate-700 hover:bg-slate-50"
                      >
                        Archive term
                      </button>
                    )}
                  </div>
                </article>
              ))}

              {visibleTerms.length === 0 && (
                <p className="rounded-xl bg-slate-50 p-5 text-base text-slate-600">
                  No active terms. Add a term below to configure this school year.
                </p>
              )}
            </div>

            {visibleTerms.length < 4 && (
              <div className="mt-7 rounded-xl border-2 border-dashed border-slate-300 p-5">
                <h3 className="text-lg font-bold text-slate-900">
                  Add another term
                </h3>
                <p className="mt-2 text-base text-slate-600">
                  Your school can use up to four terms in one academic year.
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <input
                    value={newTermName}
                    onChange={(e) => setNewTermName(e.target.value)}
                    placeholder="Example: Fourth Term"
                    className="min-h-14 flex-1 rounded-xl border-2 border-slate-300 px-4 text-base"
                  />
                  <button
                    onClick={addTerm}
                    className="min-h-14 rounded-xl bg-blue-700 px-6 py-3 text-base font-bold text-white hover:bg-blue-800"
                  >
                    + Add term
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-blue-200 bg-blue-50 p-5">
            <h3 className="text-lg font-bold text-blue-950">
              Important information
            </h3>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-base leading-7 text-blue-900">
              <li>Only one term can be open for mark entry at a time.</li>
              <li>Closing a term does not delete its marks or results.</li>
              <li>Archived terms are hidden from the active calendar.</li>
              <li>Reopening a closed term requires administrator confirmation.</li>
            </ul>
          </section>
        </>
      )}
    </main>
  );
}
