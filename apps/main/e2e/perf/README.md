# Perf instrumentation and latency driver

Dev-only timing instrumentation for the Data in Depth tool plus a Playwright
driver that measures data-loading strategies against live environments.
Everything is gated behind `NEXT_PUBLIC_PERF_LOG=1`: default builds carry no
instrumentation surface (guarded by `e2e/perf-flag-off.spec.ts` in the
offline suite), no window global, no perf marks, and the fetch layer keeps
its untouched `response.json()` path.

## What gets recorded (flag on)

All records buffer in memory (bounded at 5000) and are harvested through
`window.__coeqwalPerf` (`records()`, `clear()`, `dump()`, `actions`,
`bench()`):

| Record                                                                   | Source                             | Meaning                                                                                                                                                                       |
| ------------------------------------------------------------------------ | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api`                                                                    | `apiFetcher` (packages/data)       | One per request: url, status, attempts, timedOut, totalMs (all attempts + backoff), netMs (final attempt network span), parseMs, transferBytes (Content-Length), decodedChars |
| `swr:data-ready`                                                         | SWR middleware (DataProvider)      | Hook mount / key change to data-defined, with `detail.cacheState`: "cold" (a load happened) vs "warm" (served from SWR cache)                                                 |
| `select:scenarios`, `select:hydroclimate`                                | store subscription (storeInstance) | Selection commit instants, from the workspace slice                                                                                                                           |
| `paint:category-batch`, `paint:explorer-chart`                           | `usePerfPaintMark`                 | Two animation frames after the section's data became renderable: a paint approximation, not real frame presentation                                                           |
| `transform:cws`, `transform:ag`, `transform:delta`, `transform:env-flow` | `perfTime` wraps in the data hooks | Payload-to-chart-props shaping cost. Sections mount on accordion expand, so these fire on first expand, not at batch arrival                                                  |
| compute bench                                                            | `window.__coeqwalPerf.bench(n)`    | Times the panel's real quantile functions (`seriesStats`) at x1, x6 (record + 5 water-year types), and 6-scenario x 20-variable worst case                                    |

`end_to_end_ms` for a selection is derived at analysis time as
`paint.t - select.t`.

## How to run

Unit specs for the perf core (node-side, no browser, no server):

```bash
pnpm --filter main perf:unit
```

Driver (needs a flag-on app already running, and hits the live API):

```bash
# 1. Put NEXT_PUBLIC_PERF_LOG=1 in apps/main/.env.local (do not commit), then
pnpm dev:main   # note the port Next binds (3000, or 3001 if 3000 is busy)

# 2. Run the driver against it
PERF_BASE_URL=http://localhost:3000 PERF_RUNS=10 pnpm --filter main perf:driver

# 3. Summarize
node apps/main/e2e/perf/analyze.mjs
```

Knobs: `PERF_BASE_URL` (default `http://localhost:3000`; point it at a
flag-on static build served locally, or at a staging URL once the API
allowlists that origin), `PERF_RUNS` (default 10), `PERF_SCENARIOS`
(comma-separated workspace scenario ids, default `s0020,s0025,s0030`),
`PERF_RESULTS_DIR` (default `e2e/perf/results`, gitignored).

Suites:

- `driver/api-matrix.spec.ts`: times the live endpoints behind the three
  load strategies without the app in the loop: one batch request for n
  scenarios (batch-all), n per-scenario requests, and n x 4 per-subject
  (single `types=` value) requests, at n = 1 / 3 / 6.
- `driver/app-flow.spec.ts`: full app flow per run: fresh browser context,
  open Data in Depth, one-commit scenario selection via the dev-only
  `actions.selectScenarios` escape hatch, wait for the paint mark (cold),
  expand the Community water section (captures `transform:cws` and the
  fan-out endpoints), then clear and re-select inside the SWR window (warm).
  Plus a compute-bench harvest.

Remove the flag from `.env.local` after measuring so local builds go back
to the default (instrumentation-free) configuration.

## Known limitations

- CORS preflight occurrence and encoded (compressed) transfer size are not
  client-observable for api.coeqwal.org without a `Timing-Allow-Origin`
  response header; sizes fall back to `Content-Length` and decoded text
  length.
- React StrictMode (dev builds) double-mounts components: `swr:data-ready`
  records can appear duplicated, and dev-server numbers include dev-mode
  React overhead. Rankings measured on dev are indicative; confirm absolute
  numbers against a flag-on production build (`NEXT_PUBLIC_PERF_LOG=1
pnpm turbo run build --filter=main`, then serve `out/`).
- Paint marks approximate "charts on screen" as two animation frames after
  data readiness; they do not measure real frame presentation.
- The warm lane deliberately sits inside SWR's 60s dedupe window; it
  measures the cache path, not a revalidation.
- Results JSONL is local-only (gitignored). Summaries belong in issue or PR
  text, not committed artifacts.
