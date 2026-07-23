"use client";

import dynamic from "next/dynamic";

const LabShell = dynamic(
  () => import("@/desk/LabShell").then((m) => m.LabShell),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-dvh items-center justify-center bg-lab-wash">
        <p className="font-display text-2xl text-lab-ink">Chem Lab</p>
      </div>
    ),
  },
);

export function LabApp() {
  return <LabShell />;
}
