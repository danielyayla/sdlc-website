---
id: CHG-0002
artifact: plan
cycle: 1
spec_sha: 50275b45de2a291ee17101933b5fb7bc9a90914d
rev: 1
accepted_by: null
accepted_at: null
acceptance_line: ""
context_manifest: sha256:abe5d2abc0501b2ca7e78bc19064eccbc9649472378a54d50d04ac4e423db0f1
schema: 1
---
# Plan: Add renderFooter with the build year (from spec.md 50275b45)

Source of truth: accepted spec.md (blob 50275b45de2a, accepted at gate 2 in commit 4ef70d9). Requirement ids R1–R3, acceptance tests T1–T5 and concerns C1–C9 below refer to that file.

## Files that change
src/site.js
test/footer.test.js (new)

Not changed, on purpose: test/render.test.js, test/nav.test.js, test/slugify.test.js (frozen, C3/R2.1), package.json (no dependencies, R1.9), scripts/lint.js.

## Order of work
1. Baseline. Run `npm test` and `npm run lint` before editing anything. Expect 15 passing tests (2 render, 5 nav, 8 slugify) and no lint output. If either fails, stop and report; do not "fix" the baseline.
2. Create `test/footer.test.js` (new). Copy the import pattern from `test/nav.test.js` (`import { test } from "node:test"`, `import assert from "node:assert/strict"`, `import { renderFooter } from "../src/site.js"`). Name each test with its spec id so the reviewer can map them. Six tests:
   - `T1 renderFooter renders copyright entity, year, owner`: `renderFooter({ owner: "Acme", year: 2026 })` strictly equals `<footer>&copy; 2026 Acme</footer>`. Exact equality also proves R1.2 (single element, no surrounding whitespace) and R1.6 (no attributes).
   - `T2 renderFooter escapes ampersand in owner (C1)`: `renderFooter({ owner: "Smith & Sons", year: 2026 })` strictly equals `<footer>&copy; 2026 Smith &amp; Sons</footer>`.
   - `T3 renderFooter escapes metacharacters in owner and year (C1, C2)`: `renderFooter({ owner: "<b>x</b>", year: "\"><script>" })` strictly equals `<footer>&copy; &quot;&gt;&lt;script&gt; &lt;b&gt;x&lt;/b&gt;</footer>`. Then also assert the spec's weaker form: after removing the leading `<footer>` and trailing `</footer>`, the remainder matches `assert.doesNotMatch(inner, /[<>"]/)`. Exact equality implies the spec wording; keep both.
   - `T4 renderFooter renders string and number year identically (R1.4)`: `renderFooter({ owner: "Acme", year: "2026" })` strictly equals `renderFooter({ owner: "Acme", year: 2026 })`.
   - `T5 renderFooter is pure and never reads the clock (R1.7, R1.9)`: call `renderFooter({ owner: "Acme", year: 1999 })` twice; both results strictly equal each other and equal `<footer>&copy; 1999 Acme</footer>`; then `assert.ok(!out.includes(String(new Date().getFullYear())))`. The test may read the clock; the function must not.
   - `R1.8 renderFooter coerces missing fields to "undefined" like the other helpers (C9)`: `renderFooter({})` strictly equals `<footer>&copy; undefined undefined</footer>`. This is the sixth test the spec allows for suite-size headroom (C6); it pins the coercion rule the PO is asked to confirm under C9.
   Run `npm test`; the new file must fail because `renderFooter` is not exported yet. That is the expected red step.
3. Edit `src/site.js`: append the function below `renderNav` (after line 24), copied verbatim from spec.md "Design":
   ```js
   export function renderFooter({ owner, year }) {
     return `<footer>&copy; ${escapeHtml(year)} ${escapeHtml(owner)}</footer>`;
   }
   ```
   Do not touch lines 1–24. Line 1 stays `// site: tiny static-site helpers for the SDLC website` (C5, R3.2). Both interpolations go through the existing `escapeHtml` (C1, C2). `&copy;` is written literally in the template, never passed through `escapeHtml`. `renderPage` is not changed to call `renderFooter` (R2.2).
4. Run `npm run build`, `npm test`, `npm run lint`. Expected: build exits 0 with no output; test output shows 21 tests, 21 pass, 0 fail (15 existing + 6 footer); lint prints nothing and exits 0. Fix only the new function or the new test file if anything fails; never edit the three existing test files, `escapeHtml`, `renderPage`, `slugify` or `renderNav` (C3; the test-freeze hook enforces this on every Edit/Write).
5. Confirm scope with `git status --short`: exactly `M src/site.js` and `A test/footer.test.js` (or `??` before staging). Nothing else, no `package.json` change.
6. Report done with the passing test count and the three command exit codes.

Budget: this should take one round. CLAUDE.md allows at most 5.

## Risks
- **HTML injection (C1, C2).** `renderFooter` builds markup from caller data, and `year` is caller data too. Mitigation: both interpolations go through `escapeHtml`; T2 and T3 assert exact escaped output, so dropping either `escapeHtml` call fails the suite. Do not "optimise" the year path to a bare `${year}`.
- **Freeze on existing behaviour (C3).** The `.claude/hooks/test-freeze.sh` PreToolUse hook runs on every Edit/Write. The new tests live in a new file, so the implementation session never touches a frozen file. If the hook blocks creating `test/footer.test.js`, stop and ask the engineer; do not move tests into an existing file.
- **Plan sync hook.** `.claude/hooks/plan-sync.sh` runs on every Bash call and checks work against this plan's file list. Only the two paths above are touched, so nothing outside the list should be needed; if the hook blocks a command, stop and report rather than widening scope.
- **Purity (C4, R1.7).** No default year, no `new Date()`, no module state in `src/site.js`. T5 catches a clock read only if the current year differs from 1999, which it always will. The intent's open question already answered "no" to a default; do not reopen it.
- **Suite size (C6).** Five spec tests bring the suite to exactly `suiteMinSize: 20`. This plan adds the sixth test the spec permits, so the suite lands at 21 and the threshold is met with one test of headroom whether or not the check is inclusive. If the platform owner rejects the sixth test at gate 3, drop the R1.8 test and change the expected count to 20 everywhere in this plan.
- **Footer wording (C8) and missing-field behaviour (C9).** Tests T1–T5 and R1.8 pin `&copy; YEAR OWNER`, no attributes, and `undefined` coercion. If the PO changes either answer at gate 3, the spec must be revised first and this plan re-derived; the implementation session must not guess a different format.
- **Lint (C5).** Appending at the end of the file cannot move line 1, but an editor that rewrites the file could. Step 4 runs lint to confirm.
- **Org skills (C7).** `.claude/skills` does not exist; nothing to apply.
- **Undocumented inputs.** `String()` coercion means `renderFooter({ owner: null, year: [2026] })` gives `<footer>&copy; 2026 null</footer>`. This follows R1.8 and is not tested beyond the `undefined` case; leave it.

## Proof
- `npm run build` exits 0.
- `npm test` reports 21 tests, 21 pass, 0 fail; the 15 tests in `test/render.test.js`, `test/nav.test.js` and `test/slugify.test.js` are among them and none of those files is in the diff.
- `npm run lint` prints nothing and exits 0 (line 1 of `src/site.js` still a comment).
- `git status --short` lists only `src/site.js` and `test/footer.test.js`.
- Test titles include the ids T1–T5 and R1.8 so the reviewer can tick the spec's acceptance table line by line.
- No screenshot or endpoint: this is a pure library change with no runtime surface.
