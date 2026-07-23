# Chem Lab — Brand Brief

Grounded in the existing product ([`DESIGN.md`](../DESIGN.md), [`globals.css`](../src/app/globals.css)) rather than invented from scratch. Chem Lab already has real design DNA — this brief formalizes it into a usable brand system.

## What the product actually is

A virtual chemistry desk: drag glassware onto warm wood, pour reactants, watch a real balanced equation resolve (`HCl + NaOH → NaCl + H2O`), get a plain-language tutor explanation, earn XP. Not a quiz app, not a dashboard — a *tactile teaching instrument*.

## Name

**Chem Lab** — kept as-is. It's already load-bearing across the codebase (metadata, wordmark, README) and it's plainly honest about what the product does, which suits the "real chemistry, no gimmicks" voice better than a cute neologism would.

## Tagline

Primary (already living in the product's own hero copy — reuse it, don't replace it):

> **The desk reacts to every move.**

Alternates for different contexts:
- "Pour it. Stir it. See it react." (feature-demo videos)
- "Real reactions. Zero safety goggles." (social / ad-length)
- "Chemistry you can actually touch." (onboarding / brand statement)

## Voice

- **Precise, not academic.** Say "acid + base → salt + water," not "an exothermic neutralization reaction occurs."
- **Confident, unhurried.** Golden-hour teaching lab, not a game HUD shouting for attention.
- **Earns excitement, doesn't manufacture it.** Bubbles and glow only appear because a real reaction happened — never decorative.
- Never: exclamation-point marketing, gamer-bro hype, textbook dryness.

## Color system (already defined in `globals.css` — this is the canonical palette, do not drift from it)

| Token | Hex | Role |
|---|---|---|
| `--lab-wash` | `#d8e4df` | Page atmosphere (cool seafoam wash) |
| `--lab-panel` | `#f2f7f4` | Frosted glass panels |
| `--lab-desk` | `#4a3428` | Walnut desk — the brand's signature surface |
| `--lab-ink` | `#14241f` | Primary text, dark chrome bars |
| `--lab-muted` | `#5a6f67` | Secondary text |
| `--lab-teal` | `#1a6b5c` | Primary accent / CTAs — the "brand color" |
| `--lab-line` | `#b4c5bd` | Borders |
| `--lab-foam` | `#eaf4ef` | Light text on dark |
| `--lab-glass` | `#8fc0b5` | Glassware tint |
| `--lab-amber` | `#c4783a` | Heat / reward flash |
| `--lab-hazard` | `#b42318` | Safe-fail red |

Explicitly **not**: purple-on-white AI-brochure gradients, cream+terracotta editorial serif spam, dark-mode neon glow. The brand color story is *walnut wood + seafoam glass + ink*, lit like late-afternoon sun through a lab window.

## Typography (already in `layout.tsx` — never Inter/Roboto/Arial/system)

| Role | Font | Use |
|---|---|---|
| Display | **Fraunces** (500/600/700) | Wordmark, headlines, XP numerals |
| UI | **DM Sans** | Labels, buttons, body copy |
| Formula | **JetBrains Mono** | Equations, chemical formulas — a distinctive brand signature no competitor uses |

The JetBrains Mono equation banner (`HCl + NaOH → NaCl + H2O`) is a uniquely ownable brand asset — it appears nowhere else in edtech and should be reused deliberately in marketing (see screenshot `branding/screenshots/03-reaction-equation.png`).

## Logo direction

Five concepts explored (`branding/logos/`), spanning wordmark-only through icon lockups, all built from the same material vocabulary: walnut wood, seafoam glass, ink, and the meniscus/bubble curve already animated in the product's CSS. See `branding/logos/README.md` for the breakdown of each and recommended use case.

## Anti-patterns (carried over from `DESIGN.md`)

Purple gradients, cream+terracotta broadsheet layouts, dark mode by default, neon glow spam, generic flask clip-art, stock-photo "excited students," pill/badge clutter competing with the desk.
