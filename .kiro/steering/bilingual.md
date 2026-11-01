---
inclusion: fileMatch
fileMatchPattern: "src/**/*.ts"
---
# Bilingual (EN/AR)
- Width is measured in code points after stripping Arabic diacritics (harakat U+064B-U+065F are zero-width).
- Arabic lines are stored in logical order; the web view sets `dir="rtl"` and the text output right-aligns. Never reverse strings manually.
- Digits stay Western (0-9) inside Arabic lines so times/temps survive bidi unchanged.
- Every EN page in the core set has an AR twin with the same page number.
