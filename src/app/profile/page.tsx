"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { NavChrome } from "@/components/auth/NavChrome";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { useAuthStore } from "@/store/authStore";

function ProfilePageInner() {
  const router = useRouter();
  const search = useSearchParams();
  const onboarding = search.get("onboarding") === "1";
  const user = useAuthStore((s) => s.user);
  const authReady = useAuthStore((s) => s.authReady);

  useEffect(() => {
    if (authReady && !user) {
      router.replace("/login");
    }
  }, [authReady, user, router]);

  return (
    <div className="min-h-dvh bg-lab-wash px-4 py-8">
      <div className="mx-auto flex max-w-lg items-center justify-between">
        <Link href="/lab" className="font-display text-2xl text-lab-ink">
          Chem Lab
        </Link>
        <NavChrome />
      </div>
      <div className="mx-auto mt-10 max-w-md">
        <h1 className="font-display text-3xl text-lab-ink">
          {onboarding ? "Complete your profile" : "Profile"}
        </h1>
        <p className="mt-1 text-sm text-lab-muted">
          {onboarding
            ? "Add gender and date of birth to finish setup. Address is optional."
            : "Update your lab profile details."}
        </p>
        <div className="mt-6">
          {!authReady ? (
            <p className="text-sm text-lab-muted">Loading…</p>
          ) : (
            <ProfileForm onboarding={onboarding} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-lab-wash text-sm text-lab-muted">
          Loading profile…
        </div>
      }
    >
      <ProfilePageInner />
    </Suspense>
  );
}
