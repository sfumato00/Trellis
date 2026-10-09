#!/usr/bin/env node
// Static checks for docs/explainer/index.html (AC1, AC3, AC4 + markup sanity).
// Usage: node docs/explainer/verify.mjs docs/explainer/index.html
import { readFileSync } from "node:fs";

const file = process.argv[2];
if (!file) { console.error("usage: node verify.mjs <html>"); process.exit(2); }
const html = readFileSync(file, "utf8");
const errors = [];
const VOID = new Set(["meta", "link", "br", "img", "input", "hr", "source", "wbr"]);
const SKIP_TEXT = new Set(["script", "style", "title"]);
// text made only of these characters needs no translation
const NEUTRAL_TEXT = /^[\s\d·•→←↔⇄✓✕/.,:;()+\-–—|#*%&;]*$/;

// ---- tokenize -------------------------------------------------------------
const tokenRe = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w:-]*)((?:\s+[^\s=>/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>|([^<]+)/g;
const attrRe = /([^\s=>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
function parseAttrs(s) {
  const out = {};
  for (const m of s.matchAll(attrRe)) out[m[1]] = m[2] ?? m[3] ?? m[4] ?? "";
  return out;
}

const root = { tag: "#root", attrs: {}, children: [], parent: null };
let cur = root;
let line = 1;
for (const m of html.matchAll(tokenRe)) {
  const [full, close, tagRaw, attrStr, selfClose, text] = m;
  if (full.startsWith("<!--")) { line += (full.match(/\n/g) || []).length; continue; }
  if (text !== undefined) {
    if (!SKIP_TEXT.has(cur.tag)) cur.children.push({ text, parent: cur, line });
    line += (text.match(/\n/g) || []).length;
    continue;
  }
  const tag = tagRaw.toLowerCase();
  if (close) {
    if (cur.tag !== tag) errors.push(`line ${line}: </${tag}> closes <${cur.tag}>`);
    else cur = cur.parent;
    continue;
  }
  const node = { tag, attrs: parseAttrs(attrStr), children: [], parent: cur, line };
  cur.children.push(node);
  if (!(VOID.has(tag) || selfClose)) cur = node;
  line += (full.match(/\n/g) || []).length;
}
if (cur !== root) errors.push(`unclosed <${cur.tag}> from line ${cur.line}`);

function* walk(n) { for (const c of n.children || []) { yield c; if (c.children) yield* walk(c); } }
const elements = [...walk(root)].filter((n) => n.tag);
const texts = [...walk(root)].filter((n) => n.text !== undefined);
function textOf(n) { return [...walk(n)].filter((t) => t.text !== undefined).map((t) => t.text).join("").trim(); }

// ---- AC1: no external resources ---------------------------------------------
for (const el of elements) {
  const bad =
    (el.tag === "script" && /^https?:/.test(el.attrs.src || "")) ||
    (el.tag === "link" && /^https?:/.test(el.attrs.href || "")) ||
    (["img", "image", "source", "iframe"].includes(el.tag) && /^https?:/.test(el.attrs.src || el.attrs.href || ""));
  if (bad) errors.push(`line ${el.line}: external resource <${el.tag}>`);
}
if (/url\(\s*['"]?https?:/.test(html)) errors.push("external url() in CSS");
if (/@import/.test(html)) errors.push("@import in CSS");

// ---- unique ids ----------------------------------------------------------------
const ids = new Map();
for (const el of elements) if (el.attrs.id) {
  if (ids.has(el.attrs.id)) errors.push(`duplicate id "${el.attrs.id}" (lines ${ids.get(el.attrs.id)}, ${el.line})`);
  ids.set(el.attrs.id, el.line);
}

// ---- AC3: icon sprite ------------------------------------------------------------
const symbols = new Set(elements.filter((e) => e.tag === "symbol").map((e) => e.attrs.id));
const useCount = Object.fromEntries([...symbols].map((s) => [s, 0]));
for (const el of elements.filter((e) => e.tag === "use")) {
  const ref = (el.attrs.href || el.attrs["xlink:href"] || "").replace(/^#/, "");
  if (!symbols.has(ref)) errors.push(`line ${el.line}: <use> -> missing symbol #${ref}`);
  else useCount[ref]++;
}
for (const [s, n] of Object.entries(useCount)) {
  // every vocabulary icon appears in the legend AND somewhere else; i-lattice is the brand mark
  if (s !== "i-lattice" && n < 2) errors.push(`icon #${s} used ${n}x (needs legend + at least one diagram/card)`);
}
const legendIcons = elements.filter((e) => e.tag === "use" && hasAncestor(e, (a) => a.attrs.id === "legend")).length;
if (legendIcons !== symbols.size - 1) errors.push(`legend shows ${legendIcons} icons, sprite has ${symbols.size - 1}`);
for (const el of elements.filter((e) => e.tag === "svg" && (e.attrs.viewbox || e.attrs.viewBox) === "0 0 24 24")) {
  errors.push(`line ${el.line}: ad-hoc 24x24 icon outside the sprite`);
}

// ---- AC4: bilingual completeness ------------------------------------------------
function hasAncestor(n, pred) { for (let p = n.parent; p; p = p.parent) if (p.attrs && pred(p)) return true; return false; }
function isExempt(n) {
  return hasAncestor(n, (a) =>
    a.attrs.lang === "en" || a.attrs.lang === "zh" || "data-neutral" in a.attrs ||
    a.tag === "code" || a.tag === "symbol" || a.tag === "defs" || a.attrs.class === "t-c" ||
    (a.attrs.class || "").split(/\s+/).includes("t-c"));
}
for (const t of texts) {
  const s = t.text.trim();
  if (!s || NEUTRAL_TEXT.test(s)) continue;
  if (!isExempt(t)) errors.push(`line ${t.line}: untranslated text "${s.slice(0, 50)}"`);
}
let pairs = 0;
for (const el of elements) {
  const kids = (el.children || []).filter((c) => c.tag);
  const en = kids.filter((c) => c.attrs.lang === "en");
  const zh = kids.filter((c) => c.attrs.lang === "zh");
  if (en.length !== zh.length) errors.push(`line ${el.line}: <${el.tag}> has ${en.length} en / ${zh.length} zh children`);
  for (const c of [...en, ...zh]) if (!textOf(c)) errors.push(`line ${c.line}: empty [lang=${c.attrs.lang}]`);
  pairs += en.length;
}
const langEls = elements.filter((e) => e.attrs.lang === "en" || e.attrs.lang === "zh");
for (const el of langEls) {
  if (hasAncestor(el, (a) => a.attrs.lang === "en" || a.attrs.lang === "zh")) errors.push(`line ${el.line}: nested lang element`);
}

// ---- report ----------------------------------------------------------------------
console.log(`elements: ${elements.length}, en/zh pairs: ${pairs}, icons: ${symbols.size}, <use>: ${Object.values(useCount).reduce((a, b) => a + b, 0)}`);
if (errors.length) { for (const e of errors) console.log("FAIL " + e); console.log(`${errors.length} problem(s)`); process.exit(1); }
console.log("OK: no external resources, unique ids, sprite resolves, bilingual pairs complete");
