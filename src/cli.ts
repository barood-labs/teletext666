import { render, COLS, ROWS, rows, visibleWidth, type Lang } from './grid.ts';
import { toText } from './format.ts';
import { PAGES, getPage } from './pages/index.ts';
const [cmd = '100', arg] = process.argv.slice(2);
if (cmd === 'check') {
  let bad = 0;
  for (const n of Object.keys(PAGES).map(Number)) for (const lang of ['en', 'ar'] as Lang[]) {
    const p = render(await getPage(n, lang));
    p.subpages.forEach((_, i) => { const r = rows(p, i); if (r.length !== ROWS || r.some((l) => visibleWidth(l) > COLS)) { bad++; console.log(`FAIL P${n} ${lang} sub${i}`); } });
  }
  console.log(bad ? `${bad} failures` : 'all pages fit 40x24'); process.exit(bad ? 1 : 0);
} else {
  process.stdout.write(toText(render(await getPage(Number(cmd), arg === 'ar' ? 'ar' : 'en'))));
}
