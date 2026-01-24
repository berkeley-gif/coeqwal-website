/**
 * COEQWAL React hooks
 *
 * Atomic hooks for fetching COEQWAL API data with SWR caching.
 *
 * @example
 * ```typescript
 * import { useTierList, useTierMapping, useScenarios } from "@repo/data/coeqwal/hooks"
 *
 * function MyComponent() {
 *   const { tierList, isLoading: tiersLoading } = useTierList()
 *   const { tierMapping } = useTierMapping()
 *   const { scenarios, activeScenarioIds } = useScenarios()
 *   // ...
 * }
 * ```
 */

export { useTierList } from "./useTierList"
export { useTierMapping, mapShortCodeToDisplayName } from "./useTierMapping"
export { useScenarios } from "./useScenarios"
