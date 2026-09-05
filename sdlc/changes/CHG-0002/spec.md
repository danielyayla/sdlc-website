---
id: CHG-0002
artifact: spec
cycle: 1
intent_sha: 9c2770b43979e46176ad12c20238e62da9288343
prompt_ref: prompts/design-pass@1
skills: []
concerns:
  - id: C1
    policy: REVIEW.md security pass (HTML injection)
    owner: tech_lead (@danielyayla)
    resolved: false
    note: renderFooter interpolates caller data into HTML; owner must go through escapeHtml
  - id: C2
    policy: REVIEW.md security pass (HTML injection)
    owner: tech_lead (@danielyayla)
    resolved: false
    note: year is also caller data and is interpolated; it must be coerced and escaped, not trusted as a number
  - id: C3
    policy: "intent.md constraint: existing exports unchanged"
    owner: tech_lead (@danielyayla)
    resolved: false
    note: escapeHtml, renderPage, slugify and renderNav and their tests are the freeze; test-freeze hook enforces it
  - id: C4
    policy: "CLAUDE.md: keep functions pure; every exported function gets a test under test/"
    owner: tech_lead (@danielyayla)
    resolved: false
    note: renderFooter takes no default year and reads no clock; new test file test/footer.test.js
  - id: C5
    policy: "CLAUDE.md lint rule: files under src/ start with a comment line (scripts/lint.js)"
    owner: tech_lead (@danielyayla)
    resolved: false
    note: Only src/site.js is touched; header comment stays on line 1
  - id: C6
    policy: sdlc/config.yaml thresholds.suiteMinSize=20, eligibility.coverage=lenient
    owner: platform (dkapper01@gmail.com)
    resolved: false
    note: Suite has 15 tests today; the 5 tests in this spec bring it to exactly 20, with no margin
  - id: C7
    policy: "Stage prompt: apply the org skills under .claude/skills"
    owner: platform (dkapper01@gmail.com)
    resolved: false
    note: No .claude/skills directory exists in this repo; front-matter skills is empty (same as CHG-0001 C8)
  - id: C8
    policy: "intent.md proposed outcome: footer text and markup not fully specified"
    owner: po (dkapper01@gmail.com)
    resolved: false
    note: Spec chooses <footer>&copy; YEAR OWNER</footer> with no class or id; PO to confirm wording and order
  - id: C9
    policy: "intent.md title vs open question: 'build year' but callers pass year"
    owner: po (dkapper01@gmail.com)
    resolved: false
    note: "Spec follows the answered open question: no default, no clock; missing year renders as the string 'undefined' per the existing coercion rule"
created: 2026-09-05T07:40:39Z
context_manifest: sha256:58a0d394ab73d46e90b9bc2398906d5481920321d7408998ecbaae35220cf77a
schema: 1
---
# Spec: Add renderFooter with the build year

## Requirements

Source of truth: the accepted intent.md (gate 1, sha 9c2770b4). Requirement ids are referenced by the tests and by the plan.

### R1. `renderFooter({ owner, year })` is exported from `src/site.js`
- R1.1 Takes a single options object with two fields, `owner` and `year`. No other fields are read.
- R1.2 Returns exactly one `<footer>` element as a string, with no surrounding whitespace or newline: `<footer>&copy; YEAR OWNER</footer>`.
- R1.3 `owner` is passed through the existing `escapeHtml` before interpolation (see C1). It is therefore also coerced with `String()`.
- R1.4 `year` is passed through the existing `escapeHtml` before interpolation (see C2). A number such as `2026` renders as `2026`; a string such as `"2026"` renders identically.
- R1.5 The copyright sign is emitted as the HTML entity `&copy;`, not the literal `©` character, so the output is ASCII regardless of page encoding (see C8).
- R1.6 No `class`, `id` or other attributes are emitted on the `<footer>`; styling hooks are out of scope.
- R1.7 `year` has no default. `renderFooter` never reads the clock, the environment or module state (intent open question, answered "no"; see C9).
- R1.8 Missing `owner` or `year` is not validated. `undefined` coerces to the string `undefined`, the same rule `escapeHtml`, `slugify` and `renderNav` already follow (see C9).
- R1.9 Pure: same input always gives the same output; no I/O, no dependencies.

### R2. Existing behaviour is frozen
- R2.1 `escapeHtml`, `renderPage`, `slugify` and `renderNav` keep their current source and current tests unchanged (see C3).
- R2.2 `renderPage` is not changed to call `renderFooter`; composing a footer into a page stays the caller's job, as with `renderNav`.

### R3. House rules
- R3.1 The new export has tests under `test/` (see C4).
- R3.2 `src/site.js` keeps its comment as line 1 (see C5).
- R3.3 `npm run build`, `npm test` and `npm run lint` all pass after the change.

### Acceptance tests (to be added under `test/`)
| id | input | expected |
|---|---|---|
| T1 | `{ owner: "Acme", year: 2026 }` | `<footer>&copy; 2026 Acme</footer>` |
| T2 | `{ owner: "Smith & Sons", year: 2026 }` | `<footer>&copy; 2026 Smith &amp; Sons</footer>` |
| T3 | `{ owner: "<b>x</b>", year: "\"><script>" }` | output contains no raw `<`, `>` or `"` other than the `<footer>` and `</footer>` tags |
| T4 | `{ owner: "Acme", year: "2026" }` | identical to T1 output (string and number year render the same) |
| T5 | same input called twice | both calls return the same string, and the result does not contain the current year unless it was passed in (purity check: call with `year: 1999`) |

