
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");
const [destinations, setDestinations] = useState<
  { label: string; href: string }[]
>([]);
const [showDestinations, setShowDestinations] = useState(false);



async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();

  setLoading(true);
  setMessage("");
  setShowDestinations(false);
  setDestinations([]);

  try {
    const credential = await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

    const userRef = doc(db, "users", credential.user.uid);
    const userSnap = await getDoc(userRef);
    const profile = userSnap.exists() ? userSnap.data() : {};

    // Ask the server whether this account is Super Admin.
    const token = await credential.user.getIdToken();

    const superAdminResponse = await fetch("/api/super-admin/check", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const superAdminData = await superAdminResponse.json();
    const isSuperAdmin =
      superAdminResponse.ok && superAdminData.authorized === true;

    // Support both the existing single role and a future roles array.
    const roles: string[] = Array.isArray(profile.roles)
      ? profile.roles
      : profile.role
        ? [profile.role]
        : [];

    const schoolAccountActive =
      profile.active === true && !!profile.schoolId;

    const availableDestinations: { label: string; href: string }[] = [];

    if (isSuperAdmin) {
      availableDestinations.push({
        label: "Super Admin — Register a School",
        href: "/register-school",
      });
    }

    if (schoolAccountActive) {
      if (roles.includes("technical_admin")) {
        availableDestinations.push({
          label: "Technical Admin — School Dashboard",
          href: "/dashboard",
        });
      }

      if (roles.includes("class_master")) {
        availableDestinations.push({
          label: "Class Master Workspace",
          href: "/class-master",
        });
      }

      if (roles.includes("teacher")) {
        availableDestinations.push({
          label: "Teacher Workspace",
          href: "/teacher",
        });
      }
    }

    if (availableDestinations.length === 0) {
      await signOut(auth);
      throw new Error(
        "Your account has no active access role. Contact your administrator."
      );
    }

    // Super Admin gets a choice of authorised destinations.
    if (isSuperAdmin) {
      setDestinations(availableDestinations);
      setShowDestinations(true);
      return;
    }

    // Ordinary school users retain automatic routing.
    if (availableDestinations.length === 1) {
      router.replace(availableDestinations[0].href);
      return;
    }

    // Accounts with multiple school roles can choose.
    setDestinations(availableDestinations);
    setShowDestinations(true);

  } catch (error: unknown) {
    const code = (error as { code?: string }).code;

    const errorMessages: Record<string, string> = {
      "auth/invalid-credential": "Incorrect email or password.",
      "auth/user-not-found": "No account was found with this email.",
      "auth/wrong-password": "Incorrect email or password.",
      "auth/too-many-requests": "Too many attempts. Please try again later.",
      "auth/network-request-failed": "Network error. Check your internet connection.",
      "auth/invalid-email": "Please enter a valid email address.",
    };

    setMessage(
      error instanceof Error && !code
        ? error.message
        : errorMessages[code || ""] || "Unable to sign in. Please try again."
    );

    setMessageType("error");
  } finally {
    setLoading(false);
  }
}

  async function handlePasswordReset() {
    if (!email.trim()) {
      setMessage("Enter your email address first.");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMessage("Password reset instructions have been sent to your email.");
      setMessageType("success");
    } catch {
      setMessage("Unable to send reset email. Check the email address and try again.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#03070d] via-[#091321] to-[#111827] px-4 py-12">
      {/* Premium dark background lighting */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-[#c49a50]/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[#d6ad61]/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(214,173,97,0.08),transparent_55%)]" />

      <div className="relative z-10 w-full max-w-[460px]">
        <Link href="/" className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d6ad61]/40 bg-gradient-to-br from-[#26364b] to-[#080e18] text-xl font-black text-[#e2c17f] shadow-[0_8px_35px_rgba(214,173,97,0.18)]">
            GS
          </div>
          <h1 className="mt-3 text-xl font-black tracking-[2px] text-white">
            GODSPEED SCHOLAR
          </h1>
          <p className="mt-1 text-[10px] font-bold tracking-[3px] text-[#d6ad61]">
            SCHOOL MANAGEMENT SYSTEM
          </p>
        </Link>

        <section className="rounded-[28px] border border-white bg-white/95 p-7 shadow-[0_25px_80px_-25px_rgba(15,35,70,0.20)] backdrop-blur-xl sm:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-6 w-6"
              >
                <path d="M12 15v2m-6 5h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2Z" />
                <path d="M8 9V6a4 4 0 1 1 8 0v3" />
              </svg>
            </div>

            <p className="text-xs font-bold uppercase tracking-[2px] text-blue-600">
              Secure school access
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-[#142746]">
              Welcome back
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Sign in to access your school&apos;s academic workspace.
            </p>
          </div>

          {showDestinations ? (
  <div className="space-y-4">
    <div className="text-center">
      <h3 className="text-lg font-black text-[#142746]">
        Choose your workspace
      </h3>
      <p className="mt-2 text-sm text-slate-500">
        Select where you want to continue.
      </p>
    </div>

    {destinations.map((destination) => (
      <button
        key={destination.href}
        type="button"
        onClick={() => router.replace(destination.href)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 text-left text-sm font-bold text-[#142746] transition hover:border-[#c49a50] hover:bg-amber-50"
      >
        {destination.label}
        <span>→</span>
      </button>
    ))}

    <button
      type="button"
      onClick={async () => {
        await signOut(auth);
        setShowDestinations(false);
        setDestinations([]);
        setPassword("");
      }}
      className="w-full pt-2 text-sm font-semibold text-slate-500 hover:text-red-600"
    >
      Sign out
    </button>
  </div>
) : (
  <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-bold text-slate-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-bold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  disabled={loading}
                  className="text-xs font-bold text-blue-600 transition hover:text-blue-800 disabled:opacity-50"
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-4 pr-16 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 transition hover:text-blue-600"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {message && (
              <div
                role="alert"
                className={`rounded-xl border p-3 text-sm ${
                  messageType === "success"
                    ? "border-blue-100 bg-blue-50 text-blue-700"
                    : "border-red-100 bg-red-50 text-red-600"
                }`}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#142746] to-blue-600 py-4 text-sm font-bold text-white shadow-lg shadow-blue-900/15 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Please wait..." : "Sign in to your account"}
              {!loading && <span className="transition-transform group-hover:translate-x-1">→</span>}
            </button>
        </form>
)}
          <div className="mt-7 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
            <p className="text-xs leading-6 text-slate-600">
              Access is provided by your school&apos;s Technical Administrator.
              Contact your administrator if you need an account.
            </p>
          </div>
        </section>

        <div className="mt-7 text-center">
          <Link href="/" className="text-xs font-semibold text-slate-300 transition hover:text-[#e2c17f]">
            ← Back to home
          </Link>

          <p className="mt-4 text-[10px] font-bold tracking-[1.5px] text-[#d6ad61]">
            POWERED BY GODSPEED TECHNOLOGIES
          </p>
          <p className="mt-1 text-[10px] text-slate-400">
            Kumba, Cameroon
          </p>
          <p className="mt-3 text-[10px] text-slate-500">
            © 2026 GODSPEED SCHOLAR. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  );
}
