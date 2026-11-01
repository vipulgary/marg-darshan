import { existsSync } from "node:fs";
import { defineConfig } from "prisma/config";

// Prisma 7 does not load .env by itself; the repo keeps one .env at the root.
for (const file of ["../../.env", ".env"]) if (existsSync(file)) process.loadEnvFile(file);

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // `prisma generate` does not need a database, so allow it to run without DATABASE_URL.
  datasource: { url: process.env.DATABASE_URL ?? "" },
});
