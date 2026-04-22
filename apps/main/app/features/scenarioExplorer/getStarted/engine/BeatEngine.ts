/* Beat engine. Single progress subscriber and actor dispatch.
 *
 * Phase 0 spike. Owns the one `progress.on("change")` subscription the
 * refactor is trying to reach (H6 in the spec). The engine walks a flat
 * list of actors derived from the beat table, computes which actors
 * transitioned into or out of their window on this tick, and dispatches
 * the appropriate hook on the arbiter that owns each kind.
 *
 * Dispatch order per tick.
 *
 * 1. For each actor currently active last tick but no longer in window,
 *    call `arbiter.onExit(actor, v, ctx)` and clear the active flag.
 * 2. For each actor now in window but not last tick, call
 *    `arbiter.onEnter(actor, v, ctx)` and set the active flag.
 * 3. For each actor now in window, call `arbiter.onUpdate(actor, v, ctx)`.
 * 4. For each arbiter with a `commit` hook, call it once.
 *
 * On unmount the engine calls `onExit` for every still-active actor
 * followed by each arbiter's `teardown`. Navigation handlers can force
 * the same cleanup via `clearInteractiveState`, which calls
 * `api.teardown()`.
 *
 * Live-context invariant. The engine holds a `ref` to the latest
 * `BeatEngineContext` so consumers can replace it every render without
 * re-subscribing or re-initializing. Reading `ctxRef.current` inside
 * the progress callback is safe because React guarantees the ref is up
 * to date by the time any effect-driven code path reads it.
 */

"use client"

import { useEffect, useMemo, useRef } from "react"
import type { MotionValue } from "@repo/motion"
import type {
  Actor,
  ActorKind,
  Arbiter,
  BeatEngineContext,
  BeatTableEntry,
} from "./types"

export interface BeatEngineApi {
  /** Force cleanup. Call `onExit` on every active actor, then
   *  `teardown` on every arbiter. Used by navigation handlers
   *  (`handleNext`, `handleBack`, `handleRestart` via the existing
   *  `clearInteractiveState`). Idempotent. */
  teardown: () => void
}

export interface UseBeatEngineArgs {
  progress: MotionValue<number>
  beatTable: readonly BeatTableEntry[]
  context: BeatEngineContext
  /** Collection of arbiters keyed by their `kind`. Missing kinds are
   *  tolerated. Actors of an unhandled kind are silently skipped so
   *  the engine can ship Phase 0 without narration or camera
   *  arbiters. */
  arbiters: readonly Arbiter[]
  /** When false, the engine is inert. No subscription, no dispatch.
   *  Used to keep the engine and the legacy per-effect code paths
   *  mutually exclusive while Phase 0 ships. Flipping to `true`
   *  activates dispatch for beats whose `actors` array is non-empty
   *  in `beatTable`. */
  enabled: boolean
}

export function useBeatEngine({
  progress,
  beatTable,
  context,
  arbiters,
  enabled,
}: UseBeatEngineArgs): BeatEngineApi {
  // Stable refs for the hot-path callback.
  //
  // The `progress.on("change")` callback captures these refs once and
  // reads `.current` on every tick. Swapping the ref contents on each
  // render keeps the callback free of React state closures without
  // needing to re-subscribe.

  const ctxRef = useRef(context)
  ctxRef.current = context

  const flatActorsRef = useRef<readonly Actor[]>([])
  const arbiterByKindRef = useRef<Map<ActorKind, Arbiter>>(new Map())

  // Memoize the flattened actor list so we only rebuild when the table
  // identity changes. Each (beat, actor-index) pair is one entry in a
  // parallel `active` array the dispatcher owns.
  const flatActors = useMemo<readonly Actor[]>(() => {
    const out: Actor[] = []
    for (const entry of beatTable) {
      for (const actor of entry.actors) out.push(actor)
    }
    return out
  }, [beatTable])
  flatActorsRef.current = flatActors

  // Arbiter lookup, rebuilt whenever the arbiters array identity changes.
  const arbiterByKind = useMemo<Map<ActorKind, Arbiter>>(() => {
    const m = new Map<ActorKind, Arbiter>()
    for (const a of arbiters) m.set(a.kind, a)
    return m
  }, [arbiters])
  arbiterByKindRef.current = arbiterByKind

  // `activeRef[i]` is true iff flatActors[i] is currently inside its
  // window (i.e. received `onEnter` without a matching `onExit` yet).
  // Reset whenever the actor list identity changes, since indices are
  // no longer stable.
  const activeRef = useRef<boolean[]>([])
  useEffect(() => {
    activeRef.current = new Array(flatActors.length).fill(false)
  }, [flatActors])

  // The one progress subscription.
  //
  // Lives for the lifetime of the component (given stable deps below).
  // `enabled` is captured by identity, not value, to avoid
  // re-subscribing as a cheap disable toggle. Instead the callback
  // early-returns when `enabled` is false.

  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  useEffect(() => {
    const unsub = progress.on("change", (v) => {
      if (!enabledRef.current) return

      const ctx = ctxRef.current
      const actors = flatActorsRef.current
      const active = activeRef.current
      const byKind = arbiterByKindRef.current

      // Phase 1, exits. Walk the active-flag array and find actors
      // that were in-window but no longer are, so we can clear their
      // state before any new enters fire this tick.
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

      // Phase 2, enters. Actors now inside their window that weren't
      // last tick.
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

      // Phase 3, updates. Every actor still in-window after the above
      // receives an update (including those just entered this tick).
      for (let i = 0; i < actors.length; i++) {
        if (!active[i]) continue
        const actor = actors[i]!
        const arbiter = byKind.get(actor.kind)
        arbiter?.onUpdate?.(actor as never, v, ctx)
      }

      // Phase 4, commit. One-shot per arbiter, after all actor
      // dispatches this tick have resolved. Lets batching arbiters
      // coalesce writes.
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

  // Stable api for callers (nav handlers call `api.teardown()`).
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
    }
  }, [progress])

  return api
}
