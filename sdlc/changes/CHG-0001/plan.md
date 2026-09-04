---
id: CHG-0001
artifact: plan
cycle: 1
spec_sha: a8e6c8143d6c4b8d5512fb6937dd2435c3881ab7
rev: 2
accepted_by: null
accepted_at: null
acceptance_line: npm run build, npm test and npm run lint all exit 0; npm test reports 15 tests passing (2 existing in test/render.test.js unchanged, 8 in test/slugify.test.js, 5 in test/nav.test.js, titles carrying T1–T8); git status --short lists only src/site.js, test/slugify.test.js and test/nav.test.js.
context_manifest: sha256:5abb7be8a5e130ec2d17db64177197b82fae2d600308327f30edae35687f00c8
schema: 1
---
# Plan: Add renderNav and slugify (from spec.md a8e6c814)

Source of truth: accepted spec.md (blob a8e6c8143d6c, commit ac8da87). Requirement ids R1–R4, acceptance tests T1–T8 and concerns C1–C8 below refer to that file.

## Files that change
src/site.js
test/slugify.test.js (new)
test/nav.test.js (new)

Not changed, on purpose: test/render.test.js (frozen, C4), package.json (no dependencies, R1.7/R2.6), scripts/lint.js.

## Order of work
1. Baseline. Run `npm test` and `npm run lint` before editing anything. Expect 2 passing tests and no lint output. If either fails, stop and report; do not "fix" the baseline.
2. Create `test/slugify.test.js` (new). Copy the import pattern from `test/render.test.js` (`node:test`, `node:assert/strict`, `import { slugify } from "../src/site.js"`). Name each test with its spec id so the reviewer can map them. Tests:
   - `T1 slugify("Hello, World!")` equals `"hello-world"`.
   - `T2 slugify("  --Multiple   spaces__and--dashes--  ")` equals `"multiple-spaces-and-dashes"`.
   - `T3 slugify("Café au lait")` equals `"cafe-au-lait"` (R1.6 fold).
   - `T4 slugify("日本語")` equals `""` (R1.6 drop, C3).
   - `T5 slugify(42)` equals `"42"` (R1.5).
   - `R1.5 slugify(null)` equals `"null"` and `slugify(undefined)` equals `"undefined"`.
   - `R1.1/R1.4` for each of the inputs above, `assert.match(out, /^(?!-)[a-z0-9-]*(?<!-)$/)` (only allowed chars, no leading or trailing hyphen).
   - `R1.7 idempotent`: `slugify(slugify("Hello, World!"))` equals `"hello-world"`.
   Run `npm test`; the new file must fail because `slugify` is not exported yet. That is the expected red step.
3. Create `test/nav.test.js` (new), importing `renderNav` (and `escapeHtml` only if useful for building expectations). Tests:
   - `T6 renderNav([{label:"Home",href:"/"},{label:"A & B",href:"/a?x=1&y=2"}])` strictly equals `<ul><li><a href="/">Home</a></li><li><a href="/a?x=1&amp;y=2">A &amp; B</a></li></ul>`.
   - `T7 renderNav([{label:"<script>",href:"\" onclick=\"x"}])` strictly equals `<ul><li><a href="&quot; onclick=&quot;x">&lt;script&gt;</a></li></ul>`. This is stronger than the spec's "no raw `<`, `>`, `"`" wording and implies it; keep the exact-equality form (C1).
   - `T8 renderNav([])` strictly equals `<ul></ul>`.
   - `R2.2 coercion`: `renderNav([{label: 1, href: 2}])` equals `<ul><li><a href="2">1</a></li></ul>`.
   - `R2.1/R2.4 no extras`: output of T6 contains no whitespace characters and no `class=` or `aria-current` substrings.
   Run `npm test`; expect this file to fail for the same reason (red).
4. Edit `src/site.js`: append the two functions below `renderPage`, copied verbatim from spec.md "Design" (`slugify` then `renderNav`). Do not touch lines 1–8. Line 1 stays `// site: tiny static-site helpers for the SDLC website` (C6). `renderNav` must call the existing `escapeHtml` for both `href` and `label` (C1); `renderPage` is not changed to call `renderNav` (R3.2).
5. Run `npm run build`, `npm test`, `npm run lint`. Expected: build exits 0 with no output; test output shows 15 tests, 15 pass, 0 fail (2 existing + 8 slugify + 5 nav); lint prints nothing and exits 0. Fix only the new code or new tests if anything fails; never edit `test/render.test.js`, `escapeHtml` or `renderPage` (C4, the test-freeze hook enforces this).
6. Confirm scope with `git status --short`: exactly `M src/site.js`, `A test/slugify.test.js`, `A test/nav.test.js`. Nothing else, no `package.json` change.
7. Report done with the passing test count and the three command exit codes.

Budget: this should take one round. CLAUDE.md allows at most 5.

## Risks
- **HTML injection (C1).** `renderNav` builds markup from caller data. Mitigation: both interpolations go through `escapeHtml`; T6 and T7 assert exact escaped output, so a missing `escapeHtml` call fails the suite.
- **Dangerous href schemes (C2).** `javascript:` and `data:` hrefs pass through unchanged (R2.5). Nothing to implement; the tech lead confirms this stays out of scope at gate 3. Do not add an allow-list.
- **ASCII-only slugs (C3).** Non-Latin headings slug to `""` (T4), so callers can get empty or colliding anchor ids. Accepted by the spec; PO confirms at gate 3. Do not add a fallback such as a hash suffix.
- **Freeze on existing behaviour (C4).** The `.claude/hooks/test-freeze.sh` PreToolUse hook runs on every Edit/Write. Putting the new tests in new files, not in `test/render.test.js`, keeps the implementation session clear of it. If the hook also blocks creating new files under `test/`, stop and ask the engineer; do not move tests elsewhere.
- **Suite size (C7).** After this change the suite has 15 tests, below `suiteMinSize: 20` in sdlc/config.yaml. The plan does not pad tests to reach a number; whether `eligibility.coverage: lenient` admits the change is a platform decision before the build stage.
- **Regex runtime support.** `\p{M}` with the `u` flag and `String.prototype.normalize("NFKD")` need Node 10+; `node --test` already needs Node 18+, so no new floor is introduced. `[^\x00-\x7f]` is a plain character class and does not need the `u` flag.
- **Undocumented inputs.** `String()` coercion means `slugify([1,2])` gives `"1-2"` and `slugify({})` gives `"object-object"`. This follows R1.5 and is not tested or documented; leave it.
- **Org skills (C8).** `.claude/skills` does not exist; nothing to apply.

## Proof
- `npm run build` exits 0.
- `npm test` reports 15 tests, 15 pass, 0 fail; the two tests in `test/render.test.js` are among them and that file is not in the diff.
- `npm run lint` prints nothing and exits 0 (line 1 of `src/site.js` still a comment).
- `git status --short` lists only `src/site.js`, `test/slugify.test.js`, `test/nav.test.js`.
- Test titles include the ids T1–T8 so the reviewer can tick the spec's acceptance table line by line.
- No screenshot or endpoint: this is a pure library change with no runtime surface.
