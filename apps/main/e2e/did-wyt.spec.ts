import { test, expect } from "@playwright/test"
import { collectConsoleErrors, setupNetwork } from "./support/network"

// Water-year-type filter, end to end and offline. The HAR fixture has no
// data-in-depth entries and id-resolution from it yields no live-eligible
// members, so the tool never fires a live request and renders the
// deterministic sample-data engine. That is enough to exercise the whole
// filter surface: the chips render and toggle, the selection persists across
// reload via the explorer session storage, and (the substance) filtering
// actually shrinks the data - a Dry+Critical selection cuts the 100 sample
// years down to the subset the seeded classification assigns to those
// classes, which the exported CSV reflects. The live `wyt=` request
// serialization is covered by the endpoint-path test in did-mapping.spec.ts
// (plus a manual check against the real API); the request itself cannot be
// observed under this offline harness because no live request is made.

test("wyt chips filter the sample data and persist across reload", async ({
  page,
}) => {
  const errors = collectConsoleErrors(page)
  await setupNetwork(page)
  await page.goto("/explore")
  await page
    .getByRole("tab", { name: "Data in depth: Explore underlying data" })
    .click()
  await expect(page.getByText(/^Sample data$/)).toBeVisible()

  // The chip row renders with "All years" as the selected default.
  await expect(page.getByText("Water year types")).toBeVisible()
  const critical = page.getByRole("button", { name: "Critical", exact: true })
  await expect(critical).toBeVisible()
  const allYears = page.getByRole("button", { name: "All years" })
  await expect(
    page.getByRole("button", { name: "All years", pressed: true }),
  ).toBeVisible()

  // Toggling a class deselects "All years"; clicking "All years" clears the
  // filter and reselects it.
  await critical.click()
  await expect(
    page.getByRole("button", { name: "Critical", exact: true, pressed: true }),
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "All years", pressed: false }),
  ).toBeVisible()
  await allYears.click()
  await expect(
    page.getByRole("button", { name: "Critical", exact: true, pressed: false }),
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "All years", pressed: true }),
  ).toBeVisible()

  // Select two dry classes for the filter-effect and persistence checks.
  await page.getByRole("button", { name: "Dry", exact: true }).click()
  await critical.click()

  // The selection survives a reload (explorer session storage).
  await page.reload()
  await page
    .getByRole("tab", { name: "Data in depth: Explore underlying data" })
    .click()
  await expect(
    page.getByRole("button", { name: "Critical", exact: true, pressed: true }),
  ).toBeVisible()

  // The filter actually reduces the data: save a snapshot of the filtered
  // chart and confirm its CSV carries fewer than the full 100 sample years.
  await page.getByRole("button", { name: "save snapshot" }).click()
  // dispatchEvent, not click: the drawer's footer button sits just below the
  // 720px headless viewport (same workaround as did-share.spec.ts).
  await page.getByRole("button", { name: "Go to Share" }).dispatchEvent("click")
  await page.getByRole("button", { name: "Add to story" }).click()
  const downloadPromise = page.waitForEvent("download")
  await page.getByRole("button", { name: "Download data" }).click()
  const download = await downloadPromise
  const stream = await download.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(chunk as Buffer)
  const csv = Buffer.concat(chunks).toString("utf8")
  expect(csv).toContain("Data source,Sample data")
  expect(csv).toContain("Year index")
  const yearRows = (csv.split("Year index")[1] ?? "")
    .split("\n")
    .filter((line) => /^\d+,/.test(line)).length
  expect(yearRows).toBeGreaterThan(0)
  expect(yearRows).toBeLessThan(100)

  expect(errors).toEqual([])
})

test("a value-view capture with a lingering filter exports filtered, labeled data", async ({
  page,
}) => {
  // The chip row hides on the single-value view, but a selection made on
  // another view still applies to the underlying series, matching the live
  // request behavior (wyt is sent in every view). The exported CSV must
  // therefore carry BOTH the filter header row and a filtered series, never
  // a filter claim over unfiltered data or vice versa.
  const errors = collectConsoleErrors(page)
  await setupNetwork(page)
  await page.goto("/explore")
  await page
    .getByRole("tab", { name: "Data in depth: Explore underlying data" })
    .click()
  await expect(page.getByText(/^Sample data$/)).toBeVisible()

  // Select a class where the chips are visible, then move to a variable
  // whose only view is the single summary value (chips hidden there).
  await page.getByRole("button", { name: "Critical", exact: true }).click()
  await page.getByRole("button", { name: /Groundwater level trend/ }).click()
  await expect(page.getByText("Water year types")).toBeHidden()

  await page.getByRole("button", { name: "save snapshot" }).click()
  // dispatchEvent, not click: the drawer's footer button sits just below the
  // 720px headless viewport (same workaround as did-share.spec.ts).
  await page.getByRole("button", { name: "Go to Share" }).dispatchEvent("click")
  await page.getByRole("button", { name: "Add to story" }).click()
  const downloadPromise = page.waitForEvent("download")
  await page.getByRole("button", { name: "Download data" }).click()
  const download = await downloadPromise
  const stream = await download.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(chunk as Buffer)
  const csv = Buffer.concat(chunks).toString("utf8")
  expect(csv).toContain("Water year types,Critical")
  const yearRows = (csv.split("Year index")[1] ?? "")
    .split("\n")
    .filter((line) => /^\d+,/.test(line)).length
  expect(yearRows).toBeGreaterThan(0)
  expect(yearRows).toBeLessThan(100)

  expect(errors).toEqual([])
})
