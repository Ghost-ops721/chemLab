/** Domain-agnostic base types. Shared desk/drag/animation/gamification use only these. */

export type DomainId = string;

export interface Item {
  id: string;
  name: string;
  domain: DomainId;
  category: string;
  subcategory: string;
  tags: string[];
  icon: string;
}

export type EngineEffectKind =
  | "color"
  | "gas"
  | "precipitate"
  | "heat"
  | "hazard"
  | "smoke";

export interface EngineEffect {
  kind: EngineEffectKind;
  /** CSS color for color/heat glow, or descriptive token */
  value?: string;
  /** exo | endo for heat; severity for hazard */
  intensity?: "low" | "medium" | "high" | "exo" | "endo";
  messageKey?: string;
}

export interface EngineInput {
  itemIds: string[];
  /** Equipment function present (e.g. heat-source) */
  equipmentFunctions?: string[];
}

export interface EngineResult {
  ok: boolean;
  products: Item[];
  label?: string;
  effects: EngineEffect[];
  explanationKey?: string;
  discoveryId: string;
}

export interface DomainModule {
  id: DomainId;
  label: string;
  getItems: () => Item[];
  getEquipment: () => Item[];
  resolve: (input: EngineInput) => EngineResult;
}

/** Ephemeral bench FX timestamps (ms) — drive CSS one-shots */
export interface VesselFx {
  pourAt?: number;
  stirAt?: number;
  shakeAt?: number;
  mixAt?: number;
  heatFlashAt?: number;
  /** Last poured chemical color for splash tint */
  pourColor?: string;
  /** Optional desk-local origin of a pour stream */
  pourFrom?: { x: number; y: number };
  /** Vessel→vessel transfer window */
  transferAt?: number;
  transferFromId?: string;
  transferToId?: string;
  /** Role during an active transfer */
  transferRole?: "source" | "target";
}

/** Instance of equipment placed on the desk */
export interface DeskVessel {
  instanceId: string;
  equipmentId: string;
  contentIds: string[];
  /** Heat source attached to this vessel */
  heatAttached: boolean;
  /** How vigorously the liquid has been stirred (0–3) */
  stirLevel: number;
  lastResult?: EngineResult;
  position: { x: number; y: number };
  fx: VesselFx;
}
