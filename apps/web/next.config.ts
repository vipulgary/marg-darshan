import type { NextConfig } from "next";
import { existsSync } from "node:fs";
import createNextIntlPlugin from "next-intl/plugin";

// One .env at the repo root serves the web app, Prisma and the engine.
if (existsSync("../../.env")) process.loadEnvFile("../../.env");

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
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
