/** IFRA Standards–aligned teaching types (not certified compliance). */

export type IfraProductCategoryId =
  | "cat4" // Fine fragrance (hydroalcoholic)
  | "cat5a" // Body lotion / leave-on body
  | "cat5b" // Face moisturizer
  | "cat9" // Soap / rinse-off
  | "cat11a"; // Candles / incidental air care

export type IfraIngredientStatus = "pass" | "fail" | "unknown";

export type IfraOverallStatus = "pass" | "fail" | "unknown";

export interface IfraProductCategory {
  id: IfraProductCategoryId;
  label: string;
  shortLabel: string;
  description: string;
}

export interface IfraStandardEntry {
  /** Prefer chemicalId for Chem Lab oils; CAS used as secondary key. */
  chemicalId?: string;
  casNumber?: string;
  name: string;
  /** Max % in finished product by category (w/w teaching approx). */
  limitsByCategory: Partial<Record<IfraProductCategoryId, number>>;
  notes?: string;
}

export interface IfraIngredientCheck {
  chemicalId: string;
  name: string;
  casNumber?: string;
  actualPct: number;
  maxPct?: number;
  status: IfraIngredientStatus;
  message: string;
}

export interface IfraComplianceResult {
  version: string;
  category: IfraProductCategoryId;
  categoryLabel: string;
  status: IfraOverallStatus;
  ingredients: IfraIngredientCheck[];
  disclaimer: string;
  screened: boolean;
}

export const IFRA_DISCLAIMER =
  "Educational IFRA Standards–aligned screening only — not a certified compliance assessment. Always verify against the official IFRA Standards for real products.";

export const IFRA_STANDARDS_VERSION = "49th-Amendment-teaching";
