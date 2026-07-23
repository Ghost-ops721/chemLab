# Chem Lab Design System

## Memorable thing

> You just watched real chemistry happen on a wooden desk.

Every screen decision serves that: the desk is the hero, reaction motion is the payoff, chrome stays quiet until you earn a discovery.

## Visual thesis

A calm teaching lab at golden hour. Warm walnut desk, cool seafoam glassware, dark ink for formulas. Material and energy: tactile wood + translucent glass + precise mono equations. Not a dashboard. Not a game HUD fighting the experiment.

## Typography

| Role | Font | Use |
|------|------|-----|
| Display | Fraunces | Chem Lab wordmark, empty-state headline, XP |
| UI | DM Sans | Labels, buttons, body |
| Formula | JetBrains Mono | Equations, chemical formulas |

Never Inter / Roboto / Arial / system as primary.

## Color

```css
--lab-wash: #d8e4df;      /* page atmosphere */
--lab-panel: #f2f7f4;     /* side panels */
--lab-desk: #4a3428;      /* wood base */
--lab-ink: #14241f;       /* primary text */
--lab-muted: #5a6f67;     /* secondary */
--lab-teal: #1a6b5c;      /* accent / CTAs */
--lab-line: #b4c5bd;      /* borders */
--lab-foam: #eaf4ef;      /* light text on dark */
--lab-glass: #8fc0b5;     /* glass tint */
--lab-amber: #c4783a;     /* heat / reward flash */
--lab-hazard: #b42318;    /* safe-fail */
```

## Layout

- One composition: inventory | desk | tutor
- Desk is the visual plane (full-bleed wood), panels float as frosted glass
- First viewport budget: brand, one quest nudge, desk, one CTA path
- No cards in the hero desk area except interactive vessels
- Motion: liquid color morph, rising bubbles, settling precipitate, exo glow — presence, not decoration

## Density (instrument panel)

Chrome is tight so the desk stays dominant. Prefer compact over airy:

| Token | Target |
|-------|--------|
| Panel body | `text-xs` (11–12px) |
| Section labels | `text-[10px]` uppercase |
| Display (wordmark) | `text-2xl` max in chrome |
| Display (empty desk) | `text-2xl` |
| Buttons | `px-2 py-1` / `text-xs` |
| List rows | `py-1.5`, icon `h-7 w-7` |
| Side panels | ~14–15rem wide |
| Gaps | `gap-1`–`gap-1.5`, header `py-1.5`–`py-2` |

Never inflate chrome with `text-3xl+` titles or `py-3+` list paddings outside modals.
Never fuse a full tool row at `gap-0.5` — instrument controls need `gap-1.5` minimum so labels stay scannable.

## Desk tool rail + vessel actions

The bottom desk rail and the beaker card footer are **instrument clusters**, not a single pill bar.

| Cluster | Controls |
|---------|----------|
| Place | `+ Beaker` |
| Process | Stir · Heat · Cool · Shake |
| React | Mix (teal primary) |
| Reset | Clear board (hazard tint, confirm-gated) |

Rules:
- Separators (1px `white/15` or `lab-line`) between clusters; `gap-1.5` inside a cluster
- Min control height ~28px; `px-2.5 py-1.5` on the desk rail
- Heat/Cool are toggles: inactive = quiet wash; active = semantic fill **and** physical FX under the glass
- Heat active → `--lab-amber` + soft ember ring; Cool active → ice wash (`#7dd3fc` family), never flat `sky-600` flood
- Mix stays the only pulsing CTA; Clear never sits flush against Mix without a divider

## Heat / Cool (physical states)

Heat and Cool live **on the vessel**, not only on the button paint.

| State | Under glass | In well | Button |
|-------|-------------|---------|--------|
| Heat on | Bunsen stand + layered flame (amber → cream tip) | Soft amber wash + heat haze | Amber fill + ring |
| Cool on | Ice bath tray + soft cubes | Frost rim + cool flash on toggle | Ice fill (`#0c4a6e` / `#7dd3fc`), not neon blue |
| Off | Nothing under glass | No wash | Quiet `lab-wash` / rail `white/10` |

Motion: 200–300ms toggle; flame/frost idle loops. `prefers-reduced-motion` → static tint, no dance/haze.

Anti-patterns: flat orange sheet over the whole card, fused flame rectangles, blue flood that kills liquid color.

## Flow

1. Open Equipment → drag beaker to desk
2. Open Chemicals → drop reactants into vessel
3. Mix / React → animation + equation + tutor explanation
4. XP / badge toast only on first discovery

## Motion

- Glassware is equipment-shaped SVG (`GlassVessel`) with clipped liquid wells — not rectangular cards
- Liquid free-surface waves idle continuously; pour/stir/shake/boil amplify motion
- Pour streams: inventory drop splash + vessel→vessel ribbon when one beaker is released onto another
- Reaction FX (bubbles, ppt, heat, smoke) stay secondary to the glass silhouette

