/**
 * Tokenize chemical formulas and equations for editable / hoverable UI.
 */

export type FormulaTokenKind =
  | "element"
  | "subscript"
  | "superscript"
  | "coefficient"
  | "group-open"
  | "group-close"
  | "plus"
  | "arrow"
  | "dot"
  | "text"
  | "charge";

export interface FormulaToken {
  id: string;
  kind: FormulaTokenKind;
  text: string;
  /** Knowledge lookup key (element symbol or full species formula) */
  lookupKey?: string;
  /** Species span this token belongs to, e.g. "Na2CO3" */
  species?: string;
}

export interface EditableEquation {
  id: string;
  raw: string;
  tokens: FormulaToken[];
}

let tokenSeq = 0;
function tid(): string {
  tokenSeq += 1;
  return `t${tokenSeq}`;
}

/** Split a species like Na2CO3, Ca(OH)2, SO4^2- into hoverable tokens. */
export function tokenizeSpecies(species: string): FormulaToken[] {
  const tokens: FormulaToken[] = [];
  const s = species.trim();
  if (!s) return tokens;

  // Longest-first polyatomic / functional groups for richer hover targets
  const GROUPS: { re: RegExp; text: string; lookupKey: string }[] = [
    { re: /^CH3COO/, text: "CH3COO", lookupKey: "CH3COO-" },
    { re: /^CH3CO2/, text: "CH3CO2", lookupKey: "CH3COO-" },
    { re: /^NO3/, text: "NO3", lookupKey: "NO3-" },
    { re: /^SO4/, text: "SO4", lookupKey: "SO4 2-" },
    { re: /^SO3/, text: "SO3", lookupKey: "SO3 2-" },
    { re: /^CO3/, text: "CO3", lookupKey: "CO3 2-" },
    { re: /^PO4/, text: "PO4", lookupKey: "PO4 3-" },
    { re: /^CrO4/, text: "CrO4", lookupKey: "CrO4 2-" },
    { re: /^NH4/, text: "NH4", lookupKey: "NH4+" },
    { re: /^OH/, text: "OH", lookupKey: "OH-" },
  ];

  const subMap: Record<string, string> = {
    "₀": "0",
    "₁": "1",
    "₂": "2",
    "₃": "3",
    "₄": "4",
    "₅": "5",
    "₆": "6",
    "₇": "7",
    "₈": "8",
    "₉": "9",
  };

  let i = 0;
  while (i < s.length) {
    const rest = s.slice(i);

    const group = GROUPS.find((g) => g.re.test(rest));
    if (group) {
      tokens.push({
        id: tid(),
        kind: "element",
        text: group.text,
        lookupKey: group.lookupKey,
        species: s,
      });
      i += group.text.length;
      continue;
    }

    const el = rest.match(/^([A-Z][a-z]?)/);
    if (el) {
      tokens.push({
        id: tid(),
        kind: "element",
        text: el[1]!,
        lookupKey: el[1],
        species: s,
      });
      i += el[1]!.length;
      continue;
    }

    const digits = rest.match(/^(\d+)/);
    if (digits) {
      tokens.push({
        id: tid(),
        kind: "subscript",
        text: digits[1]!,
        species: s,
      });
      i += digits[1]!.length;
      continue;
    }

    const uniSub = rest.match(/^([₀₁₂₃₄₅₆₇₈₉]+)/);
    if (uniSub) {
      const d = [...uniSub[1]!].map((c) => subMap[c] ?? c).join("");
      tokens.push({ id: tid(), kind: "subscript", text: d, species: s });
      i += uniSub[1]!.length;
      continue;
    }

    const charge = rest.match(/^(\^[0-9]*[+-]|[0-9]+[+-]|[+-]|[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+)/);
    if (charge) {
      tokens.push({
        id: tid(),
        kind: "charge",
        text: charge[1]!.replace(/^\^/, ""),
        lookupKey: s,
        species: s,
      });
      i += charge[1]!.length;
      continue;
    }

    const ch = s[i]!;
    if (ch === "(") {
      tokens.push({ id: tid(), kind: "group-open", text: "(", species: s });
    } else if (ch === ")") {
      tokens.push({ id: tid(), kind: "group-close", text: ")", species: s });
    } else if (ch === "·" || ch === ".") {
      tokens.push({ id: tid(), kind: "dot", text: "·", species: s });
    } else if (ch !== " " && ch !== "^") {
      tokens.push({ id: tid(), kind: "text", text: ch, species: s });
    }
    i += 1;
  }

  return tokens;
}

/** Parse a full equation string into tokens including + and →. */
export function tokenizeEquation(raw: string): FormulaToken[] {
  tokenSeq = 0;
  const normalized = raw
    .replace(/→|⟶|⇒|➔|→/g, " → ")
    .replace(/<-+>|<->|⇔|⇌/g, " → ")
    .replace(/=+/g, " → ")
    .replace(/\+/g, " + ")
    .replace(/\s+/g, " ")
    .trim();

  const parts = normalized.split(" ");
  const tokens: FormulaToken[] = [];

  for (const part of parts) {
    if (!part) continue;
    if (part === "+") {
      tokens.push({ id: tid(), kind: "plus", text: "+" });
      continue;
    }
    if (part === "→") {
      tokens.push({ id: tid(), kind: "arrow", text: "→" });
      continue;
    }

    // Leading coefficient: 2HCl or 2H2O
    const coef = part.match(/^(\d+)(.+)$/);
    if (coef) {
      tokens.push({
        id: tid(),
        kind: "coefficient",
        text: coef[1]!,
        species: coef[2],
      });
      tokens.push(...tokenizeSpecies(coef[2]!));
    } else {
      // Attach whole-species lookup key on a wrapper sense via species field
      const speciesTokens = tokenizeSpecies(part);
      for (const t of speciesTokens) {
        t.species = part;
      }
      tokens.push(...speciesTokens);
    }
  }

  return tokens;
}

export function equationFromRaw(raw: string, id?: string): EditableEquation {
  return {
    id: id ?? `eq-${Math.random().toString(36).slice(2, 9)}`,
    raw,
    tokens: tokenizeEquation(raw),
  };
}

export function rebuildRawFromTokens(tokens: FormulaToken[]): string {
  let out = "";
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]!;
    if (t.kind === "plus" || t.kind === "arrow") {
      out += ` ${t.text} `;
    } else {
      out += t.text;
    }
  }
  return out.replace(/\s+/g, " ").trim();
}
