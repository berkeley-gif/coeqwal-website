/* MapPopupArbiter
 *
 * Collects the map popups for the current frame and writes them to the
 * store in one update, so several popups don't fight over the store.
 */

import { mapActions } from "../../../../map/store"
import type { LocationHighlight } from "../../../../map/store"
import type { Arbiter, BeatEngineContext, MapPopupActor } from "../types"

export class MapPopupArbiter implements Arbiter<MapPopupActor> {
  readonly kind = "mapPopup" as const

  /** The popups to show this frame, keyed by actor id so repeat enter
   *  and update calls in the same frame don't double up. */
  private buffer = new Map<string, LocationHighlight>()

  /** Fingerprint of the last write, so we skip the store update when
   *  nothing has changed since the previous frame. */
  private lastSig = ""

  onEnter(actor: MapPopupActor, _v: number, ctx: BeatEngineContext): void {
    const hi = actor.buildHighlight(ctx)
    if (hi) this.buffer.set(actor.id, hi)
  }

  onUpdate(actor: MapPopupActor, _v: number, ctx: BeatEngineContext): void {
    // Rebuild each frame so late-arriving centroid or tier data shows
    // up on its own. If the data isn't ready yet (`buildHighlight`
    // returns null), drop this popup and try again next frame.
    const hi = actor.buildHighlight(ctx)
    if (hi) this.buffer.set(actor.id, hi)
    else this.buffer.delete(actor.id)
  }

  onExit(actor: MapPopupActor): void {
    this.buffer.delete(actor.id)
  }

  commit(): void {
    const sig = this.computeSig()
    if (sig === this.lastSig) return
    if (this.buffer.size > 0) {
      mapActions.setLocationHighlights(Array.from(this.buffer.values()))
    } else {
      mapActions.clearLocationHighlights()
    }
    this.lastSig = sig
  }

  teardown(): void {
    if (this.buffer.size > 0 || this.lastSig !== "") {
      this.buffer.clear()
      mapActions.clearLocationHighlights()
      this.lastSig = ""
    }
  }

  /** Builds the fingerprint used to detect changes. Sorts actor ids so
   *  order doesn't matter, and pairs each id with its highlight key
   *  (the part most likely to change). */
  private computeSig(): string {
    if (this.buffer.size === 0) return ""
    const ids = Array.from(this.buffer.keys()).sort()
    return ids.map((id) => `${id}#${this.buffer.get(id)!.key}`).join("|")
  }
}
