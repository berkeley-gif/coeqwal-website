import { defineConfig } from "@playwright/test"

// Perf instrumentation configs: node-side unit specs for @repo/data/perf,
// and the live-API measurement driver. Neither runs in CI or `pnpm e2e`.
// The driver needs a flag-on app (NEXT_PUBLIC_PERF_LOG=1) already running at
// PERF_BASE_URL (default: next dev on 3000) and hits the live API, so runs
// are sequential and generously timed.
export default defineConfig({
  testDir: "./e2e/perf",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  timeout: 180_000,
  projects: [
    {
      name: "unit",
      testMatch: "unit/**/*.spec.ts",
    },
    {
      name: "driver",
      testMatch: "driver/**/*.spec.ts",
      use: {
        baseURL: process.env.PERF_BASE_URL ?? "http://localhost:3000",
      },
    },
  ],
})
