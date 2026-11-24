
import Link from "next/link";
import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  metadataBase: new URL("https://gs-school.vercel.app"),

  title: "GS Scholar | Smart School Management",

  description:
    "Simplify student records, academic results and school administration with GS Scholar by GodSpeed Technologies.",

 
  openGraph: {
    title: "GS Scholar | Smart School Management",
    description:
      "Smarter processes. Accurate results. Excellent outcomes. Discover GS Scholar.",
    url: "https://gs-school.vercel.app/",
    siteName: "GS Scholar",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "GS Scholar by GodSpeed Technologies",
      },
    ],
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "GS Scholar | Smart School Management",
    description:
      "A better way to manage school records and academic results.",
    images: ["/opengraph-image"],
  },

};

const features = [
  {
    icon: "01",
    title: "Student Records",
    description:
   "Organise admissions, student records and class lists in one place, making records easier to manage and retrieve.",
  },
  {
    icon: "02",
    title: "Marks & Calculations",
   description:
  "Enter marks once and simplify calculations of averages, totals and class positions, saving time and reducing avoidable errors.",
  },
  {
    icon: "03",
    title: "Academic Oversight",
description:
  "Track class performance and student progress more easily, helping school administrators review results and make timely decisions.",
  },
  {
    icon: "04",
    title: "Progress Reports",
    description:
  "Prepare clear student progress reports faster, with organised academic information ready for review and printing.",
  },
  {
    icon: "05",
    title: "School Administration",
    description:
  "Manage academic years, terms, classes, subjects and teacher assignments in one organised workspace.",
  },
];

const roles = [
  {
    number: "01",
    title: "Teachers",
    description:
      "Access assigned classes and subjects, enter assessment marks and submit results.",
  },
  {
    number: "02",
    title: "Class Masters",
    description:
      "Review class performance, follow student progress and support academic reporting.",
  },
  {
    number: "03",
    title: "School Administrators",
    description:
      "Coordinate school records, academic structures, assignments and workflows.",
  },
];

