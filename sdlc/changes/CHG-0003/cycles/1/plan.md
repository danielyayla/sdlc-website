---
id: CHG-0003
artifact: plan
cycle: 1
spec_sha: fb417fa124fcda5037391063e44eb9f8cf16006c
rev: 2
accepted_by: dkapper01@gmail.com
accepted_at: 2026-09-08T11:18:17Z
acceptance_line: npm run build, npm test and npm run lint all exit 0; npm test reports 28 tests passing (21 existing in test/render.test.js, test/nav.test.js, test/slugify.test.js and test/footer.test.js unchanged, 7 in new test/meta.test.js with titles carrying T1–T7); git status --short lists only src/site.js and test/meta.test.js.
context_manifest: sha256:bc7ccaabc48147c6df6164c6dfd92319479be75dc944904175875a15bf950635
schema: 1
---
---
id: CHG-0003
artifact: plan
cycle: 1
spec_sha: fb417fa124fcda5037391063e44eb9f8cf16006c
rev: 2
accepted_by: 
accepted_at: 
acceptance_line: "npm run build, npm test and npm run lint all exit 0; npm test reports 28 tests passing (21 existing in test/render.test.js, test/nav.test.js, test/slugify.test.js and test/footer.test.js unchanged, 7 in new test/meta.test.js with titles carrying T1–T7); git status --short lists only src/site.js and test/meta.test.js."
context_manifest: sha256:cbd0973e2cbd25f2a729a14b277d95899baad29a6053ae56f505c03e095af2d0
schema: 1
---
# Plan: Add renderMeta for page head tags (from spec.md fb417fa1)

Source of truth: accepted spec.md (blob fb417fa124fcda, accepted at gate 2 by the PO on 2026-09-08, ledger seq 12). Requirement ids R1–R3, acceptance tests T1–T7 and concerns C1–C10 below refer to that file. Gate 2 acceptance is taken as the PO's answer to C7, C8 and C9: absent means `undefined` or `null` only, empty string emits `content=""`, missing title coerces to `undefined`, markup is title-then-meta with no separator and no `/`, and `renderPage` is not touched.

## Files that change
src/site.js
test/meta.test.js (new)

Not changed, on purpose: test/render.test.js, test/nav.test.js, test/slugify.test.js, test/footer.test.js (frozen, C3/R2.1), package.json (no dependencies, R1.11), scripts/lint.js, CLAUDE.md.

## Order of work
1. Baseline. Run `npm test` and `npm run lint` before editing anything. Expect 21 passing tests (2 render, 5 nav, 8 slugify, 6 footer) and no lint output. If either fails, stop and report; do not "fix" the baseline.
2. Create `test/meta.test.js` (new). Copy the import pattern from `test/footer.test.js`: `import { test } from "node:test"`, `import assert from "node:assert/strict"`, `import { renderMeta } from "../src/site.js"`. Name each test with its spec id so the reviewer can map the acceptance table line by line. Seven tests:
   - `T1 renderMeta renders title then description meta with no separator (R1.2)`: `renderMeta({ title: "Home", description: "Welcome to the site" })` strictly equals `<title>Home</title><meta name="description" content="Welcome to the site">`. Exact equality also proves R1.6 (void form, no `/`) and R1.10 (no other tags).
   - `T2 renderMeta escapes & and < in both values (C1)`: `renderMeta({ title: "A & B", description: "x < y" })` strictly equals `<title>A &amp; B</title><meta name="description" content="x &lt; y">`.
   - `T3 renderMeta neutralises title breakout and attribute breakout (C1, C2)`: `renderMeta({ title: "</title><script>", description: "\" onload=\"x" })` strictly equals `<title>&lt;/title&gt;&lt;script&gt;</title><meta name="description" content="&quot; onload=&quot;x">`. Then also assert the spec's weaker form: strip the fixed markup and check nothing raw remains:
     ```js
     const inner = out
       .replace(/^<title>/, "")
       .replace(/<\/title><meta name="description" content="/, "|")
       .replace(/">$/, "");
     assert.doesNotMatch(inner, /[<>"]/);
     ```
     Exact equality implies the weaker form; keep both.
   - `T4 renderMeta omits the meta tag when description is undefined (R1.7)`: `renderMeta({ title: "Home" })` strictly equals `<title>Home</title>` and `assert.ok(!out.includes("<meta"))`.
   - `T5 renderMeta treats null description as absent (R1.7)`: `renderMeta({ title: "Home", description: null })` strictly equals `renderMeta({ title: "Home" })`.
   - `T6 renderMeta emits an empty content attribute for an empty string (R1.8)`: `renderMeta({ title: "Home", description: "" })` strictly equals `<title>Home</title><meta name="description" content="">`.
   - `T7 renderMeta is pure and coerces a missing title to "undefined" (R1.9, R1.11)`: call `renderMeta({ title: "Home", description: "Welcome to the site" })` twice and assert both results are strictly equal; then `renderMeta({})` strictly equals `<title>undefined</title>` and does not include `<meta`.
   Run `npm test`; the new file must fail because `renderMeta` is not exported yet. That is the expected red step.
