# Design: page-renderer
- `PageSource { num, lang, title, lines: string[] }` -> `render(src): Page { rows: Row[][], subpages, rtl }`.
- `visibleWidth(s)`: strip `{c}` colour tags and Arabic harakat, count code points.
- `wrap(line, 40)`: greedy word wrap, colour tags carried to continuation lines.
- Header row 0, body rows 1-22, fastext row 23 (`100 Index  300 Weather  400 Prayer  666 ???`).
- Formatters: `toText(page)`, `toSms(page)`, `toHtml(page)`.
