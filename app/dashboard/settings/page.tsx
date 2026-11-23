
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type GradeBand = {
  label: string;
  range: string;
};

type ReportLabels = {
  studentName: string;
  academicYear: string;
  speciality: string;
  stream: string;
  dateOfBirth: string;
  class: string;
  admissionNumber: string;
  repeater: string;
  studentNumber: string;
  department: string;

  subject: string;
  teacher: string;
  firstSequence: string;
  secondSequence: string;
  average: string;
  coefficient: string;
  totalMarks: string;
  gradeRemarks: string;

  finalized: string;
  previewNotFinalized: string;
  incompleteReport: string;
  resultsAvailable: string;
  selectedTerm: string;
  incompleteWarning: string;
  noAssignmentsMessage: string;

  categoryTotalAverage: string;
  grandAverage: string;
  currentAverage: string;

  classPerformance: string;
  classAverage: string;
  studentPosition: string;
  passion: string;
  generalCertificate: string;

  performanceIndicators: string;
  recapitulation: string;
  firstTermAverage: string;

  classCouncilDecision: string;

// First and second term
passed: string;
needsImprovement: string;
failed: string;

// End-of-year
promoted: string;
repeat: string;
dismissed: string;
cannotTriple: string;

discipline: string;

  principalSignature: string;
  signatureAndStamp: string;
  generatedFooter: string;
};

type SchoolSettings = {
  identity: {
    schoolName: string;
    abbreviation: string;
    address: string;
    town: string;
    region: string;
    country: string;
    email: string;
    phone: string;
    website: string;
  };
  branding: {
    logoUrl: string;
    motto: string;
  };
  report: {
    title: string;
    authorityHeaderLeft: string;
    authorityHeaderRight: string;
    principalTitle: string;
    footerText: string;

    showAdmissionNumber: boolean;
    showSpeciality: boolean;
    showDepartment: boolean;
    showStream: boolean;
    showDateOfBirth: boolean;

    labels: ReportLabels;
    gradeBands: GradeBand[];
  };
};

// GTHS Kumbo starting template.
// Each school can edit these values in its own settings.
const DEFAULT_SETTINGS: SchoolSettings = {
  identity: {
    schoolName: "GOVERNMENT TECHNICAL HIGH SCHOOL KUMBO",
    abbreviation: "GTHS KUMBO",
    address: "Kumbo, Bui Division",
    town: "Kumbo",
    region: "North-West Region",
    country: "Cameroon",
    email: "",
    phone: "",
    website: "",
  },

  branding: {
    logoUrl: "",
    motto: "",
  },

  report: {
    title: "PROGRESS RECORD",
    authorityHeaderLeft: "MINISTÈRE DE L'ENSEIGNEMENT SECONDAIRE",
    authorityHeaderRight: "MINISTRY OF SECONDARY EDUCATION",
    principalTitle: "THE PRINCIPAL",
    footerText: "",

    showAdmissionNumber: true,
    showSpeciality: true,
    showDepartment: true,
    showStream: true,
    showDateOfBirth: false,

    labels: {
      studentName: "Name:",
      academicYear: "Academic Year:",
      speciality: "Speciality:",
      stream: "Stream:",
      dateOfBirth: "Date of Birth:",
      class: "Class:",
      admissionNumber: "Admission No:",
      repeater: "Repeater (Y/N):",
      studentNumber: "Student's No:",
      department: "Department:",

      subject: "SUBJECT",
      teacher: "TEACHER",
      firstSequence: "1st Seq",
      secondSequence: "2nd Seq",
      average: "AVRG",
      coefficient: "COEFF.",
      totalMarks: "TOTAL MARKS",
      gradeRemarks: "GRADE / REMARKS",

      finalized: "FINALIZED RESULTS",
      previewNotFinalized: "PREVIEW — NOT FINALIZED",
      incompleteReport: "INCOMPLETE REPORT",
      resultsAvailable: "RESULTS AVAILABLE",
      selectedTerm: "Selected Term:",
      incompleteWarning:
        "Some marks, assessment configurations or subject coefficients are incomplete. Missing results are not treated as final zero marks.",
      noAssignmentsMessage:
        "No active teacher subject assignments were found for this student's class.",

      categoryTotalAverage: "TOTAL / AVERAGE",
      grandAverage: "GRAND AVERAGE",
      currentAverage: "CURRENT:",

      classPerformance: "CLASS PERFORMANCE",
      classAverage: "Class Average:",
      studentPosition: "Student's Position:",
      passion: "Passion:",
      generalCertificate: "General Certificate:",

      performanceIndicators: "PERFORMANCE INDICATORS",
      recapitulation: "RECAPITULATION",
      firstTermAverage: "First Term Average:",

      classCouncilDecision: "CLASS COUNCIL DECISION",

passed: "PASSED:",
needsImprovement: "NEEDS IMPROVEMENT:",
failed: "FAILED:",

promoted: "PROMOTED:",
repeat: "REPEAT:",
dismissed: "DISMISSED:",
cannotTriple: "CANNOT REPEAT AGAIN:",

discipline: "DISCIPLINE",

      principalSignature: "THE PRINCIPAL",
      signatureAndStamp: "Signature and Official Stamp",
      generatedFooter:
        "Generated from the school results management system.",
    },

    gradeBands: [
      { label: "Excellent", range: "18–20" },
      { label: "Very Good", range: "16–17" },
      { label: "Good", range: "14–15" },
      { label: "Satisfactory", range: "12–13" },
      { label: "Passable", range: "10–11" },
      { label: "Poor", range: "08–09" },
      { label: "Very Weak", range: "06–07" },
      { label: "Insufficient", range: "00–05" },
    ],
  },
};

