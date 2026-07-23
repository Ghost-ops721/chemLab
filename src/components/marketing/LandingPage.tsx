"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { WaitlistForm } from "@/components/marketing/WaitlistForm";

const SECTIONS = [
  {
    title: "Pour. React. See the equation.",
    body: "Drag glassware onto warm wood, mix reactants, and watch a real balanced formula resolve — bubbles and glow only when chemistry happens.",
    image: "/reaction-equation.png",
    alt: "Chem Lab reaction equation banner",
  },
  {
    title: "Perfume Atelier",
    body: "Build inspired scent formulas — citrus to oud — with top, heart, and base notes. Remix, score, and keep what you invent.",
  },
  {
    title: "Make everyday products",
    body: "Guided goals for soap, cologne, bath bombs, ink, and more. Kitchen chemistry on a virtual desk.",
  },
  {
    title: "Invention shelf",
    body: "Save formulas, compare versions, share a card. Your lab becomes a collection, not a one-off demo.",
  },
  {
    title: "Tutor + scan",
    body: "Plain-language explanations after every Mix. Scan notes with OCR when you want the desk to meet your homework.",
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
    <div className="min-h-dvh bg-lab-wash text-lab-ink">
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <p className="font-display text-2xl tracking-tight text-lab-ink sm:text-3xl">
          Chem Lab
        </p>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/login"
            className="rounded-lg px-3 py-1.5 font-semibold text-lab-muted hover:bg-lab-panel hover:text-lab-ink"
          >
            Log in
          </Link>
          <a
            href="#waitlist"
            className="rounded-lg bg-lab-teal px-3 py-1.5 font-semibold text-white hover:bg-lab-teal/90"
          >
            Join waitlist
          </a>
        </nav>
      </header>

      <section className="relative min-h-[min(92dvh,900px)] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/desk-hero.png"
            alt=""
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-lab-ink/75 via-lab-ink/45 to-lab-ink/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-lab-wash via-transparent to-lab-ink/30" />
        </div>

        <div className="relative mx-auto flex min-h-[min(92dvh,900px)] max-w-6xl flex-col justify-end px-4 pb-16 pt-24 sm:px-6 sm:pb-20">
          <h1 className="max-w-xl font-display text-4xl leading-[1.1] text-lab-foam sm:text-5xl md:text-6xl">
            Build perfume and real formulas on a chemistry desk.
          </h1>
          <p className="mt-4 max-w-md text-base text-lab-foam/85 sm:text-lg">
            Pour, stir, and invent — everything is open while we build. Join the
            waitlist for 10% off Premium when it opens.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#waitlist"
              className="rounded-lg bg-lab-teal px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-lab-ink/20 hover:bg-lab-teal/90"
            >
              Join the waitlist — 10% off
            </a>
            <Link
              href="/lab"
              className="rounded-lg border border-lab-foam/40 bg-lab-ink/30 px-5 py-2.5 text-sm font-semibold text-lab-foam backdrop-blur hover:bg-lab-ink/50"
            >
              Open the lab
            </Link>
          </div>
          <p className="mt-4 font-mono text-[11px] tracking-wide text-lab-glass">
            HCl + NaOH → NaCl + H₂O
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-20 px-4 py-16 sm:px-6 sm:py-24">
        {SECTIONS.map((s, i) => (
          <section
            key={s.title}
            className={`grid items-center gap-8 md:grid-cols-2 ${
              i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
            }`}
          >
            <div>
              <h2 className="font-display text-3xl text-lab-ink sm:text-4xl">
                {s.title}
              </h2>
              <p className="mt-3 max-w-md text-lab-muted">{s.body}</p>
            </div>
            {"image" in s && s.image ? (
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-lab-line/60 shadow-lg shadow-lab-ink/10">
                <Image
                  src={s.image}
                  alt={s.alt ?? s.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            ) : (
              <div className="lab-desk-surface flex aspect-[16/10] items-center justify-center rounded-2xl border border-lab-desk/40 px-6">
                <p className="font-display text-2xl text-lab-foam/90">
                  {s.title}
                </p>
              </div>
            )}
          </section>
        ))}

        <section
          id="waitlist"
          className="rounded-3xl border border-lab-line/50 bg-lab-panel/80 px-6 py-10 sm:px-10"
        >
          <h2 className="font-display text-3xl text-lab-ink sm:text-4xl">
            Join the waitlist
          </h2>
          <p className="mt-2 max-w-lg text-lab-muted">
            Today everything in the lab is open. Get{" "}
            <span className="font-semibold text-lab-teal">10% off Premium</span>{" "}
            when we open paid extras later — free forever core stays free.
          </p>
          <div className="mt-6">
            <WaitlistForm intent="premium" />
          </div>
          <p className="mt-6 text-sm text-lab-muted">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-lab-teal">
              Log in
            </Link>{" "}
            or{" "}
            <Link href="/lab" className="font-semibold text-lab-teal">
              open the lab
            </Link>
            .
          </p>
        </section>
      </div>

      <footer className="border-t border-lab-line/40 px-4 py-8 text-center text-[11px] text-lab-muted">
        Chem Lab — the desk reacts to every move.
      </footer>
    </div>
  );
}
