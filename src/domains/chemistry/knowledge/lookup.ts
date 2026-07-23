import { ELEMENT_BY_SYMBOL, getElement, type ElementKnowledge } from "./elements";
import {
  COMPOUNDS,
  getCompoundByFormula,
  type CompoundKnowledge,
} from "./compounds";
import { getIon, type IonKnowledge } from "./ions";
import { getChemical } from "../data/chemicals";

export type KnowledgeKind = "element" | "compound" | "ion" | "unknown";

export interface KnowledgeCard {
  kind: KnowledgeKind;
  key: string;
  title: string;
  subtitle: string;
  summary: string;
  bullets: string[];
  hazards?: string;
  funFact?: string;
  deskChemicalId?: string;
  related: string[];
  raw?: ElementKnowledge | CompoundKnowledge | IonKnowledge;
}

/** Resolve any token text to the best knowledge card. */
export function lookupKnowledge(raw: string): KnowledgeCard {
  const cleaned = raw.trim();
  if (!cleaned) return unknownCard(cleaned);

  const ionTry = cleaned.replace(/\^/g, " ").replace(/([0-9])([+-])/g, " $1$2");
  const ion = getIon(cleaned) ?? getIon(ionTry);
  if (ion) {
    return {
      kind: "ion",
      key: ion.symbol,
      title: ion.name,
      subtitle: ion.symbol,
      summary: ion.summary,
      bullets: [
        `Charge: ${ion.charge > 0 ? "+" : ""}${ion.charge}`,
        `Type: ${ion.type}`,
      ],
      related: ion.relatedFormulas,
      raw: ion,
    };
  }

  const elSym = cleaned.replace(/[^A-Za-z]/g, "");
  if (
    (cleaned === elSym || /^[A-Z][a-z]?$/.test(cleaned)) &&
    getElement(elSym)
  ) {
    return elementCard(getElement(elSym)!);
  }

  const compound = getCompoundByFormula(cleaned);
  if (compound) return compoundCard(compound);

  const stripped = cleaned.replace(/^[0-9]+/, "");
  if (stripped !== cleaned) {
    const again = lookupKnowledge(stripped);
    if (again.kind !== "unknown") return again;
  }

  return unknownCard(cleaned);
}

export function searchKnowledge(query: string, limit = 12): KnowledgeCard[] {
  const q = query.trim().toUpperCase();
  if (!q) return [];
  const out: KnowledgeCard[] = [];

  for (const el of Object.values(ELEMENT_BY_SYMBOL)) {
    if (el.symbol.toUpperCase() === q || el.name.toUpperCase().includes(q)) {
      out.push(elementCard(el));
    }
    if (out.length >= limit) return out;
  }

  for (const c of COMPOUNDS) {
    const hay =
      `${c.formula} ${c.name} ${c.commonNames.join(" ")} ${c.aliases.join(" ")}`.toUpperCase();
    if (hay.includes(q)) out.push(compoundCard(c));
    if (out.length >= limit) return out;
  }

  return out;
}

function elementCard(el: ElementKnowledge): KnowledgeCard {
  return {
    kind: "element",
    key: el.symbol,
    title: el.name,
    subtitle: `${el.symbol} · Z=${el.atomicNumber} · ${el.atomicMass} u`,
    summary: el.summary,
    bullets: [
      `Category: ${el.category}`,
      `Electron config: ${el.electronConfig}`,
      `Oxidation states: ${el.oxidationStates.join(", ")}`,
      `Uses: ${el.uses.slice(0, 3).join(", ")}`,
    ],
    hazards: el.hazards,
    funFact: el.funFact,
    related: el.uses.slice(0, 2),
    raw: el,
    deskChemicalId: getChemical(el.symbol.toLowerCase())?.id,
  };
}

function compoundCard(c: CompoundKnowledge): KnowledgeCard {
  return {
    kind: "compound",
    key: c.formula,
    title: c.name,
    subtitle: `${c.formula}${c.iupac ? ` · ${c.iupac}` : ""} · ${c.molarMass} g/mol`,
    summary: c.learn,
    bullets: [
      `State (STP): ${c.stateAtSTP}`,
      `Bonding: ${c.bonding}`,
      `Solubility (water): ${c.solubilityWater}`,
      `Appearance: ${c.appearance}`,
      ...(c.labTip ? [`Lab tip: ${c.labTip}`] : []),
      `Uses: ${c.uses.slice(0, 3).join(", ")}`,
    ],
    hazards: c.hazards,
    related: c.relatedFormulas,
    deskChemicalId: c.deskChemicalId,
    raw: c,
  };
}

function unknownCard(key: string): KnowledgeCard {
  return {
    kind: "unknown",
    key,
    title: key || "Unknown",
    subtitle: "Not in local knowledge base yet",
    summary:
      "We couldn’t match this token to an element, ion, or curated compound. Edit the formula or select a neighboring token.",
    bullets: [],
    related: [],
  };
}

export type { ElementKnowledge, CompoundKnowledge, IonKnowledge };
