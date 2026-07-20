import { defineConfig, devices } from "@playwright/test"

const PORT = 4173

// E2E runs against the SHIPPED static export served from apps/main/out,
// never against next dev. Build first: pnpm turbo run build --filter=main
export default defineConfig({
  testDir: "./e2e",
  // Perf instrumentation specs (unit + live-API driver) run via
  // playwright.perf.config.ts, never in this offline suite.
  testIgnore: "perf/**",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    serviceWorkers: "block",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm exec serve out -l ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
