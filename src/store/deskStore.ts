"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DeskVessel, EngineResult, VesselFx } from "@/types";
import { resolveDomain } from "@/domains/registry";
import { EQUIPMENT_BY_ID } from "@/domains/chemistry/data/equipment";
import { getChemical } from "@/domains/chemistry/data/chemicals";
import { labSound } from "@/desk/labSound";
import { assertLabActionAllowed, useAuthStore } from "@/store/authStore";

interface DeskState {
  vessels: DeskVessel[];
  activeVesselId: string | null;
  lastExplanationVesselId: string | null;
  placeEquipment: (
    equipmentId: string,
    position?: { x: number; y: number },
  ) => string | null;
  moveVessel: (vesselId: string, position: { x: number; y: number }) => void;
  addChemicalToVessel: (vesselId: string, chemicalId: string) => boolean;
  /** Pour contents from one vessel into another (up to capacity). */
  transferVesselContents: (fromId: string, toId: string) => boolean;
  attachHeat: (vesselId: string) => void;
  detachHeat: (vesselId: string) => void;
  toggleHeat: (vesselId: string) => void;
  stirVessel: (vesselId: string, autoMix?: boolean) => EngineResult | null;
  removeLastChemical: (vesselId: string) => void;
  removeVessel: (vesselId: string) => void;
  clearVessel: (vesselId: string) => void;
  /** Remove every vessel from the desk. */
  clearDesk: () => void;
  setActiveVessel: (id: string | null) => void;
  mixVessel: (vesselId: string) => EngineResult | null;
  shakeVessel: (vesselId: string) => EngineResult | null;
  seedDemoReaction: () => EngineResult | null;
  runPair: (
    equipmentId: string,
    a: string,
    b: string,
    heat?: boolean,
  ) => EngineResult | null;
}

function uid(): string {
  return `v-${Math.random().toString(36).slice(2, 10)}`;
}

function patchFx(fx: VesselFx | undefined, patch: VesselFx): VesselFx {
  return { ...fx, ...patch };
}

function resolveMix(vessel: DeskVessel): EngineResult {
  const functions = vessel.heatAttached ? ["heat-source"] : [];
  return resolveDomain("chemistry", {
    itemIds: vessel.contentIds,
    equipmentFunctions: functions,
  });
}

