
"use client";

import Link from "next/link";

export default function RegisterSchoolPage() {
  return (
    <main className="min-h-screen bg-[#f4f6fa] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-semibold text-slate-500 hover:text-blue-600">
          ← Back to home
        </Link>

        <div className="mt-7 rounded-2xl bg-[#101e37] p-7 text-white sm:p-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 text-xl font-black">S</div>
          <p className="mt-7 text-xs font-bold uppercase tracking-[3px] text-blue-300">School onboarding</p>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">Bring your school on board.</h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
            Tell us about your institution. Submit your details to request access to the school management platform.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            alert("School registration will be connected to the database in the next development stage.");
          }}
          className="mt-6 space-y-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-9"
        >
          <section>
            <h2 className="text-lg font-bold text-[#14233d]">School information</h2>
            <p className="mt-1 text-sm text-slate-500">Basic details about your institution.</p>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field label="Official school name" placeholder="e.g. Government Technical High School" required />
              <Field label="School abbreviation" placeholder="e.g. GTHS" />
              <Field label="Country" placeholder="Cameroon" required />
              <Field label="Region / State" placeholder="e.g. North-West" required />
              <Field label="Town / City" placeholder="e.g. Kumbo" required />
              <Field label="School email" placeholder="school@example.com" type="email" required />
              <Field label="Phone number" placeholder="+237 ..." type="tel" required />
              <Field label="School website (optional)" placeholder="https://..." />
            </div>
          </section>

          <div className="border-t border-slate-100" />

          <section>
            <h2 className="text-lg font-bold text-[#14233d]">Institution details</h2>
            <p className="mt-1 text-sm text-slate-500">Help us understand your school.</p>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">School type</label>
                <select required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-blue-500">
                  <option value="">Select school type</option>
                  <option>Government</option>
                  <option>Private</option>
                  <option>Confessional</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Education level</label>
                <select required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-blue-500">
                  <option value="">Select education level</option>
                  <option>Primary</option>
                  <option>Secondary</option>
                  <option>Technical / Vocational</option>
                  <option>Higher Education</option>
                  <option>Multiple levels</option>
                </select>
              </div>
            </div>
          </section>

          <div className="border-t border-slate-100" />

          <section>
            <h2 className="text-lg font-bold text-[#14233d]">Contact person</h2>
            <p className="mt-1 text-sm text-slate-500">Who should we contact about this request?</p>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field label="Full name" placeholder="Contact person's name" required />
              <Field label="Position / Title" placeholder="e.g. Principal" required />
              <Field label="Contact email" placeholder="contact@example.com" type="email" required />
              <Field label="Contact phone" placeholder="+237 ..." type="tel" required />
            </div>
          </section>

          <div className="rounded-xl bg-blue-50 p-4 text-sm leading-6 text-blue-900">
            Submitting this form is a request for school registration. It does not automatically create an account or grant administrator access.
          </div>

          <button type="submit" className="w-full rounded-xl bg-blue-600 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700">
            Submit school registration request →
          </button>

          <p className="text-center text-sm text-slate-500">
            Already registered? <Link href="/login" className="font-bold text-blue-600">Sign in</Link>
          </p>
        </form>

        <p className="py-7 text-center text-xs text-slate-400">© 2026 ScholarFlow · School Management System</p>
      </div>
    </main>
  );
}

function Field({
  label,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
      />
    </div>
  );
}
