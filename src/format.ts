import { COLS, COLOURS, rows, stripTags, visibleWidth, type Page } from './grid.ts';

export function toText(page: Page, now?: Date): string {
  return page.subpages.map((_, i) => rows(page, i, now).map((r, idx) => {
    const t = stripTags(r);
    return page.rtl && idx > 0 && idx < 23 ? (t.trim() ? ' '.repeat(Math.max(0, COLS - visibleWidth(t))) + t : '') : t.trimEnd();
  }).join('\n')).join('\n\n' + '-'.repeat(COLS) + '\n\n') + '\n';
}

export function toSms(page: Page, limit = 480): string[] {
  const text = `P${page.num} ${page.title}\n` + page.subpages.flat().map(stripTags).filter((l) => l.trim()).join('\n');
  const parts: string[] = []; let cur = '';
  for (const line of text.split('\n')) {
    if ((cur + '\n' + line).length > limit && cur) { parts.push(cur); cur = line; }
    else cur = cur ? cur + '\n' + line : line;
  }
  if (cur) parts.push(cur);
  return parts;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
function rowHtml(r: string): string {
  let out = '', open = false;
  for (const part of r.split(/(\{[krgybmcw]\})/)) {
    const m = part.match(/^\{([krgybmcw])\}$/);
    if (m) { if (open) out += '</span>'; out += `<span class="${COLOURS[m[1]]}">`; open = true; }
    else out += esc(part);
  }
  return out + (open ? '</span>' : '');
}
export function toHtml(page: Page, now?: Date): string {
  const subs = page.subpages.map((_, i) => `<pre class="screen${i ? ' hidden' : ''}" dir="ltr">${rows(page, i, now).map((r, idx) =>
    `<div class="row"${page.rtl && idx > 0 && idx < 23 ? ' dir="rtl"' : ''}>${rowHtml(r) || '&nbsp;'}</div>`).join('')}</pre>`).join('');
  return `<!doctype html><html lang="${page.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>P${page.num} ${esc(page.title)} · TELETEXT 666</title><link rel="stylesheet" href="/static/crt.css"></head>
<body data-page="${page.num}" data-lang="${page.lang}" data-subs="${page.subpages.length}"><main class="tv">${subs}
<div class="counter" id="counter">P${page.num}</div></main>
<p class="help">Type a 3-digit page · <a href="/${page.lang === 'ar' ? '' : 'ar/'}${page.num}">${page.lang === 'ar' ? 'English' : 'العربية'}</a> · curl ${'$HOST'}/${page.num}</p>
<script src="/static/remote.js"></script></body></html>`;
}
