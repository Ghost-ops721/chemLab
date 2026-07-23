export type AnalyticsEventName =
  | "page_view"
  | "desk_place_equipment"
  | "desk_add_chemical"
  | "desk_mix"
  | "goal_start"
  | "goal_complete"
  | "auth_gate_shown"
  | "signup_complete"
  | "scan_upload"
  | "tutor_open";

export const ANALYTICS_EVENT_NAMES = new Set<string>([
  "page_view",
  "desk_place_equipment",
  "desk_add_chemical",
  "desk_mix",
  "goal_start",
  "goal_complete",
  "auth_gate_shown",
  "signup_complete",
  "scan_upload",
  "tutor_open",
]);
