"use client";

import { useRef } from "react";
import type { Invention } from "@/domains/chemistry/invention";
import { resolveScentProfile } from "@/domains/chemistry/perfume";
import { track } from "@/lib/analytics/track";
import { showToast } from "@/gamification/ToastHost";

export function InventionShareCard({
  invention,
  onClose,
}: {
  invention: Invention;
  onClose: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const latest = invention.versions[invention.versions.length - 1];
  const scent =
    invention.kind === "perfume"
      ? resolveScentProfile({
          goalId: invention.sourceGoalId,
          perfumeRecipeId: invention.perfumeRecipeId,
          contentIds: latest?.snapshot.contentIds,
          displayName: invention.name,
        })
      : null;

  async function copyShareText() {
    const text = `I made “${invention.name}” in Chem Lab — score ${invention.bestScore}/100 (${latest?.tier ?? "make"}). Can you beat my formula?`;
    try {
      await navigator.clipboard.writeText(text);
      track("invention_shared", {
        inventionId: invention.id,
        method: "clipboard",
        score: invention.bestScore,
      });
      showToast({ title: "Copied", detail: "Paste it anywhere." });
    } catch {
      showToast({ title: "Copy failed", detail: text });
    }
  }

  async function nativeShare() {
    const text = `I made “${invention.name}” in Chem Lab — score ${invention.bestScore}/100.`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: invention.name,
          text,
          url: typeof window !== "undefined" ? window.location.origin : undefined,
        });
        track("invention_shared", {
          inventionId: invention.id,
          method: "native",
          score: invention.bestScore,
        });
        return;
      } catch {
        /* fall through */
      }
    }
    await copyShareText();
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-lab-ink/60 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Share creation"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl border border-lab-line bg-lab-panel shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={cardRef}
          className="relative overflow-hidden bg-gradient-to-br from-lab-teal/20 via-lab-panel to-lab-amber/15 px-5 pb-5 pt-6"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-lab-teal">
            Made in Chem Lab
          </p>
          <h3 className="mt-2 font-display text-2xl leading-tight text-lab-ink">
            {invention.name}
          </h3>
          <p className="mt-1 text-[12px] text-lab-muted">
            {invention.kind} · v{latest?.version ?? 1} · {latest?.tier ?? "make"}
          </p>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-[9px] uppercase tracking-wider text-lab-muted">
                Mastery score
              </p>
              <p className="font-display text-4xl text-lab-teal">
                {invention.bestScore}
              </p>
            </div>
            <div className="h-16 w-12 rounded-b-2xl rounded-t-md border border-lab-glass/50 bg-gradient-to-b from-white/80 to-lab-glass/40 shadow-md" />
          </div>
          {scent ? (
            <p className="mt-3 text-[11px] leading-snug text-lab-ink/80">
              <span className="font-semibold text-lab-teal">Smells like </span>
              {scent.smellsLike}
            </p>
          ) : latest?.notes?.[0] ? (
            <p className="mt-3 text-[11px] leading-snug text-lab-ink/80">
              {latest.notes[0]}
            </p>
          ) : null}
          {scent?.hasNotesOf.length ? (
            <p className="mt-1.5 text-[10px] leading-snug text-lab-muted">
              Notes of {scent.hasNotesOf.slice(0, 5).join(" · ")}
            </p>
          ) : null}
        </div>
        <div className="flex gap-2 border-t border-lab-line/50 px-4 py-3">
          <button
            type="button"
            className="flex-1 rounded-lg border border-lab-line bg-white px-3 py-2 text-xs font-semibold text-lab-ink hover:bg-lab-wash"
            onClick={onClose}
          >
            Close
          </button>
          <button
            type="button"
            className="flex-[1.4] rounded-lg bg-lab-teal px-3 py-2 text-xs font-semibold text-white hover:bg-lab-teal/90"
            onClick={() => void nativeShare()}
          >
            Share pride card
          </button>
        </div>
      </div>
    </div>
  );
}
