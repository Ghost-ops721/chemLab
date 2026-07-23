/** Common ions for formula hover / OCR linking. */

export interface IonKnowledge {
  symbol: string;
  name: string;
  charge: number;
  type: "cation" | "anion" | "polyatomic";
  summary: string;
  relatedFormulas: string[];
}

export const IONS: IonKnowledge[] = [
  { symbol: "H+", name: "Hydrogen ion / proton", charge: 1, type: "cation", summary: "What acids donate in water. Often written H₃O⁺ (hydronium) in reality.", relatedFormulas: ["H3O+", "HCl", "H2SO4"] },
  { symbol: "H3O+", name: "Hydronium", charge: 1, type: "polyatomic", summary: "H⁺ attached to water — the true form of acidity in aqueous solution.", relatedFormulas: ["H+", "H2O"] },
  { symbol: "Na+", name: "Sodium ion", charge: 1, type: "cation", summary: "Alkali-metal cation; always soluble partner in salts.", relatedFormulas: ["NaCl", "NaOH", "Na2CO3"] },
  { symbol: "K+", name: "Potassium ion", charge: 1, type: "cation", summary: "Alkali cation; lilac flame test.", relatedFormulas: ["KCl", "KI", "KOH"] },
  { symbol: "NH4+", name: "Ammonium", charge: 1, type: "polyatomic", summary: "The only common polyatomic cation in intro chem. Behaves like alkali metals for solubility.", relatedFormulas: ["NH3", "NH4Cl"] },
  { symbol: "Ag+", name: "Silver ion", charge: 1, type: "cation", summary: "Forms insoluble halides — classic precip tests.", relatedFormulas: ["AgNO3", "AgCl", "AgBr", "AgI"] },
  { symbol: "Ca2+", name: "Calcium ion", charge: 2, type: "cation", summary: "Group 2 cation; bones, lime, hard water.", relatedFormulas: ["CaCl2", "CaCO3", "Ca(OH)2"] },
  { symbol: "Ba2+", name: "Barium ion", charge: 2, type: "cation", summary: "Used to test for sulfate as white BaSO₄.", relatedFormulas: ["BaCl2", "BaSO4", "Ba(OH)2"] },
  { symbol: "Mg2+", name: "Magnesium ion", charge: 2, type: "cation", summary: "Light alkaline-earth cation; chlorophyll uses Mg²⁺.", relatedFormulas: ["MgSO4", "Mg(OH)2"] },
  { symbol: "Cu2+", name: "Copper(II) ion", charge: 2, type: "cation", summary: "Gives blue aqueous solutions; reduced by more reactive metals.", relatedFormulas: ["CuSO4", "Cu", "Cu(OH)2"] },
  { symbol: "Fe2+", name: "Iron(II) ion", charge: 2, type: "cation", summary: "Pale green solutions; oxidizes to Fe³⁺ in air.", relatedFormulas: ["FeSO4", "Fe"] },
  { symbol: "Fe3+", name: "Iron(III) ion", charge: 3, type: "cation", summary: "Yellow-brown aqueous color; forms Fe(OH)₃ gel ppt.", relatedFormulas: ["Fe", "Fe2+"] },
  { symbol: "Zn2+", name: "Zinc ion", charge: 2, type: "cation", summary: "Colorless; product when Zn metal dissolves in acid.", relatedFormulas: ["Zn", "ZnCl2", "ZnSO4"] },
  { symbol: "Pb2+", name: "Lead(II) ion", charge: 2, type: "cation", summary: "Toxic heavy metal ion; yellow PbI₂ ppt.", relatedFormulas: ["Pb(NO3)2", "PbI2", "PbCl2"] },
  { symbol: "Al3+", name: "Aluminum ion", charge: 3, type: "cation", summary: "High charge density; amphoteric hydroxide.", relatedFormulas: ["Al", "AlCl3"] },
  { symbol: "Cl-", name: "Chloride", charge: -1, type: "anion", summary: "Halide from HCl/NaCl. Precipitates with Ag⁺.", relatedFormulas: ["HCl", "NaCl", "AgCl"] },
  { symbol: "Br-", name: "Bromide", charge: -1, type: "anion", summary: "Halide; cream AgBr ppt.", relatedFormulas: ["NaBr", "AgBr"] },
  { symbol: "I-", name: "Iodide", charge: -1, type: "anion", summary: "Halide; yellow AgI / PbI₂. Oxidized by Cl₂ to I₂.", relatedFormulas: ["KI", "PbI2", "I2"] },
  { symbol: "OH-", name: "Hydroxide", charge: -1, type: "anion", summary: "Defines bases. Combines with H⁺ to make water.", relatedFormulas: ["NaOH", "KOH", "H2O"] },
  { symbol: "NO3-", name: "Nitrate", charge: -1, type: "polyatomic", summary: "Almost always soluble — great spectator anion.", relatedFormulas: ["HNO3", "AgNO3", "NaNO3"] },
  { symbol: "CH3COO-", name: "Acetate", charge: -1, type: "polyatomic", summary: "Conjugate base of acetic acid; buffer partner.", relatedFormulas: ["CH3COOH"] },
  { symbol: "SO4 2-", name: "Sulfate", charge: -2, type: "polyatomic", summary: "Common oxoanion. Ba²⁺ / Pb²⁺ / Ca²⁺ exceptions for solubility.", relatedFormulas: ["H2SO4", "CuSO4", "BaSO4"] },
  { symbol: "CO3 2-", name: "Carbonate", charge: -2, type: "polyatomic", summary: "With acids releases CO₂. Most carbonates insoluble except Group 1 / NH₄⁺.", relatedFormulas: ["Na2CO3", "CaCO3", "CO2"] },
  { symbol: "SO3 2-", name: "Sulfite", charge: -2, type: "polyatomic", summary: "With acid releases SO₂ gas.", relatedFormulas: ["Na2SO3", "SO2"] },
  { symbol: "PO4 3-", name: "Phosphate", charge: -3, type: "polyatomic", summary: "Essential biological anion; mostly insoluble salts.", relatedFormulas: ["H3PO4"] },
  { symbol: "CrO4 2-", name: "Chromate", charge: -2, type: "polyatomic", summary: "Yellow Cr(VI) anion; toxic. Forms colorful ppts.", relatedFormulas: ["K2CrO4", "Ag2CrO4"] },
  { symbol: "S 2-", name: "Sulfide", charge: -2, type: "anion", summary: "Many metal sulfides are insoluble and colored.", relatedFormulas: ["H2S"] },
];

export const ION_BY_SYMBOL: Record<string, IonKnowledge> = Object.fromEntries(
  IONS.map((i) => [i.symbol.replace(/\s/g, ""), i]),
);

export function getIon(symbol: string): IonKnowledge | undefined {
  const key = symbol.replace(/\s/g, "");
  return ION_BY_SYMBOL[key] ?? IONS.find((i) => i.symbol === symbol);
}
