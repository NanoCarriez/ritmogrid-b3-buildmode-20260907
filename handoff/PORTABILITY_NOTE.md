# PORTABILITY NOTE — RitmoGrid B3 post-run

This note does **not** rewrite the B3 repo as a clean-room app. The frozen
`b3-buildmode` tree is left intact. No destructive scaffold strip was performed.

## Can another competent coding agent run RitmoGrid without the generic Build scaffold?

**YES, with a product-focused export.** Persistence is `localStorage` key
`ritmogrid.v1`. The app does not use auth, Neon, multiplayer, or app-data
connectors.

A materially lighter production export is **feasible**. It was **not** produced
in this 20-minute microtest because stripping platform chrome in the live
workspace would risk breaking the App Builder preview contract
(`startup.sh`, Vite/Nitro ports, `public/__grok`, auth-off invariants).

## Product-essential (RitmoGrid logic + UI)

- `src/components/ritmo-app.tsx` and habit/cierre/pro/settings/share/stats/tile/form/detail/check-ring
- `src/components/ui/button.tsx`
- `src/lib/ritmo/*` (types, dates, streaks, export, palette, cierre)
- `src/store/ritmo-store.ts`
- `src/routes/__root.tsx`, `src/routes/index.tsx`
- `src/styles.css`
- `public/favicon.svg`, `public/og.jpg`
- `handoff/*` (review artifacts, not runtime)

## Generic Build infrastructure still in the tree (not product logic)

Required **only if** the app stays inside this App Builder sandbox:

- `src/lib/auth/*`, `src/lib/app-data/*`, `src/lib/multiplayer/*`, `src/lib/db.ts`
- `src/lib/og/*`, `scripts/grok-pwa-*.mjs`, `public/__grok/*`
- `scripts/browser-smoke.mjs`, `scripts/preview.mjs`, `startup.sh`
- `vite.config.ts` nitro/vercel/`grokPwaPlugin` wiring
- `.grok/` skills and references

Not required for a portable Vite/React localStorage build handed to another agent.

## Lightweight handoff result

`DOCUMENTED_NOT_STRIPPED`

A separate product-only subtree was not created (destabilization/timebox risk).
The list above is the smallest competent portable map.
