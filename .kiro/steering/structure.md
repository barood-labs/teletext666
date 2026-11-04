---
inclusion: always
---
# Project structure
- `src/grid.ts` — 40x24 cell grid, word-safe wrap, RTL line handling. Pure functions only.
- `src/format.ts` — outputs: HTML (CRT viewer), plain text (curl), SMS (≤160-char segments).
- `src/pages/` — one module per page group; each exports `{ number, title: {en, ar}, render(lang, ctx) }`.
- `src/feeds/` — adapters for keyless open data (Open-Meteo, Aladhan, USGS). Every adapter needs a fixture + test.
- `src/server.ts` — zero-dependency HTTP server on :6660. `src/gateway.ts` — SMS/text gateway (`P###`).
- `public/` — CRT viewer assets. `test/` — unit + property tests (`node --test`).
- Conventions: TypeScript run directly by Node ≥22.18, no build step, no runtime deps unless a spec approves one.
- New features start as a spec in `.kiro/specs/<feature>/` (requirements.md in EARS → design.md → tasks.md).
