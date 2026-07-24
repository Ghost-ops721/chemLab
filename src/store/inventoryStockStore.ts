"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CHEMICALS, getChemical } from "@/domains/chemistry/data/chemicals";
import { defaultPourMl } from "@/desk/vesselContents";

/** Starting teaching stock (ml) per chemical category. */
export function defaultStockMl(chemicalId: string): number {
  const c = getChemical(chemicalId);
  if (!c) return 50;
  if (c.subcategory === "fragrance" || c.tags.includes("perfume")) return 20;
  if (c.id === "c2h5oh" || c.id === "h2o") return 100;
  if (c.state === "gas") return 40;
  if (c.state === "solid") return 50;
  return 80;
}

function buildFullStock(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const c of CHEMICALS) {
    out[c.id] = defaultStockMl(c.id);
  }
  return out;
}

interface InventoryStockState {
  stockMlByChemicalId: Record<string, number>;
  stockMl: (chemicalId: string) => number;
  /** Returns false if not enough stock. */
  tryConsume: (chemicalId: string, amountMl: number) => boolean;
  restockAll: () => void;
  restockChemical: (chemicalId: string) => void;
}

export const useInventoryStockStore = create<InventoryStockState>()(
  persist(
    (set, get) => ({
      stockMlByChemicalId: buildFullStock(),
      stockMl: (chemicalId) => {
        const map = get().stockMlByChemicalId;
        if (chemicalId in map) return map[chemicalId]!;
        return defaultStockMl(chemicalId);
      },
      tryConsume: (chemicalId, amountMl) => {
        const need = Math.max(0, amountMl);
        if (need < 0.05) return true;
        const have = get().stockMl(chemicalId);
        if (have + 0.05 < need) return false;
        set((s) => ({
          stockMlByChemicalId: {
            ...s.stockMlByChemicalId,
            [chemicalId]: Math.round((have - need) * 100) / 100,
          },
        }));
        return true;
      },
      restockAll: () => set({ stockMlByChemicalId: buildFullStock() }),
      restockChemical: (chemicalId) =>
        set((s) => ({
          stockMlByChemicalId: {
            ...s.stockMlByChemicalId,
            [chemicalId]: defaultStockMl(chemicalId),
          },
        })),
    }),
    {
      name: "chemlab-inventory-stock",
      version: 1,
      migrate: (persisted) => {
        const state = persisted as {
          stockMlByChemicalId?: Record<string, number>;
        };
        const base = buildFullStock();
        return {
          stockMlByChemicalId: {
            ...base,
            ...(state.stockMlByChemicalId ?? {}),
          },
        };
      },
    },
  ),
);

/** Max pour limited by stock + vessel room. */
export function maxPourLimitedByStock(
  chemicalId: string,
  vesselRoomMl: number,
  requestedMl?: number,
): number {
  const stock = useInventoryStockStore.getState().stockMl(chemicalId);
  const want = requestedMl ?? defaultPourMl(chemicalId);
  return Math.max(0, Math.min(stock, vesselRoomMl, want));
}
