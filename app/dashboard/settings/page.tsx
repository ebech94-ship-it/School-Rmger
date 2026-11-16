
"use client";

import { useState } from "react";

export default function SchoolSettingsPage() {
  const [schoolName, setSchoolName] = useState("Government Technical High School");
  const [abbreviation, setAbbreviation] = useState("GTHS");
  const [town, setTown] = useState("Kumbo");
  const [region, setRegion] = useState("North-West");
  const [country, setCountry] = useState("Cameroon");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [passMark, setPassMark] = useState("20");
  const [maximumMark, setMaximumMark] = useState("40");
  const [message, setMessage] = useState("");

  function saveSettings(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("Settings updated in this preview only. Firebase saving will be connected later.");
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <p className="text-sm font-semibold text-blue-700">ADMINISTRATION / CONFIGURATION</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">School Settings</h1>
          <p className="mt-2 text-sm text-slate-500">Manage your school&apos;s identity and academic grading preferences.</p>
        </div>

        <form onSubmit={saveSettings} className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-900">School identity</h2>
              <p className="mt-1 text-sm text-slate-500">These details appear on official school reports.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">Official school name</label>
                <input value={schoolName} onChange={e => setSchoolName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm" required />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Abbreviation</label>
                <input value={abbreviation} onChange={e => setAbbreviation(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm" required />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Town / City</label>
                <input value={town} onChange={e => setTown(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Region</label>
                <input value={region} onChange={e => setRegion(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Country</label>
                <input value={country} onChange={e => setCountry(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Official email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="school@example.com" className="w-full rounded-xl border border-slate-300 p-3 text-sm" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Telephone</label>
                <input value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="+237..." className="w-full rounded-xl border border-slate-300 p-3 text-sm" />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="text-lg font-bold text-slate-900">Grading configuration</h2>
            <p className="mt-1 text-sm text-slate-500">Set the standard mark scale used for sequence assessments.</p>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Maximum standard mark</label>
                <input type="number" min="1" value={maximumMark} onChange={e => setMaximumMark(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm" />
                <p className="mt-1 text-xs text-slate-400">Current standard: out of 40</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Pass mark</label>
                <input type="number" min="0" value={passMark} onChange={e => setPassMark(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm" />
                <p className="mt-1 text-xs text-slate-400">Current illustrative threshold: 20/40</p>
              </div>
            </div>

            <div className="mt-5 rounded-xl bg-blue-50 p-4">
              <p className="text-sm font-semibold text-blue-900">Mark conversion</p>
              <p className="mt-1 text-sm text-blue-800">
                Marks entered on another scale can be converted to the school&apos;s standard scale of /{maximumMark}.
                For example, 35/50 converts to 28/40 when the standard is 40.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="text-lg font-bold text-slate-900">Academic report preferences</h2>
            <p className="mt-1 text-sm text-slate-500">The initial report template uses these subject groupings.</p>

            <div className="mt-4 space-y-3">
              {["General Education", "Professional Education", "Other Subjects"].map((category, index) => (
                <div key={category} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-blue-700">{index + 1}</span>
                  <span className="text-sm font-medium text-slate-800">{category}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">Subject coefficients are managed separately in Subject Management.</p>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button type="submit" className="rounded-xl bg-blue-700 px-7 py-3 font-semibold text-white hover:bg-blue-800">
              Save school settings
            </button>
          </div>

          {message && <p className="rounded-xl bg-blue-50 p-4 text-sm text-blue-800">{message}</p>}
        </form>
      </div>
    </main>
  );
}
