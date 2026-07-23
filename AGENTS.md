<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Chem Lab — Agent company

**Obsidian vault:** `/Users/neil/Documents/chemlab` (open `00 Home.md`)  
**Ntfy:** https://ntfy.sh/chemistry  
**Skills:** `.cursor/skills/chemlab-*`  
**Model stance:** Cursor Grok · brutal honesty · collaborative labeled team takes

## Pipeline law (non-negotiable)

```
Development → QA (browse + tests + verdict) → Deployment
```

Deploy agents **must refuse** unless the session note has `qa_status: PASS`.  
Orchestrator: `chemlab-ops` · Gate: `chemlab-dev-pipeline` · Weekly: `chemlab-weekly-report` ("run weekly chem report") · OSS: `chemlab-oss-marketing` ("do today's ntfy")

## Two repos

| App | Path |
|-----|------|
| Product (this repo) | `/Users/neil/Desktop/chemistry` |
| Admin | `/Users/neil/Desktop/chem-lab-admin` |

Shared Firebase: `chem-lab-neil`. Secrets protocol lives in the vault (`Ops/Secrets Protocol.md`) — never paste keys into Obsidian.
