import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { COLS, ROWS, render, rows, visibleWidth, type Lang, type Page } from '../src/grid.ts';
import { parseFeed, fetchNews } from '../src/feeds/news.ts';
import { resetCache } from '../src/feeds/fetch.ts';
import { news } from '../src/pages/live.ts';

const read = (f: string) => readFileSync(new URL(`./fixtures/${f}`, import.meta.url), 'utf8');
const world = read('bbc-world.xml');
const arabic = read('bbc-arabic.xml');

test('parseFeed: RSS 2.0 BBC World fixture -> items in feed order (R9)', () => {
  const items = parseFeed(world);
  assert.equal(items.length, 8, 'all 8 channel items parsed (dedupe happens in compressFeed, not parseFeed)');
  assert.equal(items[0].title, 'M5.8 quake strikes coast of Turkiye, magnitude revised to 5.8');
  assert.equal(items[0].link, 'https://www.bbc.co.uk/news/world-66090001');
  assert.equal(items[0].time, 'Tue, 03 Nov 2026 09:45:00 GMT');
  // digits preserved in title (R13 feed side)
  assert.match(items[0].title, /5\.8/);
  assert.match(items[0].title, /12:45|5\.8|M5/);
});

test('parseFeed: CDATA unwrapped, HTML stripped, entities decoded (R10)', () => {
  const items = parseFeed(world);
  // item 0 description was CDATA-wrapped with <p>, <b>, <a> tags
  assert.equal(items[0].summary,
    'A M5.8 earthquake hit the coast at 12:45 local time. Officials say tsunami risk is low at depth 10 km.');
  assert.ok(!/<[^>]+>/.test(items[0].summary), 'no HTML tags survive');
  assert.ok(!items[0].summary.includes('<'), 'no stray markup');
  // item 2 description used plain entities (no CDATA)
  assert.equal(items[2].summary,
    'Coastguard & army crews on scene; one official called it the "worst flood in years".');
  // heatwave item: CDATA + &amp; + &quot;
  const heat = items.find((i) => i.title.startsWith('Heatwave'))!;
  assert.equal(heat.summary,
    'Spain & Greece issue red alerts. Fire risk "extreme" near Athens through the weekend.');
});

test('parseFeed: Arabic fixture keeps logical order, Western digits, harakat (R9, R15)', () => {
  const items = parseFeed(arabic);
  assert.equal(items.length, 8);
  assert.equal(items[0].title, 'زلزال بقوة 5.8 يضرب ساحل تركيا');
  // Western digit kept inside Arabic line
  assert.match(items[0].title, /5\.8/);
  assert.match(items[0].summary, /12:45/);
  // harakat present in source (مُستَشفى) survives into the title unchanged
  const clinic = items.find((i) => i.title.includes('عيادة'))!;
  assert.ok(clinic.title.includes('مُستَشفى'), 'harakat preserved, not reversed or stripped');
});

