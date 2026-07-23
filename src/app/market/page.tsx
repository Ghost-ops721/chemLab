"use client";

import Link from "next/link";
import { NavChrome } from "@/components/auth/NavChrome";
import { MarketBrowser } from "@/perfume/MarketPanel";

export default function MarketPage() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-lab-wash via-[#e4efe9] to-lab-wash px-4 py-8">
      <div className="mx-auto flex max-w-2xl items-center justify-between">
        <Link href="/lab" className="font-display text-2xl text-lab-ink">
          Chem Lab
        </Link>
        <NavChrome />
      </div>
      <div className="mx-auto mt-8 max-w-2xl">
        <p className="font-display text-[10px] uppercase tracking-[0.2em] text-lab-teal">
          Atelier Market
        </p>
        <h1 className="mt-1 font-display text-3xl text-lab-ink">
          Shared formulas
        </h1>
        <p className="mt-1 text-sm text-lab-muted">
          Browse community perfume blends, remix onto your desk, or open a
          panel study.
        </p>
        <div className="mt-6">
          <MarketBrowser />
        </div>
        <p className="mt-6 text-[11px] leading-snug text-lab-muted">
          IFRA badges are teaching screens against Chem Lab’s{" "}
          <span className="font-mono">49th-Amendment-teaching</span> seed —
          not certified compliance.
        </p>
      </div>
    </div>
  );
}
