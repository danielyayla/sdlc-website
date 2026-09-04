---
id: CHG-0001
artifact: intent
cycle: 1
author: dkapper01@gmail.com
created: 2026-09-04T09:28:42Z
status: draft
schema: 1
---
# Intent: Add renderNav and slugify

## Problem
Pages are assembled by hand: every page repeats the navigation markup, and anchor ids are typed by hand, so links break when a heading changes.

## Proposed outcome
src/site.js exports slugify(text) (lower-case, hyphen-separated, ASCII only) and renderNav(items) (an unordered list of escaped links built from {label, href}) alongside renderPage, each pure and covered by a test under test/.

## Affected users and systems
Internal callers of src/site.js; the test suite under test/.

## Constraints
Keep functions pure; no dependencies; src files start with a comment line (lint rule); existing renderPage and escapeHtml behaviour unchanged.

## Open questions
Should renderNav mark the current page? (No — keep this change small.)
