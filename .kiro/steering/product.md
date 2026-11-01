---
inclusion: always
---
# Product: TELETEXT 666
Resurrected Teletext/Ceefax. Live, useful data (weather, prayer times, alerts) rendered as 40x24 teletext pages, browsed by 3-digit page number.
- Delivery: web viewer (CRT look), `curl host/100` plain text, SMS-sized text (`/sms/100`).
- Every page must stay ~1 KB so it loads on 2G / disaster networks.
- Bilingual: English + Arabic (RTL) on every core page. Arabic pages live at `/ar/<page>`.
- Page 666 = graveyard of dead web tech (Halloween easter egg). Tasteful, never hurts usefulness.
