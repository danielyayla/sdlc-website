---
id: CHG-0003
artifact: intent
cycle: 1
author: dkapper01@gmail.com
created: 2026-09-08T10:53:34Z
status: draft
schema: 1
---
# Intent: Add renderMeta for page head tags

## Problem
Each page's <head> is written by hand, so the title and description tags are inconsistent and unescaped text has slipped into them.

## Proposed outcome
src/site.js exports renderMeta({ title, description }) that returns the <title> and <meta name="description"> tags as one string, with both values escaped, pure and covered by a test under test/.

## Affected users and systems
Internal callers of src/site.js; the test suite under test/.

## Constraints
Keep functions pure; no dependencies; src files start with a comment line (lint rule); existing exports unchanged.

## Open questions
Should a missing description omit the meta tag? (Yes — render only <title> when description is absent.)
