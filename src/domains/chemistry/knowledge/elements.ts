/** Periodic table knowledge — hover/learn cards for every element. */

export interface ElementKnowledge {
  symbol: string;
  name: string;
  atomicNumber: number;
  atomicMass: number;
  group: number | null;
  period: number;
  category:
    | "alkali-metal"
    | "alkaline-earth"
    | "transition-metal"
    | "post-transition"
    | "metalloid"
    | "nonmetal"
    | "halogen"
    | "noble-gas"
    | "lanthanide"
    | "actinide";
  electronConfig: string;
  oxidationStates: number[];
  appearance: string;
  summary: string;
  uses: string[];
  hazards: string;
  funFact: string;
}

const E = (
  partial: ElementKnowledge,
): ElementKnowledge => partial;

/** Core learning set — every common lab element, richly annotated. */
export const ELEMENTS: ElementKnowledge[] = [
  E({ symbol: "H", name: "Hydrogen", atomicNumber: 1, atomicMass: 1.008, group: 1, period: 1, category: "nonmetal", electronConfig: "1s¹", oxidationStates: [-1, 1], appearance: "Colorless gas", summary: "The lightest element and the most abundant in the universe. In the lab it is often produced by metals reacting with acids.", uses: ["Fuel cells", "Ammonia synthesis", "Reducing agent"], hazards: "Highly flammable; forms explosive mixtures with air.", funFact: "About 75% of all normal matter in the universe is hydrogen." }),
  E({ symbol: "He", name: "Helium", atomicNumber: 2, atomicMass: 4.003, group: 18, period: 1, category: "noble-gas", electronConfig: "1s²", oxidationStates: [0], appearance: "Colorless gas", summary: "An inert noble gas with the lowest boiling point of any element.", uses: ["Cryogenics", "Balloons", "Protective atmospheres"], hazards: "Asphyxiant in high concentrations.", funFact: "Helium was discovered in the Sun’s spectrum before it was found on Earth." }),
  E({ symbol: "Li", name: "Lithium", atomicNumber: 3, atomicMass: 6.94, group: 1, period: 2, category: "alkali-metal", electronConfig: "[He] 2s¹", oxidationStates: [1], appearance: "Soft silvery metal", summary: "Lightest metal; highly reactive with water.", uses: ["Batteries", "Mood-stabilizing drugs", "Ceramics"], hazards: "Reacts violently with water; corrosive.", funFact: "Lithium floats on oil and even on water briefly before reacting." }),
  E({ symbol: "C", name: "Carbon", atomicNumber: 6, atomicMass: 12.011, group: 14, period: 2, category: "nonmetal", electronConfig: "[He] 2s² 2p²", oxidationStates: [-4, 2, 4], appearance: "Black solid / diamond / graphite", summary: "The backbone of organic chemistry; forms chains and rings that make life possible.", uses: ["Fuels", "Polymers", "Steel", "Activated charcoal"], hazards: "Dust can be combustible; CO is toxic.", funFact: "Diamond and graphite are both pure carbon — different crystal structures." }),
  E({ symbol: "N", name: "Nitrogen", atomicNumber: 7, atomicMass: 14.007, group: 15, period: 2, category: "nonmetal", electronConfig: "[He] 2s² 2p³", oxidationStates: [-3, 3, 5], appearance: "Colorless gas", summary: "Makes up ~78% of Earth’s atmosphere as N₂ with a strong triple bond.", uses: ["Fertilizers", "Explosives", "Inert atmosphere"], hazards: "Liquid N₂ causes frostbite; some nitrogen oxides are toxic.", funFact: "The N≡N bond is one of the strongest diatomic bonds known." }),
  E({ symbol: "O", name: "Oxygen", atomicNumber: 8, atomicMass: 15.999, group: 16, period: 2, category: "nonmetal", electronConfig: "[He] 2s² 2p⁴", oxidationStates: [-2, -1], appearance: "Colorless gas", summary: "Essential for combustion and respiration; the most common element in Earth’s crust by mass when counted in oxides.", uses: ["Medical oxygen", "Steelmaking", "Rocket oxidizer"], hazards: "Supports vigorous combustion; high O₂ atmospheres are fire hazards.", funFact: "Liquid oxygen is pale blue and magnetic." }),
  E({ symbol: "F", name: "Fluorine", atomicNumber: 9, atomicMass: 18.998, group: 17, period: 2, category: "halogen", electronConfig: "[He] 2s² 2p⁵", oxidationStates: [-1], appearance: "Pale yellow gas", summary: "The most electronegative element; extremely reactive.", uses: ["Toothpaste (fluoride)", "Teflon", "Uranium processing"], hazards: "Highly toxic and corrosive gas.", funFact: "Fluorine will even attack glass under the right conditions." }),
  E({ symbol: "Na", name: "Sodium", atomicNumber: 11, atomicMass: 22.99, group: 1, period: 3, category: "alkali-metal", electronConfig: "[Ne] 3s¹", oxidationStates: [1], appearance: "Soft silvery metal", summary: "Reactive alkali metal; forms Na⁺ salts that dominate everyday chemistry (table salt).", uses: ["Street lamps", "Soap", "Heat transfer"], hazards: "Reacts violently with water releasing H₂ and heat.", funFact: "Sodium metal is soft enough to cut with a knife." }),
  E({ symbol: "Mg", name: "Magnesium", atomicNumber: 12, atomicMass: 24.305, group: 2, period: 3, category: "alkaline-earth", electronConfig: "[Ne] 3s²", oxidationStates: [2], appearance: "Silvery metal", summary: "Light structural metal; burns with a bright white flame.", uses: ["Alloys", "Flares", "Epsom salt (MgSO₄)"], hazards: "Powder/dust can ignite; bright flame harms eyes.", funFact: "Magnesium is central to chlorophyll’s structure in plants." }),
  E({ symbol: "Al", name: "Aluminum", atomicNumber: 13, atomicMass: 26.982, group: 13, period: 3, category: "post-transition", electronConfig: "[Ne] 3s² 3p¹", oxidationStates: [3], appearance: "Silvery metal", summary: "Most abundant metal in Earth’s crust; protected by a tough oxide layer.", uses: ["Cans", "Aircraft", "Foil"], hazards: "Fine powder is combustible; Al dust explosions possible.", funFact: "Recycling aluminum saves ~95% of the energy vs. refining from ore." }),
  E({ symbol: "Si", name: "Silicon", atomicNumber: 14, atomicMass: 28.085, group: 14, period: 3, category: "metalloid", electronConfig: "[Ne] 3s² 3p²", oxidationStates: [-4, 4], appearance: "Lustrous gray solid", summary: "Semiconductor backbone of modern electronics; also forms silica (SiO₂).", uses: ["Chips", "Glass", "Silicones"], hazards: "Dust inhalation risk (silicosis from silica).", funFact: "About 28% of Earth’s crust is silicon by mass." }),
  E({ symbol: "P", name: "Phosphorus", atomicNumber: 15, atomicMass: 30.974, group: 15, period: 3, category: "nonmetal", electronConfig: "[Ne] 3s² 3p³", oxidationStates: [-3, 3, 5], appearance: "White/red solid", summary: "Essential for DNA and ATP; white phosphorus is highly reactive.", uses: ["Fertilizers", "Matches", "Detergents"], hazards: "White P ignites in air and is toxic.", funFact: "White phosphorus glows faintly in air — the origin of the word phosphorescence." }),
  E({ symbol: "S", name: "Sulfur", atomicNumber: 16, atomicMass: 32.06, group: 16, period: 3, category: "nonmetal", electronConfig: "[Ne] 3s² 3p⁴", oxidationStates: [-2, 4, 6], appearance: "Yellow solid", summary: "Forms many acids and salts; key in proteins (disulfide bridges).", uses: ["Sulfuric acid", "Vulcanization", "Fungicides"], hazards: "SO₂ and H₂S are toxic gases.", funFact: "Ancient cultures burned sulfur as incense — brimstone." }),
  E({ symbol: "Cl", name: "Chlorine", atomicNumber: 17, atomicMass: 35.45, group: 17, period: 3, category: "halogen", electronConfig: "[Ne] 3s² 3p⁵", oxidationStates: [-1, 1, 3, 5, 7], appearance: "Green-yellow gas", summary: "Powerful oxidizer used for disinfection; forms chloride salts.", uses: ["Water treatment", "PVC", "Bleach"], hazards: "Toxic respiratory irritant; WWI chemical weapon.", funFact: "Chlorine was the first elemental gas used as a chemical weapon (1915)." }),
  E({ symbol: "K", name: "Potassium", atomicNumber: 19, atomicMass: 39.098, group: 1, period: 4, category: "alkali-metal", electronConfig: "[Ar] 4s¹", oxidationStates: [1], appearance: "Soft silvery metal", summary: "Essential electrolyte in biology; more reactive than sodium.", uses: ["Fertilizer", "Soap", "Gunpowder (KNO₃)"], hazards: "Violent reaction with water.", funFact: "Your nerves fire partly because of K⁺ gradients across membranes." }),
  E({ symbol: "Ca", name: "Calcium", atomicNumber: 20, atomicMass: 40.078, group: 2, period: 4, category: "alkaline-earth", electronConfig: "[Ar] 4s²", oxidationStates: [2], appearance: "Silvery metal", summary: "Builds bones and teeth as Ca²⁺ compounds; lime chemistry is classic.", uses: ["Cement", "Antacids", "Steelmaking"], hazards: "Metal reacts with water; dust irritant.", funFact: "The word calcium comes from Latin calx — lime." }),
  E({ symbol: "Cr", name: "Chromium", atomicNumber: 24, atomicMass: 51.996, group: 6, period: 4, category: "transition-metal", electronConfig: "[Ar] 3d⁵ 4s¹", oxidationStates: [2, 3, 6], appearance: "Hard silvery metal", summary: "Gives stainless steel its shine and corrosion resistance; Cr(VI) is toxic.", uses: ["Stainless steel", "Chrome plating", "Pigments"], hazards: "Hexavalent chromium compounds are carcinogenic.", funFact: "Emerald’s green comes from chromium impurities in beryl." }),
  E({ symbol: "Fe", name: "Iron", atomicNumber: 26, atomicMass: 55.845, group: 8, period: 4, category: "transition-metal", electronConfig: "[Ar] 3d⁶ 4s²", oxidationStates: [2, 3], appearance: "Gray metal", summary: "Earth’s most used metal; rusts as Fe₂O₃·nH₂O. Central to hemoglobin.", uses: ["Steel", "Magnets", "Catalysts"], hazards: "Fine dust combustible; rust not acutely toxic.", funFact: "Your blood’s red color is from iron-containing heme." }),
  E({ symbol: "Cu", name: "Copper", atomicNumber: 29, atomicMass: 63.546, group: 11, period: 4, category: "transition-metal", electronConfig: "[Ar] 3d¹⁰ 4s¹", oxidationStates: [1, 2], appearance: "Reddish metal", summary: "Excellent conductor; Cu²⁺ solutions are characteristically blue.", uses: ["Wiring", "Plumbing", "Coins"], hazards: "Cu salts are toxic if ingested in quantity.", funFact: "Copper is one of the few metals with a natural color that isn’t silvery." }),
  E({ symbol: "Zn", name: "Zinc", atomicNumber: 30, atomicMass: 65.38, group: 12, period: 4, category: "transition-metal", electronConfig: "[Ar] 3d¹⁰ 4s²", oxidationStates: [2], appearance: "Bluish-gray metal", summary: "Classic lab metal for generating H₂ with acids; sacrificial anode for steel.", uses: ["Galvanizing", "Batteries", "Brass"], hazards: "Zn fumes can cause metal fume fever.", funFact: "The Statue of Liberty’s skin is copper — but many steels are zinc-coated." }),
  E({ symbol: "Br", name: "Bromine", atomicNumber: 35, atomicMass: 79.904, group: 17, period: 4, category: "halogen", electronConfig: "[Ar] 3d¹⁰ 4s² 4p⁵", oxidationStates: [-1, 1, 3, 5], appearance: "Red-brown liquid", summary: "Only nonmetal liquid at room temperature; strong oxidizer.", uses: ["Flame retardants", "Photography (historical)", "Disinfectants"], hazards: "Corrosive vapor; toxic.", funFact: "Bromine’s name comes from Greek bromos — stench." }),
  E({ symbol: "Ag", name: "Silver", atomicNumber: 47, atomicMass: 107.87, group: 11, period: 5, category: "transition-metal", electronConfig: "[Kr] 4d¹⁰ 5s¹", oxidationStates: [1], appearance: "Lustrous white metal", summary: "Best electrical conductor; Ag⁺ forms insoluble halides used in classic precip labs.", uses: ["Jewelry", "Electronics", "Antimicrobial coatings"], hazards: "AgNO₃ stains skin; chronic exposure → argyria.", funFact: "Silver halide photography literally captures light as metallic silver." }),
  E({ symbol: "I", name: "Iodine", atomicNumber: 53, atomicMass: 126.9, group: 17, period: 5, category: "halogen", electronConfig: "[Kr] 4d¹⁰ 5s² 5p⁵", oxidationStates: [-1, 1, 3, 5, 7], appearance: "Purple-black solid / violet vapor", summary: "Essential for thyroid hormones; classic starch test turns blue-black.", uses: ["Antiseptics", "Contrast media", "Nutrition"], hazards: "Irritant; excess intake harms thyroid.", funFact: "Iodine sublimes — solid to violet vapor without melting." }),
  E({ symbol: "Ba", name: "Barium", atomicNumber: 56, atomicMass: 137.33, group: 2, period: 6, category: "alkaline-earth", electronConfig: "[Xe] 6s²", oxidationStates: [2], appearance: "Silvery metal", summary: "Ba²⁺ forms the classic white BaSO₄ precipitate used medically as a contrast agent.", uses: ["X-ray contrast", "Green fireworks", "Drilling fluids"], hazards: "Soluble barium salts are toxic.", funFact: "Barium sulfate is so insoluble it’s safe to swallow for GI X-rays." }),
  E({ symbol: "Au", name: "Gold", atomicNumber: 79, atomicMass: 196.97, group: 11, period: 6, category: "transition-metal", electronConfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s¹", oxidationStates: [1, 3], appearance: "Yellow metal", summary: "Noble metal — resists corrosion. Near the bottom of the reactivity series.", uses: ["Electronics", "Jewelry", "Nanomedicine"], hazards: "Generally inert; some gold salts toxic.", funFact: "All the gold ever mined would fit in a cube ~22 m on a side." }),
  E({ symbol: "Pb", name: "Lead", atomicNumber: 82, atomicMass: 207.2, group: 14, period: 6, category: "post-transition", electronConfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p²", oxidationStates: [2, 4], appearance: "Soft gray metal", summary: "Dense, soft metal; Pb²⁺ salts appear in classic precip demos (PbI₂ yellow).", uses: ["Batteries", "Radiation shielding", "Historical paints (banned)"], hazards: "Neurotoxic heavy metal — handle with care.", funFact: "The Latin name plumbum gives us the symbol Pb and the word plumbing." }),
];

export const ELEMENT_BY_SYMBOL: Record<string, ElementKnowledge> = Object.fromEntries(
  ELEMENTS.map((e) => [e.symbol, e]),
);

export function getElement(symbol: string): ElementKnowledge | undefined {
  return ELEMENT_BY_SYMBOL[symbol];
}
