---
inclusion: always
---
# Tech
- Node >= 22.6 running TypeScript directly (type stripping). Zero runtime deps. Use only erasable TS syntax (no enums, no namespaces, no parameter properties).
- `src/grid.ts` is the only place that lays out text into the grid. Pages return `PageSource` (title + lines); never pad/wrap by hand in pages.
- Server: `node:http` in `src/server.ts`. Content negotiation: curl/plain UA or `?format=text` -> text; else HTML.
- Feeds: `src/feeds/*` fetch keyless open APIs (Open-Meteo, Aladhan, USGS) with timeout + cached fallback. A failing feed must render a page, not crash.
- Tests: `node --test`. Property tests use the in-repo seeded generator in `test/prop.ts`.
