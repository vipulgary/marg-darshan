// Update ticket status/notes in tasks.json, then regenerate task.md.
// Usage: node scripts/set-task.mjs <done|doing|todo> AMX-001 AMX-002 ... [--note "text"]
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const file = join(root, "tasks.json");
const args = process.argv.slice(2);
const status = args.shift();
const noteIdx = args.indexOf("--note");
const note = noteIdx >= 0 ? args.splice(noteIdx, 2)[1] : undefined;
if (!["done", "doing", "todo"].includes(status)) throw new Error("status must be done|doing|todo");

const data = JSON.parse(readFileSync(file, "utf8"));
const ids = new Set(args);
for (const e of data.epics) for (const t of e.tickets) if (ids.has(t[0])) { t[3] = status; ids.delete(t[0]); if (note) data.notes[t[0]] = note; }
if (ids.size) throw new Error(`unknown tickets: ${[...ids].join(", ")}`);
writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
execFileSync(process.execPath, [join(root, "scripts", "gen-tasks.mjs")], { stdio: "inherit" });
