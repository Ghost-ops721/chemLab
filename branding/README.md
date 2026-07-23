# Chem Lab — Branding Deliverables

Grounded in the real product (Next.js 16 app at `/`, existing `DESIGN.md`/`globals.css` design system) rather than generic AI defaults. See [`BRAND_BRIEF.md`](./BRAND_BRIEF.md) for the full brand system.

## What's in this folder

```
branding/
├── BRAND_BRIEF.md          # Name, voice, tagline, color system, typography, logo direction
├── screenshots/            # Real product screenshots captured from the running app (npm run dev)
├── logos/                  # 5 logo concepts (PNG) + README explaining each
├── videos/
│   ├── README.md           # Shotstack vs Remotion bake-off — full comparison + recommendation
│   ├── final/               # ← the 5 delivered MP4s
│   ├── remotion/            # Remotion source project (renders the 5 videos)
│   └── shotstack-templates/ # Shotstack Edit JSON templates + exact setup blocker notes
```

## Quick answers

**Brand brief:** [`BRAND_BRIEF.md`](./BRAND_BRIEF.md) — name stays **Chem Lab**, tagline **"The desk reacts to every move."**, colors are the product's existing walnut/seafoam/ink palette (`--lab-*` CSS variables), type is Fraunces (display) + DM Sans (UI) + JetBrains Mono (equations).

**5 logos:** [`logos/`](./logos/) — `chemlab-logo-01-wordmark.png`, `02-monogram.png`, `03-icon-lockup.png`, `04-abstract-mark.png`, `05-badge-seal.png`. Recommendation: lead with `03-icon-lockup`, use `02-monogram` as the app icon/favicon.

**5 videos:** [`videos/final/`](./videos/final/) — 5 MP4s, all produced with **Remotion** (1920×1080, 30fps, 16–20s each). Full head-to-head against Shotstack, including exactly why Shotstack couldn't render anything without credentials we're not allowed to invent, is in [`videos/README.md`](./videos/README.md).

**Shotstack setup notes:** [`videos/shotstack-templates/README.md`](./videos/shotstack-templates/README.md) — confirmed Shotstack requires an `app.shotstack.io` API key (no anonymous path exists) and Cursor Pro for the hosted MCP; two ready-to-submit Edit JSON templates are included so rendering takes one API call once a key is available.

## Recommendation going forward

Use **Remotion** as the primary video pipeline — it's code-based, reads real product screenshots directly, and reproduces the brand's exact fonts/colors/motion with zero translation loss. Revisit Shotstack only if non-technical marketing ops need a visual timeline editor and a real API key gets provisioned.
