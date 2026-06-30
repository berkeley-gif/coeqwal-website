/**
 * `stageShareItem` is the single helper every "capture + add to share
 * drawer" call site funnels through. It runs the capture inside a
 * try/catch, hands the captured result (or `null`) to `buildItem`, and
 * always calls `addItem` so the share card still renders even if the
 * capture failed (cards then fall back to the live-mounted chart).
 *
 * Two patterns flow through the same helper:
 *   - Toolbar / simple paths: `buildItem` ignores `captured` for
 *     non-snapshot fields and just spreads `cachedSvg` /
 *     `cachedImageDataUrl` from the capture result. This is the
 *     dominant pattern (Radar toolbar, Equity, Resilience tile, bar
 *     chart row).
 *   - Sidebar radar paths: `buildItem` also reads `captured.color`,
 *     `captured.chartData`, etc. into the item. Same helper, same
 *     fail-open behavior.
 */

import type { ShareItem } from "../store"
import type { CapturedVisual } from "./capture/types"

export interface StageShareItemArgs<T extends ShareItem, R> {
  /** Run the off-screen capture (or any capture path). May reject. */
  capture: () => Promise<R | null>
  /**
   * Build the share item from the capture result. Receives `null`
   * when the capture rejected or returned `null`. Always returns the
   * item to stage. The share card can render without snapshot data.
   */
  buildItem: (captured: R | null) => T
  /** Append the resulting item to the share drawer. */
  addItem: (item: T) => void
  /** Free-form tag used when logging capture failures. */
  errorLabel: string
}

export async function stageShareItem<T extends ShareItem, R = CapturedVisual>(
  args: StageShareItemArgs<T, R>,
): Promise<void> {
  let captured: R | null = null
  try {
    captured = await args.capture()
  } catch (err) {
    console.error(`[${args.errorLabel}] capture failed:`, err)
  }
  args.addItem(args.buildItem(captured))
}
