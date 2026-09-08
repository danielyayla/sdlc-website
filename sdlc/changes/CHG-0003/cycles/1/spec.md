---
id: CHG-0003
artifact: spec
cycle: 1
intent_sha: 53aa59db8f5492be0ee31425779e0be449ee9bc6
prompt_ref: prompts/design-pass@1
skills: []
concerns:
  - id: C1
    policy: REVIEW.md security pass (HTML injection)
    owner: tech_lead (@danielyayla)
    resolved: false
    note: renderMeta interpolates caller data into HTML; title and description must both go through escapeHtml
  - id: C2
    policy: REVIEW.md security pass (HTML injection)
    owner: tech_lead (@danielyayla)
    resolved: false
    note: description lands in a double-quoted attribute; escapeHtml escapes " but not ', so the attribute must stay double-quoted (R1.5)
  - id: C3
    policy: "intent.md constraint: existing exports unchanged"
    owner: tech_lead (@danielyayla)
    resolved: false
    note: escapeHtml, renderPage, slugify, renderNav, renderFooter and their tests are the freeze; renderPage is not changed to call renderMeta; test-freeze hook enforces it
  - id: C4
    policy: "CLAUDE.md: keep functions pure; every exported function gets a test under test/"
    owner: tech_lead (@danielyayla)
    resolved: false
    note: renderMeta reads no defaults, clock or module state; new test file test/meta.test.js
  - id: C5
    policy: "CLAUDE.md lint rule: files under src/ start with a comment line (scripts/lint.js)"
    owner: tech_lead (@danielyayla)
    resolved: false
    note: Only src/site.js is touched; header comment stays on line 1
  - id: C6
    policy: "Stage prompt: apply the org skills under .claude/skills"
    owner: platform (dkapper01@gmail.com)
    resolved: false
    note: No .claude/skills directory exists in this repo; front-matter skills is empty (same as CHG-0001 C8 and CHG-0002 C7)
  - id: C7
    policy: "intent.md open question: 'absent' description is underspecified"
    owner: po (dkapper01@gmail.com)
    resolved: false
    note: Spec omits the meta tag only for undefined and null; empty string emits content=""; missing title coerces to the string 'undefined' like the other helpers. PO to confirm
  - id: C8
    policy: "intent.md proposed outcome: head markup underspecified"
    owner: po (dkapper01@gmail.com)
    resolved: false
    note: Spec chooses <title>..</title><meta name="description" content=".."> with no separator, no self-closing slash, no charset or viewport tags. PO to confirm
  - id: C9
    policy: intent.md problem statement vs proposed outcome
    owner: po (dkapper01@gmail.com)
    resolved: false
    note: renderPage has no head slot and already emits its own <title>, so renderMeta cannot be composed into renderPage; hand-written heads remain hand-written apart from these two tags. Follow-up change may add a head slot
  - id: C10
    policy: sdlc/config.yaml thresholds.suiteMinSize=20, eligibility.coverage=lenient
    owner: platform (dkapper01@gmail.com)
    resolved: false
    note: Suite has 21 tests today; the 7 tests in this spec bring it to 28. Threshold met with margin; informational
created: 2026-09-08T10:59:28Z
context_manifest: sha256:209257402844a7458cedf80846394ed881e40b6921a58fc58de9edec2008cf03
schema: 1
---
# Spec: Add renderMeta for page head tags

## Requirements

Source of truth: the accepted intent.md (gate 1, sha 53aa59db). Requirement ids are referenced by the tests and by the plan.

