import { test } from "node:test";
import assert from "node:assert/strict";
import { escapeHtml, renderPage } from "../src/site.js";

test("escapeHtml escapes the four HTML metacharacters", () => {
  assert.equal(escapeHtml(`<a href="x">&`), "&lt;a href=&quot;x&quot;&gt;&amp;");
});

test("renderPage wraps the body and escapes the title", () => {
  const html = renderPage({ title: "A & B", body: "<p>hi</p>" });
  assert.ok(html.startsWith("<!doctype html>"));
  assert.ok(html.includes("<title>A &amp; B</title>"));
  assert.ok(html.includes("<body><p>hi</p></body>"));
});
