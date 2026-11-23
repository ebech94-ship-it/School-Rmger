
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function RegisterSchoolPage() {
const router = useRouter();

const [accessStatus, setAccessStatus] = useState<
  "checking" | "allowed" | "denied"
>("checking");

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (!user) {
      router.replace("/login?next=/register-school");
      return;
    }

    try {
      const token = await user.getIdToken();

      const response = await fetch("/api/super-admin/check", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      setAccessStatus(
        response.ok && data.authorized === true ? "allowed" : "denied"
      );
    } catch {
      setAccessStatus("denied");
    }
  });

  return () => unsubscribe();
}, [router]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    schoolId: string;
    schoolName: string;
    invitationUrl: string;
    whatsappUrl: string;
    email: string;
  } | null>(null);

async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();

  const form = event.currentTarget;

  setLoading(true);
    setError("");
    setResult(null);

    try {
      const user = auth.currentUser;

      if (!user) {
        throw new Error("Please sign in with your Super Admin account first.");
      }

      const idToken = await user.getIdToken();
      const formData = new FormData(form);

      const body = Object.fromEntries(formData.entries());

      const response = await fetch("/api/schools/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "School registration failed.");
      }

      setResult(data);
     form.reset();
     
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

if (accessStatus === "checking") {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
      Verifying administrator access...
    </main>
  );
}

if (accessStatus === "denied") {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 text-center text-white">
      <h1 className="text-2xl font-bold">Access Restricted</h1>
      <p className="mt-3 text-sm text-slate-300">
        You are not authorised to register schools.
      </p>
      <Link href="/" className="mt-6 text-amber-400">
        Return to homepage
      </Link>
    </main>
  );
}

  return (
    <main className="min-h-screen bg-[#f4f6fa] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-semibold text-slate-500 hover:text-blue-600">
          ← Back to home
        </Link>

        <div className="mt-7 rounded-2xl bg-[#101e37] p-7 text-white sm:p-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 text-xl font-black">S</div>
          <p className="mt-7 text-xs font-bold uppercase tracking-[3px] text-blue-300">Super Admin · School onboarding</p>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">Bring your school on board.</h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
            Register an institution and generate a secure invitation for its Technical Administrator.
          </p>
        </div>

        {result ? (
          <section className="mt-6 space-y-5 rounded-2xl border border-green-200 bg-white p-6 shadow-sm sm:p-9">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700">
                ✓
              </div>
              <h2 className="mt-4 text-2xl font-black text-slate-900">School registered!</h2>
              <p className="mt-2 text-sm text-slate-600">
                {result.schoolName} has been saved to Firestore.
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-500">Technical Administrator</p>
              <p className="mt-1 font-semibold text-slate-900">{result.email}</p>
              <p className="mt-3 break-all text-xs text-slate-500">{result.invitationUrl}</p>
            </div>

            <a
              href={result.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-xl bg-green-600 py-4 text-center text-sm font-bold text-white hover:bg-green-700"
            >
              Send invitation via WhatsApp →
            </a>

            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(result.invitationUrl)}
              className="w-full rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Copy invitation link
            </button>

            <button
              type="button"
              onClick={() => setResult(null)}
              className="w-full py-2 text-sm font-semibold text-blue-600"
            >
              Register another school
            </button>
          </section>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-9"
          >
            <section>
              <h2 className="text-lg font-bold text-[#14233d]">School information</h2>
              <p className="mt-1 text-sm text-slate-500">Basic details about the institution.</p>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <Field name="schoolName" label="Official school name" placeholder="e.g. Government Technical High School" required />
                <Field name="abbreviation" label="School abbreviation" placeholder="e.g. GTHS" />
                <Field name="country" label="Country" placeholder="Cameroon" required />
                <Field name="region" label="Region / State" placeholder="e.g. North-West" required />
                <Field name="town" label="Town / City" placeholder="e.g. Kumbo" required />
                <Field name="schoolEmail" label="School email" placeholder="school@example.com" type="email" required />
                <Field name="phone" label="Phone number" placeholder="+237 ..." type="tel" required />
                <Field name="website" label="School website (optional)" placeholder="https://..." />
              </div>
            </section>

            <div className="border-t border-slate-100" />

            <section>
              <h2 className="text-lg font-bold text-[#14233d]">Institution details</h2>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <SelectField
                  name="schoolType"
                  label="School type"
                  options={["Government", "Private", "Confessional", "Other"]}
                />
                <SelectField
                  name="educationLevel"
                  label="Education level"
                  options={["Primary", "Secondary", "Technical / Vocational", "Higher Education", "Multiple levels"]}
                />
              </div>
            </section>

            <div className="border-t border-slate-100" />

            <section>
              <h2 className="text-lg font-bold text-[#14233d]">Technical Administrator</h2>
              <p className="mt-1 text-sm text-slate-500">
                This person will receive the invitation and manage the school&apos;s workspace.
              </p>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <Field name="contactName" label="Full name" placeholder="Administrator's name" required />
                <Field name="contactPosition" label="Position / Title" placeholder="e.g. Technical Administrator" required />
                <Field name="contactEmail" label="Account email address" placeholder="admin@school.com" type="email" required />
                <Field name="contactPhone" label="WhatsApp phone number" placeholder="+237 ..." type="tel" required />
              </div>
            </section>

            {error && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="rounded-xl bg-blue-50 p-4 text-sm leading-6 text-blue-900">
              Registering creates the school&apos;s Firestore record and a secure, single-use invitation for its Technical Administrator. The invitation expires after seven days.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Registering school..." : "Register school and generate invitation →"}
            </button>
          </form>
        )}

        <p className="py-7 text-center text-xs text-slate-400">
          © 2026 ScholarFlow · School Management System
        </p>
      </div>
    </main>
  );
}

function Field({
  name,
  label,
  placeholder,
  type = "text",
  required = false,
}: {
  name: string;
  label: string;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
      />
    </div>
  );
}

function SelectField({
  name,
  label,
  options,
}: {
  name: string;
  label: string;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
      <select
        name={name}
        required
        defaultValue=""
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-blue-500"
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}