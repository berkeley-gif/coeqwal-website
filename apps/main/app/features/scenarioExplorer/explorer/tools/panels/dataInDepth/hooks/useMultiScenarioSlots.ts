/**
 * useMultiScenarioSlots - Fan out a per-scenario data hook across a
 * variable-length list of scenarios without violating Rules of Hooks.
 *
 * Sections under Data in Depth need to fetch the same data shape for
 * each selected scenario. The naive pattern is:
 *
 *   const results = scenarios.map((id) => useFooHook(id))
 *
 * That call count changes every time the user adds or removes a
 * scenario, which trips React's "Rendered more hooks than during the
 * previous render" assertion the moment the section is open across
 * such a change.
 *
 * This helper sidesteps the issue by always invoking the underlying
 * hook exactly `MAX_FETCH_SLOTS` times. Active slots get the real
 * scenario id, inactive slots get `null` (which short-circuits the
 * underlying SWR fetch, so unused slots cost nothing). The returned
 * array is then sliced down to the caller's scenario count.
 *
 * Usage:
 *
 *   const results = useMultiScenarioSlots(scenarios, useReservoirPercentiles)
 *   const results = useMultiScenarioSlots(
 *     scenarios,
 *     (s) => useSpillMonthly(s, "major"),
 *   )
 *
 * This must stay in step with `MAX_DATA_IN_DEPTH_SCENARIOS`
 * (`config/scenarioLimit.ts`), the cap on how many scenarios Data in Depth
 * compares at once. If that cap changes, bump `MAX_FETCH_SLOTS` and add or
 * remove the matching `fetchHook` calls below. The count has to be a literal
 * here (one fetch slot per call) for the Rules of Hooks, so it cannot import
 * the constant directly. The longer-term fix is to migrate each section to
 * consume `useBatchStatistics` (a single batched API call), at which point the
 * per-scenario hook fan-out goes away entirely.
 */

const MAX_FETCH_SLOTS = 6

export function useMultiScenarioSlots<T>(
  scenarios: string[],
  fetchHook: (scenarioId: string | null) => T,
): T[] {
  if (
    process.env.NODE_ENV !== "production" &&
    scenarios.length > MAX_FETCH_SLOTS
  ) {
    // Selecting more scenarios than we have slots would silently drop the
    // extras (they never get a fetch). Surface it loudly in development.
    console.warn(
      `useMultiScenarioSlots: ${scenarios.length} scenarios exceed MAX_FETCH_SLOTS (${MAX_FETCH_SLOTS}). ` +
        `Scenarios beyond the cap will not load. Raise MAX_FETCH_SLOTS or migrate the section to useBatchStatistics.`,
    )
  }

  const slots: (string | null)[] = new Array(MAX_FETCH_SLOTS).fill(null)
  for (let i = 0; i < Math.min(scenarios.length, MAX_FETCH_SLOTS); i++) {
    slots[i] = scenarios[i] ?? null
  }

  // The hook count must stay constant across renders. We deliberately
  // call fetchHook exactly MAX_FETCH_SLOTS times.
  const r0 = fetchHook(slots[0] ?? null)
  const r1 = fetchHook(slots[1] ?? null)
  const r2 = fetchHook(slots[2] ?? null)
  const r3 = fetchHook(slots[3] ?? null)
  const r4 = fetchHook(slots[4] ?? null)
  const r5 = fetchHook(slots[5] ?? null)

  const all = [r0, r1, r2, r3, r4, r5]
  return all.slice(0, scenarios.length)
}
