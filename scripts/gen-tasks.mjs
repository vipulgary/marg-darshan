// Renders task.md from tasks.json. Usage: node scripts/gen-tasks.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(readFileSync(join(root, "tasks.json"), "utf8"));

// done = 100%, doing = 50% (weighted by estimate)
const WEIGHT = { done: 1, doing: 0.5, todo: 0 };
const ICON = { done: "✅ Done", doing: "🔄 In progress", todo: "⏳ Pending" };

const bar = (pct, width = 20) => {
  const filled = Math.round((pct / 100) * width);
  return "█".repeat(filled) + "░".repeat(width - filled) + ` ${pct.toFixed(1)}%`;
};

const stats = (tickets) => {
  const s = { total: tickets.length, done: 0, doing: 0, todo: 0, days: 0, earned: 0 };
  for (const [, , est, status] of tickets) {
    s[status]++;
    s.days += est;
    s.earned += est * WEIGHT[status];
  }
  s.pct = s.days ? (s.earned / s.days) * 100 : 0;
  return s;
};

const all = data.epics.flatMap((e) => e.tickets);
const t = stats(all);
const out = [];

out.push("# Astromax — Task Tracker", "");
out.push(`> Auto-generated from \`tasks.json\` by \`node scripts/gen-tasks.mjs\` · Last updated: ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC`);
out.push("> Progress is weighted by estimate (dev-days): Done = 100%, In progress = 50%.", "");

out.push("## Overall Project Progress", "");
out.push("```", `Project  ${bar(t.pct, 40)}`, "```", "");
out.push("| Total tickets | ✅ Done | 🔄 In progress | ⏳ Pending | Effort done / total |");
out.push("|---|---|---|---|---|");
out.push(`| **${t.total}** | **${t.done}** | **${t.doing}** | **${t.todo}** | ${t.earned.toFixed(1)} / ${t.days.toFixed(1)} days |`, "");

out.push("## Progress by Sprint", "");
out.push("| Sprint | Tickets | Done | In progress | Pending | Progress |");
out.push("|---|---|---|---|---|---|");
for (const sp of ["S1", "S2", "S3", "S4", "S5"]) {
  const s = stats(all.filter((x) => x[4] === sp));
  out.push(`| ${sp} | ${s.total} | ${s.done} | ${s.doing} | ${s.todo} | \`${bar(s.pct)}\` |`);
}
out.push("");

out.push("## Progress by Segment (Epic)", "");
out.push("| Epic | Segment | Tickets | Done | In progress | Pending | Progress |");
out.push("|---|---|---|---|---|---|---|");
for (const e of data.epics) {
  const s = stats(e.tickets);
  out.push(`| ${e.id} | ${e.name} | ${s.total} | ${s.done} | ${s.doing} | ${s.todo} | \`${bar(s.pct)}\` |`);
}
out.push("");

out.push("## All Tickets", "");
for (const e of data.epics) {
  const s = stats(e.tickets);
  out.push(`### ${e.id} — ${e.name}  ·  ${s.done}/${s.total} done`, "");
  out.push("| Ticket | Title | Est (d) | Sprint | Status | Notes |");
  out.push("|---|---|---|---|---|---|");
  for (const [id, title, est, status, sprint] of e.tickets) {
    out.push(`| ${id} | ${title} | ${est} | ${sprint} | ${ICON[status]} | ${data.notes[id] ?? ""} |`);
  }
  out.push("");
}

out.push("---", "Full acceptance criteria for every ticket: see `Final Plan.md` §6.");
writeFileSync(join(root, "task.md"), out.join("\n") + "\n");
console.log(`task.md written — ${t.done}/${t.total} done, ${t.pct.toFixed(1)}% complete`);