3. Edit `src/site.js`: append the function below `renderFooter` (after line 28, the closing brace of `renderFooter`), copied verbatim from spec.md "Design":
   ```js
   export function renderMeta({ title, description }) {
     const titleTag = `<title>${escapeHtml(title)}</title>`;
     if (description === undefined || description === null) return titleTag;
     return `${titleTag}<meta name="description" content="${escapeHtml(description)}">`;
   }
   ```
   Do not touch lines 1–28. Line 1 stays `// site: tiny static-site helpers for the SDLC website` (C5, R3.2). Both interpolations go through the existing `escapeHtml` (C1). The `content` attribute is double-quoted and must stay double-quoted (C2, R1.5). The absence check is `=== undefined || === null`, not a truthiness test, so `""` still emits the tag (R1.7, R1.8). `title` has no default or guard (R1.9). `renderPage` is not changed to call `renderMeta` (R2.2, C9).
4. Run `npm run build`, `npm test`, `npm run lint`. Expected: build exits 0 with no output beyond the script echo; test output ends with `# tests 28`, `# pass 28`, `# fail 0`; lint prints nothing and exits 0. Fix only the new function or the new test file if anything fails; never edit the four existing test files, `escapeHtml`, `renderPage`, `slugify`, `renderNav` or `renderFooter` (C3; the test-freeze hook blocks Edit/Write on frozen files).
5. Confirm scope with `git status --short`: exactly `M src/site.js` and `?? test/meta.test.js` (or `A` once staged). Nothing else, no `package.json` change.
6. Report done with the passing test count and the three command exit codes.

Budget: one round expected. CLAUDE.md allows at most 5.

## Risks
- **HTML injection (C1, C2).** `renderMeta` builds markup from caller data and `description` lands inside an attribute. Mitigation: both values go through `escapeHtml`, and the attribute delimiter is fixed to `"` because `escapeHtml` does not escape `'`. T2 and T3 assert exact escaped output, so dropping either `escapeHtml` call or switching to single quotes fails the suite. Do not "simplify" to `${description}` or `content='...'`.
- **Absence boundary (C7).** A truthiness check (`if (!description)`) would pass T4 and T5 but fail T6. The spec's explicit `undefined`/`null` test is the only shape that passes all three; T6 exists to catch the shortcut. If the PO reverses the empty-string decision at gate 3, the spec must be revised first and T6 rewritten; the implementation session must not guess.
- **Freeze on existing behaviour (C3, R2).** The `.claude/hooks/test-freeze.sh` PreToolUse hook runs on every Edit/Write. The new tests live in a new file, so the implementation session never touches a frozen file. If the hook blocks creating `test/meta.test.js`, stop and ask the engineer; do not move tests into an existing file.
- **Plan sync hook.** `.claude/hooks/plan-sync.sh` runs on every Bash call and checks work against this plan's file list. Only the two paths above are touched. If the hook blocks a command, stop and report rather than widening scope.
- **`renderPage` temptation (C9, R2.2).** `renderPage` already emits its own `<title>` and has no head slot. Wiring `renderMeta` into it would change an existing export and duplicate the title. Leave it alone; a head slot is a separate change the PO may open later.
- **Purity (C4, R1.11).** No defaults, no module state, no I/O. T7 checks determinism by calling twice and pins the `undefined` coercion so a "helpful" default title cannot be added silently.
- **Lint (C5).** Appending at the end of the file cannot move line 1, but an editor that rewrites the file could. Step 4 runs lint to confirm.
- **Suite size (C10).** 21 existing plus 7 new gives 28, above `suiteMinSize: 20` with margin. No action.
- **Org skills (C6).** `.claude/skills` does not exist in this worktree (checked); nothing to apply.
- **Undocumented inputs.** `String()` coercion means `renderMeta({ title: null, description: 0 })` gives `<title>null</title><meta name="description" content="0">`. This follows R1.3 and R1.9 and is not tested beyond the `undefined` and `null` cases; leave it.

## Proof
- `npm run build` exits 0.
- `npm test` reports 28 tests, 28 pass, 0 fail; the 21 tests in `test/render.test.js`, `test/nav.test.js`, `test/slugify.test.js` and `test/footer.test.js` are among them and none of those files is in the diff.
- `npm run lint` prints nothing and exits 0 (line 1 of `src/site.js` still a comment).
- `git status --short` lists only `src/site.js` and `test/meta.test.js`.
- Test titles include the ids T1–T7 so the reviewer can tick the spec's acceptance table line by line; T2 and T3 are the evidence for the REVIEW.md security pass (C1, C2).
- No screenshot or endpoint: this is a pure library change with no runtime surface.
