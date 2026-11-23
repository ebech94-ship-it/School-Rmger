
"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function SchoolInvitationForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{
    email: string;
    schoolName: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("This invitation link is invalid or incomplete.");
      return;
    }

    if (password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/schools/accept-invitation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Account activation failed.");
      }

      setSuccess({
        email: data.email,
        schoolName: data.schoolName,
      });

      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to activate your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-lg rounded-2xl border border-emerald-200 bg-white p-8 shadow-xl">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">
          ✓
        </div>

        <h1 className="text-2xl font-black text-slate-900">
          Account activated!
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Your Technical Administrator account for{" "}
          <strong>{success.schoolName}</strong> has been successfully created.
        </p>

        <div className="mt-6 rounded-xl bg-slate-50 p-5">
          <h2 className="mb-3 text-sm font-bold text-slate-800">
            Your login credentials
          </h2>

          <p className="text-xs font-medium text-slate-500">LOGIN EMAIL</p>
          <p className="mt-1 break-all font-semibold text-slate-900">
            {success.email}
          </p>

          <p className="mt-4 text-xs font-medium text-slate-500">
            PASSWORD
          </p>
          <p className="mt-1 text-sm text-slate-700">
            The password you created during activation.
          </p>
        </div>

        <p className="mt-4 text-xs leading-5 text-slate-500">
          Keep your login email and password safe. You will use these details
          whenever you sign in.
        </p>

        <Link
          href="/login"
          className="mt-6 block w-full rounded-xl bg-slate-900 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-slate-700"
        >
          Continue to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
         GODSPEED SCHOLAR
        </p>

        <h1 className="mt-3 text-2xl font-black text-slate-900">
          Activate your administrator account
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Welcome! Create a secure password to activate your school&apos;s
          Technical Administrator account.
        </p>
      </div>

      {!token && (
        <div className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          This invitation link is invalid or incomplete. Please request a new
          invitation from your platform administrator.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Create password
          </label>

          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Confirm password
          </label>

          <input
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Enter your password again"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !token}
          className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Activating account..." : "Activate Account"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs leading-5 text-slate-500">
        Already activated your account?{" "}
        <Link href="/login" className="font-bold text-amber-700 hover:underline">
          Sign in here
        </Link>
      </p>
    </div>
  );
}

export default function AcceptSchoolInvitationPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      <Suspense
        fallback={
          <div className="text-sm font-medium text-slate-500">
            Loading invitation...
          </div>
        }
      >
        <SchoolInvitationForm />
      </Suspense>
    </main>
  );
}
