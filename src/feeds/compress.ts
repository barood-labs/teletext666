import { visibleWidth, stripTags, COLS, type Lang } from '../grid.ts';
import type { Item } from './news.ts';

const ELLIPSIS = '\u2026'; // U+2026, visible width 1
const HARAKAT = /[\u064B-\u065F\u0670]/g;

// Normalise a title to a comparison key: lowercase, strip harakat + colour tags +
// punctuation, collapse whitespace. Arabic letters are kept (only shape is
// compared); Western digits are kept so magnitude/time headlines stay distinct.
function normalise(s: string): string {
  return stripTags(s ?? '')
    .replace(HARAKAT, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// edit distance <= 1 (one insert, delete, or substitute). Used for near-dup
// detection; O(n) over the (short) keys.
function within1(a: string, b: string): boolean {
  if (a === b) return true;
  const la = a.length, lb = b.length;
  if (Math.abs(la - lb) > 1) return false;
  if (la === lb) {
    let diff = 0;
    for (let i = 0; i < la; i++) if (a[i] !== b[i] && ++diff > 1) return false;
    return diff === 1;
  }
  const long = la > lb ? a : b, short = la > lb ? b : a;
  let i = 0, j = 0, diff = 0;
  while (i < long.length && j < short.length) {
    if (long[i] === short[j]) { i++; j++; }
    else { i++; if (++diff > 1) return false; }
  }
  return true; // at most one leftover char in the longer string
}

// R14: walk items in feed order, keep the first occurrence, drop an item whose key
// equals, is a prefix of, or is within edit distance 1 of a kept item's key.
// Idempotent: running it twice equals once.
function dedupeTagged(tagged: { it: Item; order: number }[]): { it: Item; order: number }[] {
  const kept: { it: Item; order: number }[] = [];
  const keys: string[] = [];
  for (const t of tagged) {
    const k = normalise(t.it.title);
    let dup = false;
    for (const kk of keys) {
      if (k === kk) { dup = true; break; }
      if (k.length > 0 && kk.length > 0 && (kk.startsWith(k) || within1(k, kk))) { dup = true; break; }
    }
    if (!dup) { kept.push(t); keys.push(k); }
  }
  return kept;
}

export function dedupeFeed(items: Item[]): Item[] {
  return dedupeTagged(items.map((it, order) => ({ it, order }))).map((t) => t.it);
}

// title or summary carries a digit / time -> promoted to the top band (R16)
function hasNumber(it: Item): boolean {
  return /\d/.test(it.title || '') || /\d/.test(it.summary || '');
}

// deterministic, wall-clock-free sortable key; missing/unparseable -> 0 (oldest)
function timeKey(t?: string): number {
  if (!t) return 0;
  const n = Date.parse(t);
  return Number.isNaN(n) ? 0 : n;
}

// R12 + R13: truncate at the last whole-word boundary and append an ellipsis.
// Digit/time tokens are whole tokens, so they are kept intact or dropped
// entirely -- never split across a break or ellipsis. A single token longer
// than `max` is emitted unchanged (the grid's hard-break is the only cut).
export function truncate(line: string, max: number): string {
  if (visibleWidth(line) <= max) return line;
  const tokens = line.split(' ').filter((t) => t !== '');
  const out: string[] = [];
  let width = 0;
  for (const tok of tokens) {
    const add = (out.length === 0 ? 0 : 1) + visibleWidth(tok); // leading space (if any) + token
    if (width + add + 1 <= max) { out.push(tok); width += add; } // +1 reserves room for ellipsis
    else break;
  }
  if (out.length === 0) return tokens[0] ?? ''; // degenerate single token > max
  return out.join(' ') + ELLIPSIS;
}

// compressFeed(items, lang, budget): normalise -> dedupe -> rank -> emit, pure.
// Never calls wrap/render; grid.ts stays the sole layout authority.
export function compressFeed(items: Item[], lang: Lang, budget: number): string[] {
  void lang; // logical order + Western digits + harakat-aware width need no action here
  if (budget <= 0) return [];
  const ranked = dedupeTagged(items.map((it, order) => ({ it, order })));
  // R16: number/time band first, then newest, then feed order. No Date.now/random.
  ranked.sort((a, b) => {
    const an = hasNumber(a.it) ? 1 : 0, bn = hasNumber(b.it) ? 1 : 0;
    if (an !== bn) return bn - an;                 // number items promoted to the top band
    const ta = timeKey(a.it.time), tb = timeKey(b.it.time);
    if (ta !== tb) return tb - ta;                 // newest (largest time) first
    return a.order - b.order;                      // tie-break: feed order ascending
  });
  const out: string[] = [];
  for (const { it } of ranked) {
    if (out.length >= budget) break;
    out.push(truncate(it.title, COLS));
    const sk = normalise(it.summary);
    if (out.length < budget && sk !== '' && sk !== normalise(it.title)) out.push(truncate(it.summary, COLS));
  }
  return out;
}
