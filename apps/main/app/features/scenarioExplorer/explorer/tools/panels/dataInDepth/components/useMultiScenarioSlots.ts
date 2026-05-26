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
 * If we ever raise the data-explorer scenario cap above 12, bump
 * `MAX_FETCH_SLOTS`. The longer-term fix is to migrate each section
 * to consume `useBatchStatistics` (a single batched API call), at
 * which point per-scenario hook fan-out goes away entirely.
 */

const MAX_FETCH_SLOTS = 12

export function useMultiScenarioSlots<T>(
  scenarios: string[],
  fetchHook: (scenarioId: string | null) => T,
): T[] {
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
  const r6 = fetchHook(slots[6] ?? null)
  const r7 = fetchHook(slots[7] ?? null)
  const r8 = fetchHook(slots[8] ?? null)
  const r9 = fetchHook(slots[9] ?? null)
  const r10 = fetchHook(slots[10] ?? null)
  const r11 = fetchHook(slots[11] ?? null)

  const all = [r0, r1, r2, r3, r4, r5, r6, r7, r8, r9, r10, r11]
  return all.slice(0, scenarios.length)
}
