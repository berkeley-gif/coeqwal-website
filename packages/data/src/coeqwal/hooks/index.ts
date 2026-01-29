/**
 * COEQWAL React hooks
 *
 * Atomic hooks for fetching COEQWAL API data with SWR caching.
 *
 * @example
 * ```typescript
 * import { useTiers, useScenarios, useScenarioTiers } from "@repo/data/coeqwal/hooks"
 *
 * function MyComponent() {
 *   const { tiers, isLoading: tiersLoading } = useTiers()
 *   const { scenarios } = useScenarios()
 *   const { data: tierData } = useScenarioTiers("s0020")
 *   // ...
 * }
 * ```
 */

export { useTiers } from "./useTiers"
export { useTierMapping, mapShortCodeToDisplayName } from "./useTierMapping"
export { useScenarios } from "./useScenarios"
export { useScenarioTiers } from "./useScenarioTiers"
