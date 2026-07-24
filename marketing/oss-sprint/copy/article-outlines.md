# Technical articles — outlines (byline: Neil Carnac)

Publish on Dev.to / Hashnode / personal blog. Prefer one finished ~600–900 word piece before a second outline.

Live: https://alyra-labs.vercel.app · Source: https://github.com/Ghost-ops721/alyra-labs

---

## Article 1 — How I built a chemistry simulator

**Title:** How I built Alyra Labs — a chemistry simulator you can pour

**Hook:** Most “virtual labs” are quizzes with clipart. Alyra Labs is a desk: drag glassware, pour streams, and watch a balanced equation resolve.

**Sections:**
1. Why a desk, not a worksheet
2. Domain engine vs UI (reactions live under `src/domains/chemistry/`)
3. Animation as chemistry feedback (pour, boil, precipitate — not decoration)
4. Soft-launch auth funnel (2 chemicals as guest)
5. Lessons: DESIGN.md as a gate; OSS docs as product surface
6. CTA: try `/lab` · if it helped, consider a ⭐ · PRs welcome (`good first issue`)

**Tags:** opensource, chemistry, nextjs, education, typescript

---

## Article 2 — Simulating reactions in JavaScript

**Title:** Simulating chemical reactions in JavaScript (without lying to students)

**Hook:** Pouring acid into base isn’t a cutscene — the UI resolves `HCl + NaOH → NaCl + H2O` and a tutor explains it in plain language.

**Sections:**
1. Matching reactants → balanced equation banner
2. Stoichiometry / teaching helpers in the engine
3. Hazards live on the desk state
4. Effects only when chemistry happens
5. Tutor API (auth + rate limits) in one paragraph
6. CTA: star the repo · try perfume atelier

**Tags:** javascript, chemistry, simulation, webdev, opensource

---

## Article 3 — Building an educational physics/chemistry engine

**Title:** Building an educational chemistry engine for the browser

**Hook:** Educators need readable equations and honest limits — not a black-box game.

**Sections:**
1. Engine boundaries (what is simulated vs illustrated)
2. Goals / guided steps as curriculum packs
3. Teacher CMS + class join codes
4. What we deliberately do not simulate yet
5. How to add a reaction (point at CONTRIBUTING + good first issues)
6. CTA: Discussions for ideas · Issues for tasks

**Tags:** education, chemistry, opensource, nextjs

---

## Article 4 — Lessons learned building Alyra Labs

**Title:** Lessons learned open-sourcing Alyra Labs

**Hook:** Shipping the product and shipping the repository are different jobs.

**Sections:**
1. Brand dual-name tax (kill Chem Lab in public docs)
2. README is the homepage for contributors
3. Good first issues before the Show HN
4. Soft star language vs begging
5. What I’d do differently in week one of the OSS sprint
6. CTA: try the demo · contribute

**Byline:** Neil Carnac
