/* Beat engine: progress subscriber and actor dispatch
 *
 * Owns the one `progress.on("change")` subscription. Each frame it walks
 * a list of actors from the actor groups, works out which
 * actors moved into or out of their window, and calls the matching hook
 * on the arbiter that owns each kind.
 *
 * Dispatch order per frame:
 *
 * 1. For each actor active last frame but no longer in window,
 *    call `arbiter.onExit(actor, v, ctx)` and clear the active flag.
 * 2. For each actor now in window but not last frame, call
 *    `arbiter.onEnter(actor, v, ctx)` and set the active flag.
 * 3. For each actor now in window, call `arbiter.onUpdate(actor, v, ctx)`.
 * 4. For each arbiter with a `commit` hook, call it once.
 *
 * On unmount the engine calls `onExit` for every still-active actor
 * followed by each arbiter's `teardown`. Consumers can force the same
 * cleanup at any time by calling `api.teardown()` (for example when
 * navigating between beats).
 *
 * The engine holds a `ref` to the latest `BeatEngineContext` so
 * consumers can replace it every render without re-subscribing.
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
  /** Force cleanup. Calls `onExit` on every active actor, then
   *  `teardown` on every arbiter. Consumers call this to reset the
   *  engine without unmounting, such as on a beat change. Safe to call
   *  repeatedly. */
  teardown: () => void

  /** Read the current engine mode. */
  getMode: () => EngineMode

  /** Set the engine mode. See `EngineMode` for the values and when each
   *  one applies. Setting the current mode again is safe. */
  setMode: (mode: EngineMode) => void
}

export interface UseBeatEngineArgs {
  progress: MotionValue<number>
  actorGroups: readonly ActorGroup[]
  context: BeatEngineContext
  /** The arbiters, one per `kind` (such as `mapPaint`, `narration`, or
   *  `overlayMorph`). The engine indexes them by `kind` internally.
   *  Missing kinds are tolerated, so actors of an unhandled kind are
   *  silently skipped. */
  arbiters: readonly Arbiter[]
  /** When false, the engine does nothing. The subscription stays in
   *  place but its callback returns early, so no actors are dispatched.
   *  When true, each actor is dispatched as `progress` moves through its
   *  window. */
  enabled: boolean
}

export function useBeatEngine({
  progress,
  actorGroups,
  context,
  arbiters,
  enabled,
}: UseBeatEngineArgs): BeatEngineApi {
  // Stable refs for the per-frame callback
  //
  // The progress callback captures these refs once and reads `.current`
  // every frame. Updating the refs each render keeps the callback
  // current without re-subscribing.

  const ctxRef = useRef(context)
  ctxRef.current = context

  const flatActorsRef = useRef<readonly Actor[]>([])
  const arbiterByKindRef = useRef<Map<ActorKind, Arbiter>>(new Map())

  // Flatten all actor groups into one list, rebuilt only when the
  // groups change. A parallel `active` array (below) tracks which ones
  // are inside their window.
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

  // `activeRef[i]` is true while `flatActors[i]` is inside its window
  // (got `onEnter` but not yet `onExit`). Reset when the actor list
  // changes, since the indices shift.
  const activeRef = useRef<boolean[]>([])
  useEffect(() => {
    activeRef.current = new Array(flatActors.length).fill(false)
  }, [flatActors])

  // The one progress subscription, set up once for the life of the
  // component. We read `enabled` through a ref so toggling it doesn't
  // re-subscribe. The callback just early-returns when it's false.

  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  // Engine mode signal. Held in a ref so reads/writes from nav
  // handlers don't trigger re-renders.
  const modeRef = useRef<EngineMode>("idle")

  useEffect(() => {
    const unsub = progress.on("change", (v) => {
      if (!enabledRef.current) return

      const ctx = ctxRef.current
      const actors = flatActorsRef.current
      const active = activeRef.current
      const byKind = arbiterByKindRef.current

      // Exits. Actors in-window last frame but no longer in window.
      // Cleared before any enters fire this frame.
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

      // Enters. Actors now inside their window that weren't last frame.
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

      // Updates. Every actor still in-window, including those that just
      // entered this frame.
      for (let i = 0; i < actors.length; i++) {
        if (!active[i]) continue
        const actor = actors[i]!
        const arbiter = byKind.get(actor.kind)
        arbiter?.onUpdate?.(actor as never, v, ctx)
      }

      // Commit. One-shot per arbiter, after all actor dispatches this
      // frame. Lets batching arbiters combine their writes into one
      // update.
      for (const arbiter of byKind.values()) {
        arbiter.commit?.(ctx)
      }
    })

    return () => {
      unsub()
      // Force cleanup of any still-active actors so stopping the
      // subscription doesn't leak state into the next mount.
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

  // Stable api for callers (nav handlers call `api.teardown()`,
  // navigation/selection sites call `api.setMode()`).
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
