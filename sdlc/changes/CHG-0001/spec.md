---
id: CHG-0001
artifact: spec
cycle: 1
intent_sha: 8b489d0f8518a30a57f4dd7bbffed008e26941a6
prompt_ref: prompts/design-pass@1
skills: []
concerns:
  - id: C1
    policy: REVIEW.md security pass (HTML injection)
    owner: tech_lead (@danielyayla)
    resolved: false
    note: renderNav interpolates caller data into HTML; label and href must both go through escapeHtml
  - id: C2
    policy: REVIEW.md security pass (HTML injection)
    owner: tech_lead (@danielyayla)
    resolved: false
    note: "escapeHtml does not block javascript: or data: hrefs; scheme validation is declared out of scope"
  - id: C3
    policy: "intent.md constraint: slugify is ASCII only"
    owner: po (dkapper01@gmail.com)
    resolved: false
    note: Non-Latin headings slug to an empty string; diacritics are folded via NFKD before dropping non-ASCII
  - id: C4
    policy: "intent.md constraint: existing renderPage and escapeHtml behaviour unchanged"
    owner: tech_lead (@danielyayla)
    resolved: false
    note: Existing tests are the freeze; no edits to those two functions or their tests
  - id: C5
    policy: "CLAUDE.md: keep functions pure; every exported function gets a test under test/"
    owner: tech_lead (@danielyayla)
    resolved: false
    note: Two new exports require tests in test/; no I/O, no module state
  - id: C6
    policy: "CLAUDE.md lint rule: files under src/ start with a comment line (scripts/lint.js)"
    owner: tech_lead (@danielyayla)
    resolved: false
    note: Only src/site.js is touched; the existing header comment must remain line 1
  - id: C7
    policy: sdlc/config.yaml thresholds.suiteMinSize=20, eligibility.coverage=lenient
    owner: platform (dkapper01@gmail.com)
    resolved: false
    note: Suite will have roughly 10 tests after this change, below the 20 threshold; lenient coverage may or may not admit it
  - id: C8
    policy: "Stage prompt: apply the org skills under .claude/skills"
    owner: platform (dkapper01@gmail.com)
    resolved: false
    note: No .claude/skills directory exists in this repo; front-matter skills is empty
created: 2026-09-04T11:56:24Z
context_manifest: sha256:a8b209d6216a671f405fb30e0bfccb3a240bebac73d0bcba851680aaf8e8cdf1
schema: 1
---
# Spec: Add renderNav and slugify

## Requirements

Source of truth: the accepted intent.md (gate 1, sha 8b489d0f). Requirement ids are referenced by the tests and by the plan.

### R1. `slugify(text)` is exported from `src/site.js`
- R1.1 Returns a string containing only `a-z`, `0-9` and `-`.
- R1.2 Output is lower-case.
- R1.3 Any run of one or more characters outside `a-z0-9` becomes a single `-`.
- R1.4 No leading or trailing `-`.
- R1.5 Input is coerced with `String()` first, so numbers and other primitives are accepted; `null` and `undefined` therefore slug to `null` and `undefined` (same coercion rule `escapeHtml` already uses).
- R1.6 Non-ASCII input: characters are Unicode-normalised (NFKD) and combining marks dropped before the ASCII filter, so `Café au lait` becomes `cafe-au-lait`. Characters with no ASCII decomposition are dropped (see C3). Text with no ASCII letters or digits slugs to the empty string.
- R1.7 Pure: same input always gives the same output; no I/O, no module state, no dependencies.

### R2. `renderNav(items)` is exported from `src/site.js`
- R2.1 `items` is an array of `{ label, href }` objects. Returns one `<ul>` element whose children are `<li><a href="HREF">LABEL</a></li>` in input order, with no whitespace between elements.
- R2.2 Both `label` and `href` are passed through the existing `escapeHtml` before interpolation (see C1). Values are therefore also coerced with `String()`.
- R2.3 An empty array returns `<ul></ul>`.
- R2.4 `renderNav` does not mark a current page and accepts no other options (intent open question, answered "no").
- R2.5 `renderNav` does not validate `href` schemes; a caller passing `javascript:` is rendered as-is after escaping (see C2).
- R2.6 Pure; no dependencies.

### R3. Existing behaviour is frozen
- R3.1 `escapeHtml` and `renderPage` keep their current source and current tests unchanged (see C4).
- R3.2 `renderPage` is not changed to call `renderNav`; composing a nav into a page stays the caller's job.

### R4. House rules
- R4.1 Every new export has at least one test under `test/` (see C5).
- R4.2 `src/site.js` keeps its comment as line 1 (see C6).
- R4.3 `npm run build`, `npm test` and `npm run lint` all pass after the change.

### Acceptance tests (to be added under `test/`)
| id | function | input | expected |
|---|---|---|---|
| T1 | slugify | `"Hello, World!"` | `"hello-world"` |
| T2 | slugify | `"  --Multiple   spaces__and--dashes--  "` | `"multiple-spaces-and-dashes"` |
| T3 | slugify | `"Café au lait"` | `"cafe-au-lait"` |
| T4 | slugify | `"日本語"` | `""` |
| T5 | slugify | `42` | `"42"` |
| T6 | renderNav | `[{label:"Home",href:"/"},{label:"A & B",href:"/a?x=1&y=2"}]` | `<ul><li><a href="/">Home</a></li><li><a href="/a?x=1&amp;y=2">A &amp; B</a></li></ul>` |
| T7 | renderNav | `[{label:"<script>",href:"\" onclick=\"x"}]` | label and href contain no raw `<`, `>` or `"` |
| T8 | renderNav | `[]` | `<ul></ul>` |

