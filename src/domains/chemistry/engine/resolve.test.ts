import { describe, expect, it } from "vitest";
import { resolveDomain } from "@/domains/registry";
import { balanceEquation, parseFormula } from "@/domains/chemistry/engine/balance";
import { resolveChemistry } from "@/domains/chemistry/engine/resolve";
import { getChemical } from "@/domains/chemistry/data/chemicals";

function chem(...ids: string[]) {
  return ids.map((id) => {
    const c = getChemical(id);
    if (!c) throw new Error(`missing ${id}`);
    return c;
  });
}

describe("parseFormula / balance", () => {
  it("parses nested parentheses", () => {
    expect(parseFormula("Ca(OH)2")).toEqual({ Ca: 1, O: 2, H: 2 });
    expect(parseFormula("Pb(NO3)2")).toEqual({ Pb: 1, N: 2, O: 6 });
  });

  it("balances combustion of methane", () => {
    const b = balanceEquation(["CH4", "O2"], ["CO2", "H2O"]);
    expect(b?.label).toBe("CH4 + 2O2 → CO2 + 2H2O");
  });
});

describe("reaction engine", () => {
  it("neutralizes HCl + NaOH", () => {
    const r = resolveChemistry(chem("hcl", "naoh"));
    expect(r.ok).toBe(true);
    expect(r.reactionType).toBe("neutralization");
    expect(r.balancedEquation).toContain("NaCl");
    expect(r.balancedEquation).toContain("H2O");
  });

  it("single-displaces Zn + HCl → ZnCl2 + H2", () => {
    const r = resolveChemistry(chem("zn", "hcl"));
    expect(r.ok).toBe(true);
    expect(r.reactionType).toBe("single-displacement");
    expect(r.gasReleased).toBe(true);
    expect(r.balancedEquation).toMatch(/ZnCl2/);
    expect(r.balancedEquation).toMatch(/H2/);
  });

  it("precipitates AgNO3 + NaCl → AgCl", () => {
    const r = resolveChemistry(chem("agno3", "nacl"));
    expect(r.ok).toBe(true);
    expect(r.reactionType).toBe("precipitation");
    expect(r.precipitateFormed).toBe(true);
    expect(r.balancedEquation).toMatch(/AgCl/);
  });

  it("combusts CH4 + O2 with heat", () => {
    const r = resolveChemistry(chem("ch4", "o2"), { hasHeat: true });
    expect(r.ok).toBe(true);
    expect(r.reactionType).toBe("combustion");
    expect(r.heatReleased).toBe("exo");
    expect(r.balancedEquation).toMatch(/CO2/);
  });

  it("blocks sodium + water as hazard", () => {
    const r = resolveChemistry(chem("na", "h2o"));
    expect(r.ok).toBe(false);
    expect(r.reactionType).toBe("hazard");
    expect(r.hazardTriggered).toBe(true);
  });

  it("redox Zn + CuSO4", () => {
    const r = resolveChemistry(chem("zn", "cuso4"));
    expect(r.ok).toBe(true);
    expect(["redox", "single-displacement"]).toContain(r.reactionType);
    expect(r.balancedEquation).toMatch(/ZnSO4/);
    expect(r.balancedEquation).toMatch(/Cu/);
  });

  it("adapts through domain registry", () => {
    const er = resolveDomain("chemistry", { itemIds: ["hcl", "naoh"] });
    expect(er.ok).toBe(true);
    expect(er.label).toBeTruthy();
    expect(er.discoveryId).toContain("neutralization");
  });
});
