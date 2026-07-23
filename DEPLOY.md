# Chem Lab — soft launch deploy checklist

Use this before sharing a public URL.

## 1. Firebase

- [ ] Auth: Email/password enabled; authorized domains include your Vercel URL
- [ ] Deploy Firestore rules from this repo:

```bash
npx firebase-tools login
npx firebase-tools use chem-lab-neil   # or your project
npx firebase-tools deploy --only firestore:rules
```

- [ ] Confirm from browser console that forging `xp` via client `updateDoc` is denied

## 2. Vercel env

Set in the Vercel project (Production + Preview):

- [ ] All `NEXT_PUBLIC_FIREBASE_*`
- [ ] `GROQ_API_KEY`
- [ ] `FIREBASE_SERVICE_ACCOUNT_JSON` (preferred) **or** `FIREBASE_ADMIN_PROJECT_ID` + `FIREBASE_ADMIN_CLIENT_EMAIL` + `FIREBASE_ADMIN_PRIVATE_KEY`
- [ ] `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN`
- [ ] Redeploy after env changes

## 3. CI & quality

- [ ] GitHub Actions CI green on `main` (lint, test, typecheck, build, Playwright)
- [ ] Sentry receives a test error (e.g. temporary throw in a page, or Sentry debug)

## 4. Smoke after deploy

- [ ] Home loads (desk empty state)
- [ ] Starter `HCl + NaOH` produces equation + tutor (signed-in)
- [ ] Guest hits auth gate after 2 chemicals
- [ ] Signup → `/profile?onboarding=1` → back to lab
- [ ] Scan without login shows sign-in message; with login OCR works or labeled fallback
- [ ] Burst OCR → HTTP 429
- [ ] Mobile + desktop viewport check

## Soft-launch gate (agent-verified 2026-07-23)

Local verification already done in this branch:

- [x] Lint / typecheck / Vitest (30) / Playwright smoke (4)
- [x] gstack browse: home desk chrome loads, no console errors, login page OK
- [x] `/api/progress` returns 503 without Admin credentials (expected until env is set)

Still required on your machine before sharing a public URL:

- [ ] `firebase login --reauth` then `npx firebase-tools deploy --only firestore:rules`
- [ ] Set Vercel env: Firebase client + Admin + `GROQ_API_KEY` + Sentry DSNs
- [ ] Confirm Sentry receives an event
- [ ] Burst OCR as signed-in user → 429
- [ ] Mobile + desktop smoke on the deployed URL
