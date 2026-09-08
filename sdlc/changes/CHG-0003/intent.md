---
id: CHG-0003
artifact: intent
cycle: 2
author: dkapper01@gmail.com
created: 2026-09-08T11:29:34Z
status: draft
schema: 1
---
# Intent: renderMeta emits a title of "undefined" when the title is missing

## Problem
Pages rendered without a title show "<title>undefined</title>" in the browser tab; 3 reports on 2026-09-08 from the docs index; the spec asked for the coercion but callers expected a fallback.

## Proposed outcome
renderMeta falls back to the site name when title is absent, with a test proving the tab title is never the string "undefined"; renderMeta's escaping unchanged.

## Affected users and systems
src/site.js callers on the docs index; the test suite under test/.

## Constraints
<carried from the previous cycle>

## Open questions
Should the fallback be configurable per page? (No — one site name, passed by the caller.)
