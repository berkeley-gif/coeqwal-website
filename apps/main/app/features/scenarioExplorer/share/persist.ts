/**
 * Local-storage persistence for share state.
 *
 * Keeps the on-disk envelope schema and the policy for which
 * runtime fields are persisted. The store hydrates from
 * `loadShareState` once at startup and writes back through
 * `saveShareState` whenever `shareItems` or `storyItemIds`
 * change.
 *
 * Scope of persistence:
 *  - `cachedSvg`, `cachedImageDataUrl`, and `cachedChartData` are all
 *    preserved on every variant. The SVG is what the share cards
 *    render (rasterized to PNG on demand). `cachedChartData` is the
 *    structured payload the per-variant CSV builders consume; keeping
 *    it on disk is what makes the data-download icons work for
 *    radar / equity / resilience after a page reload (only barChart
 *    items have a recompute path through `useResolvedScenarioTiers`).
 *  - `saveShareState` already swallows quota-exceeded errors, so a
 *    user with an oversized tray simply skips the persist (in-memory
 *    state still works for the rest of the session).
 *
 * Versioning model
 * ----------------
 * Two layers, deliberately:
 *
 *  - `SHARE_STORAGE_KEY` is the localStorage key. Bumping the key
 *    discards every prior version's items at hydration time. Use
 *    when the schema changed in a way no migration can express
 *    (e.g. a variant's metadata was removed) and the right
 *    user-facing behavior is "start fresh".
 *  - `SHARE_STORAGE_VERSION` is the envelope schema version. The
 *    envelope is a JSON object `{ version, shareItems, storyItemIds }`
 *    and `migrateEnvelope` is a chained migrator that walks any
 *    older version forward to the current one. Use this when the
 *    new build CAN read old data with a transformation. P2.3
 *    introduces v2 with the share/types.ts split. Pre-v2 envelopes
 *    were written under `coeqwal-share-v1` (no version field),
 *    those are silently discarded by the key bump.
 */

import type { PersistedShareItem, ShareItem } from "./types"

export const SHARE_STORAGE_KEY = "coeqwal-share-v2"
export const SHARE_STORAGE_VERSION = 2

interface ShareEnvelope {
  /**
   * Envelope schema version. Bumped by migrations within the same
   * SHARE_STORAGE_KEY. Independent from the URL version
   * (`SHARE_URL_VERSION` in `share/url.ts`). Older envelopes that
   * predate this field are treated as version 1.
   */
  version: number
  shareItems: PersistedShareItem[]
  storyItemIds: string[]
}

/**
 * Forward-only migration chain. Each step walks an envelope from
 * version N to N+1. New migrations are appended here and the
 * version constant is bumped.
 *
 * v1 → v2 (current): identity. The v1 → v2 transition is paired
 * with the `coeqwal-share-v1` → `coeqwal-share-v2` storage-key
 * bump (P2.3), so v1 items never reach this migrator under the
 * v2 key. Kept as a documented placeholder so future migrations
 * follow the same shape.
 */
const MIGRATIONS: Record<number, (env: unknown) => unknown> = {
  1: (env) => {
    if (typeof env !== "object" || env === null) return env
    const obj = env as Record<string, unknown>
    return { ...obj, version: 2 }
  },
}

function migrateEnvelope(envIn: unknown): ShareEnvelope | null {
  if (typeof envIn !== "object" || envIn === null) return null
  let env = envIn as Record<string, unknown>
  let version = typeof env.version === "number" ? env.version : 1
  while (version < SHARE_STORAGE_VERSION) {
    const step = MIGRATIONS[version]
    if (!step) return null
    const next = step(env)
    if (typeof next !== "object" || next === null) return null
    env = next as Record<string, unknown>
    version = typeof env.version === "number" ? env.version : version + 1
  }
  return env as unknown as ShareEnvelope
}

/**
 * Project a `ShareItem` to its persisted shape. The persisted shape
 * currently includes every runtime field; the function exists as a
 * single chokepoint where future strip-on-save policies can be
 * applied (e.g. dropping a transient computed field) without every
 * call site needing to learn about it.
 *
 * The return type is `PersistedShareItem`. If the item shape and
 * the persisted shape drift, TypeScript will reject the assignment
 * here, which is the desired loud failure.
 */
function toPersisted(item: ShareItem): PersistedShareItem {
  return item
}

/**
 * Load the persisted share state on store hydration. Tolerant of
 * a missing or corrupt envelope; returns an empty state in that
 * case so the app still boots.
 */
export function loadShareState(): {
  shareItems: ShareItem[]
  storyItemIds: string[]
} {
  try {
    if (typeof window === "undefined") {
      return { shareItems: [], storyItemIds: [] }
    }
    const raw = localStorage.getItem(SHARE_STORAGE_KEY)
    if (!raw) return { shareItems: [], storyItemIds: [] }
    const parsed = JSON.parse(raw) as unknown
    const migrated = migrateEnvelope(parsed)
    if (!migrated) return { shareItems: [], storyItemIds: [] }
    return {
      shareItems: Array.isArray(migrated.shareItems)
        ? (migrated.shareItems as ShareItem[])
        : [],
      storyItemIds: Array.isArray(migrated.storyItemIds)
        ? migrated.storyItemIds
        : [],
    }
  } catch {
    return { shareItems: [], storyItemIds: [] }
  }
}

/**
 * Persist the current share state. Strips runtime-only fields per
 * `toPersisted` and silently swallows quota or unavailability
 * errors. The store calls this from a subscribe hook every time
 * `shareItems` or `storyItemIds` changes.
 */
export function saveShareState(
  shareItems: ShareItem[],
  storyItemIds: string[],
): void {
  try {
    if (typeof window === "undefined") return
    const envelope: ShareEnvelope = {
      version: SHARE_STORAGE_VERSION,
      shareItems: shareItems.map(toPersisted),
      storyItemIds,
    }
    localStorage.setItem(SHARE_STORAGE_KEY, JSON.stringify(envelope))
  } catch {
    // localStorage full or unavailable, silently ignore;
    // in-memory state still works for the rest of the session.
  }
}
