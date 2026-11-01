import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COLS, ROWS, render, rows, stripTags, visibleWidth, wrap } from '../src/grid.ts';
import { toSms, toText } from '../src/format.ts';
import { parseCommand } from '../src/gateway.ts';
import { rng, sentence } from './prop.ts';

test('harakat and colour tags are zero-width', () => {
  assert.equal(visibleWidth('{y}مُستَشفى'), 6);
});
test('property: wrapped lines fit, no words lost, digits preserved (500 cases)', () => {
  const r = rng(666);
  for (let i = 0; i < 500; i++) {
    const s = sentence(r, i % 2 === 1);
    const out = wrap(s);
    for (const l of out) assert.ok(visibleWidth(l) <= COLS, `too wide: ${l}`);
    assert.equal(stripTags(out.join('')).replace(/\s/g, ''), stripTags(s).replace(/\s/g, ''));
    const digits = (x: string) => (x.match(/\d+/g) || []).join(',');
    if (!/\S{41,}/.test(stripTags(s))) assert.equal(digits(out.join(' ')), digits(s));
  }
});
test('property: every rendered subpage is exactly 24 rows of <=40 cols', () => {
  const r = rng(13);
  for (let i = 0; i < 100; i++) {
    const lines = Array.from({ length: 1 + Math.floor(r() * 40) }, () => sentence(r, r() < .5));
    const p = render({ num: 300, lang: i % 2 ? 'ar' : 'en', title: 'T', lines });
    p.subpages.forEach((_, s) => { const rr = rows(p, s); assert.equal(rr.length, ROWS); rr.forEach((l) => assert.ok(visibleWidth(l) <= COLS, l)); });
    assert.ok(toText(p).length > 0);
    toSms(p).forEach((m) => assert.ok(m.length <= 480 || !m.includes('\n')));
  }
});
test('sms command parsing', () => {
  assert.deepEqual(parseCommand('p300'), { num: 300, lang: 'en' });
  assert.deepEqual(parseCommand('AR P400'), { num: 400, lang: 'ar' });
  assert.deepEqual(parseCommand('صلاة 400'), { num: 400, lang: 'ar' });
  assert.deepEqual(parseCommand('hello'), { num: 100, lang: 'en' });
});
