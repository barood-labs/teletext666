---
inclusion: fileMatch
fileMatchPattern: "src/**/*.ts"
---
# Teletext rules
- Grid: exactly 40 columns x 24 rows. Row 0 = header (`P100  TELETEXT 666  date time`). Row 23 = fastext bar.
- Wrap on word boundaries; only hard-break a single word longer than 40 cols.
- Overflow -> subpages (`1/2`, `2/2`), never silent truncation.
- 8 colours only: black red green yellow blue magenta cyan white. Colour is markup (`{y}`), invisible to width.
- Page numbers 100-899 plus 666. Index = 100.
