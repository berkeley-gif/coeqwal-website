import type { Page } from "@playwright/test"
import {
  EXPLORE_SESSION_STORAGE_KEY,
  EXPLORE_SESSION_STORAGE_VERSION,
} from "../../app/features/scenarioExplorer/explorer/store/exploreSessionPersist"

// Every Explore tool, Data in Depth included, asks for a scenario before it
// draws. Specs that test a tool's chart select one first, as a visitor
// would, through the sidebar.

/**
 * Tick current operations in the scenario sidebar (a no-op when it is
 * already ticked).
 *
 * @param page - a page showing an Explore tool with the scenario sidebar
 */
export async function selectCurrentOperations(page: Page): Promise<void> {
  await page
    .getByRole("checkbox", { name: "Select Current operations scenario" })
    .check()
}

/**
 * Start the page with these scenarios already selected, as a returning
 * visitor's saved session would. For flows where the sidebar cannot list
 * scenarios (e.g. the scenario list fails to load).
 *
 * Side effect: registers an init script that writes the Explore session
 * to sessionStorage before the app loads.
 *
 * @param page - the page, before navigation
 * @param scenarioIds - the selection to restore
 */
export async function seedSelectedScenarios(
  page: Page,
  scenarioIds: string[],
): Promise<void> {
  await page.addInitScript(
    ({ key, version, ids }) => {
      window.sessionStorage.setItem(
        key,
        JSON.stringify({
          version,
          workspace: { selectedScenarios: ids },
          list: {},
          radar: {},
          equity: {},
          resilience: {},
          data: {},
        }),
      )
    },
    {
      key: EXPLORE_SESSION_STORAGE_KEY,
      version: EXPLORE_SESSION_STORAGE_VERSION,
      ids: scenarioIds,
    },
  )
}
