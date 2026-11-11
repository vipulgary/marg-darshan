import type { NextConfig } from "next";
import { existsSync } from "node:fs";
import createNextIntlPlugin from "next-intl/plugin";

// One .env at the repo root serves the web app, Prisma and the engine.
if (existsSync("../../.env")) process.loadEnvFile("../../.env");

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Shared hosting (Hostinger) reports 64 CPUs but caps threads per account.
// By default the build forks one worker per CPU, and each worker's native
// SWC binding starts a Tokio pool sized to the CPU count, so the build dies
// with "OS can't spawn worker thread". Keep both small; workers inherit env.
process.env.TOKIO_WORKER_THREADS ??= "2";

const nextConfig: NextConfig = {
  experimental: {
    cpus: 2,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withNextIntl(nextConfig);