## Design

One small pure function is appended to the existing `src/site.js` module, reusing the existing `escapeHtml` for all interpolated values and adding no dependencies. `renderPage` is left untouched; callers compose the footer into the page body themselves, exactly as they do with `renderNav`. Tests go in a new file using the same `node:test` and `node:assert/strict` pattern as the existing files.

### Files
- `src/site.js`: add `renderFooter` below `renderNav`. No other source files. The file header comment stays on line 1.
- `test/footer.test.js`: new file importing `renderFooter` and containing T1 to T5. Existing test files are not edited (the test-freeze hook blocks edits to them anyway).

### `renderFooter`
```js
export function renderFooter({ owner, year }) {
  return `<footer>&copy; ${escapeHtml(year)} ${escapeHtml(owner)}</footer>`;
}
```
`escapeHtml` already escapes `&`, `<`, `>` and `"`, which covers the text context used here. Passing `year` through `escapeHtml` rather than interpolating it directly costs nothing for the normal numeric case and closes the injection path if a caller ever passes a string (C2). `&copy;` is written literally in the template, not produced by `escapeHtml`, so it is not double-escaped.

### Interaction with `renderPage`
None. Callers do `renderPage({ title, body: content + renderFooter({ owner, year }) })`. `renderPage` intentionally does not escape `body`, so the footer HTML passes through unchanged.

### Test suite size
The suite has 15 tests today (2 in `render.test.js`, 5 in `nav.test.js`, 8 in `slugify.test.js`). The 5 tests above bring it to exactly 20, which meets `suiteMinSize: 20` with no margin (C6). The plan may add a sixth test if the platform owner wants headroom.

### Verification
`npm run build` (syntax check), `npm test` (node --test), `npm run lint` (header comment). Max 5 rounds per CLAUDE.md.

## Areas of concern

| id | concern | policy touched | owner |
|---|---|---|---|
| C1 | `renderFooter` builds HTML from caller data. `owner` must go through `escapeHtml`; T2 and T3 are the evidence. Review pass should confirm no unescaped interpolation slipped in. | REVIEW.md security pass (HTML injection) | tech_lead (@danielyayla), owns `/src/` |
| C2 | `year` is also caller data. The spec escapes it rather than trusting it as a number (R1.4, T3). Reviewer should confirm this rather than accepting a bare interpolation. | REVIEW.md security pass (HTML injection) | tech_lead (@danielyayla) |
| C3 | The four existing exports and their tests must not change. The existing test files are the freeze; the implementation session must not edit them. | intent.md constraint: existing exports unchanged | tech_lead (@danielyayla) |
| C4 | The new export needs tests under `test/` and must stay pure: no default year, no clock, no module state (T5). | CLAUDE.md: keep functions pure; every exported function gets a test | tech_lead (@danielyayla) |
| C5 | `src/site.js` must keep its comment on line 1 or `npm run lint` fails. | CLAUDE.md lint rule; scripts/lint.js | tech_lead (@danielyayla) |
| C6 | After this change the suite has exactly 20 tests, meeting `suiteMinSize: 20` with no margin. Platform owner should confirm the threshold is inclusive and whether headroom is wanted. | sdlc/config.yaml thresholds.suiteMinSize, eligibility.coverage | platform (dkapper01@gmail.com) |
| C7 | The stage prompt asks to apply org skills under `.claude/skills`, but that directory does not exist in this repo. Front-matter `skills` is empty. Same gap was raised as CHG-0001 C8 and is still open. | Stage prompt: apply org skills under .claude/skills | platform (dkapper01@gmail.com) |
| C8 | The intent says "a single footer element with the escaped owner name and the year" but not the wording. The spec chooses `&copy; YEAR OWNER` with no attributes (R1.2, R1.5, R1.6). PO should confirm the order, the entity form and the absence of a class hook before the plan fixes tests to it. | intent.md proposed outcome: footer markup underspecified | po (dkapper01@gmail.com) |
| C9 | The change title says "build year" but the intent's open question rules out defaulting to the current year. The spec takes the caller-supplied year with no validation, so a missing year renders as `undefined` (R1.7, R1.8). PO should confirm that is the intended reading rather than a build-time constant. | intent.md title vs answered open question | po (dkapper01@gmail.com) |

## Open questions carried forward

1. From intent: "Should the year default to the current year?" Answered "no" in the intent; recorded here as R1.7 so the plan does not reopen it.
2. Exact footer wording and markup (`&copy; YEAR OWNER`, no attributes): spec chooses this form; PO to confirm under C8.
3. Should missing `owner` or `year` throw, or coerce to `undefined` like the other helpers? Spec chooses coerce (R1.8); PO to confirm under C9.
4. Does the eligibility check accept a suite of exactly 20 tests (C6)? Platform to confirm before the build stage, and the plan may add a sixth test for headroom.
5. Are org skills expected under `.claude/skills` for this repo (C7)? Still unanswered from CHG-0001.
