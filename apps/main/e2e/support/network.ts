import { fileURLToPath } from "node:url"
import type { Page } from "@playwright/test"

// The app's two real API origins replay from a committed HAR fixture so the
// suite runs offline and secretless. RECORD_FIXTURES=1 re-records the shared
// HAR against the live API (run with --workers=1). Every other external
// origin (Mapbox, Typekit fonts, telemetry) is aborted loudly so a missed
// matcher fails visibly instead of silently hitting the network.
//
// A spec can replay its own fixture instead of the shared one by passing
// `har` (and its own `recording` flag). One HAR route per page: while
// recording, routeFromHAR's update mode passes each API request on to the
// next handler, so a second fixture route or the catch-all abort below
// would stop it from reaching the network and the fixture would record the
// abort (status -1) instead of the response.
const HAR_PATH = fileURLToPath(new URL("../fixtures/api.har", import.meta.url))
export const API_URL_PATTERN =
  /^https:\/\/(api\.coeqwal\.org|x66ckhp067\.execute-api\.us-west-2\.amazonaws\.com)\//

const RECORDING = !!process.env.RECORD_FIXTURES

export interface NetworkOptions {
  /** HAR fixture to replay (default: the shared fixtures/api.har) */
  har?: string
  /** Record this fixture against the live API instead of replaying it */
  recording?: boolean
}

export async function setupNetwork(
  page: Page,
  { har = HAR_PATH, recording = RECORDING }: NetworkOptions = {},
): Promise<void> {
  // The Data in Depth tour auto-starts on the tool's first visit and its
  // scrim would sit over the controls every other spec drives. Those specs
  // test the tool, not the tour, so the shared setup marks it seen;
  // did-tour.spec.ts clears the key to exercise the auto-start itself.
  await page.addInitScript(() => {
    window.localStorage.setItem("coeqwal-tour-seen-data", "true")
  })

  // Registered first, consulted last: catch-all abort for external requests
  // the HAR route below does not claim. While recording, API requests must
  // pass through to the network, so they are exempt.
  await page.route(
    (url) =>
      url.hostname !== "localhost" &&
      !(recording && API_URL_PATTERN.test(url.href)),
    (route) => {
      console.warn(`[e2e] aborted external request: ${route.request().url()}`)
      return route.abort()
    },
  )
  await page.routeFromHAR(har, {
    url: API_URL_PATTERN,
    update: recording,
    notFound: recording ? "fallback" : "abort",
  })
}

// Console errors the harness itself causes and therefore ignores:
// the empty Mapbox token (secretless build) and resources aborted above.
const ALLOWLISTED_TEXT = [/API access token is required to use Mapbox GL/]
const ALLOWLISTED_SOURCES = /mapbox|typekit/

export function collectConsoleErrors(
  page: Page,
  /** Resource URLs a spec deliberately refuses (their load failures are
   *  expected and ignored), e.g. background prefetches */
  { ignoreUrls }: { ignoreUrls?: RegExp } = {},
): string[] {
  const errors: string[] = []
  page.on("console", (message) => {
    if (message.type() !== "error") return
    if (ignoreUrls && ignoreUrls.test(message.location().url)) return
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