function mergeSettings(
  data?: Partial<SchoolSettings>
): SchoolSettings {
  const identity = {
    ...DEFAULT_SETTINGS.identity,
    ...data?.identity,
  };

  const branding = {
    ...DEFAULT_SETTINGS.branding,
    ...data?.branding,
  };

  const report = {
    ...DEFAULT_SETTINGS.report,
    ...data?.report,
  };

  const savedBands = data?.report?.gradeBands;

  return {
    identity: {
      ...identity,
      schoolName:
        identity.schoolName || DEFAULT_SETTINGS.identity.schoolName,
      abbreviation:
        identity.abbreviation || DEFAULT_SETTINGS.identity.abbreviation,
      town: identity.town || DEFAULT_SETTINGS.identity.town,
      region: identity.region || DEFAULT_SETTINGS.identity.region,
      country: identity.country || DEFAULT_SETTINGS.identity.country,
    },

    branding,

    report: {
      ...report,

      title: report.title || DEFAULT_SETTINGS.report.title,
      authorityHeaderLeft:
        report.authorityHeaderLeft ||
        DEFAULT_SETTINGS.report.authorityHeaderLeft,
      authorityHeaderRight:
        report.authorityHeaderRight ||
        DEFAULT_SETTINGS.report.authorityHeaderRight,
      principalTitle:
        report.principalTitle ||
        DEFAULT_SETTINGS.report.principalTitle,

      labels: {
        ...DEFAULT_SETTINGS.report.labels,
        ...data?.report?.labels,
      },

      gradeBands:
        Array.isArray(savedBands) && savedBands.length > 0
          ? savedBands
          : DEFAULT_SETTINGS.report.gradeBands,
    },
  };
}

