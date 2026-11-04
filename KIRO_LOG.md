# How Kiro was used (running log for the Devpost write-up)

## Disclosure
The initial scaffold (commit 562a5fa, Nov 1, 2026, inside the submission period) was drafted before Kiro was
signed in: renderer MVP, steering and spec drafts. All later work is done through Kiro and logged below.

## Sessions
| Date (MST) | Surface | Spec / task | What Kiro did | Commit |
|---|---|---|---|---|
| 2026-11-03 ~18:00 | Kiro CLI 3.0.0 (Auto model) | feed-editor spec | Wrote EARS requirements R1–R20, design + correctness properties, tasks 5–8; Stop hook ran tests | 0ee9b64 |
| 2026-11-03 18:05–18:30 | Kiro CLI 3.0.0 (Auto model), --trust-all-tools | feed-editor tasks 5–8 | cachedFetch `parse` hook; RSS/Atom `parseFeed` + hand-written BBC fixtures; `compressFeed` Page Editor with 5 property tests (400 runs each); page 200 EN/AR with OFF AIR + "no headlines" fallbacks; index 100 entry. 19/19 tests, all pages fit 40x24. Session hit the 25-min wall-clock limit right after marking task 8 done; README page-map row added by hand. | (this commit) |

## Hooks
- `validate-grid.json` (PostFileSave) — re-renders all pages, blocks 40x24 overflow.
- `turn-end-check.json` (Stop) — tests + README page-map sync.
- Legacy `*.kiro.hook` (IDE 0.x format) kept for comparison; remove once v1 hooks verified in Kiro.

## PBT bugs caught
- (record each: property, counterexample, fix commit)
- Session 2: no property failures; the bugs Kiro fixed were in example-based tests (orphan item `time: ''` vs `undefined`, a fetch stub that returned the wrong fixture).
