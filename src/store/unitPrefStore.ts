"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AmountUnit } from "@/desk/unitDisplay";

interface UnitPrefState {
  unit: AmountUnit;
  setUnit: (unit: AmountUnit) => void;
  cycleUnit: () => void;
}

const ORDER: AmountUnit[] = ["ml", "g", "mmol"];

export const useUnitPrefStore = create<UnitPrefState>()(
  persist(
    (set, get) => ({
      unit: "ml",
      setUnit: (unit) => set({ unit }),
      cycleUnit: () => {
        const i = ORDER.indexOf(get().unit);
        set({ unit: ORDER[(i + 1) % ORDER.length]! });
      },
    }),
    { name: "chemlab-amount-unit" },
  ),
);
