/** Shared vessel card geometry — keep layout, overlap, and pour streams in sync. */

export const VESSEL_CARD = {
  /** Matches `w-[11.5rem]` on VesselSlot (11.5 * 16 = 184). */
  width: 184,
  /** Approximate card height including chrome + glass + actions. */
  height: 280,
  /** Horizontal padding inside card before the SVG glass. */
  glassInsetX: 10,
  /** Offset from card top to the glass SVG. */
  glassTop: 36,
  /** Glass SVG render height in the slot. */
  glassH: 150,
} as const;

export const LAB_GLASS_FALLBACK = "var(--lab-glass, #8fc0b5)";
