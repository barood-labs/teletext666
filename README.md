# TELETEXT 666 — Ceefax rises from the grave

Teletext, resurrected for the networks that still fail. Live, useful data rendered as **40×24 bilingual (English / العربية) teletext pages**, each under ~1 KB, reachable by browser, `curl`, or SMS.

```
curl localhost:6660/400?city=gaza      # prayer times, plain text
curl localhost:6660/ar/300?city=amman  # Arabic weather, right-aligned
curl "localhost:6660/sms?body=P888"    # SMS-sized quake alerts
```
Open `http://localhost:6660/100` in a browser for the CRT viewer — type any 3-digit page number.

## Run
Node ≥ 22.18 (runs TypeScript directly, zero dependencies).
```
npm start      # server on :6660
npm test       # unit + property tests (grid limits, no word loss, digits survive bidi)
npm run check  # render every page EN+AR and verify 40x24
npm run page -- 400 ar
```

## Page map
| Page | English | العربية |
|---|---|---|
| 100 | Index | الفهرس |
| 101 | About | عن الخدمة |
| 200 | News (BBC World / BBC Arabic RSS, Page Editor) | الأخبار |
| 300 | Weather (Open-Meteo) | الطقس |
| 400 | Prayer times (Aladhan) | مواقيت الصلاة |
| 666 | Graveyard | المقبرة |
| 888 | Quake alerts (USGS) | تنبيهات |

`?city=` boise · london · amman · cairo · gaza · beirut

## Built with Kiro
See [`.kiro/`](.kiro): steering (product, tech, teletext rules, bilingual), specs (page-renderer, feed-editor, text-gateway) with EARS requirements, design and tasks, and agent hooks (grid validation on save, test scaffolding for new feeds, README page-map sync).

## License
MIT
