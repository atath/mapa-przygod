// Fast checks that need no browser.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { sha256js } from "../src/sha256.js";
import { PIN_HASH } from "./helpers.mjs";

test("the plain-JS SHA-256 matches Node's crypto", () => {
  for (const s of ["", "66647", "1234", "abc", "x".repeat(55), "x".repeat(56), "x".repeat(64), "x".repeat(200), "zażółć"])
    assert.equal(sha256js(s), createHash("sha256").update(s).digest("hex"), JSON.stringify(s));
});

test("PIN 66647 of the first version still hashes to the stored value", () => {
  assert.equal(sha256js("66647"), PIN_HASH);
  assert.match(readFileSync(new URL("../src/save.js", import.meta.url), "utf8"), new RegExp(PIN_HASH));
});

test("storage keys keep their old names (renaming them would lose every save)", () => {
  const src = readFileSync(new URL("../src/save.js", import.meta.url), "utf8");
  assert.match(src, /KEY = "lesna-wyprawa"/); assert.match(src, /KEY2 = "lesna-wyprawa-v2"/);
});

test("the built page has its version in the offline cache name", () => {
  const v = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version;
  assert.match(readFileSync(new URL("../dist/sw.js", import.meta.url), "utf8"), new RegExp(`mapa-przygod-${v.replace(/\./g, "\\.")}`));
});

test("dialogue text is plain by default: no esc() inside say(), markup only through sayHTML in known places", () => {
  const dir = new URL("../src/", import.meta.url), html = [];
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".js"))) {
    const src = readFileSync(new URL(f, dir), "utf8");
    assert.doesNotMatch(src, /\bsay\([^;{]*?,\s*esc\(/, `${f}: say() escapes on its own, esc() inside it shows "&amp;" on screen`);
    if (/\bsayHTML\(petName|\bsayHTML\(heroName|\bsayHTML\(mon/.test(src)) html.push(f);
  }
  assert.deepEqual(html.sort(), ["chest-room.js", "polish-rooms.js"], "a new sayHTML() call: check it escapes every name and word it shows");
});
