// Builds marg-darshan-web.tar.gz for Hostinger's "Node.js app → upload files" deploy.
//
// Hostinger only recognises a Next.js app when `next` is in the TOP-LEVEL package.json, so the
// archive contains apps/web at its root (not this monorepo) plus a lockfile resolved for it alone.
// Only committed files are packaged (git archive), so secrets in .env never leave this machine.
//
// Usage:  node scripts/package-hostinger.mjs            (packages HEAD)
//         node scripts/package-hostinger.mjs <git-ref>  (packages a tag/branch/commit)
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const ref = process.argv[2] ?? "HEAD";
const root = resolve(import.meta.dirname, "..");
const out = join(root, "marg-darshan-web.tar.gz");
const work = mkdtempSync(join(tmpdir(), "md-pkg-"));
const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { stdio: "inherit", shell: process.platform === "win32", ...opts });

try {
  const dirty = execFileSync("git", ["status", "--porcelain", "apps/web"], { cwd: root, encoding: "utf8" }).trim();
  if (dirty && ref === "HEAD") console.warn("⚠ apps/web has uncommitted changes — they are NOT in the package (commit first).\n");

  console.log(`→ exporting apps/web at ${ref}`);
  // tar gets relative paths only: GNU tar reads "C:\..." as a remote host.
  run("git", ["archive", "--format=tar", "-o", join(work, "src.tar"), `${ref}:apps/web`], { cwd: root });
  const app = join(work, "app");
  mkdirSync(app);
  run("tar", ["-xf", "../src.tar"], { cwd: app });

  console.log("→ resolving a lockfile for the app on its own");
  run("npm", ["install", "--package-lock-only", "--no-audit", "--no-fund"], { cwd: app });

  console.log(`→ writing ${out}`);
  run("tar", ["-czf", "../out.tar.gz", "."], { cwd: app });
  rmSync(out, { force: true });
  execFileSync(process.execPath, ["-e", "require('fs').copyFileSync(process.argv[1], process.argv[2])", join(work, "out.tar.gz"), out]);
  console.log(`\n✔ ${out} (${(statSync(out).size / 1e6).toFixed(1)} MB)`);
  console.log("  Upload it in hPanel → Website → Deployments → Redeploy → Upload files (do not reuse the previous source).");
} finally {
  rmSync(work, { recursive: true, force: true });
}
