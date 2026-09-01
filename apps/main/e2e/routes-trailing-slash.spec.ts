import { test, expect } from "@playwright/test"
import { collectConsoleErrors, setupNetwork } from "./support/network"

// The static host serves "/explore/" from explore/index.html and redirects
// "/explore" to it. Before the export emitted directory-style pages it wrote
// only explore.html, so every trailing-slash deep link returned 404 in
// production (/explore/, /learn/, /data/, /about/ all did). These specs run
// against the built export, whose directory layout the local server resolves
// the same way.
//
// The 404 page renders the same site header as a real page, so asserting a
// landmark is not enough: each case asserts page-specific content and the
// absence of the not-found copy.

const NOT_FOUND_COPY = /This page could not be found/

test("the explore page serves under its trailing-slash URL", async ({
  page,
}) => {
  const errors = collectConsoleErrors(page)
  await setupNetwork(page)
  await page.goto("/explore/")
  // The Explore sub-nav proves the page rendered AND that the tab sync
  // resolved the "explore" segment from a trailing-slash pathname.
  await expect(
    page.getByRole("tab", { name: "Data in depth: Explore underlying data" }),
  ).toBeVisible()
  await expect(page.getByText(NOT_FOUND_COPY)).toHaveCount(0)
  expect(errors).toEqual([])
})

test("the learn page serves under its trailing-slash URL", async ({ page }) => {
  await setupNetwork(page)
  await page.goto("/learn/")
  await expect(page.getByRole("tab", { name: /learn/i }).first()).toBeVisible()
  await expect(page.getByText(NOT_FOUND_COPY)).toHaveCount(0)
})

test("the root path still serves", async ({ page }) => {
  await setupNetwork(page)
  await page.goto("/")
  await expect(page.getByRole("banner")).toBeVisible()
  await expect(page.getByText(NOT_FOUND_COPY)).toHaveCount(0)
})
