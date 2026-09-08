import { test } from "node:test";
import assert from "node:assert/strict";
import { renderMeta } from "../src/site.js";

test("T1 renderMeta renders title then description meta with no separator (R1.2)", () => {
  assert.equal(
    renderMeta({ title: "Home", description: "Welcome to the site" }),
    "<title>Home</title><meta name=\"description\" content=\"Welcome to the site\">"
  );
});

test("T2 renderMeta escapes & and < in both values (C1)", () => {
  assert.equal(
    renderMeta({ title: "A & B", description: "x < y" }),
    "<title>A &amp; B</title><meta name=\"description\" content=\"x &lt; y\">"
  );
});

test("T3 renderMeta neutralises title breakout and attribute breakout (C1, C2)", () => {
  const out = renderMeta({ title: "</title><script>", description: "\" onload=\"x" });
  assert.equal(
    out,
    "<title>&lt;/title&gt;&lt;script&gt;</title><meta name=\"description\" content=\"&quot; onload=&quot;x\">"
  );
  // spec's weaker form: nothing raw outside the fixed markup
  const inner = out
    .replace(/^<title>/, "")
    .replace(/<\/title><meta name="description" content="/, "|")
    .replace(/">$/, "");
  assert.doesNotMatch(inner, /[<>"]/);
});

test("T4 renderMeta omits the meta tag when description is undefined (R1.7)", () => {
  const out = renderMeta({ title: "Home" });
  assert.equal(out, "<title>Home</title>");
  assert.ok(!out.includes("<meta"));
});

test("T5 renderMeta treats null description as absent (R1.7)", () => {
  assert.equal(renderMeta({ title: "Home", description: null }), renderMeta({ title: "Home" }));
});

test("T6 renderMeta emits an empty content attribute for an empty string (R1.8)", () => {
  assert.equal(
    renderMeta({ title: "Home", description: "" }),
    "<title>Home</title><meta name=\"description\" content=\"\">"
  );
});

test("T7 renderMeta is pure and coerces a missing title to \"undefined\" (R1.9, R1.11)", () => {
  const out = renderMeta({ title: "Home", description: "Welcome to the site" });
  const again = renderMeta({ title: "Home", description: "Welcome to the site" });
  assert.equal(out, again);
  const empty = renderMeta({});
  assert.equal(empty, "<title>undefined</title>");
  assert.ok(!empty.includes("<meta"));
});
