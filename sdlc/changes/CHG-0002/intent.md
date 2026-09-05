---
id: CHG-0002
artifact: intent
cycle: 1
author: dkapper01@gmail.com
created: 2026-09-05T01:01:41Z
status: draft
schema: 1
---
# Intent: Add renderFooter with the build year

## Problem
Every page ends with hand-written footer markup, and the copyright year is typed by hand so it drifts between pages.

## Proposed outcome
src/site.js exports renderFooter({ owner, year }) that returns a single <footer> element with the escaped owner name and the year, pure and covered by a test under test/.

## Affected users and systems
Internal callers of src/site.js; the test suite under test/.

## Constraints
Keep functions pure; no dependencies; src files start with a comment line (lint rule); existing exports unchanged.

## Open questions
Should the year default to the current year? (No — callers pass it; keep the function pure.)
