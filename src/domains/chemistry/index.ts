import type { DomainModule, EngineInput, EngineResult, Item } from "@/types";
import { CHEMICALS, getChemical } from "./data/chemicals";
import { EQUIPMENT } from "./data/equipment";
import { resolveChemistry } from "./engine/resolve";
import { adaptReactionResult } from "./adapt";

export const chemistryDomain: DomainModule = {
  id: "chemistry",
  label: "Chemistry",
  getItems: () => CHEMICALS as Item[],
  getEquipment: () => EQUIPMENT as Item[],
  resolve: (input: EngineInput): EngineResult => {
    const chemicals = input.itemIds
      .map((id) => getChemical(id))
      .filter((c): c is NonNullable<typeof c> => Boolean(c));

    const hasHeat = Boolean(
      input.equipmentFunctions?.includes("heat-source"),
    );
    const hasCool = Boolean(
      input.equipmentFunctions?.includes("cold-source"),
    );

    const result = resolveChemistry(chemicals, { hasHeat, hasCool });
    return adaptReactionResult(
      result,
      chemicals.map((c) => c.id),
    );
  },
};
