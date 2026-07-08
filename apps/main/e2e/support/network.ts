import { fileURLToPath } from "node:url"
import type { Page } from "@playwright/test"

// The app's two real API origins replay from a committed HAR fixture so the
// suite runs offline and secretless. RECORD_FIXTURES=1 re-records the HAR
// against the live API (run with --workers=1). Every other external origin
// (Mapbox, Typekit fonts, telemetry) is aborted loudly so a missed matcher
// fails visibly instead of silently hitting the network.
const HAR_PATH = fileURLToPath(new URL("../fixtures/api.har", import.meta.url))
const API_URL_PATTERN =
  /^https:\/\/(api\.coeqwal\.org|x66ckhp067\.execute-api\.us-west-2\.amazonaws\.com)\//

const RECORDING = !!process.env.RECORD_FIXTURES

export async function setupNetwork(page: Page): Promise<void> {
  // Registered first, consulted last: catch-all abort for external requests
  // the HAR route below does not claim.
  await page.route(
    (url) => url.hostname !== "localhost",
    (route) => {
      console.warn(`[e2e] aborted external request: ${route.request().url()}`)
      return route.abort()
    },
  )
  await page.routeFromHAR(HAR_PATH, {
    url: API_URL_PATTERN,
    update: RECORDING,
    notFound: RECORDING ? "fallback" : "abort",
  })
}

// Console errors the harness itself causes and therefore ignores:
// the empty Mapbox token (secretless build) and resources aborted above.
const ALLOWLISTED_TEXT = [/API access token is required to use Mapbox GL/]
const ALLOWLISTED_SOURCES = /mapbox|typekit/

export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = []
  page.on("console", (message) => {
    if (message.type() !== "error") return
    if (ALLOWLISTED_TEXT.some((pattern) => pattern.test(message.text()))) return
    // Aborting an external origin (Mapbox, Typekit) surfaces as a "Failed to
    // fetch <url>" error whose origin is in the message text, while
    // location().url is the app chunk that logged it. Match against both so
    // the harness ignores the aborts it deliberately causes regardless of
    // whether the build has a real Mapbox token.
    if (ALLOWLISTED_SOURCES.test(message.location().url)) return
    if (ALLOWLISTED_SOURCES.test(message.text())) return
    errors.push(message.text())
  })
  return errors
}
