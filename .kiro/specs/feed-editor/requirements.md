# Requirements: feed-editor

## US1 — Keyless live-data feeds (foundation)
As a reader on any network, I want live data fetched from keyless open APIs with a short timeout and a cache, so pages load fast and survive source outages.
- R1: WHEN any feed is requested THE SYSTEM SHALL fetch it with a ≤4 s timeout and SHALL cache the last good result for 10 minutes.
- R2: IF a fetch fails and no cache exists THEN THE SYSTEM SHALL render an "OFF AIR" page naming the source.
- R3: IF a fetch fails but a cached copy exists THEN THE SYSTEM SHALL render the cached data.
- R4: THE SYSTEM SHALL support Open-Meteo weather at page 300 (EN/AR) with no API key.
- R5: THE SYSTEM SHALL support Aladhan prayer times at page 400 (EN/AR) with no API key.
- R6: THE SYSTEM SHALL support USGS earthquake alerts at page 888 (EN/AR) with no API key.
- R7: THE SYSTEM SHALL support BBC RSS news at page 200 (EN/AR) with no API key.

## US2 — RSS/Atom fetch and parse
As a reader, I want the News page to pull a public RSS/Atom feed, so headlines come from a real source without added dependencies.
- R8: WHEN page 200 is requested THE SYSTEM SHALL fetch BBC World (EN: `https://feeds.bbci.co.uk/news/world/rss.xml`) or BBC Arabic (AR: `https://feeds.bbci.co.uk/arabic/rss.xml`) RSS via cachedFetch with the timeout and cache of R1.
- R9: WHEN the feed returns XML THE SYSTEM SHALL parse it with a zero-dependency regex/XML-lite parser (RSS 2.0 `<item>` and Atom 1.0 `<entry>`) and SHALL extract per item the title, summary, link, and publish time.
- R10: WHEN parsing item text THE SYSTEM SHALL strip HTML tags, unwrap CDATA, and decode XML/HTML entities so only display text reaches the grid.

## US3 — The Page Editor (compressFeed)
As a reader, I want long headlines and summaries compressed to fit one 40×24 page without losing words, numbers, or meaning, so I get the gist at a glance.
- R11: WHEN feed items exceed the page budget THE SYSTEM SHALL compress them via `compressFeed(items, lang, budget)` into at most `budget` body rows, each ≤40 visible columns.
- R12: WHEN a headline or summary line exceeds 40 columns THE SYSTEM SHALL truncate at the last whole-word boundary and append an ellipsis, and SHALL NOT cut a word mid-word.
- R13: WHEN truncating THE SYSTEM SHALL keep every digit/time token (e.g. `12:45`, `M4.5`, `2026-11-03`) intact and SHALL NOT split it across a break or ellipsis.
- R14: WHEN two headlines are near-identical after normalisation THE SYSTEM SHALL keep only one, de-duplicating deterministically and idempotently.
- R15: WHEN lang is Arabic THE SYSTEM SHALL keep lines in logical order, measure width ignoring harakat, keep Western digits, and mark the page RTL, and SHALL NOT reverse strings.
- R16: THE SYSTEM SHALL rank items deterministically for a given input — most recent first, ties broken by feed order, items containing numbers/times promoted — so output is reproducible without wall-clock time.

## US4 — Page 200 (News), bilingual + offline fallback
As a reader, I want a News page at 200 in English and Arabic, and a graceful page when the feed is down, so I am never shown a crash or blank.
- R17: THE SYSTEM SHALL expose page 200 EN at `/200` and AR at `/ar/200`, twins sharing page number 200.
- R18: WHEN page 200 renders THE SYSTEM SHALL show the header, the compressed headlines, and a source attribution line (EN "BBC World", AR "BBC Arabic").
- R19: IF the news fetch fails and no cache exists THEN THE SYSTEM SHALL render the "OFF AIR" page naming the source (per R2), reusing the same shape as the other live pages.
- R20: WHEN the news feed parses to zero items THE SYSTEM SHALL render a "no headlines" line rather than an empty page.
