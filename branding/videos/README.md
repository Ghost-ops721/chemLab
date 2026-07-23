# Chem Lab — Video Bake-off: Shotstack vs Remotion

## Result summary

| | Shotstack | Remotion |
|---|---|---|
| Videos delivered | 0 rendered (2 Edit JSON templates ready) | **5 of 5**, all rendered MP4s |
| Blocker | Requires a Shotstack account + API key (sandbox key is free, but is a credential we're not allowed to invent); hosted MCP also requires Cursor Pro | None — fully code-based, no account/key needed |
| Time to first result | N/A (blocked at auth) | ~23s to render the first test composition, ~80s for all 5 |
| Brand fidelity | Would need custom font ingestion to match Fraunces/DM Sans/JetBrains Mono exactly; text/image driven | Exact brand fonts, exact CSS hex colors, exact motion curves (built straight from the product's own `globals.css` keyframes) |
| Real product footage | References the same PNG screenshots, but Shotstack needs them re-hosted at a public URL first | Reads screenshots directly from disk, no hosting step |

**Winner for this task: Remotion**, by default and by design — it's the only pipeline that produced actual videos without a credential we don't have. See [`shotstack-templates/README.md`](shotstack-templates/README.md) for exactly what's needed to unblock Shotstack, and the ready-to-submit Edit JSON once you have a key.

## Why Remotion won here (not just "the other one failed")

Even setting the credential blocker aside, Remotion was the better fit for *this specific brand*:

- **Pixel-exact brand fidelity.** Chem Lab's brand signature is a very specific combination — Fraunces display serif, DM Sans UI, JetBrains Mono equations, and CSS custom properties (`--lab-teal`, `--lab-desk`, etc.) already wired into the live product. Remotion is React + CSS, so the video components import the *actual* Google Fonts packages and the *actual* hex values — zero translation loss. Shotstack's text asset uses a font-name allowlist; matching Fraunces/JetBrains Mono exactly would require a font-ingestion side-quest before the first frame renders.
- **Real screenshots, zero re-hosting.** The brief asks for real product screenshots as the visual anchor. Remotion's `staticFile()` reads them straight off disk. Shotstack's render engine fetches assets by URL only — every local screenshot would need to be pushed to a public bucket or Shotstack's Ingest API first.
- **Deterministic, debuggable, git-friendly.** Every animation (the equation typewriter, the XP bar fill, the meniscus wobble) is plain TypeScript/React with `interpolate`/`spring` — reviewable in a PR diff, unit-testable, and reproducible byte-for-byte on every render. Shotstack edits are JSON timelines, which are easy to hand-tune in Studio but harder to keep pixel-perfect to a design system encoded in code.
- **No render queue / polling.** Remotion renders locally and synchronously; Shotstack requires POST → poll `get_render_status` → download, which is fine for production pipelines but adds latency for fast iteration.

Where Shotstack would likely win, if credentials were available: **stock footage / AI-generated b-roll assembly, captions/rich-text effects out of the box, and non-technical stakeholders editing in Shotstack Studio's visual timeline** without touching code. If Chem Lab ever needs marketing ops to assemble ad variants themselves without a dev, Shotstack Studio is worth revisiting — with a real API key.

## The 5 delivered videos (`final/`, all Remotion, 1920x1080, 30fps, H.264 MP4)

| File | Length | Concept |
|---|---|---|
| `remotion-01-HeroIntro.mp4` | 20s | Brand intro: wordmark reveal → real desk screenshot → real reaction-equation screenshot → logo/tagline outro |
| `remotion-02-FeatureDemo.mp4` | 20s | Product walkthrough: Step 1 (place beaker) → Step 2 (pour reactants) → Step 3 (stir/heat/shake/mix) → real equation screenshot proof → logo outro |
| `remotion-03-ReactionMoment.mp4` | 18s | The brand's most ownable asset — the JetBrains Mono equation banner (`HCl + NaOH → NaCl + H2O`) typewriter-revealed on ink background, then the plain-language tutor explanation, then logo outro |
| `remotion-04-Gamification.mp4` | 20s | XP bar fill + level-up, quest card, "First Precipitate" discovery/reward card, logo outro |
| `remotion-05-SignupCTA.mp4` | 16s | Tagline cycle → real signup-modal screenshot recreated as a brand card → "Sign up free" CTA → logo outro |

## Re-rendering / editing

```bash
cd branding/videos/remotion
npm install
npm run render          # renders all 5 to ../final
# or, to iterate on one:
npx remotion studio src/index.ts     # opens the visual editor/preview
npx remotion render src/index.ts 03-ReactionMoment ../final/out.mp4
```

Source is organized as:
- `remotion/src/theme.ts` — brand color tokens (mirrors `src/app/globals.css`)
- `remotion/src/components/Fonts.ts` — loads Fraunces / DM Sans / JetBrains Mono via `@remotion/google-fonts`
- `remotion/src/components/` — reusable pieces (desk background, rising bubbles, the flask/vessel SVG, equation typewriter, screenshot Ken Burns pan, logo reveal)
- `remotion/src/compositions/` — the 5 videos, one file each
- `remotion/public/` — the real product screenshots and logo PNGs used as source material