export const useDeskStore = create<DeskState>()(
  persist(
    (set, get) => ({
  vessels: [],
  activeVesselId: null,
  lastExplanationVesselId: null,

  placeEquipment: (equipmentId, position) => {
    const eq = EQUIPMENT_BY_ID[equipmentId];
    if (!eq) return null;

    if (eq.function === "heat-source") {
      const active = get().activeVesselId;
      if (active) {
        get().attachHeat(active);
        return active;
      }
      return null;
    }

    if (eq.function === "stirring") {
      const active = get().activeVesselId;
      if (active) {
        get().stirVessel(active, true);
        return active;
      }
      return null;
    }

    if (eq.function !== "container" && eq.function !== "measuring") {
      return null;
    }

    const instanceId = uid();
    const n = get().vessels.length;
    const vessel: DeskVessel = {
      instanceId,
      equipmentId,
      contentIds: [],
      heatAttached: false,
      stirLevel: 0,
      fx: {},
      position: position ?? {
        x: 48 + (n % 4) * 200,
        y: 56 + Math.floor(n / 4) * 220,
      },
    };
    labSound.place();
    set((s) => ({
      vessels: [...s.vessels, vessel],
      activeVesselId: instanceId,
    }));
    return instanceId;
  },

  moveVessel: (vesselId, position) => {
    set((s) => ({
      vessels: s.vessels.map((v) =>
        v.instanceId === vesselId
          ? {
              ...v,
              position: {
                x: Math.max(8, position.x),
                y: Math.max(8, position.y),
              },
            }
          : v,
      ),
    }));
  },

  addChemicalToVessel: (vesselId, chemicalId) => {
    if (!assertLabActionAllowed()) return false;

    let added = false;
    const color = getChemical(chemicalId)?.color;
    set((s) => ({
      vessels: s.vessels.map((v) => {
        if (v.instanceId !== vesselId) return v;
        const eq = EQUIPMENT_BY_ID[v.equipmentId];
        const cap = eq?.capacity ?? 3;
        if (v.contentIds.length >= cap) return v;
        if (v.contentIds.includes(chemicalId)) return v;
        added = true;
        return {
          ...v,
          contentIds: [...v.contentIds, chemicalId],
          lastResult: undefined,
          stirLevel: 0,
          fx: patchFx(v.fx, {
            pourAt: Date.now(),
            pourColor: color,
          }),
        };
      }),
      activeVesselId: vesselId,
    }));
    if (added) {
      labSound.pour();
      const auth = useAuthStore.getState();
      if (!auth.user) {
        auth.recordGuestChemicalAdd();
      }
    }
    return added;
  },

  transferVesselContents: (fromId, toId) => {
    if (!assertLabActionAllowed()) return false;
    if (fromId === toId) return false;
    const state = get();
    const from = state.vessels.find((v) => v.instanceId === fromId);
    const to = state.vessels.find((v) => v.instanceId === toId);
    if (!from || !to) return false;
    if (from.contentIds.length === 0) return false;

    const toEq = EQUIPMENT_BY_ID[to.equipmentId];
    const cap = toEq?.capacity ?? 3;
    const room = Math.max(0, cap - to.contentIds.length);
    if (room <= 0) return false;

    const moving = from.contentIds
      .filter((id) => !to.contentIds.includes(id))
      .slice(0, room);
    if (moving.length === 0) return false;

    const remaining = from.contentIds.filter((id) => !moving.includes(id));
    const pourColor =
      getChemical(moving[moving.length - 1]!)?.color ??
      getChemical(from.contentIds[from.contentIds.length - 1]!)?.color;
    const now = Date.now();

    labSound.pour();
    set((s) => ({
      vessels: s.vessels.map((v) => {
        if (v.instanceId === fromId) {
          return {
            ...v,
            contentIds: remaining,
            lastResult: undefined,
            stirLevel: 0,
            fx: patchFx(v.fx, {
              transferAt: now,
              transferFromId: fromId,
              transferToId: toId,
              transferRole: "source",
              pourColor,
            }),
          };
        }
        if (v.instanceId === toId) {
          return {
            ...v,
            contentIds: [...v.contentIds, ...moving],
            lastResult: undefined,
            stirLevel: 0,
            fx: patchFx(v.fx, {
              pourAt: now,
              pourColor,
              transferAt: now,
              transferFromId: fromId,
              transferToId: toId,
              transferRole: "target",
            }),
          };
        }
        return v;
      }),
      activeVesselId: toId,
    }));
    return true;
  },

  attachHeat: (vesselId) => {
    labSound.heat();
    set((s) => ({
      vessels: s.vessels.map((v) =>
        v.instanceId === vesselId
          ? {
              ...v,
              heatAttached: true,
              fx: patchFx(v.fx, { heatFlashAt: Date.now() }),
            }
          : v,
      ),
      activeVesselId: vesselId,
    }));
  },

  detachHeat: (vesselId) => {
    set((s) => ({
      vessels: s.vessels.map((v) =>
        v.instanceId === vesselId ? { ...v, heatAttached: false } : v,
      ),
    }));
  },

  toggleHeat: (vesselId) => {
    const v = get().vessels.find((x) => x.instanceId === vesselId);
    if (!v) return;
    if (v.heatAttached) get().detachHeat(vesselId);
    else get().attachHeat(vesselId);
  },

  stirVessel: (vesselId, autoMix = false) => {
    if (!assertLabActionAllowed()) return null;
    labSound.stir();
    const vessel = get().vessels.find((v) => v.instanceId === vesselId);
    if (!vessel) return null;

    const nextLevel = Math.min(3, vessel.stirLevel + 1);
    set((s) => ({
      vessels: s.vessels.map((v) =>
        v.instanceId === vesselId
          ? {
              ...v,
              stirLevel: nextLevel,
              fx: patchFx(v.fx, { stirAt: Date.now() }),
            }
          : v,
      ),
      activeVesselId: vesselId,
    }));

    const canMix =
      vessel.contentIds.length >= 2 ||
      (vessel.contentIds.length >= 1 && vessel.heatAttached);

    if (autoMix && canMix && nextLevel >= 2) {
      return get().mixVessel(vesselId);
    }
    return null;
  },

  removeLastChemical: (vesselId) => {
    labSound.clear();
    set((s) => ({
      vessels: s.vessels.map((v) => {
        if (v.instanceId !== vesselId || v.contentIds.length === 0) return v;
        return {
          ...v,
          contentIds: v.contentIds.slice(0, -1),
          lastResult: undefined,
          stirLevel: 0,
        };
      }),
    }));
  },

  removeVessel: (vesselId) => {
    labSound.clear();
    set((s) => ({
      vessels: s.vessels.filter((v) => v.instanceId !== vesselId),
      activeVesselId:
        s.activeVesselId === vesselId ? null : s.activeVesselId,
    }));
  },

  clearVessel: (vesselId) => {
    labSound.clear();
    set((s) => ({
      vessels: s.vessels.map((v) =>
        v.instanceId === vesselId
          ? {
              ...v,
              contentIds: [],
              lastResult: undefined,
              heatAttached: false,
              stirLevel: 0,
              fx: {},
            }
          : v,
      ),
    }));
  },

  clearDesk: () => {
    labSound.clear();
    set({
      vessels: [],
      activeVesselId: null,
      lastExplanationVesselId: null,
    });
  },

  setActiveVessel: (id) => set({ activeVesselId: id }),

  mixVessel: (vesselId) => {
    if (!assertLabActionAllowed()) return null;
    const vessel = get().vessels.find((v) => v.instanceId === vesselId);
    if (!vessel || vessel.contentIds.length < 1) return null;

    const result = resolveMix(vessel);
    if (result.effects.some((e) => e.kind === "hazard")) labSound.hazard();
    else labSound.mix();

    set((s) => ({
      vessels: s.vessels.map((v) =>
        v.instanceId === vesselId
          ? {
              ...v,
              lastResult: result,
              stirLevel: Math.max(v.stirLevel, 1),
              fx: patchFx(v.fx, {
                mixAt: Date.now(),
                shakeAt: Date.now(),
                stirAt: Date.now(),
              }),
            }
          : v,
      ),
      lastExplanationVesselId: vesselId,
      activeVesselId: vesselId,
    }));

    return result;
  },

  shakeVessel: (vesselId) => {
    if (!assertLabActionAllowed()) return null;
    const vessel = get().vessels.find((v) => v.instanceId === vesselId);
    if (!vessel) return null;
    labSound.shake();
    set((s) => ({
      vessels: s.vessels.map((v) =>
        v.instanceId === vesselId
          ? {
              ...v,
              fx: patchFx(v.fx, { shakeAt: Date.now() }),
              stirLevel: Math.min(3, v.stirLevel + 1),
            }
          : v,
      ),
      activeVesselId: vesselId,
    }));
    // Shake agitates only — press Mix to react
    return null;
  },

  seedDemoReaction: () => {
    if (!assertLabActionAllowed()) return null;
    set({ vessels: [], activeVesselId: null, lastExplanationVesselId: null });
    const id = get().placeEquipment("beaker", { x: 140, y: 90 });
    if (!id) return null;
    get().addChemicalToVessel(id, "hcl");
    get().addChemicalToVessel(id, "naoh");
    get().stirVessel(id);
    return get().mixVessel(id);
  },

  runPair: (equipmentId: string, a: string, b: string, heat = false) => {
    if (!assertLabActionAllowed()) return null;
    set({ vessels: [], activeVesselId: null, lastExplanationVesselId: null });
    const id = get().placeEquipment(equipmentId, { x: 140, y: 90 });
    if (!id) return null;
    get().addChemicalToVessel(id, a);
    get().addChemicalToVessel(id, b);
    if (heat) get().attachHeat(id);
    get().stirVessel(id);
    return get().mixVessel(id);
  },
    }),
    {
      name: "reactolab-desk",
      partialize: (s) => ({
        vessels: s.vessels.map((v) => ({ ...v, fx: {} })),
        activeVesselId: s.activeVesselId,
        lastExplanationVesselId: s.lastExplanationVesselId,
      }),
    },
  ),
);
