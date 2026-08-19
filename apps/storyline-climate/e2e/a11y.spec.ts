import { expect, test, type Page } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

const TAGS = ["wcag2a", "wcag2aa", "wcag21aa"]

async function blockingViolations(page: Page, state: string) {
  const results = await new AxeBuilder({ page })
    .withTags(TAGS)
    .disableRules(["color-contrast"])
    .analyze()

  for (const violation of results.violations) {
    if (violation.impact !== "critical" && violation.impact !== "serious") {
      console.log(
        `[a11y advisory] ${state}: ${violation.id} (${violation.impact}), ${violation.nodes.length} node(s)`,
      )
    }
  }

  return results.violations
    .filter(
      (violation) =>
        violation.impact === "critical" || violation.impact === "serious",
    )
    .map(
      (violation) =>
        `${violation.id} (${violation.impact}): ${violation.nodes.length} node(s)`,
    )
}

test("climate story has no blocking accessibility violations", async ({
  page,
}) => {
  await page.goto("/")
  await expect(
    page.getByRole("heading", {
      name: "How climate change affects California's water",
    }),
  ).toBeAttached()

  expect(await blockingViolations(page, "climate-story")).toEqual([])
})

test("custom controls expose labels, values, and selected state", async ({
  page,
}) => {
  await page.goto("/")

  const comparisonSliders = page.getByRole("slider", {
    name: "Comparison position",
  })
  await expect(comparisonSliders).toHaveCount(2)
  await expect(comparisonSliders.first()).toHaveAttribute("aria-valuetext")
  await comparisonSliders.first().press("End")
  await expect(comparisonSliders.first()).toHaveAttribute(
    "aria-valuenow",
    "100",
  )
  await comparisonSliders.last().press("Home")
  await expect(comparisonSliders.last()).toHaveAttribute("aria-valuenow", "0")
  await expect(
    page.getByRole("slider", { name: "Month in water year" }),
  ).toBeAttached()

  await expect(
    page.getByRole("group", { name: "Hydroclimate scenario" }),
  ).toBeAttached()

  const selectedClimate = page.getByRole("button", {
    name: "Moderate-wet climate risk",
  })
  await expect(selectedClimate).toHaveAttribute("aria-pressed", "true")
  await page.getByRole("button", { name: "Moderate-dry climate risk" }).click()
  await expect(selectedClimate).toHaveAttribute("aria-pressed", "false")

  expect(await blockingViolations(page, "climate-controls")).toEqual([])
})
