export type {
  IfraProductCategoryId,
  IfraIngredientStatus,
  IfraOverallStatus,
  IfraProductCategory,
  IfraStandardEntry,
  IfraIngredientCheck,
  IfraComplianceResult,
} from "./types";

export {
  IFRA_DISCLAIMER,
  IFRA_STANDARDS_VERSION,
} from "./types";

export {
  IFRA_PRODUCT_CATEGORIES,
  IFRA_CATEGORY_BY_ID,
  IFRA_STANDARDS_SEED,
  lookupIfraEntry,
} from "./seed";

export {
  checkIfraCompliance,
  type CheckIfraComplianceInput,
} from "./checkIfraCompliance";