## Goals

Lab goals (soap, ink, antacid, citrus cologne starter, classics) live in the top bar **Goals** picker.

**Perfume is different:** inspired scents are selected in **Perfume Atelier** (top bar **Perfume**, empty-desk **Browse Perfume Atelier**, or Goals hero **Browse full Atelier**). Users must see a bottle selection + family filters before committing to a make. Never route “Perfume” intent into the legacy citrus cologne product goal.

Perfume recipes are marked **Easy / Medium / Hard / Very hard** from guided step count (roughly 6–9 / 10–14 / 15–20 / 21–30). Harder tiers use multi-vessel pours, stir/shake gates, and transfers — not more than 6 chemicals in one beaker.

Memorable flow for perfume:
1. Open Atelier → browse / search / family / difficulty
2. Select a scent → see pyramid + bottle + step count
3. **Make this on the desk →** starts the guided goal
4. Mix → pack / XP / ★

The desk stays free-play; the guide panel is a floating coach with openable hints — not a HUD on the wood.

### Active Goal coach

Quiet seafoam glass coach — supports the desk, never competes with the beaker.

| Element | Treatment |
|---------|-----------|
| Chrome | `lab-panel/95` + `lab-line`, Fraunces title truncate + `title` tooltip |
| Progress | Thin `h-1` teal bar; `text-[10px]` step counts |
| Steps | Compact rows; current step teal wash; done check in teal — no emoji noise in the header strip |
| Complete | Soft teal footer + single “Make more like this” CTA (reward overlay owns celebration) |
| Minimized | Compact ink chip bottom-left — not a second toolbar |

Anti-patterns: mint game-HUD glow, truncated titles without tooltip, emoji-heavy headers fighting the vessel card.

## Production UI states (tutor + OCR)

| State | Behavior |
|-------|----------|
| Loading | Compact “Consulting the lab tutor…” / “Reading…” pulse — no skeleton cards |
| Signed out | Offline/static notes + “Sign in to unlock the lab tutor” / OCR gate |
| Rate limited | Keep last/fallback text; short muted banner; Retry-After respected |
| OCR fallback | Always label sample/demo equations (never pretend vision succeeded) |
| Error | Fallback explanation + “Offline notes”; Scan shows hazard-colored error line |

## Anti-patterns

- Purple gradients, cream+terracotta editorial, broadsheet newspaper layouts
- Dark mode by default
- Pill clusters and stat strips competing with the desk
- Detached badges floating on vessel liquid

## IFRA screening (Phase B)

Formula Inspector and live preview run a **teaching** IFRA Standards–aligned screen (default Category 4 fine fragrance) against Chem Lab’s version-pinned seed (`49th-Amendment-teaching`).

| UI | Behavior |
|----|----------|
| Pass | Teal “IFRA screen: Pass · Screened” + per-oil actual% / max% |
| Fail | Hazard-tint status; warnings also land in the hazards list |
| Unknown | Muted — material not in seed or solvents only |
| Disclaimer | Always visible: educational aid, not certified compliance |

Optional API: `POST /api/ifra/check` with `{ contents, category? }` — auth not required; IP rate-limited.

## Atelier Market & panel studies (Phase B)

Market keeps the golden-hour desk language (Fraunces / DM Sans, lab tokens) — frosted panels, bottle silhouettes, no dashboard chrome.

| Surface | Role |
|---------|------|
| Top bar **Market** / `/market` | Browse + search shared formulas; Remix on desk |
| `/lab/formula/[id]` | Deep link — volumetric remix via `loadFormula({ contents })` |
| Formula Inspector / Share card | **Publish to Market** (auth); Screened vs Experimental badge from IFRA |
| `/study/[id]` | Blind or labeled panel; 1–7 attribute ratings; one per uid |

Collections: `formulas` (public read, owner write), `studies`, `study_ratings`. Panel means show in the study page and after starting a study from the Inspector.

## 3D fluid (vessel well)

WebGL liquid (`FluidVesselCanvas` / Three.js) sits **inside** the glass well under the SVG rim. Spectacle is secondary to the glass silhouette — no HUD stickers, no neon glow, no purple shaders. Lab CSS tokens (`--lab-glass`, teal / amber / hazard) remain the palette.

Constraints:
- Fill, layers, turbidity, foam/boil particles, and short impulses (blast/flash/pour) only
- Cap particles; pause when off-screen; idle throttle so many vessels do not freeze the desk
- Fallback to SVG `LiquidSurface` when WebGL fails, `prefers-reduced-motion`, or `force2d`
- CSS `VesselEffects` stay on top of / beside the 3D liquid
