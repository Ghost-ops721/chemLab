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

/** How close edges must be to magnet into a tidy side-by-side / stacked layout. */
export const SNAP_EDGE_PX = 36;
/** How close axes must be to snap into the same row or column. */
export const SNAP_ALIGN_PX = 44;
/** Gap left between snapped cards. */
export const SNAP_GAP_PX = 8;

export type VesselPosition = { x: number; y: number };

/**
 * If `pos` is near another vessel, return a tidy snapped position (aligned row
 * or column with a small gap). Returns null when nothing is close enough.
 */
export function snapAlignPosition(
  pos: VesselPosition,
  others: VesselPosition[],
  card = VESSEL_CARD,
): VesselPosition | null {
  if (others.length === 0) return null;

  const w = card.width;
  const h = card.height;
  let bestScore = Infinity;
  let bestX = pos.x;
  let bestY = pos.y;
  let found = false;

  const consider = (x: number, y: number, score: number) => {
    if (score < bestScore) {
      bestScore = score;
      bestX = x;
      bestY = y;
      found = true;
    }
  };

  for (const other of others) {
    const dx = pos.x - other.x;
    const dy = pos.y - other.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    const overlapW =
      Math.min(pos.x + w, other.x + w) - Math.max(pos.x, other.x);
    const overlapH =
      Math.min(pos.y + h, other.y + h) - Math.max(pos.y, other.y);
    const messyOverlap = overlapW > w * 0.12 && overlapH > h * 0.12;

    // Soft axis align when roughly in the same row / column (not stacked on top)
    if (!messyOverlap) {
      if (absDy <= SNAP_ALIGN_PX && absDx < w * 2.2) {
        consider(pos.x, other.y, absDy + absDx * 0.05);
      }
      if (absDx <= SNAP_ALIGN_PX && absDy < h * 2.2) {
        consider(other.x, pos.y, absDx + absDy * 0.05);
      }
    }

    // Side-by-side: right of other
    const gapRight = pos.x - (other.x + w);
    if (
      Math.abs(gapRight - SNAP_GAP_PX) <= SNAP_EDGE_PX &&
      absDy <= SNAP_ALIGN_PX * 1.4
    ) {
      consider(
        other.x + w + SNAP_GAP_PX,
        other.y,
        Math.abs(gapRight - SNAP_GAP_PX) + absDy,
      );
    }
    // Side-by-side: left of other
    const gapLeft = other.x - (pos.x + w);
    if (
      Math.abs(gapLeft - SNAP_GAP_PX) <= SNAP_EDGE_PX &&
      absDy <= SNAP_ALIGN_PX * 1.4
    ) {
      consider(
        other.x - w - SNAP_GAP_PX,
        other.y,
        Math.abs(gapLeft - SNAP_GAP_PX) + absDy,
      );
    }
    // Stacked: below other
    const gapBelow = pos.y - (other.y + h);
    if (
      Math.abs(gapBelow - SNAP_GAP_PX) <= SNAP_EDGE_PX &&
      absDx <= SNAP_ALIGN_PX * 1.4
    ) {
      consider(
        other.x,
        other.y + h + SNAP_GAP_PX,
        Math.abs(gapBelow - SNAP_GAP_PX) + absDx,
      );
    }
    // Stacked: above other
    const gapAbove = other.y - (pos.y + h);
    if (
      Math.abs(gapAbove - SNAP_GAP_PX) <= SNAP_EDGE_PX &&
      absDx <= SNAP_ALIGN_PX * 1.4
    ) {
      consider(
        other.x,
        other.y - h - SNAP_GAP_PX,
        Math.abs(gapAbove - SNAP_GAP_PX) + absDx,
      );
    }

    // Near-overlap / proximity: park beside (or above/below) instead of leaving a mess
    const near =
      (overlapW > -SNAP_EDGE_PX && overlapH > h * 0.2) ||
      (overlapH > -SNAP_EDGE_PX && overlapW > w * 0.2);
    if (near) {
      if (absDx >= absDy) {
        const toRight = dx >= 0;
        consider(
          toRight ? other.x + w + SNAP_GAP_PX : other.x - w - SNAP_GAP_PX,
          other.y,
          (messyOverlap ? 0 : 4) + absDy * 0.5,
        );
      } else {
        const below = dy >= 0;
        consider(
          other.x,
          below ? other.y + h + SNAP_GAP_PX : other.y - h - SNAP_GAP_PX,
          (messyOverlap ? 0 : 4) + absDx * 0.5,
        );
      }
    }
  }

  if (!found) return null;
  if (Math.abs(bestX - pos.x) < 0.5 && Math.abs(bestY - pos.y) < 0.5) {
    return null;
  }
  return {
    x: Math.max(8, bestX),
    y: Math.max(8, bestY),
  };
}