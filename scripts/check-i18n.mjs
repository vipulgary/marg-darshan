// AMX-022: fails CI when messages/hi/* and messages/en/* don't have the same files and keys, or a value is empty.
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "apps", "web", "messages");
const flatten = (obj, prefix = "") =>
  Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" && !Array.isArray(v) ? flatten(v, `${prefix}${k}.`) : [[`${prefix}${k}`, v]],
  );
const load = (locale) =>
  new Map(
    readdirSync(join(dir, locale))
      .filter((f) => f.endsWith(".json"))
      .flatMap((f) => flatten(JSON.parse(readFileSync(join(dir, locale, f), "utf8")), `${f.replace(".json", "")}:`)),
  );

const hi = load("hi");
const en = load("en");
const errors = [];
for (const k of hi.keys()) if (!en.has(k)) errors.push(`missing in en: ${k}`);
for (const k of en.keys()) if (!hi.has(k)) errors.push(`missing in hi: ${k}`);
for (const [name, map] of [["hi", hi], ["en", en]])
  for (const [k, v] of map) if (typeof v !== "string" || !v.trim()) errors.push(`empty or non-string value in ${name}: ${k}`);

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`i18n OK — ${hi.size} keys in hi and en`);