const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  suggestions,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  suggestions?: string[];
}) {
  const listId = `suggestions-${label.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}

      <input
        type={type}
        list={suggestions ? listId : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />

      {suggestions && (
        <datalist id={listId}>
         {Array.from(new Set(suggestions)).map((item) => (
  <option key={item} value={item} />
))}
        </datalist>
      )}
    </label>
  );
}

async function compressLogo(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please select an image file.");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Please choose an image smaller than 5 MB.");
  }

  const image = await createImageBitmap(file);

  const scale = Math.min(
    1,
    512 / Math.max(image.width, image.height)
  );

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  const context = canvas.getContext("2d");

  if (!context) {
    image.close();
    throw new Error("Could not process this image.");
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  image.close();

  let blob: Blob | null = null;

  for (const quality of [0.82, 0.68, 0.52, 0.38]) {
    blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality)
    );

    if (blob && blob.size <= 120 * 1024) break;
  }

  if (!blob || blob.size > 120 * 1024) {
    throw new Error(
      "The logo is still too large. Please choose a simpler image."
    );
  }

  return await new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () =>
      reject(new Error("Could not read the image."));

    reader.readAsDataURL(blob);
  });
}

const LABEL_GROUPS: {
  title: string;
  fields: { key: keyof ReportLabels; label: string; suggestions?: string[] }[];
}[] = [
  {
    title: "Student information",
    fields: [
      { key: "studentName", label: "Student name label", suggestions: ["Name:", "Nom:"] },
      { key: "academicYear", label: "Academic year label", suggestions: ["Academic Year:", "Année scolaire:"] },
      { key: "speciality", label: "Speciality label", suggestions: ["Speciality:", "Spécialité:"] },
      { key: "stream", label: "Stream label", suggestions: ["Stream:", "Série:"] },
      { key: "dateOfBirth", label: "Date of birth label", suggestions: ["Date of Birth:", "Date de naissance:"] },
      { key: "class", label: "Class label", suggestions: ["Class:", "Classe:"] },
      { key: "admissionNumber", label: "Admission number label", suggestions: ["Admission No:", "Matricule:"] },
      { key: "repeater", label: "Repeater label", suggestions: ["Repeater (Y/N):", "Redoublant (O/N):"] },
      { key: "studentNumber", label: "Student number label", suggestions: ["Student's No:", "N° de l'élève:"] },
      { key: "department", label: "Department label", suggestions: ["Department:", "Département:"] },
    ],
  },
  {
    title: "Subject table",
    fields: [
      { key: "subject", label: "Subject heading", suggestions: ["SUBJECT", "MATIÈRE"] },
      { key: "teacher", label: "Teacher heading", suggestions: ["TEACHER", "ENSEIGNANT"] },
      { key: "firstSequence", label: "First sequence heading", suggestions: ["1st Seq", "1ère Séquence"] },
      { key: "secondSequence", label: "Second sequence heading", suggestions: ["2nd Seq", "2ème Séquence"] },
      { key: "average", label: "Average heading", suggestions: ["AVRG", "MOYENNE"] },
      { key: "coefficient", label: "Coefficient heading", suggestions: ["COEFF.", "COEFFICIENT"] },
      { key: "totalMarks", label: "Total marks heading", suggestions: ["TOTAL MARKS", "TOTAL DES POINTS"] },
      { key: "gradeRemarks", label: "Grade / remarks heading", suggestions: ["GRADE / REMARKS", "APPRÉCIATION"] },
      { key: "categoryTotalAverage", label: "Category total wording", suggestions: ["TOTAL / AVERAGE", "TOTAL / MOYENNE"] },
      { key: "grandAverage", label: "Grand average wording", suggestions: ["GRAND AVERAGE", "MOYENNE GÉNÉRALE"] },
      { key: "currentAverage", label: "Current average wording", suggestions: ["CURRENT:", "ACTUELLE:"] },
    ],
  },
  {
    title: "Report status and messages",
    fields: [
      { key: "finalized", label: "Finalized status", suggestions: ["FINALIZED RESULTS", "RÉSULTATS DÉFINITIFS"] },
      { key: "previewNotFinalized", label: "Preview status", suggestions: ["PREVIEW — NOT FINALIZED", "APERÇU — NON DÉFINITIF"] },
      { key: "incompleteReport", label: "Incomplete report status", suggestions: ["INCOMPLETE REPORT", "BULLETIN INCOMPLET"] },
      { key: "resultsAvailable", label: "Results available status", suggestions: ["RESULTS AVAILABLE", "RÉSULTATS DISPONIBLES"] },
      { key: "selectedTerm", label: "Selected term label", suggestions: ["Selected Term:", "Trimestre sélectionné:"] },
      { key: "incompleteWarning", label: "Incomplete results warning" },
      { key: "noAssignmentsMessage", label: "No subject assignments message" },
    ],
  },
  {
    title: "Class performance",
    fields: [
      { key: "classPerformance", label: "Class performance heading", suggestions: ["CLASS PERFORMANCE", "PERFORMANCE DE LA CLASSE"] },
      { key: "classAverage", label: "Class average label", suggestions: ["Class Average:", "Moyenne de la classe:"] },
      { key: "studentPosition", label: "Student position label", suggestions: ["Student's Position:", "Rang de l'élève:"] },
      { key: "passion", label: "Passion label" },
      { key: "generalCertificate", label: "General certificate label" },
      { key: "performanceIndicators", label: "Performance indicators heading", suggestions: ["PERFORMANCE INDICATORS", "INDICATEURS DE PERFORMANCE"] },
    ],
  },
  {
  title: "Recapitulation and class council",
  fields: [
    {
      key: "recapitulation",
      label: "Recapitulation heading",
      suggestions: ["RECAPITULATION", "RÉCAPITULATIF"],
    },
    {
      key: "firstTermAverage",
      label: "First term average label",
      suggestions: [
        "First Term Average:",
        "Moyenne du premier trimestre:",
      ],
    },
    {
      key: "classCouncilDecision",
      label: "Class council heading",
      suggestions: [
        "CLASS COUNCIL DECISION",
        "DÉCISION DU CONSEIL DE CLASSE",
      ],
    },
    {
      key: "promoted",
      label: "End-of-year promotion label",
      suggestions: ["PROMOTED:", "ADMIS(E):"],
    },
    {
      key: "repeat",
      label: "End-of-year repetition label",
      suggestions: ["REPEAT:", "REDOUBLE:"],
    },
    {
      key: "dismissed",
      label: "End-of-year dismissal label",
      suggestions: ["DISMISSED:", "EXCLU(E):"],
    },
    {
      key: "cannotTriple",
      label: "End-of-year cannot-repeat-again label",
      suggestions: ["CANNOT REPEAT AGAIN:", "NE PEUT PLUS REDOUBLER:"],
    },
    {
  key: "passed",
  label: "First/second term: Passed",
  suggestions: ["PASSED:", "ADMIS(E):"],
},
{
  key: "needsImprovement",
  label: "First/second term: Needs improvement",
  suggestions: ["NEEDS IMPROVEMENT:", "DOIT S'AMÉLIORER:"],
},
{
  key: "failed",
  label: "First/second term: Failed",
  suggestions: ["FAILED:", "ÉCHOUÉ(E):"],
},
    {
      key: "discipline",
      label: "Discipline heading",
      suggestions: ["DISCIPLINE"],
    },
  ],
},
  {
    title: "Principal and footer",
    fields: [
      { key: "principalSignature", label: "Principal signature wording", suggestions: ["THE PRINCIPAL", "LE PROVISEUR", "THE HEADTEACHER", "LE DIRECTEUR"] },
      { key: "signatureAndStamp", label: "Signature and stamp wording", suggestions: ["Signature and Official Stamp", "Signature et cachet officiel"] },
      { key: "generatedFooter", label: "Generated report footer" },
    ],
  },
];

export default function SchoolSettingsPage() {
  const [schoolId, setSchoolId] = useState("");
  const [settings, setSettings] =
    useState<SchoolSettings>(DEFAULT_SETTINGS);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let unsubscribeSettings: (() => void) | undefined;
    let alive = true;

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

        const currentSchoolId = String(data.schoolId);

        if (!alive) return;

        setSchoolId(currentSchoolId);

        unsubscribeSettings = onSnapshot(
          doc(db, "schools", currentSchoolId, "settings", "general"),
          (snapshot) => {
            if (!alive) return;

            setSettings(
              snapshot.exists()
                ? mergeSettings(
                    snapshot.data() as Partial<SchoolSettings>
                  )
                : DEFAULT_SETTINGS
            );

            setLoading(false);
          },
          () => {
            setError(
              "Could not load settings. Check your connection or access."
            );
            setLoading(false);
          }
        );
      } catch {
        setError("Could not verify your administrator account.");
        setLoading(false);
      }
    });

    return () => {
      alive = false;
      unsubscribeAuth();
      unsubscribeSettings?.();
    };
  }, []);

  function update(
    section: "identity" | "branding" | "report",
    field: string,
    value: string | boolean
  ) {
    setSettings((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }));
  }

  function updateLabel(key: keyof ReportLabels, value: string) {
    setSettings((current) => ({
      ...current,
      report: {
        ...current.report,
        labels: {
          ...current.report.labels,
          [key]: value,
        },
      },
    }));
  }

  function updateGradeBand(
    index: number,
    field: keyof GradeBand,
    value: string
  ) {
    setSettings((current) => ({
      ...current,
      report: {
        ...current.report,
        gradeBands: current.report.gradeBands.map((band, i) =>
          i === index ? { ...band, [field]: value } : band
        ),
      },
    }));
  }

  function addGradeBand() {
    setSettings((current) => ({
      ...current,
      report: {
        ...current.report,
        gradeBands: [
          ...current.report.gradeBands,
          { label: "", range: "" },
        ],
      },
    }));
  }

  function removeGradeBand(index: number) {
    setSettings((current) => ({
      ...current,
      report: {
        ...current.report,
        gradeBands: current.report.gradeBands.filter(
          (_, i) => i !== index
        ),
      },
    }));
  }

  async function handleLogo(file?: File) {
    if (!file) return;

    setUploading(true);
    setError("");
    setMessage("");

    try {
      const logoData = await compressLogo(file);

      update("branding", "logoUrl", logoData);

      setMessage("Logo prepared. Save your settings to keep it.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Logo upload failed."
      );
    } finally {
      setUploading(false);
    }
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!schoolId || saving || uploading) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await setDoc(
        doc(db, "schools", schoolId, "settings", "general"),
        {
          ...settings,
          updatedAt: serverTimestamp(),
          updatedBy: auth.currentUser?.uid || "",
        },
        { merge: true }
      );

      setMessage("School settings saved successfully.");
    } catch {
      setError(
        "Settings could not be saved. Check your connection and Firestore permissions."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="p-8 text-center text-slate-700">
        Loading your school settings...
      </main>
    );
  }

  const report = settings.report;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-7 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-6">

        <header className="rounded-2xl bg-[#142b55] p-6 text-white">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-200">
            School administration
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            School Settings
          </h1>

          <p className="mt-2 text-sm text-blue-100">
            Configure your student&apos;s identity and report card.
            Suggested GTHS wording is provided, and you can edit
            any wording to suit your school.
          </p>
        </header>

        {error && (
          <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {message && (
          <div role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
            {message}
          </div>
        )}

        <form onSubmit={saveSettings} className="space-y-6">

          {/* SCHOOL DETAILS */}

          <section className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                1. School details
              </h2>
              <p className="text-sm text-slate-500">
                These details identify your school on its report cards.
              </p>
            </div>

            <Field
              label="Official school name"
              value={settings.identity.schoolName}
              onChange={(v) => update("identity", "schoolName", v)}
              placeholder="Enter the full official school name"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="School abbreviation"
                value={settings.identity.abbreviation}
                onChange={(v) => update("identity", "abbreviation", v)}
              />

              <Field
                label="Town / city"
                value={settings.identity.town}
                onChange={(v) => update("identity", "town", v)}
              />

              <Field
                label="Region"
                value={settings.identity.region}
                onChange={(v) => update("identity", "region", v)}
              />

              <Field
                label="Country"
                value={settings.identity.country}
                onChange={(v) => update("identity", "country", v)}
              />

              <Field
                label="Postal / physical address"
                value={settings.identity.address}
                onChange={(v) => update("identity", "address", v)}
                placeholder="Optional"
              />

              <Field
                label="Official telephone"
                value={settings.identity.phone}
                onChange={(v) => update("identity", "phone", v)}
                placeholder="Optional"
              />

              <Field
                label="Official email"
                type="email"
                value={settings.identity.email}
                onChange={(v) => update("identity", "email", v)}
                placeholder="Optional"
              />

              <Field
                label="School website"
                value={settings.identity.website}
                onChange={(v) => update("identity", "website", v)}
                placeholder="Optional"
              />
            </div>

            <p className="rounded-xl bg-blue-50 p-3 text-xs text-blue-800">
              Contact information is optional. You can save settings
              without a telephone number, email, website or address.
            </p>
          </section>

          {/* LOGO AND MOTTO */}

          <section className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                2. School logo and motto
              </h2>
              <p className="text-sm text-slate-500">
                Choose a logo from your phone or computer.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border bg-slate-50">
                {settings.branding.logoUrl ? (
                  <img
                    src={settings.branding.logoUrl}
                    alt="School logo"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="px-2 text-center text-xs text-slate-400">
                    No logo selected
                  </span>
                )}
              </div>

              <div>
                <label className="inline-flex cursor-pointer rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white hover:bg-blue-800">
                  {uploading ? "Preparing logo..." : "Choose logo"}

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(event) => {
                      void handleLogo(event.target.files?.[0]);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>

                {settings.branding.logoUrl && (
                  <button
                    type="button"
                    onClick={() => update("branding", "logoUrl", "")}
                    className="ml-3 text-sm font-semibold text-red-600"
                  >
                    Remove logo
                  </button>
                )}

                <p className="mt-2 text-xs text-slate-500">
                  Maximum original image size: 5 MB.
                  Compressed image limit: 120 KB.
                </p>
              </div>
            </div>

            <Field
              label="School motto (optional)"
              value={settings.branding.motto}
              onChange={(v) => update("branding", "motto", v)}
              placeholder="Enter your school's motto"
            />
          </section>

          {/* REPORT HEADINGS */}

          <section className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                3. Report card headings
              </h2>
              <p className="text-sm text-slate-500">
                Select a suggested heading or enter your own wording.
              </p>
            </div>

            <Field
              label="Left official heading (French)"
              value={report.authorityHeaderLeft}
              onChange={(v) => update("report", "authorityHeaderLeft", v)}
              suggestions={[
                "MINISTÈRE DE L'ENSEIGNEMENT SECONDAIRE",
                "MINISTÈRE DE L'ÉDUCATION DE BASE",
              ]}
            />

            <Field
              label="Right official heading (English)"
              value={report.authorityHeaderRight}
              onChange={(v) => update("report", "authorityHeaderRight", v)}
              suggestions={[
                "MINISTRY OF SECONDARY EDUCATION",
                "MINISTRY OF BASIC EDUCATION",
              ]}
            />

            <Field
              label="Report title"
              value={report.title}
              onChange={(v) => update("report", "title", v)}
              suggestions={[
                "PROGRESS RECORD",
                "REPORT CARD",
                "BULLETIN DE NOTES",
                "RELEVÉ DE NOTES",
              ]}
            />

            <Field
              label="Principal's signature title"
              value={report.principalTitle}
              onChange={(v) => update("report", "principalTitle", v)}
              suggestions={[
                "THE PRINCIPAL",
                "LE PROVISEUR",
                "THE HEADTEACHER",
                "LE DIRECTEUR",
              ]}
            />

            <Field
              label="Additional report footer (optional)"
              value={report.footerText}
              onChange={(v) => update("report", "footerText", v)}
              placeholder="Optional additional note"
            />
          </section>

          {/* STUDENT DETAILS */}

          <section className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                4. Student details on report cards
              </h2>
              <p className="text-sm text-slate-500">
                Choose which optional student details should appear.
              </p>
            </div>

            {([
              ["showAdmissionNumber", "Admission number"],
              ["showSpeciality", "Speciality / trade"],
              ["showDepartment", "Department"],
              ["showStream", "Stream / section"],
              ["showDateOfBirth", "Date of birth"],
            ] as const).map(([key, label]) => (
              <label
                key={key}
                className="flex items-center gap-3 text-sm text-slate-700"
              >
                <input
                  type="checkbox"
                  checked={report[key]}
                  onChange={(event) =>
                    update("report", key, event.target.checked)
                  }
                  className="h-4 w-4 accent-blue-700"
                />
                {label}
              </label>
            ))}
          </section>

          {/* ALL REPORT LABELS */}

          <section className="space-y-5 rounded-2xl border bg-white p-5 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                5. Report card wording and labels
              </h2>
              <p className="text-sm text-slate-500">
                Every heading and label below can be edited.
                Leave a field empty to use its standard default.
              </p>
            </div>

            {LABEL_GROUPS.map((group) => (
              <div key={group.title} className="space-y-4">
                <div className="border-b pb-2">
                  <h3 className="font-bold text-slate-800">
                    {group.title}
                  </h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {group.fields.map((field) => (
                    <Field
                      key={field.key}
                      label={field.label}
                      value={report.labels[field.key]}
                      onChange={(v) => updateLabel(field.key, v)}
                      suggestions={field.suggestions}
                      placeholder="Leave empty to use default"
                    />
                  ))}
                </div>
              </div>
            ))}
          </section>

          {/* GRADE BANDS */}

          <section className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                6. Performance indicators and grade descriptions
              </h2>
              <p className="text-sm text-slate-500">
                Edit the descriptions and mark ranges displayed on
                the report card.
              </p>
            </div>

            {report.gradeBands.map((band, index) => (
              <div
                key={index}
                className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]"
              >
                <Field
                  label={`Grade description ${index + 1}`}
                  value={band.label}
                  onChange={(v) => updateGradeBand(index, "label", v)}
                  placeholder="e.g. Excellent"
                />

                <Field
                  label="Mark range"
                  value={band.range}
                  onChange={(v) => updateGradeBand(index, "range", v)}
                  placeholder="e.g. 18–20"
                />

                <button
                  type="button"
                  onClick={() => removeGradeBand(index)}
                  className="rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addGradeBand}
              className="rounded-xl border border-blue-200 px-4 py-3 text-sm font-bold text-blue-700 hover:bg-blue-50"
            >
              + Add grade description
            </button>

            <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
              These are the displayed grade descriptions and ranges.
              The report calculation will be connected to the configured
              grading rules when we update the report page.
            </p>
          </section>

          {/* SAVE */}

          <div className="sticky bottom-3 rounded-2xl border bg-white/95 p-3 shadow-xl backdrop-blur">
            <button
              type="submit"
              disabled={saving || uploading}
              className="w-full rounded-xl bg-blue-700 px-6 py-3 font-bold text-white disabled:opacity-60"
            >
              {uploading
                ? "Preparing logo..."
                : saving
                  ? "Saving settings..."
                  : "Save school settings"}
            </button>

            <p className="mt-2 text-center text-xs text-slate-500">
              Optional information can be completed later.
              Your settings are saved for this school.
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
