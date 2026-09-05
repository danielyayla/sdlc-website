import { test } from "node:test";
import assert from "node:assert/strict";
import { renderFooter } from "../src/site.js";

test("T1 renderFooter renders copyright entity, year, owner", () => {
  assert.equal(renderFooter({ owner: "Acme", year: 2026 }), "<footer>&copy; 2026 Acme</footer>");
});

test("T2 renderFooter escapes ampersand in owner (C1)", () => {
  assert.equal(
    renderFooter({ owner: "Smith & Sons", year: 2026 }),
    "<footer>&copy; 2026 Smith &amp; Sons</footer>"
  );
});

test("T3 renderFooter escapes metacharacters in owner and year (C1, C2)", () => {
  const out = renderFooter({ owner: "<b>x</b>", year: "\"><script>" });
  assert.equal(out, "<footer>&copy; &quot;&gt;&lt;script&gt; &lt;b&gt;x&lt;/b&gt;</footer>");
  // spec's weaker form: nothing raw between the footer tags
  const inner = out.replace(/^<footer>/, "").replace(/<\/footer>$/, "");
  assert.doesNotMatch(inner, /[<>"]/);
});

test("T4 renderFooter renders string and number year identically (R1.4)", () => {
  assert.equal(
    renderFooter({ owner: "Acme", year: "2026" }),
    renderFooter({ owner: "Acme", year: 2026 })
  );
});

test("T5 renderFooter is pure and never reads the clock (R1.7, R1.9)", () => {
  const out = renderFooter({ owner: "Acme", year: 1999 });
  const again = renderFooter({ owner: "Acme", year: 1999 });
  assert.equal(out, again);
  assert.equal(out, "<footer>&copy; 1999 Acme</footer>");
  // the test may read the clock; the function must not
  assert.ok(!out.includes(String(new Date().getFullYear())));
});

test("R1.8 renderFooter coerces missing fields to \"undefined\" like the other helpers (C9)", () => {
  assert.equal(renderFooter({}), "<footer>&copy; undefined undefined</footer>");
});
