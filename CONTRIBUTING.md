# Contributing to Alyra Labs

Thanks for helping make the virtual chemistry desk better. This guide gets you from clone to a useful PR.

## Code of Conduct

Participation is governed by our [Code of Conduct](./CODE_OF_CONDUCT.md). Be precise, respectful, and constructive.

## Good first issues

Look for labels:

- `good first issue`
- `help wanted`
- `documentation`
- `beginner` / `easy`

Start with an open issue — comment if you are taking it so we do not duplicate work.

## Local setup

```bash
git clone https://github.com/Ghost-ops721/alyra-labs.git
cd alyra-labs
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Desk: `/lab`.

### Environment notes

| Goal | What you need |
|------|----------------|
| Desk UI only | `NEXT_PUBLIC_FIREBASE_*` (or expect auth/Firestore limits) |
| Tutor / OCR / progress | Also `GROQ_API_KEY` + Firebase Admin (`FIREBASE_SERVICE_ACCOUNT_JSON` or `FIREBASE_ADMIN_*`) |

Without Admin credentials, `/api/explain`, `/api/ocr`, and `/api/progress` return **503**. The desk chrome still runs.

Field names must match [`.env.example`](./.env.example) exactly.

## Design

Visual and UX changes must follow [DESIGN.md](./DESIGN.md) and [branding/BRAND_BRIEF.md](./branding/BRAND_BRIEF.md). Do not invent new hex colors or default Inter/Roboto stacks.

## Tests

```bash
npm run typecheck
npm test                 # Vitest
npx playwright test      # smoke E2E (optional for docs-only)
```

Add or update unit tests when you change reaction / engine / store logic.

## Pull requests

1. Branch from `main` with a focused scope (one concern per PR).
2. Keep diffs readable; avoid drive-by refactors.
3. Link the related issue.
4. Describe **why**, not only what.
5. Ensure typecheck + unit tests pass locally.
6. Do not commit secrets (`.env.local`, service account JSON, API keys).

### PR checklist

- [ ] Follows DESIGN.md for UI
- [ ] `npm run typecheck` passes
- [ ] `npm test` passes
- [ ] No secrets in the diff
- [ ] Issue linked (if applicable)

## Project map (where to edit)

| Area | Path |
|------|------|
| Desk / DnD | `src/desk/`, `src/drag/` |
| Animation / fluids | `src/animation/` |
| Chemistry engine | `src/domains/chemistry/` |
| Goals | `src/goals/` |
| Perfume atelier | `src/perfume/`, `src/domains/chemistry/perfume/` |
| App routes / APIs | `src/app/` |

## Questions

Use [GitHub Discussions](https://github.com/Ghost-ops721/alyra-labs/discussions) for ideas and questions. Use Issues for actionable bugs and tasks.

Maintained by **Neil Carnac**.
