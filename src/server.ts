import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { render } from './grid.ts';
import { toHtml, toSms, toText } from './format.ts';
import { getPage } from './pages/index.ts';
import { parseCommand } from './gateway.ts';

const STATIC: Record<string, string> = { 'crt.css': 'text/css', 'remote.js': 'text/javascript' };
const isText = (ua: string, q: URLSearchParams) => q.get('format') === 'text' || /curl|wget|httpie|lynx|w3m/i.test(ua);

export const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://x');
  const q = url.searchParams;
  try {
    if (url.pathname.startsWith('/static/')) {
      const f = url.pathname.slice(8);
      if (!STATIC[f]) { res.writeHead(404).end(); return; }
      res.writeHead(200, { 'content-type': STATIC[f], 'cache-control': 'max-age=3600' }).end(readFileSync(new URL(`../public/${f}`, import.meta.url)));
      return;
    }
    if (url.pathname === '/sms') {
      const { num, lang } = parseCommand(q.get('body') || q.get('Body') || 'P100');
      res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' }).end(toSms(render(await getPage(num, lang, q))).join('\n---\n'));
      return;
    }
    const m = url.pathname.match(/^\/(?:(ar|en)\/)?(sms\/)?(\d{3})?\/?$/);
    if (!m) { res.writeHead(404, { 'content-type': 'text/plain' }).end('P404 not found\n'); return; }
    const lang = m[1] === 'ar' ? 'ar' : 'en';
    const page = render(await getPage(Number(m[3] || 100), lang, q));
    if (m[2]) res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' }).end(toSms(page).join('\n---\n') + '\n');
    else if (isText(req.headers['user-agent'] || '', q)) res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' }).end(toText(page));
    else res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(toHtml(page));
  } catch (e) {
    res.writeHead(500, { 'content-type': 'text/plain' }).end('P500 ' + (e as Error).message + '\n');
  }
});

if (import.meta.main) {
  const port = Number(process.env.PORT || 6660);
  server.listen(port, () => console.log(`TELETEXT 666 on http://localhost:${port}  (curl localhost:${port}/100)`));
}
