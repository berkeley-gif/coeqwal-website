/**
 * SWR primitives re-exported through @repo/data so apps consume them
 * through the data package boundary instead of importing from "swr".
 *
 * Most domain fetching should still go through named hooks in
 * `@repo/data/coeqwal/hooks` (useTiers, useScenarios, useBatchStatistics,
 * etc.). This subpath exists for ad-hoc SWR usage (`preload`, `useSWR`
 * with a custom key, `useSWRConfig`) until those use cases get promoted
 * to first-class hooks.
 */

export { default } from "swr"
export { useSWRConfig, preload, SWRConfig, mutate } from "swr"
export type { SWRConfiguration, SWRResponse, Key, Fetcher } from "swr"
