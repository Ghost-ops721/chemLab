"use client";

import { NavChrome } from "@/components/auth/NavChrome";
import { AlyraMark } from "@/components/brand/AlyraMark";

/** Shared top bar — matches LabShell so nav stays consistent across pages. */
export function AppHeader({
  subtitle,
}: {
  subtitle?: string;
}) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-lab-line/40 bg-lab-panel/90 px-3 py-1.5 backdrop-blur md:px-4">
      <div className="min-w-0">
        <AlyraMark size="md" href="/lab" />
        {subtitle ? (
          <p className="mt-0.5 max-w-md truncate text-[11px] text-lab-muted">
            {subtitle}
          </p>
        ) : null}
      </div>
      <NavChrome />
    </header>
  );
}
