/**
 * Scenario cap for Data in Depth.
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
