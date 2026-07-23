import { describe, expect, it } from "vitest";
import {
  canCraftFreeform,
  matchPerfumeRecipe,
  tryPerfumeCraft,
} from "@/domains/chemistry/engine/perfumeCraft";
import { getChemical } from "@/domains/chemistry/data/chemicals";
import { PERFUME_RECIPES } from "@/domains/chemistry/perfume";

function chem(...ids: string[]) {
  return ids.map((id) => {
    const c = getChemical(id);
    if (!c) throw new Error(`missing ${id}`);
    return c;
  });
}

describe("perfumeCraft", () => {
  it("ships at least 50 inspired recipes", () => {
    expect(PERFUME_RECIPES.length).toBeGreaterThanOrEqual(50);
  });

  it("matches Havas-style from signature notes", () => {
    const r = tryPerfumeCraft(
      chem("c2h5oh", "cardamom-oil", "saffron-note", "oud-oil"),
    );
    expect(r?.ok).toBe(true);
    expect(r?.explanationKey).toBe("product-perfume:inspired-havas");
    expect(matchPerfumeRecipe(chem("c2h5oh", "cardamom-oil", "saffron-note", "oud-oil"))?.id).toBe(
      "inspired-havas",
    );
  });

  it("matches 1 Million-style", () => {
    const r = tryPerfumeCraft(
      chem("c2h5oh", "grapefruit-oil", "cinnamon-oil", "leather-note"),
    );
    expect(r?.ok).toBe(true);
    expect(r?.explanationKey).toContain("inspired-1million");
  });

  it("crafts freeform with top+heart+base", () => {
    const inputs = chem("c2h5oh", "bergamot-oil", "rose-oil", "sandalwood-oil");
    expect(canCraftFreeform(inputs)).toBe(true);
    const r = tryPerfumeCraft(inputs);
    expect(r?.ok).toBe(true);
    expect(r?.explanationKey).toBe("product-perfume:custom");
  });

  it("does not freeform without a base note", () => {
    expect(
      canCraftFreeform(chem("c2h5oh", "bergamot-oil", "rose-oil")),
    ).toBe(false);
  });

  it("every recipe's required chemicals exist", () => {
    for (const recipe of PERFUME_RECIPES) {
      for (const id of recipe.requiredChemicalIds) {
        expect(getChemical(id), `missing ${id} for ${recipe.id}`).toBeTruthy();
      }
    }
  });
});
