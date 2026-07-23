"use client";

import type { FormulaToken } from "@/domains/chemistry/knowledge/tokenize";
import { lookupKnowledge } from "@/domains/chemistry/knowledge/lookup";

interface Props {
  tokens: FormulaToken[];
  selectedId: string | null;
  hoveredId: string | null;
  onHover: (id: string | null, lookupKey: string | null) => void;
  onSelect: (id: string, lookupKey: string) => void;
}

function tokenLookupKey(t: FormulaToken): string | null {
  if (t.kind === "plus" || t.kind === "arrow" || t.kind === "coefficient") {
    return null;
  }
  // Polyatomic group tokens already carry an ion lookupKey
  if (t.lookupKey && /[+\-]| /.test(t.lookupKey)) {
    return t.lookupKey;
  }
  if (t.kind === "element" && t.species && t.species.length > 1) {
    const compound = lookupKnowledge(t.species);
    if (compound.kind === "compound") return t.species;
  }
  if (t.lookupKey) return t.lookupKey;
  if (t.species) return t.species;
  return t.text;
}

export function FormulaTokenBoard({
  tokens,
  selectedId,
  hoveredId,
  onHover,
  onSelect,
}: Props) {
  return (
    <div
      className="flex flex-wrap items-baseline gap-y-1 rounded-2xl border border-lab-line/50 bg-lab-ink px-3 py-4 font-mono text-lab-foam shadow-inner md:px-5"
      role="list"
      aria-label="Editable chemistry formula tokens"
    >
      {tokens.map((t) => {
        const key = tokenLookupKey(t);
        const interactive = Boolean(key);
        const active = selectedId === t.id || hoveredId === t.id;
        const isOp = t.kind === "plus" || t.kind === "arrow";
        const isSub = t.kind === "subscript" || t.kind === "charge";
        const isCoef = t.kind === "coefficient";

        const className = [
          "relative inline-flex select-none rounded-md px-0.5 transition",
          isOp ? "mx-1.5 text-lab-glass" : "",
          isSub ? "text-[0.7em] align-sub text-lab-foam/85" : "",
          isCoef ? "mr-0.5 text-lab-amber" : "",
          interactive
            ? "cursor-pointer hover:bg-lab-teal/40 hover:text-white"
            : "cursor-default",
          active && interactive ? "bg-lab-teal text-white ring-1 ring-lab-foam/40" : "",
        ]
          .filter(Boolean)
          .join(" ");

        if (!interactive) {
          return (
            <span key={t.id} className={className} role="listitem">
              {t.text}
            </span>
          );
        }

        return (
          <button
            key={t.id}
            type="button"
            role="listitem"
            className={className}
            onMouseEnter={() => onHover(t.id, key)}
            onMouseLeave={() => onHover(null, null)}
            onFocus={() => onHover(t.id, key)}
            onBlur={() => onHover(null, null)}
            onClick={() => onSelect(t.id, key!)}
            title={lookupKnowledge(key!).title}
          >
            {t.text}
          </button>
        );
      })}
    </div>
  );
}
