export const COLS = 40;
export const ROWS = 24;
export const BODY = 22;
export const COLOURS: Record<string, string> = { k: 'black', r: 'red', g: 'green', y: 'yellow', b: 'blue', m: 'magenta', c: 'cyan', w: 'white' };

export type Lang = 'en' | 'ar';
export interface PageSource { num: number; lang: Lang; title: string; lines: string[] }
export interface Page { num: number; lang: Lang; title: string; rtl: boolean; subpages: string[][] }

const TAG = /\{[krgybmcw]\}/g;
const HARAKAT = /[\u064B-\u065F\u0670]/g;

export function stripTags(s: string): string { return s.replace(TAG, ''); }
export function visibleWidth(s: string): number { return [...stripTags(s).replace(HARAKAT, '')].length; }

function lastTag(s: string): string { const m = s.match(TAG); return m ? m[m.length - 1] : ''; }

export function wrap(line: string, cols = COLS): string[] {
  if (visibleWidth(line) <= cols) return [line];
  const out: string[] = [];
  let cur = '';
  for (const word of line.split(' ')) {
    let w = word;
    while (visibleWidth(w) > cols) {
      if (cur) { out.push(cur); cur = lastTag(cur); }
      const chars = [...w]; let head = ''; let i = 0;
      while (i < chars.length && visibleWidth(head + chars[i]) <= cols) head += chars[i++];
      out.push(head); w = lastTag(head) + chars.slice(i).join('');
    }
    const cand = stripTags(cur) === '' ? cur + w : cur + ' ' + w;
    if (visibleWidth(cand) <= cols) cur = cand;
    else { out.push(cur); cur = lastTag(cur) + w; }
  }
  if (stripTags(cur) !== '' || out.length === 0) out.push(cur);
  return out;
}

export function render(src: PageSource): Page {
  const body = src.lines.flatMap((l) => wrap(l));
  const subpages: string[][] = [];
  for (let i = 0; i < Math.max(body.length, 1); i += BODY) subpages.push(body.slice(i, i + BODY));
  return { num: src.num, lang: src.lang, title: src.title, rtl: src.lang === 'ar', subpages };
}

export function header(page: Page, sub: number, now = new Date()): string {
  const t = now.toISOString().slice(11, 16);
  const s = page.subpages.length > 1 ? ` ${sub + 1}/${page.subpages.length}` : '';
  const left = `P${page.num}${s}`;
  const mid = 'TELETEXT 666';
  const pad = COLS - left.length - mid.length - t.length;
  const a = Math.max(1, Math.floor(pad / 2)), b = Math.max(1, pad - a);
  return `{w}${left}${' '.repeat(a)}{y}${mid}${' '.repeat(b)}{w}${t}`;
}
export function fastext(lang: Lang): string {
  return lang === 'ar' ? '{r}100 فهرس {g}300 طقس {y}400 صلاة {c}888' : '{r}100 Index {g}300 Wthr {y}400 Pray {c}888 Alrt';
}
export function rows(page: Page, sub: number, now?: Date): string[] {
  const body = [...page.subpages[sub]];
  while (body.length < BODY) body.push('');
  return [header(page, sub, now), ...body, fastext(page.lang)];
}
