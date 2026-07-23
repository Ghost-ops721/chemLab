"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { WaitlistForm } from "@/components/marketing/WaitlistForm";

const BELOW = [
  {
    title: "Perfume Atelier",
    body: "Top, heart, and base notes on warm wood. Build citrus to oud, remix, and keep what you invent.",
  },
  {
    title: "Real chemistry",
    body: "Pour, stir, heat, shake — equations resolve when reactions happen. Bubbles and glow only when chemistry does.",
  },
  {
    title: "Invention shelf",
    body: "Save formulas, compare versions, share a card. Your desk becomes a collection.",
  },
] as const;

export function LandingPage() {
  const user = useAuthStore((s) => s.user);
  const authReady = useAuthStore((s) => s.authReady);
  const router = useRouter();

  useEffect(() => {
    if (authReady && user) {
      router.replace("/lab");
    }
  }, [authReady, user, router]);

  return (
    <div className="min-h-dvh bg-lab-ink text-lab-foam">
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-5 sm:px-8">
        <p className="font-display text-xl tracking-tight text-lab-foam/90 sm:text-2xl">
          Chem Lab
        </p>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/login"
            className="rounded-md px-3 py-1.5 font-medium text-lab-foam/70 transition hover:text-lab-foam"
          >
            Log in
          </Link>
          <a
            href="#waitlist"
            className="rounded-md bg-lab-teal px-3 py-1.5 font-semibold text-white transition hover:bg-lab-teal/90"
          >
            Waitlist
          </a>
        </nav>
      </header>

      {/* Hero: one composition — brand, line, CTA, wood plane */}
      <section className="landing-hero relative flex min-h-dvh flex-col justify-center overflow-hidden">
        <div className="lab-desk-surface absolute inset-0" aria-hidden />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-lab-ink/55 via-lab-ink/20 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-lab-ink/70 via-transparent to-lab-ink/25"
          aria-hidden
        />

        {/* Soft glassware silhouettes — atmosphere, not chrome */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="landing-vessel landing-vessel-a absolute bottom-[16%] right-[6%] h-48 opacity-55 sm:right-[10%] sm:h-64 sm:opacity-65 md:right-[14%]" />
          <div className="landing-vessel landing-vessel-b absolute bottom-[20%] right-[20%] h-32 opacity-45 sm:right-[26%] sm:h-40 sm:opacity-55" />
          <div className="landing-sheen absolute inset-x-0 top-0 h-1/2" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-3xl px-5 pt-20 sm:px-8">
          <h1 className="landing-rise font-display text-5xl leading-[0.95] tracking-tight text-white sm:text-7xl md:text-8xl">
            Chem Lab
          </h1>
          <p className="landing-rise landing-rise-delay mt-5 max-w-md text-base leading-relaxed text-white/90 sm:text-lg">
            Build perfume and real formulas on a chemistry desk.
          </p>
          <p className="landing-rise landing-rise-delay-2 mt-2 max-w-sm text-sm text-lab-glass">
            Everything is open while we build. Join for 10% off Premium later.
          </p>
          <div className="landing-rise landing-rise-delay-3 mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#waitlist"
              className="rounded-md bg-lab-teal px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_30px_rgba(0,0,0,0.35)] transition hover:bg-lab-teal/90"
            >
              Join the waitlist
            </a>
            <Link
              href="/lab"
              className="rounded-md border border-white/35 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white/55 hover:bg-white/15"
            >
              Open the lab
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-lab-foam/10 bg-lab-wash px-5 py-20 text-lab-ink sm:px-8 sm:py-28">
        <div className="mx-auto grid max-w-5xl gap-14 sm:gap-16 md:grid-cols-3 md:gap-10">
          {BELOW.map((s) => (
            <div key={s.title}>
              <h2 className="font-display text-2xl leading-tight sm:text-3xl">
                {s.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-lab-muted sm:text-[15px]">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="waitlist"
        className="lab-desk-surface relative overflow-hidden px-5 py-20 sm:px-8 sm:py-28"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-lab-ink/55"
          aria-hidden
        />
        <div className="relative mx-auto max-w-lg">
          <h2 className="font-display text-4xl text-lab-foam sm:text-5xl">
            Get early access
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-lab-foam/75 sm:text-base">
            The lab is free to explore now. Waitlist members get{" "}
            <span className="text-lab-glass">10% off Premium</span> when it
            opens.
          </p>
          <div className="mt-8 [&_input]:border-lab-foam/20 [&_input]:bg-lab-ink/40 [&_input]:text-lab-foam [&_input]:placeholder:text-lab-foam/40 [&_label]:text-lab-foam/55">
            <WaitlistForm intent="premium" />
          </div>
          <p className="mt-8 text-sm text-lab-foam/55">
            Already in?{" "}
            <Link href="/login" className="font-semibold text-lab-glass">
              Log in
            </Link>
            {" · "}
            <Link href="/lab" className="font-semibold text-lab-glass">
              Open the lab
            </Link>
          </p>
        </div>
      </section>

      <footer className="bg-lab-ink px-5 py-8 text-center text-[11px] text-lab-foam/40">
        Chem Lab — pour, stir, invent.
      </footer>
    </div>
  );
}