const principles = [
  ["01", "Discipline"],
  ["02", "Patience"],
  ["03", "Swiftness"],
  ["04", "Excellence"],
];

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f3f0e9] text-[#182334]">

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-[#c9a45d]/20 bg-[#091321]/95 text-white shadow-xl backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">

          <Link href="/" className="flex shrink-0 items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#d9b66f]/60 bg-gradient-to-br from-[#e5c47e] to-[#a77a32] text-xl font-black text-[#101b2b] shadow-lg shadow-black/30">
              GS
            </div>

            <div>
              <p className="text-xl font-black tracking-[1px] text-white sm:text-2xl">
                GODSPEED <span className="text-[#dfbd79]">SCHOLAR</span>
              </p>
              <p className="mt-0.5 text-[10px] font-semibold tracking-[1.5px] text-slate-300">
                GODSPEED TECHNOLOGIES
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-300 lg:flex">
            <a href="#features" className="transition hover:text-[#e5c47e]">Features</a>
            <a href="#workflow" className="transition hover:text-[#e5c47e]">How it works</a>
            <a href="#about" className="transition hover:text-[#e5c47e]">About</a>
            <a href="#contact" className="transition hover:text-[#e5c47e]">Contact</a>
          </nav>

          <Link
            href="/login"
            className="shrink-0 rounded-lg border border-[#e0bd78] bg-gradient-to-b from-[#e7c985] to-[#bd9149] px-4 py-3 text-xs font-black text-[#111c2b] shadow-lg transition hover:brightness-110 sm:px-6 sm:text-sm"
          >
            School Portal <span className="ml-1">→</span>
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#091321] text-white">

        <div className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(220,184,112,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(220,184,112,0.25) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-[#b58a45]/15 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-52 -left-32 h-[420px] w-[420px] rounded-full bg-[#28415b]/50 blur-[100px]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-24">

          {/* HERO COPY */}
          <div className="text-center lg:text-left">

            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d6b36d]/40 bg-[#d6b36d]/10 px-4 py-2 text-[10px] font-black tracking-[2px] text-[#e8cb91] sm:text-xs">
              <span className="h-2 w-2 rounded-full bg-[#e4bd70]" />
              A BETTER WAY TO MANAGE SCHOOL RECORDS
            </div>

            <h1 className="mx-auto max-w-2xl text-4xl font-black leading-[1.12] tracking-tight sm:text-5xl lg:mx-0 lg:text-6xl">
              Smarter processes.
              <span className="mt-2 block bg-gradient-to-r from-[#f1d99f] via-[#d6ad61] to-[#b98a42] bg-clip-text text-transparent">
                Accurate results.
              </span>
              Excellent outcomes.
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-slate-300 sm:text-base sm:leading-8 lg:mx-0">
             Save time, reduce repetitive paperwork and simplify academic administration with faster processes and more accurate record-keeping.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Link
                href="/login"
                className="rounded-lg bg-gradient-to-b from-[#f0d397] to-[#c49a50] px-7 py-4 text-center text-sm font-black text-[#111c2b] shadow-xl shadow-black/30 transition hover:-translate-y-0.5 hover:brightness-110"
              >
                Enter School Portal →
              </Link>

              <a
                href="#features"
                className="rounded-lg border border-white/25 bg-white/5 px-7 py-4 text-center text-sm font-bold text-white transition hover:border-[#d6b36d]/70 hover:bg-[#d6b36d]/10"
              >
                Discover the Platform
              </a>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3 text-xs font-medium text-slate-400 lg:justify-start">
              <span><span className="mr-2 text-[#e2bd76]">✓</span>Organised records</span>
              <span><span className="mr-2 text-[#e2bd76]">✓</span>Structured workflows</span>
              <span><span className="mr-2 text-[#e2bd76]">✓</span>Clear reporting</span>
            </div>
          </div>

          {/* WORKSPACE PREVIEW */}
          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -inset-5 rounded-[2rem] bg-[#d4ad65]/15 blur-3xl" />

            <div className="relative overflow-hidden rounded-2xl border border-[#d7bd87]/40 bg-[#f5f1e8] p-5 text-[#172335] shadow-2xl sm:p-7">

              <div className="flex items-center justify-between border-b border-[#d9d0bd] pb-5">
                <div>
                  <p className="text-lg font-black">School Workspace</p>
                  <p className="mt-1 text-xs font-medium text-slate-600">
                    Academic administration
                  </p>
                </div>

              <Image
  src="/gss.jpg"
  alt="GS Scholar Logo"
  width={64}
  height={64}
  className="h-14 w-14 rounded-xl bg-white p-1 object-contain"
/>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  ["01", "Student Register", "Records and admissions"],
                  ["02", "Academic Calendar", "School year and terms"],
                  ["03", "Results Management", "Marks and calculations"],
                  ["04", "Progress Reports", "Review and reporting"],
                ].map(([number, title, description]) => (
                  <div
                    key={number}
                    className="rounded-xl border border-[#ded5c3] bg-white p-4 shadow-sm transition hover:border-[#c5a15e]"
                  >
                    <span className="text-xs font-black text-[#a77b35]">
                      {number}
                    </span>
                    <p className="mt-2 text-sm font-extrabold text-[#172335]">
                      {title}
                    </p>
                    <p className="mt-1 text-[11px] font-medium leading-5 text-slate-600">
                      {description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl bg-gradient-to-br from-[#111e30] to-[#253950] p-5 text-white">
                <p className="text-[10px] font-black uppercase tracking-[2px] text-[#e3c17e]">
                  One connected workspace
                </p>
                <p className="mt-2 text-lg font-black">
                  Every record. Better organised.
                </p>
                <p className="mt-2 text-xs leading-6 text-slate-300">
              Designed to make academic administration easier and more efficient for school managers.
                </p>
              </div>

              <p className="mt-3 text-center text-[10px] font-medium text-slate-500">
                Illustrative platform preview
              </p>
            </div>
          </div>
        </div>

        {/* GOLD TRANSITION */}
        <div className="h-[3px] bg-gradient-to-r from-transparent via-[#d5ad67] to-transparent" />
      </section>

      {/* PLATFORM STRIP */}
      <section className="border-b border-[#d6c39d] bg-[#e9e1d1]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-5 py-5 text-[10px] font-black tracking-[1.5px] text-[#29364a] sm:px-8 sm:text-xs">
          <span>STUDENT RECORDS</span>
          <span className="text-[#b38b49]">◆</span>
          <span>ACADEMIC RESULTS</span>
          <span className="text-[#b38b49]">◆</span>
          <span>SCHOOL ADMINISTRATION</span>
          <span className="text-[#b38b49]">◆</span>
          <span>PROGRESS REPORTING</span>
        </div>
      </section>

      {/* FEATURES */}
      <section
        id="features"
        className="scroll-mt-24 mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-14"
      >
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[2px] text-[#a77b35]">
              THE PLATFORM
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-[#111e30] sm:text-3xl">
              Everything essential. One organised place.
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#596273]">
              Tools designed to bring essential academic and
              administrative activities together.
            </p>
          </div>

          <p className="text-xs font-bold text-[#98713a]">
            ← Explore the features →
          </p>
        </div>

        <div className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {features.map((feature) => (
            <article
              key={feature.icon}
              className="w-[255px] shrink-0 snap-start rounded-2xl border border-[#ded5c3] bg-[#fffdf8] p-5 shadow-[0_5px_20px_rgba(35,35,25,0.06)] transition hover:-translate-y-1 hover:border-[#c5a15e] hover:shadow-lg sm:w-[280px]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d9bd80] bg-[#f3e8cf] text-xs font-black text-[#8d672f]">
                {feature.icon}
              </div>

              <h3 className="mt-4 text-base font-black text-[#172335]">
                {feature.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#596273]">
                {feature.description}
              </p>

              <div className="mt-5 h-[3px] w-12 rounded-full bg-gradient-to-r from-[#a77b35] to-[#e4c982]" />
            </article>
          ))}
        </div>
      </section>


{/* PRICING */}
<section
  id="pricing"
  className="scroll-mt-24 border-y border-[#d6c39d] bg-[#e9e1d1] px-5 py-14 sm:px-8"
>
  <div className="mx-auto max-w-7xl">
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-black uppercase tracking-[2px] text-[#a77b35]">
        SIMPLE AND TRANSPARENT PRICING
      </p>
      <h2 className="mt-3 text-3xl font-black text-[#111e30]">
        An investment in better school administration.
      </h2>
      <p className="mt-3 text-sm leading-7 text-[#596273]">
        Pricing is structured according to your school&apos;s student population,
        with a one-time onboarding fee and an annual subscription.
      </p>
    </div>

    <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {[
        ["Up to 300 Students", "50,000"],
        ["301 – 500 Students", "150,000"],
        ["501 – 1,000 Students", "250,000"],
        ["1,001 – 2,000 Students", "500,000"],
      ].map(([size, price]) => (
        <div
          key={size}
          className="rounded-2xl border border-[#d6c39d] bg-[#fffdf8] p-6 shadow-sm"
        >
          <p className="text-sm font-black text-[#29364a]">{size}</p>
          <p className="mt-4 text-2xl font-black text-[#111e30]">
            {price}
            <span className="ml-1 text-xs font-bold text-[#98713a]">
              FCFA
            </span>
          </p>
          <p className="mt-1 text-xs text-[#596273]">
            One-time onboarding
          </p>
          <div className="my-5 h-px bg-[#ded5c3]" />
          <p className="text-sm font-bold text-[#172335]">
            500 FCFA / student
          </p>
          <p className="mt-1 text-xs text-[#596273]">
            Annual subscription
          </p>
        </div>
      ))}
    </div>

    <div className="mt-6 rounded-xl border border-[#d6c39d] bg-[#fffdf8] p-5 text-center">
      <p className="font-black text-[#172335]">
        More than 2,000 students?
      </p>
      <p className="mt-2 text-sm text-[#596273]">
        Contact us for a tailored onboarding quotation.
      </p>
      <a
        href="https://www.republic.beauty/contact.html"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-block rounded-lg bg-[#111e30] px-6 py-3 text-sm font-bold text-[#e5c47e]"
      >
        Request a Quotation →
      </a>
    </div>

    <p className="mt-5 text-center text-xs text-[#596273]">
      Annual subscription is calculated using the school&apos;s registered
      student population.
    </p>
  </div>
</section>

      {/* WORKFLOW */}
      <section
        id="workflow"
        className="scroll-mt-24 border-y border-[#26364a] bg-[#111e30] py-12 text-white sm:py-14"
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8">

          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[2px] text-[#dfbd79]">
              BUILT AROUND PEOPLE
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
              Clear responsibilities. Better coordination.
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              A connected environment for the people involved
              in school academic administration.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {roles.map((role) => (
              <article
                key={role.number}
                className="rounded-xl border border-white/15 bg-white/[0.06] p-5 transition hover:border-[#d5b36e]/60 hover:bg-white/[0.09]"
              >
                <span className="text-xs font-black text-[#e0bd77]">
                  {role.number}
                </span>
                <h3 className="mt-3 text-lg font-black text-white">
                  {role.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {role.description}
                </p>
                <div className="mt-5 h-[2px] w-10 bg-[#c5a15e]" />
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section
        id="about"
        className="scroll-mt-24 bg-[#e9e1d1] px-5 py-12 sm:px-8 sm:py-14"
      >
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">

          <div className="rounded-2xl border border-[#d6c39d] bg-[#fffdf8] p-6 shadow-sm sm:p-8">

            <p className="text-xs font-black uppercase tracking-[2px] text-[#a77b35]">
              THE VISION BEHIND THE PLATFORM
            </p>

            <h2 className="mt-3 text-2xl font-black leading-tight tracking-tight text-[#111e30] sm:text-3xl">
              Technology with purpose. Solutions that matter.
            </h2>

            <p className="mt-4 text-sm leading-7 text-[#505a69]">
              GODSPEED SCHOLAR is an education technology product developed
              under GodSpeed Technologies, with a vision to create
              practical digital solutions that address real needs
              in education and beyond.
            </p>

            <p className="mt-3 text-sm leading-7 text-[#505a69]">
              Our focus is simple: useful technology, thoughtful
              design and solutions that help people work with
              greater clarity and confidence.
            </p>

            <a
              href="https://www.republic.beauty/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#111e30] px-5 py-3 text-sm font-bold text-[#e5c47e] transition hover:bg-[#263950]"
            >
              Discover Our Company ↗
            </a>
          </div>

          <div className="rounded-2xl border border-[#c6a25f]/40 bg-gradient-to-br from-[#091321] to-[#253950] p-6 text-white shadow-xl sm:p-8">

            <p className="text-xs font-black uppercase tracking-[2px] text-[#e2c17f]">
              OUR GUIDING PRINCIPLES
            </p>

            <h3 className="mt-3 text-2xl font-black">
              Driven by a standard of excellence.
            </h3>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {principles.map(([number, principle]) => (
                <div
                  key={number}
                  className="rounded-xl border border-[#d6b36d]/25 bg-white/[0.06] p-4"
                >
                  <p className="text-xs font-black text-[#e2c17f]">
                    {number}
                  </p>
                  <p className="mt-2 text-sm font-bold text-white">
                    {principle}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-5 text-xs font-medium text-slate-300">
              Innovating today. Transforming tomorrow.
            </p>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section
        id="contact"
        className="scroll-mt-24 bg-[#f3f0e9] px-5 py-12 sm:px-8 sm:py-14"
      >
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 rounded-2xl border border-[#d5b36e]/40 bg-gradient-to-r from-[#091321] via-[#15283e] to-[#253950] p-7 text-center text-white shadow-xl sm:p-10 lg:flex-row lg:text-left">

          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[2px] text-[#e2c17f]">
              FOR SCHOOLS AND INSTITUTIONS
            </p>

            <h2 className="mt-3 text-2xl font-black leading-tight sm:text-3xl">
              Give your school a more organised future.
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-300">
              Explore the school portal or contact us to discuss
              bringing your institution onto the platform.
            </p>
          </div>

          <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/login"
              className="rounded-lg bg-gradient-to-b from-[#f0d397] to-[#c49a50] px-6 py-3.5 text-center text-sm font-black text-[#111c2b] transition hover:brightness-110"
            >
              Access Portal →
            </Link>

            <a
              href="https://www.republic.beauty/contact.html"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-[#d5b36e]/50 px-6 py-3.5 text-center text-sm font-bold text-white transition hover:bg-white/10"
            >
              Contact Us ↗
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#c5a15e]/30 bg-[#07101d] px-5 py-8 text-slate-300 sm:px-8">
        <div className="mx-auto max-w-7xl">

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">

            <div>
              <p className="text-lg font-black tracking-wide text-white">
                GODSPEED SCHOLAR
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[1.5px] text-[#d9b66f]">
                Academic Management
              </p>
              <p className="mt-4 max-w-xs text-xs leading-6 text-slate-400">
                Supporting organised school administration
                and clearer academic reporting through technology.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-black text-white">Explore</h3>
              <div className="mt-4 flex flex-col gap-3 text-xs font-medium">
                <Link href="/login" className="transition hover:text-[#e5c47e]">
                  School Portal
                </Link>
                <a href="#features" className="transition hover:text-[#e5c47e]">
                  Platform Features
                </a>
                <a href="#pricing" className="transition hover:text-[#e5c47e]">
                   Pricing
                </a>
                <a href="#workflow" className="transition hover:text-[#e5c47e]">
                  How It Works
                </a>
                <a href="#about" className="transition hover:text-[#e5c47e]">
                  About
                </a>
                <Link
  href="/login?next=/register-school"
  className="text-[10px] text-slate-500 transition hover:text-[#d9b66f]"
>
  © 15th/May/2026
</Link>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-black text-white">Contact</h3>
              <div className="mt-4 flex flex-col gap-3 text-xs font-medium">
                <a
                  href="https://www.republic.beauty/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-[#e5c47e]"
                >
                  Company Website ↗
                </a>
                <a
                  href="https://www.republic.beauty/contact.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-[#e5c47e]"
                >
                  Contact & Support ↗
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-center sm:flex-row sm:text-left">
            <p className="text-[11px] text-slate-400">
              © {new Date().getFullYear()} GODSPEED SCHOLAR. All rights reserved.
            </p>

            <p className="text-xs font-medium text-slate-300">
              Powered by{" "}
              <a
                href="https://www.republic.beauty/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-black text-[#e2c17f] transition hover:text-white"
              >
                GodSpeed Technologies
              </a>
            </p>
          </div>

          <p className="mt-5 text-center text-[10px] font-medium tracking-wide text-slate-500">
            Discipline. Patience. Swiftness. Excellence.
          </p>
        </div>
      </footer>
    </main>
  );
}
