# Three good first issues (create with gh)

## Issue 1 — title
docs: clarify required Firebase Admin env vars for local tutor/OCR

**Body:**
```
## Why
New contributors hit 503 on `/api/explain` without Admin credentials and don't know which vars to set.

## Task
- Expand README "Required env" with a short "minimum to run tutor locally" checklist
- Point to `.env.example` field names exactly
- Note: without Admin, desk UI still runs; only AI/progress APIs fail

## Done when
A first-time contributor can follow README and know why explain/OCR returned 503.
```

## Issue 2 — title
a11y: add visible focus styles on lab glassware drag targets

**Body:**
```
## Why
Keyboard / focus users lose track of which vessel is selected on the desk.

## Task
- Ensure selected / focused glassware has a clear focus ring using existing lab tokens (no new hex colors)
- Don't break drag UX on pointer devices

## Done when
Tabbing to a vessel shows a clear focus state in light theme.
```

## Issue 3 — title
content: add one more acid–base neutralization example to the reaction catalog

**Body:**
```
## Why
Demos feel thin if only a couple of textbook reactions fire.

## Task
- Add one well-known acid–base pair already representable with existing chemicals (or document the chemical IDs needed)
- Equation must balance; follow existing reaction engine patterns
- Add a short unit test if the repo already tests reactions that way

## Done when
Pouring the pair on `/lab` shows the balanced equation banner.
```
