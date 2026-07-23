"use client";

import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";
import { NavChrome } from "@/components/auth/NavChrome";

export default function SignupPage() {
  return (
    <div className="min-h-dvh bg-lab-wash px-4 py-8">
      <div className="mx-auto flex max-w-lg items-center justify-between">
        <Link href="/" className="font-display text-2xl text-lab-ink">
          Chem Lab
        </Link>
        <NavChrome />
      </div>
      <div className="mx-auto mt-10 max-w-sm">
        <h1 className="font-display text-3xl text-lab-ink">Sign up</h1>
        <p className="mt-1 text-sm text-lab-muted">
          Create an account to unlock the full lab after two chemicals.
        </p>
        <div className="mt-6">
          <AuthForm mode="signup" />
        </div>
      </div>
    </div>
  );
}
