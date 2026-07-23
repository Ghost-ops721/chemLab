import type { VesselContent } from "@/types";
import type {
  IfraOverallStatus,
  IfraProductCategoryId,
} from "@/domains/chemistry/ifra";

export type MarketBadge = "screened" | "experimental";

export interface PublishedFormulaIfra {
  status: IfraOverallStatus;
  category: IfraProductCategoryId;
  version: string;
  screened: boolean;
}

export interface PublishedFormula {
  id: string;
  title: string;
  description: string;
  authorUid: string;
  authorName: string;
  contents: VesselContent[];
  equipmentId: string;
  scentVerdict?: string;
  scentSummary?: string;
  bottleColor?: string;
  ifra: PublishedFormulaIfra;
  badge: MarketBadge;
  createdAt: number;
  updatedAt: number;
  studyId?: string;
}

export interface PublishFormulaInput {
  title: string;
  description?: string;
  contents: VesselContent[];
  equipmentId: string;
  scentVerdict?: string;
  scentSummary?: string;
  bottleColor?: string;
  ifra: PublishedFormulaIfra;
}

export type StudyMode = "blind" | "labeled";

export interface StudyAggregate {
  count: number;
  liking: number;
  harshness: number;
  longevityGuess: number;
  clarity: number;
  uniqueness: number;
}

export interface Study {
  id: string;
  formulaId: string;
  creatorUid: string;
  creatorName: string;
  mode: StudyMode;
  title: string;
  /** Shown to panelists only when mode === "labeled" */
  formulaLabel?: string;
  bottleColor?: string;
  contents?: VesselContent[];
  createdAt: number;
  updatedAt: number;
  aggregate: StudyAggregate;
}

export interface StudyRatingScores {
  liking: number;
  harshness: number;
  longevityGuess: number;
  clarity: number;
  uniqueness: number;
}

export interface StudyRating extends StudyRatingScores {
  id: string;
  studyId: string;
  raterUid: string;
  createdAt: number;
}

export const EMPTY_STUDY_AGGREGATE: StudyAggregate = {
  count: 0,
  liking: 0,
  harshness: 0,
  longevityGuess: 0,
  clarity: 0,
  uniqueness: 0,
};

export function marketBadgeFromIfra(
  status: IfraOverallStatus,
): MarketBadge {
  return status === "pass" ? "screened" : "experimental";
}
