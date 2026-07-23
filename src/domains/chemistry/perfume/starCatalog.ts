import type { StarShopItem } from "./types";

/**
 * Virtual star catalog (20–150★). Unlock-only preview — no payments/shipping.
 */
export const STAR_CATALOG: StarShopItem[] = [
  {
    id: "bottle-amber-glass",
    title: "Amber Glass Bottle",
    description: "Warm amber perfume bottle skin for your pack preview.",
    price: 20,
    category: "bottle-skin",
    icon: "🧴",
  },
  {
    id: "bottle-crystal-clear",
    title: "Crystal Clear Flacon",
    description: "High-clarity glass flacon for atelier pack shots.",
    price: 30,
    category: "bottle-skin",
    icon: "💎",
  },
  {
    id: "desk-marble",
    title: "Marble Desk Theme",
    description: "Soft marble desk wash behind your vessels.",
    price: 40,
    category: "desk-theme",
    icon: "🪨",
  },
  {
    id: "note-oud-unlock",
    title: "Rare Oud Highlight",
    description: "Spotlight badge for oud blends in the atelier.",
    price: 50,
    category: "rare-note",
    icon: "🖤",
  },
  {
    id: "spray-gold-mist",
    title: "Gold Mist Spray FX",
    description: "Golden particle spray when you celebrate a perfume.",
    price: 75,
    category: "spray-fx",
    icon: "✨",
  },
  {
    id: "bottle-noir-luxe",
    title: "Noir Luxe Bottle",
    description: "Matte black luxury bottle skin.",
    price: 100,
    category: "bottle-skin",
    icon: "🖤",
  },
  {
    id: "desk-night-lab",
    title: "Night Lab Theme",
    description: "Deep-night desk lighting for late sessions.",
    price: 125,
    category: "desk-theme",
    icon: "🌙",
  },
  {
    id: "spray-rainbow",
    title: "Prism Spray FX",
    description: "Iridescent spray celebration for masterpieces.",
    price: 150,
    category: "spray-fx",
    icon: "🌈",
  },
];

export const STAR_CATALOG_BY_ID: Record<string, StarShopItem> =
  Object.fromEntries(STAR_CATALOG.map((i) => [i.id, i]));

export function getStarShopItem(id: string): StarShopItem | undefined {
  return STAR_CATALOG_BY_ID[id];
}
