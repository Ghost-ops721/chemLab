# Shotstack — status: blocked on credentials, templates ready to go

## What happened when we tried

Per the constraint against inventing credentials, we did not fabricate a Shotstack account or API key. We confirmed exactly what's needed:

1. Shotstack has **no anonymous/trial rendering** — every path (hosted MCP OAuth, local MCP via `npx @shotstack/shotstack-mcp-server`, REST API, or CLI) requires a **Shotstack account + API key** from `app.shotstack.io` (a free sandbox/stage key is enough).
2. There is no existing Shotstack MCP entry in this environment's `~/.cursor/mcp.json` or project config, and no `SHOTSTACK_API_KEY` in any `.env*` file — confirmed by searching this repo and environment.
3. Connecting the hosted MCP (`https://mcp.shotstack.io/`) inside Cursor additionally requires **Cursor Pro** (the free Hobby plan doesn't support MCP), per Shotstack's own docs.

So Shotstack was **not attempted with a live render** — there is nothing to authenticate with, and inventing a key was explicitly out of scope.

## What's here instead

Two ready-to-submit **Shotstack Edit JSON** templates matching two of the five video concepts (`01-hero-intro.edit.json`, `02-reaction-moment.edit.json`), built from Shotstack's real Edit JSON schema (timeline → tracks → clips → asset, verified against Shotstack's own `core-concepts` and `hello-world` docs). They use Chem Lab's brand colors and copy, and reference the same screenshots/logo already produced in `branding/screenshots/` and `branding/logos/`.

## To actually render these once you have a key

1. Get a free sandbox key at [app.shotstack.io](https://app.shotstack.io) (API Keys section).
2. Host the referenced images somewhere public — Shotstack's render engine fetches assets by URL, it can't read local disk. Easiest options:
   - Push `branding/screenshots/*.png` and `branding/logos/*.png` to any public bucket/CDN, or
   - Use Shotstack's own [Ingest API](https://shotstack.io/docs/guide/ingesting-footage/ingest-api.md) to upload and get back hosted URLs.
   - Replace every `REPLACE_WITH_PUBLIC_URL/...` in the two JSON files with the resulting URLs.
3. Render via curl:
   ```bash
   curl -X POST \
     -H "Content-Type: application/json" \
     -H "x-api-key: YOUR_SANDBOX_KEY" \
     -d @01-hero-intro.edit.json \
     https://api.shotstack.io/edit/stage/render
   ```
   Poll `GET https://api.shotstack.io/edit/stage/render/{id}` until `status: done`, then download from the returned `url`.
4. Or, once you have a key, add the MCP server for a fully agentic flow and ask the agent to iterate directly:
   ```json
   { "mcpServers": { "shotstack": { "url": "https://mcp.shotstack.io/" } } }
   ```
   in `~/.cursor/mcp.json` (requires Cursor Pro), then re-run this task — Shotstack's `studio`/`render_video`/`get_render_status` tools will become available and the agent can drive them directly instead of hand-authoring JSON.

## Known rough edges in these templates (fix in Shotstack Studio once rendering)

- Font families used (`Montserrat`, `Montserrat ExtraBold`, `Courier Prime`) are common Shotstack-supported fonts, standing in for the real brand fonts (Fraunces / DM Sans / JetBrains Mono) — for exact brand fidelity, ingest the real font files via the Ingest API's font upload and reference them by family name.
- The logo PNG has a light foam background; on the dark ink timeline in `02-reaction-moment.edit.json` it will show a light box — swap in a transparent-background export of the logo for a cleaner look.
