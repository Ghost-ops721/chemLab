import { describe, expect, it } from "vitest";
import { tokenizeEquation, equationFromRaw } from "@/domains/chemistry/knowledge/tokenize";
import { lookupKnowledge } from "@/domains/chemistry/knowledge/lookup";

describe("tokenizeEquation", () => {
  it("splits neutralization into hoverable pieces", () => {
    const tokens = tokenizeEquation("HCl + NaOH → NaCl + H2O");
    const texts = tokens.map((t) => t.text);
    expect(texts).toEqual(
      expect.arrayContaining(["H", "Cl", "+", "Na", "OH", "→", "2"]),
    );
    expect(tokens.some((t) => t.species === "NaOH")).toBe(true);
    expect(tokens.some((t) => t.lookupKey === "OH-")).toBe(true);
    expect(tokens.some((t) => t.species === "H2O")).toBe(true);
  });

  it("keeps coefficients", () => {
    const tokens = tokenizeEquation("2HCl + Zn → ZnCl2 + H2");
    expect(tokens.some((t) => t.kind === "coefficient" && t.text === "2")).toBe(
      true,
    );
  });

  it("handles groups Ca(OH)2", () => {
    const eq = equationFromRaw("Ca(OH)2");
    expect(eq.tokens.some((t) => t.kind === "group-open")).toBe(true);
    expect(eq.tokens.some((t) => t.text === "OH")).toBe(true);
  });

  it("groups polyatomic SO4", () => {
    const tokens = tokenizeEquation("CuSO4");
    expect(tokens.some((t) => t.text === "SO4" && t.lookupKey === "SO4 2-")).toBe(
      true,
    );
  });
});

describe("lookupKnowledge", () => {
  it("resolves common compounds", () => {
    expect(lookupKnowledge("H2O").kind).toBe("compound");
    expect(lookupKnowledge("NaOH").title).toMatch(/hydroxide/i);
    expect(lookupKnowledge("AgNO3").kind).toBe("compound");
  });

  it("resolves elements and ions", () => {
    expect(lookupKnowledge("Zn").kind).toBe("element");
    expect(lookupKnowledge("Cl-").kind).toBe("ion");
    expect(lookupKnowledge("SO4 2-").kind).toBe("ion");
  });

  it("strips leading coefficients", () => {
    expect(lookupKnowledge("2HCl").kind).toBe("compound");
  });
});
