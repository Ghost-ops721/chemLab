/** Shared SVG viewBox for all glassware: 0 0 100 140 */

export type GlassShapeId =
  | "beaker"
  | "flask"
  | "test-tube"
  | "graduated-cylinder";

export interface GlassGeometry {
  id: GlassShapeId;
  /** Outer silhouette path (for stroke / fill of glass body) */
  outline: string;
  /** Interior well used as clipPath for liquid */
  well: string;
  /** Optional rim highlight path */
  rim: string;
  /** Optional graduation tick marks */
  ticks?: string;
  /** Lip / pour spout tip in local SVG coords (for stream origin) */
  lip: { x: number; y: number };
  /** Mouth center (smoke / pour target) */
  mouth: { x: number; y: number };
  /** Liquid well bounding box for fill math */
  wellBounds: { x: number; y: number; width: number; height: number };
}

export const GLASS_SHAPES: Record<GlassShapeId, GlassGeometry> = {
  beaker: {
    id: "beaker",
    outline:
      "M22 28 L22 118 Q22 128 32 128 L68 128 Q78 128 78 118 L78 28 L84 22 L16 22 Z",
    well: "M26 30 L26 116 Q26 122 32 122 L68 122 Q74 122 74 116 L74 30 Z",
    rim: "M16 22 L84 22",
    ticks: "M28 50 H36 M28 70 H36 M28 90 H36 M28 110 H34",
    lip: { x: 84, y: 24 },
    mouth: { x: 50, y: 24 },
    wellBounds: { x: 26, y: 30, width: 48, height: 92 },
  },
  flask: {
    id: "flask",
    outline:
      "M42 18 L42 42 L22 118 Q20 128 30 128 L70 128 Q80 128 78 118 L58 42 L58 18 Z",
    well: "M44 28 L44 44 L26 114 Q25 122 32 122 L68 122 Q75 122 74 114 L56 44 L56 28 Z",
    rim: "M40 18 L60 18",
    lip: { x: 60, y: 18 },
    mouth: { x: 50, y: 18 },
    wellBounds: { x: 26, y: 28, width: 48, height: 94 },
  },
  "test-tube": {
    id: "test-tube",
    outline:
      "M38 12 L38 108 Q38 128 50 128 Q62 128 62 108 L62 12 Z",
    well: "M41 16 L41 106 Q41 122 50 122 Q59 122 59 106 L59 16 Z",
    rim: "M36 12 L64 12",
    lip: { x: 64, y: 14 },
    mouth: { x: 50, y: 12 },
    wellBounds: { x: 41, y: 16, width: 18, height: 106 },
  },
  "graduated-cylinder": {
    id: "graduated-cylinder",
    outline:
      "M34 14 L34 118 Q34 128 50 128 Q66 128 66 118 L66 14 L72 10 L28 10 Z",
    well: "M38 18 L38 116 Q38 122 50 122 Q62 122 62 116 L62 18 Z",
    rim: "M28 10 L72 10",
    ticks:
      "M40 40 H48 M40 55 H50 M40 70 H48 M40 85 H50 M40 100 H48",
    lip: { x: 72, y: 12 },
    mouth: { x: 50, y: 12 },
    wellBounds: { x: 38, y: 18, width: 24, height: 104 },
  },
};

export function resolveGlassShape(equipmentId: string): GlassGeometry {
  if (equipmentId in GLASS_SHAPES) {
    return GLASS_SHAPES[equipmentId as GlassShapeId];
  }
  return GLASS_SHAPES.beaker;
}
