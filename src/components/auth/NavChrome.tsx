"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { signOut } from "@/lib/firebase/auth";
import { labSound } from "@/desk/labSound";

export function NavChrome() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const authReady = useAuthStore((s) => s.authReady);
  const [muted, setMuted] = useState(() => labSound.isMuted());

  async function onLogout() {
    await signOut();
  }

  return (
    <nav className="flex shrink-0 items-center gap-1.5 text-[11px]">
      <Link
        href="/"
        className="rounded-md px-2 py-1 font-semibold text-lab-ink hover:bg-lab-wash"
      >
        Lab
      </Link>
      <Link
        href="/profile"
        className="rounded-md px-2 py-1 font-semibold text-lab-ink hover:bg-lab-wash"
      >
        Profile
      </Link>
      <button
        type="button"
        onClick={() => setMuted(labSound.toggleMute())}
        className="rounded-md px-2 py-1 font-semibold text-lab-muted hover:bg-lab-wash hover:text-lab-ink"
        aria-pressed={muted}
        aria-label={muted ? "Unmute lab sounds" : "Mute lab sounds"}
        title={muted ? "Unmute lab sounds" : "Mute lab sounds"}
      >
        {muted ? "Unmute" : "Mute"}
      </button>
      {!authReady ? (
        <span className="px-2 py-1 text-lab-muted">…</span>
      ) : user ? (
        <>
          <span className="hidden max-w-[7rem] truncate px-1 text-lab-muted sm:inline">
            {profile?.displayName || user.email}
          </span>
          <button
            type="button"
            onClick={() => void onLogout()}
            className="rounded-md px-2 py-1 font-semibold text-lab-muted hover:bg-lab-wash hover:text-lab-ink"
          >
            Log out
          </button>
        </>
      ) : (
        <>
          <Link
            href="/login"
            className="rounded-md px-2 py-1 font-semibold text-lab-muted hover:bg-lab-wash hover:text-lab-ink"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-lab-teal px-2 py-1 font-semibold text-white hover:bg-lab-teal/90"
          >
            Sign up
          </Link>
        </>
      )}
    </nav>
  );
}
