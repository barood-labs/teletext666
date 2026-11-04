import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COLS, ROWS, render, rows, visibleWidth, type Lang } from '../src/grid.ts';
import { compressFeed, dedupeFeed, truncate } from '../src/feeds/compress.ts';
import type { Item } from '../src/feeds/news.ts';
import { rng, sentence } from './prop.ts';

const ELLIPSIS = '\u2026';
const runs = (s: string): string[] => s.match(/\d+/g) ?? [];
const toks = (s: string): string[] => s.split(' ').filter((t) => t !== '');
const isPrefix = (a: string[], b: string[]): boolean => a.length <= b.length && a.every((t, i) => t === b[i]);

function genItems(r: () => number, ar: boolean, n: number): Item[] {
  const items: Item[] = [];
  for (let i = 0; i < n; i++) {
    const title = sentence(r, ar);
    const summary = r() < 0.6 ? sentence(r, ar) : '';
    let time: string | undefined;
    if (r() < 0.45) {
      const day = 1 + Math.floor(r() * 28);
      const hr = Math.floor(r() * 24);
      time = `2026-11-${String(day).padStart(2, '0')}T${String(hr).padStart(2, '0')}:45:00Z`;
    }
    items.push({ title, summary, time });
  }
  return items;
}

test('property: truncate never cuts mid-word and keeps digit tokens whole (400 cases, R12/R13)', () => {
  const r = rng(777);
  for (let i = 0; i < 400; i++) {
    const ar = i % 2 === 1;
    const s = sentence(r, ar);
    const max = 1 + Math.floor(r() * 60);
    const out = truncate(s, max);
    // width: fits max, or is a single whole token handed to the grid hard-break
    assert.ok(visibleWidth(out) <= max || toks(out).length <= 1, `wide non-token: "${out}" max=${max}`);
    // R12: the line minus a trailing ellipsis is whole leading tokens of the input
    const stripped = out.replace(new RegExp(ELLIPSIS + '$'), '');
    assert.ok(isPrefix(toks(stripped), toks(s)), `mid-word cut: "${out}" from "${s}"`);
    // R13: every digit run in the output is a digit run in the input (no split/creation)
    for (const d of runs(out)) assert.ok(runs(s).includes(d), `split digit "${d}" in "${out}" from "${s}"`);
  }
});

test('property: compressFeed is deterministic (400 cases, R16)', () => {
  const r = rng(2026);
  for (let i = 0; i < 400; i++) {
    const ar = i % 2 === 1;
    const lang: Lang = ar ? 'ar' : 'en';
    const items = genItems(r, ar, 1 + Math.floor(r() * 30));
    const budget = Math.floor(r() * 20);
    assert.deepEqual(compressFeed(items, lang, budget), compressFeed(items, lang, budget));
  }
});

test('property: dedupeFeed is idempotent (400 cases, R14)', () => {
  const r = rng(314);
  for (let i = 0; i < 400; i++) {
    const ar = i % 2 === 1;
    const items = genItems(r, ar, 1 + Math.floor(r() * 30));
    assert.deepEqual(dedupeFeed(dedupeFeed(items)), dedupeFeed(items));
  }
});

test('property: compressFeed output fits the grid (400 cases, R11)', () => {
  const r = rng(6660);
  for (let i = 0; i < 400; i++) {
    const ar = i % 2 === 1;
    const lang: Lang = ar ? 'ar' : 'en';
    const items = genItems(r, ar, 1 + Math.floor(r() * 30));
    const budget = 1 + Math.floor(r() * 18);
    const heads = compressFeed(items, lang, budget);
    assert.ok(heads.length <= budget, `budget exceeded: ${heads.length} > ${budget}`);
    const src = { num: 200, lang, title: ar ? 'الأخبار' : 'NEWS',
      lines: ['{y}NEWS', '', ...heads.map((h) => `{w}${h}`), '', '{w}Source: BBC'] };
    const p = render(src);
    p.subpages.forEach((_, s) => {
      const rr = rows(p, s);
      assert.equal(rr.length, ROWS, `subpage rows: ${rr.length}`);
      rr.forEach((l) => assert.ok(visibleWidth(l) <= COLS, `wide row: ${l}`));
    });
  }
});

test('property: compressFeed never cuts mid-word and preserves digits (400 cases, R12/R13)', () => {
  const r = rng(9999);
  for (let i = 0; i < 400; i++) {
    const ar = i % 2 === 1;
    const lang: Lang = ar ? 'ar' : 'en';
    const items = genItems(r, ar, 1 + Math.floor(r() * 30));
    const budget = 1 + Math.floor(r() * 18);
    const heads = compressFeed(items, lang, budget);
    const inputs = [...items.flatMap((it) => [toks(it.title), toks(it.summary)])];
    const allRuns = new Set<string>();
    for (const it of items) { for (const d of runs(it.title)) allRuns.add(d); for (const d of runs(it.summary)) allRuns.add(d); }
    for (const line of heads) {
      // width: fits or single degenerate token
      assert.ok(visibleWidth(line) <= COLS || toks(line).length <= 1, `wide: "${line}"`);
      // R12: line minus ellipsis is a prefix of some item's title or summary tokens
      const stripped = line.replace(new RegExp(ELLIPSIS + '$'), '');
      assert.ok(inputs.some((b) => isPrefix(toks(stripped), b)), `mid-word cut: "${line}"`);
      // R13: every digit run is an input digit run
      for (const d of runs(line)) assert.ok(allRuns.has(d), `split digit "${d}" in "${line}"`);
    }
  }
});
