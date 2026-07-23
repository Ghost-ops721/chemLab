"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DeskVessel } from "@/types";
import type { GoalVisualKind } from "@/domains/chemistry/data/goals";
import {
  kindFromGoalId,
  scoreInvention,
  snapshotFromVessel,
  type FormulaSnapshot,
  type Invention,
  type InventionKind,
  type InventionVersion,
  type MasteryTier,
} from "@/domains/chemistry/invention";
import { useAuthStore } from "@/store/authStore";
import { useProgressStore } from "@/store/progressStore";
import { syncInventionsToFirestore } from "@/lib/firebase/inventionsSync";
import { track } from "@/lib/analytics/track";

const MAX_INVENTIONS = 80;
const MAX_VERSIONS = 20;

function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `inv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function pushInventionsToCloud(starsDelta = 0) {
  const uid = useAuthStore.getState().user?.uid;
  if (!uid) return;
  const inventions = useInventionStore.getState().inventions;
  void syncInventionsToFirestore(uid, inventions, starsDelta)
    .then((res) => {
      if (res && typeof res.stars === "number") {
        useProgressStore.getState().setStarsFromServer({ stars: res.stars });
      }
    })
    .catch(() => {
      /* best-effort */
    });
}

function awardImproveStarsLocal(beatBest: boolean): number {
  if (!beatBest) return 0;
  const granted = 1;
  useProgressStore.setState((s) => ({
    stars: s.stars + granted,
  }));
  return granted;
}

interface InventionState {
  inventions: Invention[];
  shelfOpen: boolean;
  namingPending: {
    goalId: string;
    kind: InventionKind;
    coverVisualKind: GoalVisualKind;
    perfumeRecipeId?: string;
    snapshot: FormulaSnapshot;
    suggestedName: string;
    score: number;
    tier: MasteryTier;
    notes: string[];
  } | null;
  /** Active remix target — new versions append here */
  remixInventionId: string | null;
  compare: { inventionId: string; a: number; b: number } | null;
  /** Daily improve brief */
  dailyBriefKind: "improve" | "family" | null;
  dailyBriefAt: number;
  dailyBriefDoneAt: number;
  setShelfOpen: (open: boolean) => void;
  setCompare: (
    compare: { inventionId: string; a: number; b: number } | null,
  ) => void;
  beginNamingFromGoal: (input: {
    goalId: string;
    suggestedName: string;
    coverVisualKind: GoalVisualKind;
    perfumeRecipeId?: string;
    vessel: DeskVessel;
  }) => void;
  beginNamingFreeform: (input: {
    name: string;
    vessel: DeskVessel;
    perfumeNotes?: FormulaSnapshot["perfumeNotes"];
  }) => Invention | null;
  confirmName: (name: string) => Invention | null;
  skipNaming: () => void;
  addVersionFromVessel: (
    inventionId: string,
    vessel: DeskVessel,
  ) => { invention: Invention; version: InventionVersion; improved: boolean; starsGained: number } | null;
  renameInvention: (id: string, name: string) => void;
  deleteInvention: (id: string) => void;
  setRemixInventionId: (id: string | null) => void;
  hydrateInventions: (incoming: Invention[]) => void;
  ensureDailyBrief: () => {
    kind: "improve" | "family";
    message: string;
    inventionId?: string;
  } | null;
  markDailyBriefDone: () => void;
}

export const useInventionStore = create<InventionState>()(
  persist(
    (set, get) => ({
      inventions: [],
      shelfOpen: false,
      namingPending: null,
      remixInventionId: null,
      compare: null,
      dailyBriefKind: null,
      dailyBriefAt: 0,
      dailyBriefDoneAt: 0,

      setShelfOpen: (open) => set({ shelfOpen: open }),
      setCompare: (compare) => set({ compare }),
      setRemixInventionId: (id) => set({ remixInventionId: id }),

      beginNamingFromGoal: ({
        goalId,
        suggestedName,
        coverVisualKind,
        perfumeRecipeId,
        vessel,
      }) => {
        const snapshot = snapshotFromVessel(vessel);
        const scored = scoreInvention({
          snapshot,
          sourceGoalId: goalId,
          perfumeRecipeId: perfumeRecipeId ?? goalId,
        });
        set({
          namingPending: {
            goalId,
            kind: kindFromGoalId(goalId, coverVisualKind),
            coverVisualKind,
            perfumeRecipeId: perfumeRecipeId ?? undefined,
            snapshot,
            suggestedName,
            score: scored.score,
            tier: scored.tier,
            notes: scored.notes,
          },
        });
      },

      beginNamingFreeform: ({ name, vessel, perfumeNotes }) => {
        const snapshot = snapshotFromVessel(vessel);
        if (perfumeNotes) snapshot.perfumeNotes = perfumeNotes;
        const scored = scoreInvention({
          snapshot,
          kind: "perfume",
        });
        const now = Date.now();
        const version: InventionVersion = {
          version: 1,
          snapshot,
          score: scored.score,
          tier: scored.tier,
          notes: scored.notes,
          createdAt: now,
        };
        const invention: Invention = {
          id: newId(),
          name: name.trim() || "Untitled blend",
          kind: "perfume",
          coverVisualKind: "bottle",
          versions: [version],
          bestScore: scored.score,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({
          inventions: [invention, ...s.inventions].slice(0, MAX_INVENTIONS),
          namingPending: null,
        }));
        track("invention_named", {
          inventionId: invention.id,
          kind: "perfume",
          freeform: true,
          score: scored.score,
        });
        pushInventionsToCloud();
        return invention;
      },

      confirmName: (rawName) => {
        const pending = get().namingPending;
        if (!pending) return null;
        const name = rawName.trim() || pending.suggestedName || "My creation";
        const now = Date.now();
        const remixId = get().remixInventionId;

        // If remixing an existing invention, append version instead
        if (remixId) {
          const existing = get().inventions.find((i) => i.id === remixId);
          if (existing) {
            const vesselAsSnapshot = pending.snapshot;
            const scored = scoreInvention({
              snapshot: vesselAsSnapshot,
              sourceGoalId: existing.sourceGoalId ?? pending.goalId,
              perfumeRecipeId:
                existing.perfumeRecipeId ?? pending.perfumeRecipeId,
            });
            const prevBest = existing.bestScore;
            const improved = scored.score > prevBest;
            const nextVersion: InventionVersion = {
              version: existing.versions.length + 1,
              snapshot: vesselAsSnapshot,
              score: scored.score,
              tier: scored.tier,
              notes: scored.notes,
              createdAt: now,
            };
            const updated: Invention = {
              ...existing,
              name: name !== pending.suggestedName ? name : existing.name,
              versions: [...existing.versions, nextVersion].slice(
                -MAX_VERSIONS,
              ),
              bestScore: Math.max(existing.bestScore, scored.score),
              updatedAt: now,
            };
            set((s) => ({
              inventions: s.inventions.map((i) =>
                i.id === remixId ? updated : i,
              ),
              namingPending: null,
              remixInventionId: remixId,
            }));
            let starsGained = 0;
            if (improved) {
              starsGained = awardImproveStarsLocal(true);
              track("invention_improved", {
                inventionId: updated.id,
                score: scored.score,
                prevBest,
                starsGained,
              });
            }
            pushInventionsToCloud(starsGained);
            return updated;
          }
        }

        const version: InventionVersion = {
          version: 1,
          snapshot: pending.snapshot,
          score: pending.score,
          tier: pending.tier,
          notes: pending.notes,
          createdAt: now,
        };
        const invention: Invention = {
          id: newId(),
          name,
          kind: pending.kind,
          sourceGoalId: pending.goalId,
          perfumeRecipeId: pending.perfumeRecipeId,
          coverVisualKind: pending.coverVisualKind,
          versions: [version],
          bestScore: pending.score,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({
          inventions: [invention, ...s.inventions].slice(0, MAX_INVENTIONS),
          namingPending: null,
        }));
        track("invention_named", {
          inventionId: invention.id,
          kind: invention.kind,
          score: pending.score,
          tier: pending.tier,
        });
        pushInventionsToCloud();
        return invention;
      },

      skipNaming: () => set({ namingPending: null }),

      addVersionFromVessel: (inventionId, vessel) => {
        const existing = get().inventions.find((i) => i.id === inventionId);
        if (!existing) return null;
        const snapshot = snapshotFromVessel(vessel);
        const scored = scoreInvention({
          snapshot,
          sourceGoalId: existing.sourceGoalId,
          perfumeRecipeId: existing.perfumeRecipeId,
          kind: existing.kind,
        });
        const now = Date.now();
        const prevBest = existing.bestScore;
        const improved = scored.score > prevBest;
        const version: InventionVersion = {
          version: existing.versions.length + 1,
          snapshot,
          score: scored.score,
          tier: scored.tier,
          notes: scored.notes,
          createdAt: now,
        };
        const invention: Invention = {
          ...existing,
          versions: [...existing.versions, version].slice(-MAX_VERSIONS),
          bestScore: Math.max(existing.bestScore, scored.score),
          updatedAt: now,
        };
        set((s) => ({
          inventions: s.inventions.map((i) =>
            i.id === inventionId ? invention : i,
          ),
        }));
        let starsGained = 0;
        if (improved) {
          starsGained = awardImproveStarsLocal(true);
          track("invention_improved", {
            inventionId,
            score: scored.score,
            prevBest,
            starsGained,
          });
          const st = get();
          if (
            st.dailyBriefKind === "improve" &&
            st.dailyBriefDoneAt < st.dailyBriefAt
          ) {
            get().markDailyBriefDone();
          }
        }
        pushInventionsToCloud(starsGained);
        return { invention, version, improved, starsGained };
      },

      renameInvention: (id, name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set((s) => ({
          inventions: s.inventions.map((i) =>
            i.id === id ? { ...i, name: trimmed, updatedAt: Date.now() } : i,
          ),
        }));
        pushInventionsToCloud();
      },

      deleteInvention: (id) => {
        set((s) => ({
          inventions: s.inventions.filter((i) => i.id !== id),
          remixInventionId:
            s.remixInventionId === id ? null : s.remixInventionId,
          compare: s.compare?.inventionId === id ? null : s.compare,
        }));
        pushInventionsToCloud();
      },

      hydrateInventions: (incoming) => {
        if (!Array.isArray(incoming) || incoming.length === 0) return;
        set((s) => {
          const byId = new Map(s.inventions.map((i) => [i.id, i]));
          for (const inv of incoming) {
            if (!inv?.id || !inv.name || !Array.isArray(inv.versions)) continue;
            const prev = byId.get(inv.id);
            if (!prev || (inv.updatedAt ?? 0) >= (prev.updatedAt ?? 0)) {
              byId.set(inv.id, inv);
            }
          }
          return {
            inventions: Array.from(byId.values())
              .sort((a, b) => b.updatedAt - a.updatedAt)
              .slice(0, MAX_INVENTIONS),
          };
        });
      },

      ensureDailyBrief: () => {
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;
        const state = get();
        const sameDay =
          state.dailyBriefAt > 0 && now - state.dailyBriefAt < dayMs;
        const inventions = state.inventions;

        if (sameDay && state.dailyBriefKind) {
          if (state.dailyBriefDoneAt >= state.dailyBriefAt) return null;
          if (state.dailyBriefKind === "improve" && inventions[0]) {
            return {
              kind: "improve",
              message: `Beat your best score on “${inventions[0].name}”.`,
              inventionId: inventions[0].id,
            };
          }
          return {
            kind: "family",
            message: "Craft a citrus or floral scent and save it to your Shelf.",
          };
        }

        const kind: "improve" | "family" =
          inventions.length > 0 ? "improve" : "family";
        set({ dailyBriefKind: kind, dailyBriefAt: now });
        if (kind === "improve" && inventions[0]) {
          return {
            kind,
            message: `Beat your best score on “${inventions[0].name}”.`,
            inventionId: inventions[0].id,
          };
        }
        return {
          kind: "family",
          message: "Craft a citrus or floral scent and save it to your Shelf.",
        };
      },

      markDailyBriefDone: () => set({ dailyBriefDoneAt: Date.now() }),
    }),
    {
      name: "chemlab-inventions",
      version: 1,
      partialize: (s) => ({
        inventions: s.inventions,
        dailyBriefKind: s.dailyBriefKind,
        dailyBriefAt: s.dailyBriefAt,
        dailyBriefDoneAt: s.dailyBriefDoneAt,
      }),
    },
  ),
);
