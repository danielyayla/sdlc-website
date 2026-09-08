---
id: CHG-0003
artifact: incident
cycle: 1
src: manual
tier: incident
created: 2026-09-08T11:24:26Z
schema: 1
---
# Incident: renderMeta emits a title of "undefined" when the title is missing

## Anomaly and evidence
Pages rendered without a title show "<title>undefined</title>" in the browser tab; 3 reports on 2026-09-08 from the docs index; the spec asked for the coercion but callers expected a fallback.

## Proposed outcome
renderMeta falls back to the site name when title is absent, with a test proving the tab title is never the string "undefined"; renderMeta's escaping unchanged.

## Affected systems
src/site.js callers on the docs index; the test suite under test/.

## Open questions
Should the fallback be configurable per page? (No — one site name, passed by the caller.)
