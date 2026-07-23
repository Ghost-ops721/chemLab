/** Static fallback copy when Groq is unavailable. Keyed by explanationKey. */
export const FALLBACK_EXPLANATIONS: Record<string, string> = {
  neutralization:
    "An acid and a base reacted to form a salt and water. The H⁺ from the acid combined with OH⁻ from the base to make H₂O — a classic neutralization.",
  precipitation:
    "Two aqueous ionic solutions swapped partners. One new salt is insoluble in water, so it fell out of solution as a solid precipitate.",
  "double-displacement":
    "The cations and anions of two ionic compounds exchanged partners (double displacement). Check solubility rules to see if a precipitate forms.",
  "single-displacement":
    "A more reactive metal displaced a less reactive metal (or hydrogen) from a compound, following the reactivity series.",
  combustion:
    "A fuel burned in oxygen, producing carbon dioxide and water and releasing heat — an exothermic combustion reaction.",
  redox:
    "Electrons moved from one species to another. Oxidation states changed: one reactant was oxidized (lost electrons) and another was reduced (gained electrons).",
  "gas-forming":
    "An acid reacted with a carbonate (or similar) to release a gas — often carbon dioxide — along with water and a salt.",
  "no-reaction":
    "These chemicals do not react under the conditions modeled here. Nothing observable happens.",
  "hazard-sodium-water":
    "Sodium metal and water react violently, releasing hydrogen gas and heat. This combo is blocked for safety in Alyra Labs.",
  "hazard-incompatible":
    "This combination is unsafe or incompatible in the lab model. The reaction was stopped and no products were formed.",
  "hazard-chlorine":
    "Chlorine gas is highly toxic. Mixing it carelessly is blocked; treat halogen gases with extreme caution in a real lab.",
  "product-perfume":
    "You dissolved fragrant oils in ethanol — the same idea behind cologne and perfume: alcohol carries scent, then evaporates on skin leaving the aroma behind. Real perfume houses blend dozens of notes across a pyramid (top, heart, base); this is an educational lab stand-in.",
  "product-perfume:custom":
    "You built a freeform perfume: ethanol carrier plus top, heart, and base notes. In real perfumery this pyramid is refined over months; here you just bottled the chemistry of a scent.",
  "product-soap":
    "Heat drove saponification: fat (triglyceride) reacted with NaOH to form soap (a carboxylate salt) and glycerol. Real soap-making uses the same chemistry at kitchen or factory scale.",
  "product-soap-needs-heat":
    "Fat and lye are in the vessel, but saponification needs heat. Attach a Bunsen burner, then Mix again.",
  "product-rust":
    "Acid dissolved the iron oxide (rust), forming soluble iron chloride and water — the idea behind many rust removers. In industry, chelators and inhibitors are added; here we model the core acid–oxide reaction.",
  "product-sanitizer":
    "Ethanol kills many microbes; glycerol keeps the mix from drying your skin. Real sanitizer gels also use thickeners — this is the alcohol + humectant core.",
  "product-bath-bomb":
    "Acid + bicarbonate release CO₂ when wet — the fizz in bath bombs. Citric acid and baking soda are the classic pair; binders and oils are skipped in this desk model.",
  "product-oxygen":
    "Manganese dioxide catalyzes the breakdown of hydrogen peroxide into water and oxygen gas. The MnO₂ isn’t used up — a classic catalysis demo.",
  "product-lime-putty":
    "Quicklime (CaO) slakes with water to form calcium hydroxide (slaked lime / lime putty), releasing heat. Builders use this chemistry in traditional mortars.",
  "product-brass-cleaner":
    "A mild acid plus salt can help dissolve tarnish oxides on copper and brass. This vinegar–salt mix is a kitchen-chemistry stand-in for a metal cleaner.",
  "product-balm":
    "Heat melts wax into oil so it cools into a soft balm. Real lip balms and salves use the same oil + wax idea with added scent or actives.",
  "product-balm-needs-heat":
    "Oil and beeswax are in the vessel, but wax needs heat to melt into a balm. Attach a Bunsen burner, then Mix again.",
  "product-invisible-ink":
    "Weak organic acids can act as “invisible” writing that darkens when heated. Lemon juice / citric acid is the classic kitchen version — modeled here as a heat-finished ink.",
  "product-invisible-ink-needs-heat":
    "Citric acid and water are ready, but this stand-in needs heat for the “reveal” finish. Attach a Bunsen burner, then Mix again.",
  "product-slime":
    "Borax cross-links PVA polymer chains into a gooey network — school-science slime. Real recipes vary; the idea is polymer + cross-linker.",
  "product-limewater":
    "Carbon dioxide turns limewater milky by forming insoluble calcium carbonate — the classic CO₂ test. Chalk, limestone, and marble are the same compound.",
  default:
    "A reaction occurred based on the chemical rules in the engine. Review the balanced equation above for the products formed.",
};

export function getFallbackExplanation(key?: string): string {
  if (!key) return FALLBACK_EXPLANATIONS.default;
  if (FALLBACK_EXPLANATIONS[key]) return FALLBACK_EXPLANATIONS[key];
  if (key === "product-perfume:custom") {
    return FALLBACK_EXPLANATIONS["product-perfume:custom"];
  }
  if (key.startsWith("product-perfume:")) {
    return FALLBACK_EXPLANATIONS["product-perfume"];
  }
  if (key.startsWith("product-perfume")) {
    return FALLBACK_EXPLANATIONS["product-perfume"];
  }
  return FALLBACK_EXPLANATIONS.default;
}