test('parseFeed: Atom 1.0 <entry> parsed (R9)', () => {
  const atom = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Sample Atom</title>
  <entry>
    <title>Atom entry title 12:30 with &amp; ampersand</title>
    <summary type="text">Atom summary &amp; text with a &lt;b&gt;tag&lt;/b&gt; inside</summary>
    <link href="https://example.com/atom/1" rel="alternate"/>
    <updated>2026-11-03T09:45:00Z</updated>
  </entry>
  <entry>
    <title>Second entry no time</title>
    <content type="html"><![CDATA[<p>body &amp; soul</p>]]></content>
    <link href="https://example.com/atom/2"/>
    <published>2026-11-02T08:00:00Z</published>
  </entry>
</feed>`;
  const items = parseFeed(atom);
  assert.equal(items.length, 2);
  assert.equal(items[0].title, 'Atom entry title 12:30 with & ampersand');
  assert.equal(items[0].summary, 'Atom summary & text with a <b>tag</b> inside');
  assert.equal(items[0].link, 'https://example.com/atom/1');
  assert.equal(items[0].time, '2026-11-03T09:45:00Z');
  // content as summary fallback + CDATA + tag strip
  assert.equal(items[1].summary, 'body & soul');
  assert.equal(items[1].link, 'https://example.com/atom/2');
});

test('parseFeed: malformed/empty XML yields [] and never throws (R9)', () => {
  assert.deepEqual(parseFeed(''), []);
  assert.deepEqual(parseFeed('not xml at all'), []);
  assert.deepEqual(parseFeed('<rss><channel></channel></rss>'), []);
  assert.deepEqual(parseFeed('<item><title>orphan</title></item>'), [{ title: 'orphan', summary: '', link: undefined, time: '' }]);
  // a block missing all fields is skipped (no title, no summary)
  assert.deepEqual(parseFeed('<rss><channel><item><guid>x</guid></item></channel></rss>'), []);
});

test('fetchNews: parses cached text offline (R8, R9)', async () => {
  resetCache();
  let captured = '';
  const orig = globalThis.fetch;
  globalThis.fetch = ((url: string) => {
    captured = String(url);
    const body = captured.includes('arabic') ? arabic : world;
    return Promise.resolve({ ok: true, status: 200, text: async () => body, json: async () => ({}) } as unknown as Response);
  }) as typeof globalThis.fetch;
  try {
    const { items, source } = await fetchNews('en');
    assert.equal(source, 'BBC World');
    assert.equal(captured, 'https://feeds.bbci.co.uk/news/world/rss.xml');
    assert.equal(items.length, 8);
    assert.equal(items[0].title, 'M5.8 quake strikes coast of Turkiye, magnitude revised to 5.8');
    const ar = await fetchNews('ar');
    assert.equal(ar.source, 'BBC Arabic');
    assert.equal(ar.items[0].title, 'زلزال بقوة 5.8 يضرب ساحل تركيا');
  } finally {
    globalThis.fetch = orig;
  }
});

test('fetchNews: throw propagates when no cache (R1/R3 -> R19 handled by page builder)', async () => {
  resetCache();
  const orig = globalThis.fetch;
  globalThis.fetch = (() => Promise.reject(new Error('network down'))) as typeof globalThis.fetch;
  try {
    await assert.rejects(() => fetchNews('en'), /network down/);
  } finally {
    globalThis.fetch = orig;
  }
});

// ---- Page 200 rendering, fully offline (stubbed fetch) ----

function stubText(body: string): void {
  globalThis.fetch = (() =>
    Promise.resolve({ ok: true, status: 200, text: async () => body, json: async () => ({}) } as unknown as Response)
  ) as typeof globalThis.fetch;
}
function stubThrow(): void {
  globalThis.fetch = (() => Promise.reject(new Error('network down'))) as typeof globalThis.fetch;
}
function fits(p: Page) {
  p.subpages.forEach((_, s) => {
    const rr = rows(p, s);
    assert.equal(rr.length, ROWS);
    rr.forEach((l) => assert.ok(visibleWidth(l) <= COLS, `wide: ${l}`));
  });
}

test('news page 200 renders compressed headlines from fixture (R7, R18)', async () => {
  resetCache();
  const orig = globalThis.fetch;
  stubText(world);
  try {
    const p = render(await news('en', new URLSearchParams()));
    assert.equal(p.num, 200);
    const text = p.subpages.flat().join('\n');
    assert.ok(text.includes('BBC WORLD NEWS'), 'subtitle present');
    assert.ok(text.includes('5.8'), 'top number-headline promoted and kept');
    assert.ok(text.includes('Source: BBC World'), 'source attribution (R18)');
    fits(p);
    resetCache();
    stubText(arabic);
    const ar = render(await news('ar', new URLSearchParams()));
    const at = ar.subpages.flat().join('\n');
    assert.ok(at.includes('أخبار بي بي سي'));
    assert.ok(at.includes('5.8'), 'Arabic keeps Western digit');
    assert.ok(at.includes('المصدر: BBC Arabic'), 'Arabic source attribution (R18)');
    fits(ar);
  } finally {
    globalThis.fetch = orig;
  }
});

test('news page 200 OFF AIR when fetch fails with no cache (R19)', async () => {
  resetCache();
  const orig = globalThis.fetch;
  stubThrow();
  try {
    const p = render(await news('en', new URLSearchParams()));
    assert.equal(p.title, 'OFF AIR');
    const text = p.subpages.flat().join('\n');
    assert.ok(text.includes('BBC World'), 'names the source');
    fits(p);
    const ar = render(await news('ar', new URLSearchParams()));
    assert.equal(ar.title, 'خارج البث');
    assert.ok(ar.subpages.flat().join('\n').includes('BBC Arabic'));
    fits(ar);
  } finally {
    globalThis.fetch = orig;
  }
});

test('news page 200 "no headlines" when feed parses to zero items (R20)', async () => {
  resetCache();
  const orig = globalThis.fetch;
  stubText('<rss version="2.0"><channel><title>Empty</title></channel></rss>');
  try {
    const p = render(await news('en', new URLSearchParams()));
    const text = p.subpages.flat().join('\n');
    assert.ok(text.includes('No headlines.'), 'no-empty-page fallback (R20)');
    assert.ok(text.includes('Source: BBC World'), 'source still shown');
    fits(p);
    const ar = render(await news('ar', new URLSearchParams()));
    assert.ok(ar.subpages.flat().join('\n').includes('لا توجد عناوين'));
    fits(ar);
  } finally {
    globalThis.fetch = orig;
  }
});