### R1. `renderMeta({ title, description })` is exported from `src/site.js`
- R1.1 Takes a single options object with two fields, `title` and `description`. No other fields are read.
- R1.2 Returns one string containing, in this order and with no separator, whitespace or newline between them: `<title>TITLE</title>` and, when a description is present, `<meta name="description" content="DESCRIPTION">`.
- R1.3 `title` is passed through the existing `escapeHtml` before interpolation (see C1). It is therefore also coerced with `String()`.
- R1.4 `description` is passed through the existing `escapeHtml` before interpolation (see C1).
- R1.5 The `content` attribute is always delimited with double quotes. `escapeHtml` escapes `"` but not `'`, so double quotes are the only delimiter this spec permits (see C2).
- R1.6 The `<meta>` tag is emitted in HTML5 void form, `<meta name="description" content="...">`, with no trailing `/` (see C8).
- R1.7 A description is "absent" when it is `undefined` or `null`. In that case only `<title>...</title>` is returned and no `<meta>` tag is emitted (intent open question, answered "yes"; see C7).
- R1.8 An empty string `""` is not absent. It emits `<meta name="description" content="">`, because the caller passed a value (see C7).
- R1.9 `title` has no default and is not validated. A missing `title` coerces to the string `undefined`, the same rule `escapeHtml`, `slugify`, `renderNav` and `renderFooter` already follow (see C7).
- R1.10 No `charset`, `viewport` or other head tags are emitted; only the two tags named in the intent (see C8).
- R1.11 Pure: same input always gives the same output; no I/O, no clock, no module state, no dependencies (see C4).

### R2. Existing behaviour is frozen
- R2.1 `escapeHtml`, `renderPage`, `slugify`, `renderNav` and `renderFooter` keep their current source and current tests unchanged (see C3).
- R2.2 `renderPage` is not changed to call `renderMeta`. It keeps emitting its own `<title>` and has no head slot; composing head tags is the caller's job for hand-written heads (see C9).

### R3. House rules
- R3.1 The new export has tests under `test/` (see C4).
- R3.2 `src/site.js` keeps its comment as line 1 (see C5).
- R3.3 `npm run build`, `npm test` and `npm run lint` all pass after the change.

### Acceptance tests (to be added under `test/`)
| id | input | expected |
|---|---|---|
| T1 | `{ title: "Home", description: "Welcome to the site" }` | `<title>Home</title><meta name="description" content="Welcome to the site">` |
| T2 | `{ title: "A & B", description: "x < y" }` | `<title>A &amp; B</title><meta name="description" content="x &lt; y">` |
| T3 | `{ title: "</title><script>", description: "\" onload=\"x" }` | `<title>&lt;/title&gt;&lt;script&gt;</title><meta name="description" content="&quot; onload=&quot;x">`; additionally no raw `<`, `>` or `"` appears outside the fixed markup |
| T4 | `{ title: "Home" }` | `<title>Home</title>` and the output does not contain `<meta` |
| T5 | `{ title: "Home", description: null }` | identical to T4 output |
| T6 | `{ title: "Home", description: "" }` | `<title>Home</title><meta name="description" content="">` |
| T7 | same input called twice, plus `{}` | both calls return the same string; `renderMeta({})` returns `<title>undefined</title>` with no `<meta` (purity and coercion check) |

## Design

One small pure function is appended to the existing `src/site.js` module, reusing the existing `escapeHtml` for both interpolated values and adding no dependencies. `renderPage` is left untouched. Tests go in a new file using the same `node:test` and `node:assert/strict` pattern as the existing files.

### Files
- `src/site.js`: add `renderMeta` below `renderFooter`. No other source files. The file header comment stays on line 1.
- `test/meta.test.js`: new file importing `renderMeta` and containing T1 to T7. Existing test files are not edited (the test-freeze hook blocks edits to them anyway).

### `renderMeta`
```js
export function renderMeta({ title, description }) {
  const titleTag = `<title>${escapeHtml(title)}</title>`;
  if (description === undefined || description === null) return titleTag;
  return `${titleTag}<meta name="description" content="${escapeHtml(description)}">`;
}
```

Why this shape:
- `escapeHtml` escapes `&`, `<`, `>` and `"`. Inside `<title>` (an RCDATA element) escaping `<` turns any `</title>` in the data into `&lt;/title&gt;`, which browsers decode back to text, so the element cannot be closed early (T3, C1).
- Inside the `content` attribute the only way out is the `"` delimiter, which `escapeHtml` turns into `&quot;`. Single quotes are not escaped, so the template must never switch to single-quoted attributes (T3, C2).
- The absence check is an explicit `undefined`/`null` test rather than a truthiness test, so an empty string still emits the tag (R1.7, R1.8). The other helpers do not treat any value as absent; this is the first helper that does, which is why C7 asks the PO to confirm the boundary.
- `title` is not guarded. Coercing `undefined` to the string `undefined` matches every other helper (R1.9, T7).

