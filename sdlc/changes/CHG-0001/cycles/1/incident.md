---
id: CHG-0001
artifact: incident
cycle: 1
src: manual
tier: incident
created: 2026-09-04T12:55:39Z
schema: 1
---
# Incident: slugify collides on punctuation-only differences

## Anomaly and evidence
"Sign in" and "Sign-in" both slugify to "sign-in", so two headings on the docs page share an id and in-page links jump to the wrong section; 2 bug reports on 2026-09-04; error_rate_pct 1.1% vs baseline 0.4%.

## Proposed outcome
A uniqueSlugs(titles) helper that suffixes repeats (-2, -3 …) and a test proving distinct ids for colliding titles; slugify itself unchanged.

## Affected systems
src/site.js callers on the docs page; the test suite under test/.

## Open questions
Should renderNav call uniqueSlugs itself, or stay a pure formatter?
