import { test, expect } from "@playwright/test"
import { getTierWording } from "./support/tierWording"

// The "tier" wording guard finds the word wherever a visitor would read or
// hear it, and stays quiet on clean pages and on code-only uses.

test("the guard finds the word in every place a visitor meets it", async ({
  page,
}) => {
  const cases = [
    "<p>Tier 1</p>",
    "<p><span>Ti</span><span>er 2</span></p>",
    '<img alt="Tier 3 swatch">',
    '<div role="slider" aria-valuetext="Tier 4"></div>',
    '<button aria-label="Tier legend">x</button>',
    "<svg><text>Tier scale</text></svg>",
    '<div style="display:none">tiers hidden in a tooltip</div>',
  ]
  for (const html of cases) {
    await page.setContent(
      `<html><head><title>Ok</title></head><body>${html}</body></html>`,
    )
    expect(await getTierWording(page), html).not.toEqual([])
  }
  await page.setContent(
    "<html><head><title>Tier view</title></head><body><p>ok</p></body></html>",
  )
  expect(await getTierWording(page)).not.toEqual([])
})

test("the guard ignores clean text and code-only uses", async ({ page }) => {
  await page.setContent(`<html><head><title>Explore</title></head><body>
    <p class="tier-dot" data-tier="1">Optimal, Acceptable, At-risk, Critical</p>
    <p>Outcome levels</p><p>frontier</p>
    <script>const tier = "Tier 1"</script><style>.tier{}</style>
  </body></html>`)
  expect(await getTierWording(page)).toEqual([])
})
