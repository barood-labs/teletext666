# Design: feed-editor

## Components
- `cachedFetch(url, opts?)` — `src/feeds/fetch.ts`. Extended with an optional `parse` hook: default `(res) => res.json()` keeps the existing weather/prayer/quake callers byte-for-byte unchanged; RSS callers pass `parse: (res) => res.text()` to get raw XML. Same in-memory `Map<url, {at, data}>` and 10-min TTL; on throw, returns a stale hit if present (R1, R3). Signature stays `(url, timeoutMs=4000)`-compatible; `opts` is a trailing optional object so no existing call site breaks.
- `parseFeed(xml): Item[]` — `src/feeds/news.ts`. Zero-dependency RSS 2.0 + Atom 1.0 regex parser. Never throws; malformed XML yields `[]`.
- `compressFeed(items, lang, budget): string[]` — `src/feeds/compress.ts`. Pure editor. Imports `visibleWidth`/`stripTags` from `grid.ts` only for measurement; it does **not** call `wrap`/`render` — grid.ts stays the sole layout authority.
- `fetchNews(lang): Promise<{ items: Item[]; source: string }>` — `src/feeds/news.ts`. `cachedFetch(url, { parse: r => r.text() })` then `parseFeed`.
- `news(lang, q): Promise<PageSource>` — `src/pages/live.ts`. Page 200 builder + OFF AIR fallback. Registered as `200` in `PAGES` (`index.ts`).

## Data flow
```
news(lang,q) ──► fetchNews(lang) ──► cachedFetch(url,{parse:text})
                                      └─► parseFeed(xml) ─► Item[]
                └─► compressFeed(items, lang, BODY-1) ─► string[]
                      └─► PageSource { num:200, lang, title, lines:[title, '', …heads, '', source] }
                            └─► render() (grid.ts) ─► toText | toSms | toHtml (format.ts)
```
`render()` still owns wrap + subpaging + header(0) + fastext(23); `compressFeed` only shrinks content to fit `budget`.

## Item shape
```ts
interface Item { title: string; summary: string; link?: string; time?: string }
// time: normalised sortable string (ISO-8601 preferred; RFC-822 kept as-is for sort), original digits preserved.
```

## parseFeed algorithm
1. Detect feed kind: `<item>` → RSS 2.0; `<entry>` → Atom 1.0.
2. Per block (regex, non-greedy, DOTALL):
   - title: `<title>…</title>`.
   - summary: RSS `<description>` or Atom `<summary>`/`<content>`. Unwrap `<![CDATA[…]]>`, strip HTML tags, decode entities (`&amp; &lt; &gt; &quot; &apos; &#NN;`).
   - link: RSS `<link>text</link>`; Atom `<link href="…"/>`.
   - time: RSS `<pubDate>` (RFC-822) or Atom `<updated>`/`<published>` (ISO-8601). Keep original; derive a sortable key.
3. Return `Item[]` in feed order (BBC feeds are newest-first).

## compressFeed algorithm
`compressFeed(items, lang, budget)`:
1. **Normalise** each title → key: lowercase, strip harakat + punctuation, collapse whitespace. (Arabic keys keep their letters; only shape is compared.)
2. **Dedupe** (R14, idempotent): walk items in feed order; drop an item whose key equals, is a prefix of, or is within Levenshtein ≤ 1 of a kept item's key. Keep first occurrence. Running dedupe twice equals once.
3. **Score / rank** (R16, deterministic — no `Date.now`, no randomness):
   - rank key = `[ hasNumber ? 1 : 0, timeDesc, feedOrderAsc ]` ascending;
   - `hasNumber` = title or summary matches `/\d/` or a time pattern (`\d{1,2}:\d{2}`, `\d{4}-\d{2}-\d{2}`);
   - newest (largest `time`) first; ties by feed order; number/time items promoted to the top band.
4. **Emit** greedily until `budget` rows are filled (R11), most important first:
   - headline line = `truncate(title, COLS)`;
   - if rows remain and the item has a distinct summary, optionally one summary line = `truncate(summary, COLS)`;
   - stop at `budget`.
   The page builder reserves the title + source rows, so it calls `compressFeed(items, lang, BODY − fixedRows)`.

## Truncation at word boundary + ellipsis (R12, R13)
`truncate(line, max=COLS)`:
- Measure with `visibleWidth` (colour tags + harakat are zero-width).
- If `visibleWidth(line) ≤ max` → return as-is.
- Else split on spaces into tokens; greedily join whole tokens while `visibleWidth(joined + ' ' + next) + ellipsisW ≤ max`, where `ellipsisW = visibleWidth("…")` (=1).
- Append `"…"` (U+2026).
- Digit/time tokens are whole tokens, so they are kept intact or dropped entirely — never split (R13).
- **Degenerate token**: if a single token alone exceeds `max`, emit that token unchanged and let `grid.wrap()` hard-break it (the only place a word is ever cut). `compressFeed` itself never cuts mid-word, so R12 holds for the editor; the grid's hard-break is governed by the page-renderer spec.

## Budget accounting
- `budget` = available body rows after fixed rows (title row, blank, source row, blank) are reserved by the page builder.
- `compressFeed` never returns more than `budget` lines; each ≤ `COLS` except single pathological tokens (see above).
- `budget ≤ 0` → `[]`.

## Error handling
- `parseFeed` malformed/empty XML → `[]`; never throws.
- `fetchNews` network/HTTP failure → `cachedFetch` throws → `news()` catches → `offAir(200, lang, source)` (R19).
- zero items after parse → `compressFeed([]) = []` → `news()` renders a "no headlines" line (R20), mirroring the quakes "No major quakes" pattern.
- stale cache served by `cachedFetch` on later failure (R3).

## Correctness properties (property-based tests, seeded via `test/prop.ts`)
Tests build a `PageSource` from `compressFeed` output and assert on `render()`/`rows()`:
- **Fits grid** (R11): every subpage row ≤ `COLS` and exactly `ROWS` rows; total body rows ≤ `BODY`.
- **No mid-word cut** (R12): each emitted line ends in a whole token or in `"…"`; truncation never lands inside a token.
- **Digits preserved** (R13): every digit run present in a selected item's title survives unchanged in the output (no digit run straddles a break or ellipsis).
- **Dedupe idempotent** (R14): `dedupe(dedupe(items))` deep-equals `dedupe(items)`; near-duplicate keys collapse to one.
- **Deterministic** (R16): `compressFeed` called twice with identical `(items, lang, budget)` returns the same `string[]` (no time/random source).
- Reuse `rng(seed)` / `sentence(r, ar)` to generate Arabic + English headlines (with embedded numbers/times and repeated words) as corpus input.
