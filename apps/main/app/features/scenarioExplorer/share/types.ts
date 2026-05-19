/**
 * Share-system types.
 *
 * Holds the variant-safe `ShareItem` discriminated union and the
 * `PersistedShareItem` shape that the persistence layer writes to
 * localStorage. `ShareItem` is the runtime shape held by the store,
 * `PersistedShareItem` strips fields we deliberately do not persist
 * (in-memory chart data) so localStorage stays small.
 */

import type { OutcomeDisplayMode } from "../store"

/**
 * Patch shape accepted by `updateShareItem`. Narrower than
 * `Partial<ShareItem>` so callers can only mutate fields the share
 * UI is allowed to change. Other state goes through specific
 * actions on the store (add, remove, set) or is set once at
 * capture time and never mutated.
 */
export interface ShareItemPatch {
  /**
   * Free-form annotation users add to a share item to record why
   * they saved it. Editable inline on every card.
   */
  note?: string
  /**
   * Live chart payload backfilled when a share item arrives without
   * one (e.g. URL load). Each variant casts this to its own concrete
   * shape at the render boundary.
   */
  cachedChartData?: Record<string, unknown>
}

interface ShareItemBaseFields {
  id: string
  /**
   * Free-form annotation set by the user on the share card.
   * Editable inline via `updateShareItem`.
   */
  note?: string
  /**
   * Live chart payload captured at share time so the card can
   * render an exact replay even after the source view changes
   * upstream. Variants cast this at render time.
   */
  cachedChartData?: Record<string, unknown>
  /**
   * Serialized SVG document with computed styles inlined. Primary
   * thumbnail format. Captured by the off-screen host (single-SVG
   * variants) or the live-DOM SVG composer (composed variants).
   * Absent only when the item arrived from a URL (which cannot
   * carry visual cache); cards fall back to a live re-render in
   * that case.
   */
  cachedSvg?: string
  /**
   * PNG fallback for the rare client that cannot render SVG (and
   * for items captured before SVG was added to a variant). The
   * download UI prefers cachedSvg and rasterizes it on demand.
   */
  cachedImageDataUrl?: string
}

export type ShareItem =
  | (ShareItemBaseFields & {
      type: "barChart"
      scenarioId: string
      viewMode: OutcomeDisplayMode
      hydroclimate: string
    })
  | (ShareItemBaseFields & {
      type: "radar"
      scenarioIds: string[]
      scenarioColors?: string[]
      axes: string[]
      showRange: boolean
      /** When false, tier band background is off (matches explore `showTierZones`). */
      showTierZones?: boolean
      highlightBaseline: boolean
      showDotsOnly: boolean
      hydroclimate: string
    })
  | (ShareItemBaseFields & {
      type: "equity"
      scenarioId: string
      outcomeCodes: string[]
      compareToBaseline: boolean
      hydroclimate: string
    })
  | (ShareItemBaseFields & {
      type: "resilience"
      /** Which cell encoding was used, e.g. "tier" | "delta" | "distribution" | ... */
      cellEncoding: string
      /** Which top-level view was active, e.g. "scenario" | "outcome" | "aggregate" */
      view: string
      /** Scenario ids that were in-scope at capture time (may be empty for aggregate). */
      scenarioIds: string[]
      /** Hydroclimates that were selected at capture time. */
      hydroclimates: string[]
      /** Outcome codes that were visible at capture time. */
      outcomeCodes: string[]
      /**
       * Which capture surface produced this item. "panel" captures the
       * whole chart body; the small-multiples kinds capture a single
       * tile. Absent values rehydrate to "panel" for backwards-compatible
       * URL round trips.
       */
      tileScope?: "panel" | "scenario" | "outcome" | "hydroclimate"
      /**
       * Identifier of the captured tile when `tileScope` is one of
       * the small-multiples kinds (scenarioId, outcome code, or
       * hydroclimate value). Omitted for panel captures.
       */
      tileId?: string
      /** Human-facing label shown in the Share drawer/tab card subtitle. */
      tileLabel?: string
      /**
       * Whether numeric cell values were visible in the heatmap at
       * capture time. Used to match share thumbnails and list
       * context.
       */
      showCellNumbers?: boolean
    })

/**
 * On-disk shape of a share item. Currently the same as `ShareItem`:
 * `cachedSvg`, `cachedImageDataUrl`, and `cachedChartData` all
 * survive a reload so the share cards render and the data-download
 * icons stay enabled (only the bar chart variant has a live
 * recompute path; the others would otherwise lose their data).
 *
 * `share/persist.ts` enforces this at runtime via `toPersisted`;
 * the alias is kept as a named, mutable contract so a future
 * strip-on-save policy can re-introduce an `Omit<...>` without
 * having to chase down every call site.
 */
export type PersistedShareItem = ShareItem

/**
 * Variant helper. Use this when a function only handles one kind
 * of item, e.g. an off-screen capture adapter for radar.
 */
export type ShareItemOfType<T extends ShareItem["type"]> = Extract<
  ShareItem,
  { type: T }
>
