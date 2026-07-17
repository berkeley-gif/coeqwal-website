/* Beat engine: progress subscriber and actor dispatch.
 *
 * Owns the one `progress.on("change")` subscription. Each frame it walks
 * the flattened actor list, finds which actors moved into or out of
 * their window, and calls the matching hook on the owning arbiter.
 *
 * Dispatch order per frame:
 * 1. Exits: actors active last frame but no longer in window.
 * 2. Enters: actors now in window but not last frame.
 * 3. Updates: every actor now in window.
 * 4. `commit` on each arbiter that has one.
 *
 * On unmount, `onExit` runs for every still-active actor, then each
 * arbiter's `teardown`. `api.teardown()` forces the same cleanup (e.g.
 * navigating between beats). The latest `BeatEngineContext` is held in a
 * ref so consumers can replace it each render without re-subscribing.
 */

"use client"

import { useEffect, useMemo, useRef } from "react"
import type { MotionValue } from "@repo/motion"
import type {
  Actor,
  ActorKind,
  Arbiter,
  BeatEngineContext,
  ActorGroup,
  EngineMode,
} from "./types"

export interface BeatEngineApi {
  /** Force cleanup: `onExit` on every active actor, then `teardown` on
   *  every arbiter. Resets the engine without unmounting (e.g. beat
   *  change). Safe to call repeatedly. */
  teardown: () => void

  /** Read the current engine mode. */
  getMode: () => EngineMode

  /** Set the engine mode. See `EngineMode`. Setting the current mode
   *  again is safe. */
  setMode: (mode: EngineMode) => void
}

export interface UseBeatEngineArgs {
  progress: MotionValue<number>
  actorGroups: readonly ActorGroup[]
  context: BeatEngineContext
  /** The arbiters, one per `kind`. Indexed by `kind` internally. Missing
   *  kinds are tolerated. Actors of an unhandled kind are skipped. */
  arbiters: readonly Arbiter[]
  /** When false the subscription stays but its callback returns early, so
   *  no actors are dispatched. When true, each actor is dispatched as
   *  `progress` moves through its window. */
  enabled: boolean
}

export function useBeatEngine({
  progress,
  actorGroups,
  context,
  arbiters,
  enabled,
}: UseBeatEngineArgs): BeatEngineApi {
  // Stable refs for the per-frame callback. The progress callback
  // captures these once and reads `.current` every frame. Updating them
  // each render keeps the callback current without re-subscribing.
  const ctxRef = useRef(context)
  ctxRef.current = context

  const flatActorsRef = useRef<readonly Actor[]>([])
  const arbiterByKindRef = useRef<Map<ActorKind, Arbiter>>(new Map())

  // Flatten all actor groups into one list, rebuilt only when the groups
  // change. A parallel `active` array (below) tracks which are in window.
  const flatActors = useMemo<readonly Actor[]>(() => {
    const out: Actor[] = []
    for (const group of actorGroups) {
      for (const actor of group.actors) out.push(actor)
    }
    return out
  }, [actorGroups])
  flatActorsRef.current = flatActors

  // Arbiter lookup, rebuilt whenever the arbiters array identity changes.
  const arbiterByKind = useMemo<Map<ActorKind, Arbiter>>(() => {
    const m = new Map<ActorKind, Arbiter>()
    for (const a of arbiters) m.set(a.kind, a)
    return m
  }, [arbiters])
  arbiterByKindRef.current = arbiterByKind

  // `activeRef[i]` is true while `flatActors[i]` is in window (got
  // `onEnter` but not yet `onExit`). Reset when the actor list changes
  // because the indices shift.
  const activeRef = useRef<boolean[]>([])
  useEffect(() => {
    activeRef.current = new Array(flatActors.length).fill(false)
  }, [flatActors])

  // The one progress subscription, set up once for the component's life.
  // `enabled` is read through a ref so toggling it doesn't re-subscribe.
  // The callback early-returns when false.
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  // Engine mode signal. In a ref so nav-handler reads/writes don't
  // trigger re-renders.
  const modeRef = useRef<EngineMode>("idle")

  useEffect(() => {
    const unsub = progress.on("change", (v) => {
      if (!enabledRef.current) return

      const ctx = ctxRef.current
      const actors = flatActorsRef.current
      const active = activeRef.current
      const byKind = arbiterByKindRef.current

      // Exits. Cleared before any enters fire this frame.
      for (let i = 0; i < actors.length; i++) {
        if (!active[i]) continue
        const actor = actors[i]!
        const [start, end] = actor.window
        if (v < start || v >= end) {
          const arbiter = byKind.get(actor.kind)
          arbiter?.onExit?.(actor as never, v, ctx)
          active[i] = false
        }
      }

      // Enters. Now in window but not last frame.
      for (let i = 0; i < actors.length; i++) {
        if (active[i]) continue
        const actor = actors[i]!
        const [start, end] = actor.window
        if (v >= start && v < end) {
          const arbiter = byKind.get(actor.kind)
          arbiter?.onEnter?.(actor as never, v, ctx)
          active[i] = true
        }
      }

      // Updates. Every actor in window, including those just entered.
      for (let i = 0; i < actors.length; i++) {
        if (!active[i]) continue
        const actor = actors[i]!
        const arbiter = byKind.get(actor.kind)
        arbiter?.onUpdate?.(actor as never, v, ctx)
      }

      // Commit. Once per arbiter after all dispatches, letting batching
      // arbiters combine their writes into one update.
      for (const arbiter of byKind.values()) {
        arbiter.commit?.(ctx)
      }
    })

    return () => {
      unsub()
      // Force cleanup of still-active actors so stopping the subscription
      // doesn't leak state into the next mount.
      const ctx = ctxRef.current
      const actors = flatActorsRef.current
      const active = activeRef.current
      const byKind = arbiterByKindRef.current
      for (let i = 0; i < actors.length; i++) {
        if (!active[i]) continue
        const actor = actors[i]!
        const arbiter = byKind.get(actor.kind)
        arbiter?.onExit?.(actor as never, progress.get(), ctx)
        active[i] = false
      }
      for (const arbiter of byKind.values()) {
        arbiter.teardown?.(ctx)
      }
    }
  }, [progress])

  // Stable api for callers (`api.teardown()`, `api.setMode()`).
  const api = useMemo<BeatEngineApi>(() => {
    return {
      teardown: () => {
        const ctx = ctxRef.current
        const actors = flatActorsRef.current
        const active = activeRef.current
        const byKind = arbiterByKindRef.current
        for (let i = 0; i < actors.length; i++) {
          if (!active[i]) continue
          const actor = actors[i]!
          const arbiter = byKind.get(actor.kind)
          arbiter?.onExit?.(actor as never, progress.get(), ctx)
          active[i] = false
        }
        for (const arbiter of byKind.values()) {
          arbiter.teardown?.(ctx)
        }
      },
      getMode: () => modeRef.current,
      setMode: (mode) => {
        if (modeRef.current === mode) return
        modeRef.current = mode
      },
    }
  }, [progress])

  return api
}
