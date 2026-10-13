import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
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

// API responses can also replay from a per-URL cache shared by every spec
// (fixtures/api-cache, one JSON file per request URL). A HAR fixture is
// written whole when its page closes, so specs recording one HAR overwrite
// each other; this cache merges instead. RECORD_API_CACHE=1 fetches any
// response missing from the cache from the live API and stores it (run with
// --workers=1). A spec's own HAR wins for every URL it holds and the cache
// fills the gaps; a URL missing from both is aborted, so a gap fails visibly. Data in Depth relies on it: it needs the scenario list and
// its own endpoints, which no single HAR holds.
const API_CACHE_DIR = fileURLToPath(
  new URL("../fixtures/api-cache/", import.meta.url),
)
const RECORDING_API_CACHE = !!process.env.RECORD_API_CACHE

interface CachedResponse {
  url: string
  status: number
  headers: Record<string, string>
  body: string
}

function apiCacheFile(url: string): string {
  const key = createHash("sha1").update(url).digest("hex")
  return `${API_CACHE_DIR}${key}.json`
}

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
  // the HAR and cache routes below do not claim. While recording, API
  // requests must pass through to the network, so they are exempt.
  await page.route(
    (url) =>
      url.hostname !== "localhost" &&
      !(recording && API_URL_PATTERN.test(url.href)),
    (route) => {
      console.warn(`[e2e] aborted external request: ${route.request().url()}`)
      return route.abort()
    },
  )
  // API requests the HAR does not hold come from the shared per-URL cache
  // (see API_CACHE_DIR). While a HAR is recording, requests go to the
  // network untouched so the HAR records real responses.
  const routeFromCache = () =>
    page.route(API_URL_PATTERN, async (route) => {
      const url = route.request().url()
      if (recording || route.request().method() !== "GET") {
        return route.fallback()
      }
      const file = apiCacheFile(url)
      if (existsSync(file)) {
        const cached = JSON.parse(readFileSync(file, "utf8")) as CachedResponse
        return route.fulfill({
          status: cached.status,
          headers: cached.headers,
          body: cached.body,
        })
      }
      if (!RECORDING_API_CACHE) return route.fallback()
      const response = await route.fetch()
      const body = await response.text()
      const all = response.headers()
      const headers: Record<string, string> = {}
      for (const name of ["content-type", "access-control-allow-origin"]) {
        if (all[name]) headers[name] = all[name]
      }
      if (response.ok()) {
        mkdirSync(API_CACHE_DIR, { recursive: true })
        const entry: CachedResponse = {
          url,
          status: response.status(),
          headers,
          body,
        }
        writeFileSync(file, `${JSON.stringify(entry, null, 2)}\n`)
      }
      return route.fulfill({ response, body })
    })
  const routeHar = () =>
    page.routeFromHAR(har, {
      url: API_URL_PATTERN,
      update: recording,
      notFound: "fallback",
    })
  // Later routes are consulted first. A spec's own HAR wins for every URL it
  // holds and the cache fills its gaps; the shared HAR holds only aborted
  // placeholders, so for it the cache goes first. A URL missing from both
  // falls through to the catch-all abort, so a gap still fails visibly.
  if (har === HAR_PATH) {
    await routeHar()
    await routeFromCache()
  } else {
    await routeFromCache()
    await routeHar()
  }
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
