import assert from "node:assert/strict";
import { test } from "node:test";
import { PROBLEMS } from "../../content/catalog";
import { ICON_NAMES, ICON_PATHS } from "./paths";

test("every icon is a non-empty list of absolute path strings", () => {
  for (const name of ICON_NAMES) {
    const paths = ICON_PATHS[name];
    assert.ok(paths.length > 0, name);
    for (const d of paths) assert.match(d, /^M[\d.-]/, `${name}: ${d}`);
  }
});

test("every catalog problem points at an existing icon", () => {
  for (const p of PROBLEMS) assert.ok(p.icon in ICON_PATHS, p.slug);
});
