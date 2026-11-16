
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function AcceptInvitationPage() {
 
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

 
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token =
  new URLSearchParams(window.location.search).get("token") || "";
    setError("");

    if (!token) {
      setError("Invitation token is missing. Please use the complete invitation link.");
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
      const response = await fetch("/api/teachers/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to create your account.");
      }

      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#091321] px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-7 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[#d6b36d] text-xl font-black text-[#091321]">
            GS
          </div>
          <p className="mt-4 text-xs font-bold uppercase tracking-[3px] text-[#d6b36d]">
            GodSpeed Technologies
          </p>
          <h1 className="mt-2 text-3xl font-black text-white">
            GS SCHOOL
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Teacher account activation
          </p>
        </div>

        <div className="rounded-2xl bg-white p-7 shadow-xl sm:p-9">
          {success ? (
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700">
                ✓
              </div>
              <h2 className="mt-5 text-2xl font-bold text-slate-900">
                Account created
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Your teacher account is ready. You can now sign in using your
                registered email address and the password you created.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex w-full justify-center rounded-xl bg-[#101e37] px-5 py-4 text-sm font-bold text-white hover:bg-slate-800"
              >
                Go to sign in
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-slate-900">
                Create your password
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Complete your account setup using the invitation provided by
                your school administrator.
              </p>

              <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    New password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Confirm password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Enter your password again"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[#101e37] py-4 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Creating account..." : "Activate teacher account"}
                </button>
              </form>
                </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Powered by GodSpeed Technologies
        </p>
      </div>
    </main>
  );
}
