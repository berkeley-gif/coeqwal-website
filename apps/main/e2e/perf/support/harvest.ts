/**
 * harvest.ts - pull instrumentation records out of the app under test
 */

import type { Page } from "@playwright/test"

export interface HarvestedRecord {
  kind: string
  name?: string
  url?: string
  t: number
  durMs?: number
  totalMs?: number
  detail?: Record<string, unknown>
  [key: string]: unknown
}

export async function clearPerf(page: Page): Promise<void> {
  await page.evaluate(() => window.__coeqwalPerf?.clear())
}

export async function harvestPerf(page: Page): Promise<HarvestedRecord[]> {
  return (await page.evaluate(() =>
    window.__coeqwalPerf ? window.__coeqwalPerf.records() : [],
  )) as HarvestedRecord[]
}

/** Wait until a mark with the given name appears in the buffer */
export async function waitForMark(
  page: Page,
  name: string,
  timeoutMs = 60_000,
): Promise<void> {
  await page.waitForFunction(
    (markName) =>
      (window.__coeqwalPerf?.records() ?? []).some(
        (r) => (r as { name?: string }).name === markName,
      ),
    name,
    { timeout: timeoutMs },
  )
}
