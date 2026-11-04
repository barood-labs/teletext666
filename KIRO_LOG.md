# How Kiro was used (running log for the Devpost write-up)

## Disclosure
The initial scaffold (commit 562a5fa, Nov 1, 2026, inside the submission period) was drafted before Kiro was
signed in: renderer MVP, steering and spec drafts. All later work is done through Kiro and logged below.

## Sessions
| Date (MST) | Surface | Spec / task | What Kiro did | Commit |
|---|---|---|---|---|
| | | | | |

## Hooks
- `validate-grid.json` (PostFileSave) — re-renders all pages, blocks 40x24 overflow.
- `turn-end-check.json` (Stop) — tests + README page-map sync.
- Legacy `*.kiro.hook` (IDE 0.x format) kept for comparison; remove once v1 hooks verified in Kiro.

## PBT bugs caught
- (record each: property, counterexample, fix commit)
