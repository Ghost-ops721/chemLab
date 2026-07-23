# Chem Lab

[![License: MIT](https://img.shields.io/badge/License-MIT-1a6b5c.svg)](./LICENSE)
[![Demo](https://img.shields.io/badge/demo-live-1a6b5c.svg)](https://chemistry-nu-five.vercel.app)

Virtual chemistry desk: pour, stir, heat, and shake reactants; earn XP; scan notes with OCR; get a plain-language tutor explanation.

**The desk reacts to every move.** Open source (MIT) — [live demo](https://chemistry-nu-five.vercel.app).

Design system: [DESIGN.md](./DESIGN.md). Deploy checklist: [DEPLOY.md](./DEPLOY.md). Marketing sprint: [marketing/oss-sprint/README.md](./marketing/oss-sprint/README.md).

## Stack

- Next.js 16 (App Router) + React 19
- Firebase Auth + Firestore
- Groq (AI tutor + vision OCR)
- Zustand, Tailwind CSS 4, Vitest, Playwright

## Local setup

```bash
cp .env.example .env.local
# Fill Firebase client keys + GROQ_API_KEY + Firebase Admin credentials
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Required env

| Variable | Where used |
|----------|------------|
| `NEXT_PUBLIC_FIREBASE_*` | Client Auth + Firestore |
| `GROQ_API_KEY` | `/api/explain`, `/api/ocr` |
| `FIREBASE_SERVICE_ACCOUNT_JSON` **or** `FIREBASE_ADMIN_*` | Verify ID tokens; write progress |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | Error tracking (optional) |

Without Admin credentials, AI and progress sync APIs return 503.

### Scripts

```bash
npm run dev          # development
npm run build        # production build
npm run start        # serve build
npm run lint
npm run typecheck
npm test             # Vitest unit tests
npx playwright test  # smoke E2E
```

## Security notes (soft launch)

- `/api/explain`, `/api/ocr`, and `/api/progress` require a Firebase ID token.
- Rate limits: explain 30/min, OCR 10/min, progress 60/min (per user, in-memory).
- Firestore rules block client writes to `xp` / `discoveredIds` / `badgeIds` — progress goes through `/api/progress`.
- Deploy rules after pulling: `npx firebase-tools deploy --only firestore:rules`

## Auth funnel

Guests can add 2 chemicals, then must sign up. Live tutor and OCR require a signed-in user.

Public marketing lives at `/`. The desk is at `/lab`. Waitlist: `POST /api/waitlist`. Teacher CMS: `/teacher`. Class join: `/join?code=`.