## Design

Two small pure functions are appended to the existing `src/site.js` module, reusing the existing `escapeHtml` for all HTML output and adding no dependencies. `renderPage` is left untouched; callers compose the nav into the page body themselves. Tests are added under `test/` using the same `node:test` and `node:assert/strict` pattern as the existing file. Details follow.

### Files
- `src/site.js`: add `slugify` and `renderNav` below `renderPage`. No other source files. The file header comment stays on line 1.
- `test/render.test.js`: import the two new exports and add T1 to T8. Existing tests are not edited. (Alternative: a new `test/nav.test.js`; either satisfies `test/**/*.test.js`. Plan decides.)

### `slugify`
```js
export function slugify(text) {
  return String(text)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")   // strip combining marks left by NFKD
    .replace(/[^\x00-\x7f]/g, "")      // ASCII only (intent constraint)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
```
Order matters: normalise and strip before lower-casing so `É` folds to `e`; hyphen-collapse before trim so a leading `--` is removed in one pass. `String.prototype.normalize` is built into Node, so no dependency is added.

### `renderNav`
```js
export function renderNav(items) {
  const lis = items.map(({ label, href }) =>
    `<li><a href="${escapeHtml(href)}">${escapeHtml(label)}</a></li>`);
  return `<ul>${lis.join("")}</ul>`;
}
```
`escapeHtml` already escapes `&`, `<`, `>` and `"`, which covers both attribute (double-quoted) and text contexts used here. Single quotes are not escaped, which is safe because the attribute is double-quoted. No class names or ids are emitted; styling hooks are out of scope.

### Interaction with `renderPage`
None. Callers do `renderPage({ title, body: renderNav(items) + content })`. `renderPage` intentionally does not escape `body`, so the nav HTML passes through unchanged.

### Verification
`npm run build` (syntax check), `npm test` (node --test), `npm run lint` (header comment). Max 5 rounds per CLAUDE.md.

## Areas of concern

| id | concern | policy touched | owner |
|---|---|---|---|
| C1 | `renderNav` builds HTML from caller data. Both `label` and `href` must go through `escapeHtml`; T6 and T7 are the evidence. Review pass should confirm no unescaped interpolation slipped in. | REVIEW.md security pass (HTML injection) | tech_lead (@danielyayla), owns `/src/` |
| C2 | Escaping does not block dangerous URL schemes (`javascript:`, `data:`). The spec declares scheme validation out of scope (R2.5) because all callers are internal. Reviewer should confirm that is acceptable rather than adding a scheme allow-list. | REVIEW.md security pass (HTML injection) | tech_lead (@danielyayla) |
| C3 | "ASCII only" means non-Latin headings (T4) slug to an empty string, producing empty or colliding anchor ids. Diacritics are folded rather than dropped (R1.6), which is a slightly wider reading of the intent. Both choices need PO confirmation. | intent.md constraint: slugify is ASCII only | po (dkapper01@gmail.com) |
| C4 | `escapeHtml` and `renderPage` must not change. The existing two tests are the freeze; the implementation session must not edit them. | intent.md constraint: existing behaviour unchanged | tech_lead (@danielyayla) |
| C5 | Two new exports each need a test under `test/` and must stay pure. | CLAUDE.md: keep functions pure; every exported function gets a test | tech_lead (@danielyayla) |
| C6 | `src/site.js` must keep its comment on line 1 or `npm run lint` fails. | CLAUDE.md lint rule; scripts/lint.js | tech_lead (@danielyayla) |
| C7 | After this change the suite has about 10 tests, below `suiteMinSize: 20`. `eligibility.coverage: lenient` may admit it, but the platform owner should confirm the change is not blocked at the eligibility check. | sdlc/config.yaml thresholds.suiteMinSize, eligibility.coverage | platform (dkapper01@gmail.com) |
| C8 | The stage prompt asks to apply org skills under `.claude/skills`, but that directory does not exist in this repo. Front-matter `skills` is empty. Platform should confirm whether skills were expected to be installed here. | Stage prompt: apply org skills under .claude/skills | platform (dkapper01@gmail.com) |

## Open questions carried forward

1. From intent: "Should renderNav mark the current page?" Answered "no" in the intent; recorded here as R2.4 so the plan does not reopen it.
2. Should `slugify` fold diacritics (R1.6) or drop them outright? Spec chooses fold; PO to confirm under C3.
3. Should `renderNav` reject or allow-list `href` schemes? Spec chooses allow (R2.5); tech lead to confirm under C2.
4. Where do the new tests live: appended to `test/render.test.js` or a new `test/nav.test.js`? Left to the plan.
5. Does the eligibility check block this change on `suiteMinSize` (C7)? Platform to confirm before the build stage.
