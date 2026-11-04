import { cachedFetch } from './fetch.ts';
import type { Lang } from '../grid.ts';

// time: normalised sortable string kept as published (ISO-8601 or RFC-822),
// original digits preserved; sort derives a numeric key elsewhere.
export interface Item { title: string; summary: string; link?: string; time?: string }

const FEEDS: Record<Lang, { url: string; source: string }> = {
  en: { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', source: 'BBC World' },
  ar: { url: 'https://feeds.bbci.co.uk/arabic/rss.xml', source: 'BBC Arabic' },
};

const NAMED: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
  nbsp: ' ', hellip: '…', mdash: '—', ndash: '–',
  rsquo: '\u2019', lsquo: '\u2018', ldquo: '\u201C', rdquo: '\u201D',
};

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, d) => { const c = Number(d); return c > 0 ? String.fromCodePoint(c) : ''; })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&([a-zA-Z]+);/g, (_, n) => (n in NAMED ? NAMED[n] : `&${n};`));
}

// Unwrap CDATA, strip HTML tags, decode entities — order matters so a decoded
// '&lt;' never becomes a fake tag and a decoded '&amp;' never re-enters the
// entity pass. (R10)
function cleanText(s: string): string {
  const noCdata = s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, (_, c) => c);
  const noTags = noCdata.replace(/<[^>]+>/g, '');
  return decodeEntities(noTags).replace(/\s+/g, ' ').trim();
}

function firstBlock(block: string, re: RegExp): string {
  const m = block.match(re);
  return m ? cleanText(m[1]) : '';
}

// Zero-dependency RSS 2.0 + Atom 1.0 parser. Never throws; malformed/empty XML
// yields []. Items are returned in feed order (BBC feeds are newest-first). (R9)
export function parseFeed(xml: string): Item[] {
  if (!xml || typeof xml !== 'string') return [];
  const isAtom = /<entry\b/i.test(xml) && !/<item\b/i.test(xml);
  const blockRe = isAtom ? /<entry\b[\s\S]*?<\/entry>/gi : /<item\b[\s\S]*?<\/item>/gi;
  const out: Item[] = [];
  let m: RegExpExecArray | null;
  while ((m = blockRe.exec(xml)) !== null) {
    try {
      const b = m[0];
      let title: string, summary: string, link: string | undefined, time: string | undefined;
      if (isAtom) {
        title = firstBlock(b, /<title[^>]*>([\s\S]*?)<\/title>/i);
        summary = firstBlock(b, /<summary[^>]*>([\s\S]*?)<\/summary>/i) || firstBlock(b, /<content[^>]*>([\s\S]*?)<\/content>/i);
        const linkM = b.match(/<link\b[^>]*>/gi);
        if (linkM) {
          let href = '';
          for (const tag of linkM) {
            const rel = tag.match(/rel\s*=\s*"([^"]*)"/i);
            const h = tag.match(/href\s*=\s*"([^"]*)"/i);
            if (h && (!rel || rel[1] === 'alternate')) { href = h[1]; break; }
          }
          if (!href) { const h = linkM[0].match(/href\s*=\s*"([^"]*)"/i); if (h) href = h[1]; }
          link = href || undefined;
        }
        time = firstBlock(b, /<updated[^>]*>([\s\S]*?)<\/updated>/i) || firstBlock(b, /<published[^>]*>([\s\S]*?)<\/published>/i);
      } else {
        title = firstBlock(b, /<title[^>]*>([\s\S]*?)<\/title>/i);
        summary = firstBlock(b, /<description[^>]*>([\s\S]*?)<\/description>/i);
        const linkM = b.match(/<link\b[^>]*>([\s\S]*?)<\/link>/i);
        link = linkM ? cleanText(linkM[1]) : undefined;
        time = firstBlock(b, /<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i) || firstBlock(b, /<dc:date[^>]*>([\s\S]*?)<\/dc:date>/i);
      }
      if (title || summary) out.push({ title, summary, link, time });
    } catch { /* skip a malformed block, never throw */ }
  }
  return out;
}

// fetchNews(lang) = cachedFetch(text) + parseFeed. cachedFetch carries the
// ≤4 s timeout + 10-min cache of R1 and serves a stale copy on later failure
// (R3); a first-ever failure throws and the page builder renders OFF AIR (R19).
export async function fetchNews(lang: Lang): Promise<{ items: Item[]; source: string }> {
  const { url, source } = FEEDS[lang];
  const xml = await cachedFetch<string>(url, { parse: (res) => res.text() });
  return { items: parseFeed(xml), source };
}
