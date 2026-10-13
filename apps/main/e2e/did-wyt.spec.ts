import { test, expect } from "@playwright/test"
import { collectConsoleErrors, setupNetwork } from "./support/network"

// Water-year-type filter, end to end and offline, on recorded model results
// (see the API cache in support/network.ts): the chips render and toggle,
// the selection persists across reload via the explorer session storage,
// and (the substance) filtering actually shrinks the data: a Critical
// selection cuts the 100 water years down to the critical years, which the
// exported CSV reflects. The `wyt=` request serialization is covered by the
// endpoint-path test in did-mapping.spec.ts.

test("wyt chips filter the model results and persist across reload", async ({
  page,
}) => {
  const errors = collectConsoleErrors(page)
  await setupNetwork(page)
  await page.goto("/explore")
  await page
    .getByRole("tab", { name: "Data in depth: Explore underlying data" })
    .click()
  await expect(page.locator('[data-did-chart-state="drawn"]')).toBeVisible()

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

  // Single-select: picking a second class replaces the first instead of
  // adding to it. Leave Critical active for the filter-effect and
  // persistence checks.
  await page.getByRole("button", { name: "Dry", exact: true }).click()
  await expect(
    page.getByRole("button", { name: "Dry", exact: true, pressed: true }),
  ).toBeVisible()
  await critical.click()
  await expect(
    page.getByRole("button", { name: "Dry", exact: true, pressed: false }),
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Critical", exact: true, pressed: true }),
  ).toBeVisible()

  // The selection survives a reload (explorer session storage).
  await page.reload()
  await page
    .getByRole("tab", { name: "Data in depth: Explore underlying data" })
    .click()
  await expect(
    page.getByRole("button", { name: "Critical", exact: true, pressed: true }),
  ).toBeVisible()

  // The filter actually reduces the data: save a snapshot of the filtered
  // chart and confirm its CSV carries fewer than the full 100 water years.
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
  expect(csv).toContain("Data source,CalSim3 model results")
  expect(csv).toContain("\nWater year,")
  const yearRows = (csv.split("\nWater year,")[1] ?? "")
    .split("\n")
    .filter((line) => /^\d{4},/.test(line)).length
  expect(yearRows).toBeGreaterThan(0)
  expect(yearRows).toBeLessThan(100)

  expect(errors).toEqual([])
})

// The summary-value view, the one view that hid the water-year-type chips
// while the filter still applied to the exported series, was retired with
// the last variable that offered it (gross crop revenues is a distribution
// now). Every remaining view shows the chips, and the exceedance case above
// covers the filter travelling with the export.
