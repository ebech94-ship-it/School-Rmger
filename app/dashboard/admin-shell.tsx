
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const navigation = [
  { name: "Overview", icon: "⌂", href: "/dashboard" },
  { name: "Students", icon: "♙", href: "/dashboard/students" },
  { name: "Classes", icon: "▦", href: "/dashboard/classes" },
  { name: "Subjects", icon: "▤", href: "/dashboard/subjects" },
  { name: "Teachers", icon: "♧", href: "/dashboard/teachers" },
  { name: "Class Masters", icon: "♙", href: "/dashboard/class-masters" },
  { name: "Academic Calendar", icon: "▦", href: "/dashboard/academic-calendar" },
  { name: "Marks & Results", icon: "✎", href: "/dashboard/results" },
  { name: "Class Council", icon: "☷", href: "/dashboard/class-council" },
  { name: "Reports", icon: "▥", href: "/dashboard/reports" },
  { name: "Settings", icon: "⚙", href: "/dashboard/settings" },
];

type AdminProfile = {
  displayName?: string;
  email?: string;
  schoolId: string;
  role: string;
  active: boolean;
};

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [schoolName, setSchoolName] = useState("School");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  const activeItem =
    navigation.find((item) => item.href === pathname) ||
    navigation.find(
      (item) => item.href !== "/dashboard" && pathname.startsWith(item.href)
    );

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (active) router.replace("/login");
        return;
      }

      try {
        const userSnapshot = await getDoc(doc(db, "users", user.uid));

        if (!userSnapshot.exists()) {
          await signOut(auth);
          if (active) router.replace("/login");
          return;
        }

        const userData = userSnapshot.data() as AdminProfile;

        if (
          userData.active !== true ||
          !userData.schoolId ||
          userData.role !== "technical_admin"
        ) {
          await signOut(auth);
          if (active) router.replace("/login");
          return;
        }

        const schoolSnapshot = await getDoc(
          doc(db, "schools", userData.schoolId)
        );

        if (!schoolSnapshot.exists()) {
          await signOut(auth);
          if (active) router.replace("/login");
          return;
        }

        if (!active) return;

        setProfile({
          ...userData,
          email: user.email || userData.email || "",
        });

        setSchoolName(schoolSnapshot.data().name || "School");
        setCheckingAuth(false);
      } catch (error) {
        console.error("Admin authentication check failed:", error);

        if (active) {
          setCheckingAuth(false);
          router.replace("/login");
        }
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [router]);

  async function handleSignOut() {
    setSigningOut(true);

    try {
      await signOut(auth);
      router.replace("/login");
    } catch (error) {
      console.error("Sign out failed:", error);
      setSigningOut(false);
      alert("Unable to sign out. Please try again.");
    }
  }

  if (checkingAuth || !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f7fc]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
          <p className="mt-4 text-sm font-medium text-slate-500">
            Securing your school workspace...
          </p>
        </div>
      </main>
    );
  }

  const pageTitle = activeItem?.name || "School Administration";
  const initials = (profile.displayName || profile.email || "Admin")
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  const today = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Douala",
  }).format(new Date());

  return (
    <div className="min-h-screen bg-[#f4f6fa] text-slate-800">
      {menuOpen && (
        <button
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[270px] flex-col bg-[#101d35] text-white shadow-2xl transition-transform duration-300 lg:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Link
          href="/dashboard"
          onClick={() => setMenuOpen(false)}
          className="flex h-[82px] shrink-0 items-center gap-3 border-b border-white/10 px-6"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-blue-700 text-xl font-black shadow-lg shadow-blue-950/30">
            S
          </div>
          <div>
            <h1 className="text-lg font-black tracking-wide">SCHOLARFLOW</h1>
            <p className="text-[10px] tracking-wider text-slate-400">
              SCHOOL MANAGEMENT
            </p>
          </div>
        </Link>

        <div className="border-b border-white/10 px-5 py-5">
          <p className="text-[10px] font-bold uppercase tracking-[2px] text-slate-500">
            Current school
          </p>
          <p className="mt-2 truncate text-sm font-semibold text-white">
            {schoolName}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-400" />
            <span className="text-[11px] text-slate-400">Active workspace</span>
          </div>
        </div>

        <div className="px-5 pb-3 pt-6 text-[10px] font-bold uppercase tracking-[2px] text-slate-500">
          Main menu
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {navigation.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="w-6 text-center text-lg">{item.icon}</span>
                <span>{item.name}</span>

                {item.name === "Marks & Results" && (
                  <span className="ml-auto rounded-md bg-white/10 px-2 py-0.5 text-[9px]">
                    RESULTS
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mx-4 mb-4 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
          <p className="text-sm font-semibold">Need assistance?</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            Help and guidance for managing your school records.
          </p>
          <p className="mt-3 text-xs font-semibold text-blue-300">
            Support centre coming soon
          </p>
        </div>

        <div className="mx-4 mb-4 border-t border-white/10 pt-3">
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-red-300 transition hover:bg-red-500/10 hover:text-red-200 disabled:opacity-50"
          >
            <span className="text-lg">↪</span>
            {signingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>

        <div className="border-t border-white/10 px-5 py-4 text-xs text-slate-500">
          ScholarFlow · Version 1.0
        </div>
      </aside>

      <main className="min-h-screen lg:pl-[270px]">
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-7 lg:px-9">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-lg transition hover:bg-slate-50 lg:hidden"
              aria-label="Open navigation"
            >
              ☰
            </button>

            <div className="min-w-0">
              <p className="truncate text-xs text-slate-400">
                {schoolName} / Administration / {pageTitle}
              </p>
              <h2 className="truncate text-lg font-bold text-[#152440] sm:text-xl">
                {pageTitle}
              </h2>
            </div>
          </div>

          <div className="ml-3 flex shrink-0 items-center gap-3 sm:gap-5">
            <div className="hidden text-right md:block">
              <p className="text-xs font-medium text-slate-500">{today}</p>
              <p className="mt-1 text-[10px] text-slate-400">
                School administration
              </p>
            </div>

            <div className="flex items-center gap-2.5 border-l border-slate-200 pl-3 sm:pl-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                {initials || "AD"}
              </div>
              <div className="hidden max-w-[150px] sm:block">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {profile.displayName || "Administrator"}
                </p>
                <p className="text-xs text-slate-400">
                  Technical Administrator
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto min-h-[calc(100vh-76px)] max-w-[1600px] p-4 sm:p-7 lg:p-9">
          {children}
        </div>
      </main>
    </div>
  );
}
