import { test } from "node:test";
import assert from "node:assert/strict";
import { slugify } from "../src/site.js";

test("T1 slugify lower-cases and collapses punctuation", () => {
  assert.equal(slugify("Hello, World!"), "hello-world");
});

test("T2 slugify collapses runs and trims leading/trailing hyphens", () => {
  assert.equal(slugify("  --Multiple   spaces__and--dashes--  "), "multiple-spaces-and-dashes");
});

test("T3 slugify folds diacritics (R1.6)", () => {
  assert.equal(slugify("Café au lait"), "cafe-au-lait");
});

test("T4 slugify drops non-ASCII with no decomposition (R1.6, C3)", () => {
  assert.equal(slugify("日本語"), "");
});

test("T5 slugify coerces numbers (R1.5)", () => {
  assert.equal(slugify(42), "42");
});

test("R1.5 slugify coerces null and undefined with String()", () => {
  assert.equal(slugify(null), "null");
  assert.equal(slugify(undefined), "undefined");
});

test("R1.1/R1.4 slugify output uses only a-z0-9- with no edge hyphens", () => {
  const inputs = ["Hello, World!", "  --Multiple   spaces__and--dashes--  ", "Café au lait", "日本語", 42, null, undefined];
  for (const input of inputs) {
    assert.match(slugify(input), /^(?!-)[a-z0-9-]*(?<!-)$/);
  }
});

test("R1.7 slugify is idempotent", () => {
  assert.equal(slugify(slugify("Hello, World!")), "hello-world");
});
