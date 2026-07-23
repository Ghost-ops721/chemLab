"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { isProfileComplete } from "@/lib/firebase/profile";

export function AuthGateModal() {
  const open = useAuthStore((s) => s.authGateOpen);
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const guestChemicalAdds = useAuthStore((s) => s.guestChemicalAdds);
  const closeAuthGate = useAuthStore((s) => s.closeAuthGate);

  const guestBlocked = !user && guestChemicalAdds >= 2;
  const needsProfile = Boolean(user && !isProfileComplete(profile));
  const blocked = guestBlocked || needsProfile;

  useEffect(() => {
    if (!open && !blocked) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !blocked) closeAuthGate();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, blocked, closeAuthGate]);

  if (!open && !blocked) return null;
  if (user && isProfileComplete(profile)) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-lab-ink/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-gate-title"
      onClick={() => {
        if (!blocked) closeAuthGate();
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-lab-line bg-lab-panel p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-lab-teal">
          Chem Lab
        </p>
        <h2
          id="auth-gate-title"
          className="mt-1 font-display text-2xl text-lab-ink"
        >
          {needsProfile ? "Finish your profile" : "Save your discoveries"}
        </h2>
        <p className="mt-2 text-sm text-lab-muted">
          {needsProfile
            ? "Add gender and date of birth to keep experimenting. Address is optional."
            : "You've added two chemicals. Log in or sign up to mix, react, and earn XP."}
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          {needsProfile ? (
            <Link
              href="/profile?onboarding=1"
              className="flex-1 rounded-lg bg-lab-teal px-3 py-2 text-center text-sm font-semibold text-white hover:bg-lab-teal/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lab-teal"
            >
              Complete profile
            </Link>
          ) : (
            <>
              <Link
                href="/signup"
                className="flex-1 rounded-lg bg-lab-teal px-3 py-2 text-center text-sm font-semibold text-white hover:bg-lab-teal/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lab-teal"
              >
                Sign up
              </Link>
              <Link
                href="/login"
                className="flex-1 rounded-lg border border-lab-line bg-white px-3 py-2 text-center text-sm font-semibold text-lab-ink hover:bg-lab-wash focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lab-teal"
              >
                Log in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
