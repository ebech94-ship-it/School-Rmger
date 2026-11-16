
"use client";

import { useState } from "react";
import Link from "next/link";

export default function SetupAdminPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f6fa] px-4 py-10">
      <div className="w-full max-w-xl">
        <Link href="/" className="text-sm font-semibold text-slate-500 hover:text-blue-600">
          ← Back to home
        </Link>

        <div className="mt-7 rounded-2xl bg-[#101e37] p-7 text-white sm:p-9">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 text-xl font-black">S</div>
          <p className="mt-6 text-xs font-bold uppercase tracking-[3px] text-blue-300">Initial school setup</p>
          <h1 className="mt-3 text-3xl font-black">Create administrator account.</h1>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            Establish the first Technical Administrator responsible for managing your school&apos;s platform.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            alert("Administrator setup will be enabled after school approval and secure Firebase integration.");
          }}
          className="mt-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9"
        >
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">School registration code</label>
            <input required placeholder="Enter your approved school code" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-blue-500" />
            <p className="mt-2 text-xs text-slate-400">Provided after your school&apos;s registration is approved.</p>
          </div>

          <div className="border-t border-slate-100" />

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Full name</label>
            <input required placeholder="Administrator's full name" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-blue-500" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Official email address</label>
            <input required type="email" placeholder="administrator@school.com" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-blue-500" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Phone number</label>
            <input required type="tel" placeholder="+237 ..." className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-blue-500" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Create password</label>
            <div className="relative">
              <input required minLength={8} type={showPassword ? "text" : "password"} placeholder="At least 8 characters" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 pr-16 text-sm outline-none focus:border-blue-500" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-blue-600">
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Confirm password</label>
            <input required minLength={8} type="password" placeholder="Enter password again" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-blue-500" />
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-900">
            Security notice: Only an approved school with a valid, unused setup code can establish its first Technical Administrator. This page is currently a visual prototype.
          </div>

          <button type="submit" className="w-full rounded-xl bg-blue-600 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700">
            Establish administrator account →
          </button>

          <p className="text-center text-sm text-slate-500">
            Already have an account? <Link href="/login" className="font-bold text-blue-600">Sign in</Link>
          </p>
        </form>

        <p className="py-6 text-center text-xs text-slate-400">ScholarFlow · Secure school administration</p>
      </div>
    </main>
  );
}
