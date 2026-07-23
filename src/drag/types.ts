export const PANEL_CHEMICAL = "panel-chemical";
export const PANEL_EQUIPMENT = "panel-equipment";
export const DESK_SURFACE = "desk-surface";
export const vesselDropId = (instanceId: string) => `vessel-${instanceId}`;

export type DragPayload =
  | { type: "chemical"; itemId: string }
  | { type: "equipment"; itemId: string };

export function parseVesselId(droppableId: string): string | null {
  if (!droppableId.startsWith("vessel-")) return null;
  return droppableId.slice("vessel-".length);
}
