/* MapPopupArbiter. Batches LocationHighlights for the map-popup layer.
 *
 * Phase 0 scope. Owns the single LOI highlight the Beat 5 driver used
 * to write directly to `mapActions.setLocationHighlights`. Built as a
 * commit-phase arbiter so Phase 2's Beat 1C progressive popups (five
 * staggered actors) can coexist on the same arbiter without racing on
 * the store.
 *
 * Each `MapPopupActor` resolves to at most one `LocationHighlight` per
 * tick. Active highlights for all in-window actors are collected in a
 * buffer populated during `onEnter` and `onUpdate` and flushed in
 * `commit()` with one `setLocationHighlights` call per tick.
 */

import { mapActions } from "../../../../../map/store"
import type { LocationHighlight } from "../../../../../map/store"
import type { Arbiter, BeatEngineContext, MapPopupActor } from "../types"

export class MapPopupArbiter implements Arbiter<MapPopupActor> {
  readonly kind = "mapPopup" as const

  /** Per-tick highlight buffer. Keyed by `actor.id` so duplicate enter
   *  and update calls within a tick stay idempotent. */
  private buffer = new Map<string, LocationHighlight>()

  /** Signature of the last committed highlight set. Format is
   *  `"<actorId>#<key>|<actorId>#<key>|..."`. Used to skip redundant
   *  store writes when the buffer contents have not changed since last
   *  tick. Matches the latch-style behavior of the legacy Beat 5
   *  driver, which only wrote on window entry and exit, not every
   *  frame. */
  private lastSig = ""

  onEnter(actor: MapPopupActor, _v: number, ctx: BeatEngineContext): void {
    const hi = actor.buildHighlight(ctx)
    if (hi) this.buffer.set(actor.id, hi)
  }

  onUpdate(actor: MapPopupActor, _v: number, ctx: BeatEngineContext): void {
    // Re-evaluate each tick so late-arriving centroid or tier data
    // lands without needing a dedicated "data ready" signal. If
    // `buildHighlight` returns null (data not ready yet), drop the
    // buffer slot and try again next tick.
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

  /** Cheap structural signature of the current buffer.
   *  Order-insensitive by sorting actor ids. `highlight.key` is the
   *  most-changing part of each entry. Longitude, latitude, or tier
   *  data would only change if the `buildHighlight` thunk re-resolves
   *  to a different target, which is rare. Including the actor id
   *  together with the highlight key catches both actor-set changes
   *  and target-identity changes. */
  private computeSig(): string {
    if (this.buffer.size === 0) return ""
    const ids = Array.from(this.buffer.keys()).sort()
    return ids.map((id) => `${id}#${this.buffer.get(id)!.key}`).join("|")
  }
}
