# Alyra Labs — Brand Brief

Product atelier for [ALYRA](https://www.alyra.in/) — India's first solid perfume brand. Digital desk where scent is composed with the same precision and restraint as the refillable balms.

## What the product is

A virtual perfume chemistry desk: drag glassware onto dark wood, pour notes (top / heart / base), watch formulas resolve, invent and shelf signatures. Companion to the physical Alyra compact — not a generic quiz app.

## Name

**Alyra Labs** — the lab behind the lyre. The angel-with-lyre mark (woodcut white on black) is the brand lockup; wordmark sits beside it in display serif.

## Tagline

Primary:

> **Compose scent. Press to skin.**

Alternates:
- "Scent as authorship." (brand / founder voice — from alyra.in)
- "Quiet permanence." (journal / about)
- "Pour notes. Build a signature." (product demo)

## Voice

- **Precise, unhurried.** Fine fragrance language without marketing shout.
- **Close to skin.** Private, magnetic — never elevator-loud.
- Align with [alyra.in](https://www.alyra.in/): alcohol-free solid perfume, refillable case, made in India.
- Never: exclamation-point hype, gamer HUD, purple AI brochure, seafoam "edtech lab" leftovers.

## Color system (`globals.css`)

| Token | Hex | Role |
|---|---|---|
| `--lab-wash` | `#ebe8e2` | Cool stone page atmosphere |
| `--lab-panel` | `#f7f5f1` | Paper panels |
| `--lab-desk` | `#2a221c` | Ebony atelier desk |
| `--lab-ink` | `#0c0c0c` | Primary text / CTA fill |
| `--lab-muted` | `#5c5750` | Secondary text |
| `--lab-teal` | `#1a1a1a` | Primary accent (ink black — token name kept for code stability) |
| `--lab-line` | `#d2cdc4` | Borders |
| `--lab-foam` | `#f5f4f1` | Light text on dark |
| `--lab-glass` | `#c4b49a` | Champagne glass tint |
| `--lab-amber` | `#b8956c` | Heat / reward gold |
| `--lab-hazard` | `#b42318` | Safe-fail red |

Monochrome luxury first (black / ivory / champagne). Desk wood stays tactile; CTAs are ink or white, not teal seafoam.

## Typography

| Role | Font | Use |
|---|---|---|
| Display | **Cormorant Garamond** | Alyra Labs wordmark, headlines |
| UI | **DM Sans** | Labels, buttons, body |
| Formula | **JetBrains Mono** | Equations, CAS, IFRA IDs |

## Logo

`public/alyra-logo.png` / `branding/logos/alyra-labs-mark.png` — white line-art angel with lyre on transparent (use light plate on dark UIs). Component: `src/components/brand/AlyraMark.tsx`.

## Anti-patterns

Purple gradients, cream+terracotta broadsheet spam, neon glow, generic flask clip-art, seafoam-green "Chem Lab" nostalgia, pill/badge clutter over the desk.
