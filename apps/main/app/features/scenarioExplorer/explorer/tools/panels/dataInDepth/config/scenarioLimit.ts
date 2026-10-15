/**
 * Scenario cap and comparison set for Data in Depth. Pure module.
 *
 * The rest of the explorer (radar, distribution, resilience) lets users select
 * any number of scenarios. Data in Depth renders one chart column per scenario
 * and fans out one data hook per scenario, so it caps the comparison here
 * rather than globally. Selections beyond this limit are ignored by the Data in
 * Depth views only. Other tools still see the full selection.
 *
 * This must match MAX_FETCH_SLOTS in hooks/useMultiScenarioSlots.ts, which
 * hard-codes one fetch slot per scenario (it cannot read this value because the
 * slot count has to be a literal for the Rules of Hooks).
 */
export const MAX_DATA_IN_DEPTH_SCENARIOS = 6

/**
 * The selection Data in Depth works from: the sidebar selection, or, only
 * while its own tour runs with nothing selected, current operations, so the
 * tour's steps have a chart to point at. The selection itself is never
 * changed. Outside the tour an empty selection stays empty, and the tool
 * shows the select-a-scenario prompt (see components/scenarioPrompt.ts).
 *
 * @param selected - the workspace selection
 * @param tourActive - whether the Data in Depth tour is running
 * @param referenceId - the tour's stand-in scenario (current operations)
 * @returns the selection to compare
 */
export function getDataScenarioSelection(
  selected: string[],
  tourActive: boolean,
  referenceId: string,
): string[] {
  return selected.length === 0 && tourActive ? [referenceId] : selected
}

/**
 * The scenarios Data in Depth compares: exactly the sidebar selection, up to
 * the cap. Current operations leads when it is selected (it is the
 * reference series); it is never added when it is not.
 *
 * @param selected - the workspace selection, in selection order
 * @param referenceId - the reference scenario id (current operations)
 * @returns the compared scenario ids, capped
 */
export function getCompareScenarioIds(
  selected: string[],
  referenceId: string,
): string[] {
  const ordered = selected.includes(referenceId)
    ? [referenceId, ...selected.filter((id) => id !== referenceId)]
    : selected
  return ordered.slice(0, MAX_DATA_IN_DEPTH_SCENARIOS)
}

/**
 * The scenario held constant on the hydroclimates and locations axes: the
 * user's pin while it is still compared, otherwise the first compared
 * scenario, so the held scenario is always one the sidebar shows ticked.
 *
 * @param pinned - the user's pinned scenario, if any
 * @param compared - the compared scenario ids (getCompareScenarioIds)
 * @param referenceId - fallback when nothing is compared
 * @returns the held scenario id
 */
export function getHeldScenarioId(
  pinned: string | null | undefined,
  compared: string[],
  referenceId: string,
): string {
  if (pinned && compared.includes(pinned)) return pinned
  return compared[0] ?? referenceId
}