### Interaction with `renderPage`
None. `renderPage` already emits `<head><title>...</title></head>` and offers no head slot, so `renderMeta` output cannot be composed into it without duplicating the title. `renderMeta` serves the hand-written heads named in the intent's problem statement. Adding a head slot to `renderPage` would change an existing export and is out of scope here (C9).

### Test suite size
The suite has 21 tests today (2 in `render.test.js`, 5 in `nav.test.js`, 8 in `slugify.test.js`, 6 in `footer.test.js`). The 7 tests above bring it to 28, above `suiteMinSize: 20` with margin (C10).

### Verification
`npm run build` (syntax check), `npm test` (node --test), `npm run lint` (header comment). Max 5 rounds per CLAUDE.md.

## Areas of concern

| id | concern | policy touched | owner |
|---|---|---|---|
| C1 | `renderMeta` builds HTML from caller data. Both `title` and `description` must go through `escapeHtml`; T2 and T3 are the evidence. Review pass should confirm no unescaped interpolation slipped in. | REVIEW.md security pass (HTML injection) | tech_lead (@danielyayla), owns `/src/` |
| C2 | `description` lands in an attribute, not text. `escapeHtml` escapes `"` but not `'`, so the spec fixes the delimiter to double quotes (R1.5). Reviewer should reject any single-quoted variant. | REVIEW.md security pass (HTML injection) | tech_lead (@danielyayla) |
| C3 | The five existing exports and their tests must not change, and `renderPage` must not be rewired to call `renderMeta`. The existing test files are the freeze; the implementation session must not edit them. | intent.md constraint: existing exports unchanged | tech_lead (@danielyayla) |
| C4 | The new export needs tests under `test/` and must stay pure: no defaults, no clock, no module state (T7). | CLAUDE.md: keep functions pure; every exported function gets a test | tech_lead (@danielyayla) |
| C5 | `src/site.js` must keep its comment on line 1 or `npm run lint` fails. | CLAUDE.md lint rule; scripts/lint.js | tech_lead (@danielyayla) |
| C6 | The stage prompt asks to apply org skills under `.claude/skills`, but that directory does not exist in this repo. Front-matter `skills` is empty. Same gap was raised as CHG-0001 C8 and CHG-0002 C7 and is still open. | Stage prompt: apply org skills under .claude/skills | platform (dkapper01@gmail.com) |
| C7 | The intent answers "omit the meta tag when description is absent" but does not define absent. The spec treats `undefined` and `null` as absent, emits `content=""` for an empty string, and lets a missing `title` coerce to `undefined` like the other helpers (R1.7 to R1.9). PO should confirm these boundaries before the plan fixes tests to them. | intent.md open question: "absent" underspecified | po (dkapper01@gmail.com) |
| C8 | The intent names the two tags but not their exact form. The spec chooses title first, then meta, no separator, HTML5 void form without `/`, and no charset or viewport tags (R1.2, R1.6, R1.10). PO should confirm. | intent.md proposed outcome: head markup underspecified | po (dkapper01@gmail.com) |
| C9 | The problem statement says heads are written by hand, but `renderPage` has no head slot and emits its own `<title>`, so `renderMeta` cannot be composed into it. This change fixes the two tags for hand-written heads only. PO should decide whether a follow-up change adds a head slot to `renderPage`. | intent.md problem statement vs proposed outcome | po (dkapper01@gmail.com) |
| C10 | After this change the suite has 28 tests, above `suiteMinSize: 20` with margin. Informational; no action expected. | sdlc/config.yaml thresholds.suiteMinSize, eligibility.coverage | platform (dkapper01@gmail.com) |

## Open questions carried forward

1. From intent: "Should a missing description omit the meta tag?" Answered "yes" in the intent; recorded here as R1.7 so the plan does not reopen it.
2. What counts as absent: only `undefined` and `null` (spec choice), or also the empty string? PO to confirm under C7.
3. Should a missing `title` throw, or coerce to `undefined` like the other helpers? Spec chooses coerce (R1.9); PO to confirm under C7.
4. Exact head markup (order, no separator, void form, no extra tags): spec chooses this form; PO to confirm under C8.
5. Should `renderPage` gain a head slot so pages can stop hand-writing their heads entirely (C9)? Out of scope here; PO to decide whether to open a follow-up change.
6. Are org skills expected under `.claude/skills` for this repo (C6)? Still unanswered from CHG-0001 and CHG-0002.
