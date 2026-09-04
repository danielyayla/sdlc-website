import { test } from "node:test";
import assert from "node:assert/strict";
import { renderNav } from "../src/site.js";

const T6_ITEMS = [{ label: "Home", href: "/" }, { label: "A & B", href: "/a?x=1&y=2" }];

test("T6 renderNav renders items in order with escaped label and href", () => {
  assert.equal(
    renderNav(T6_ITEMS),
    `<ul><li><a href="/">Home</a></li><li><a href="/a?x=1&amp;y=2">A &amp; B</a></li></ul>`
  );
});

test("T7 renderNav escapes HTML metacharacters in label and href (C1)", () => {
  assert.equal(
    renderNav([{ label: "<script>", href: "\" onclick=\"x" }]),
    `<ul><li><a href="&quot; onclick=&quot;x">&lt;script&gt;</a></li></ul>`
  );
});

test("T8 renderNav returns an empty list for no items", () => {
  assert.equal(renderNav([]), "<ul></ul>");
});

test("R2.2 renderNav coerces label and href with String()", () => {
  assert.equal(renderNav([{ label: 1, href: 2 }]), `<ul><li><a href="2">1</a></li></ul>`);
});

test("R2.1/R2.4 renderNav emits no whitespace between elements, classes or aria-current", () => {
  const html = renderNav(T6_ITEMS);
  // no whitespace adjacent to any tag boundary (R2.1); label text may contain spaces
  assert.doesNotMatch(html, />\s|\s</);
  assert.ok(!html.includes("class="));
  assert.ok(!html.includes("aria-current"));
});
