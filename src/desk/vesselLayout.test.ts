import { describe, expect, it } from "vitest";
import {
  SNAP_GAP_PX,
  snapAlignPosition,
  VESSEL_CARD,
} from "@/desk/vesselLayout";

describe("snapAlignPosition", () => {
  it("aligns Y when cards are nearly in the same row", () => {
    const other = { x: 40, y: 80 };
    const pos = { x: 40 + VESSEL_CARD.width + 20, y: 80 + 12 };
    const snapped = snapAlignPosition(pos, [other]);
    expect(snapped).not.toBeNull();
    expect(snapped!.y).toBe(80);
  });

  it("parks beside a near-overlapping neighbor", () => {
    const other = { x: 100, y: 100 };
    const pos = { x: 120, y: 108 };
    const snapped = snapAlignPosition(pos, [other]);
    expect(snapped).not.toBeNull();
    expect(snapped!.x).toBe(100 + VESSEL_CARD.width + SNAP_GAP_PX);
    expect(snapped!.y).toBe(100);
  });

  it("returns null when nothing is nearby", () => {
    const snapped = snapAlignPosition({ x: 400, y: 400 }, [
      { x: 40, y: 40 },
    ]);
    expect(snapped).toBeNull();
  });
});
