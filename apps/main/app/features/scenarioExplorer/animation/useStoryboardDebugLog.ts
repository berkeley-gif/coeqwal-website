"use client"

/* useStoryboardDebugLog: a dev-only console log. Each event is one line, every value labeled and
 * in a fixed order so it is both self-describing and aligned:
 *
 *   progress=..  event=..  actor=..  window=..  beat=..  play=..
 *
 *   event=beat  a navigation step (Play, Next, or Back moved to a new beat).
 *   event=enter / event=exit  an actor crossing its window, mirroring the
 *     engine's per-frame dispatch. onUpdate runs every frame and is not
 *     logged. The overlayMorph and narration bridge actors appear here like
 *     any other actor.
 *
 * `beat` is the beat the line is about, with one consistent meaning. On a
 * navigation line it is the beat the visitor moved to. On an actor line it is
 * the beat the actor belongs to (its actorGroups group, matching the actor id
 * prefix). It does not track the live progress.
 *
 * Match an actor id to its row in BEATS.md. Logs only when
 * `process.env.NODE_ENV === "development"`. */

import { useEffect, useRef } from "react"
import type { MotionValue } from "@repo/motion"
import { TIMING_BEATS } from "./animationTiming"
import { ACTOR_GROUPS } from "./engine"

type PlayState = "idle" | "playing" | "paused" | "finished"

interface StoryboardDebugLogParams {
  progress: MotionValue<number>
  beatIndex: number
  playState: PlayState
}

const fmt = (n: number) => n.toFixed(3)

const beatLabel = (index: number) =>
  `${TIMING_BEATS[index]?.id ?? "?"} [${index}]`

/* React StrictMode invokes effects twice in development, so the
 * enter and beat lines logged on mount appear twice (and again on any remount).
 */
let strictModeNoteLogged = false
const STRICT_MODE_NOTE =
  "[storyboard] note: React StrictMode runs effects twice in development, so the lines logged on mount appear twice (more if the panel remounts). Production logs each event once."

function formatLine(o: {
  event: string
  actor: string | null
  window: string | null
  progress: string
  beat: string
  play: string
}): string {
  const field = (label: string, value: string | null, width: number) =>
    `${label}=${(value ?? "none").padEnd(width)}`
  return (
    `[storyboard] ${field("progress", o.progress, 5)}  ${field("event", o.event, 5)}  ` +
    `${field("actor", o.actor, 34)}  ${field("window", o.window, 16)}  ` +
    `${field("beat", o.beat, 24)}  play=${o.play}`
  )
}

/** See the file header. */
export function useStoryboardDebugLog({
  progress,
  beatIndex,
  playState,
}: StoryboardDebugLogParams): void {
  // Read by the actor effect, which only re-subscribes on `progress`.
  const playStateRef = useRef(playState)
  playStateRef.current = playState

  /* Print the StrictMode note once, before any mount lines. */
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return
    if (strictModeNoteLogged) return
    strictModeNoteLogged = true
    console.log(STRICT_MODE_NOTE)
  }, [])

  /* Actor execution: mirror the engine's window dispatch, exits before
   * enters, logging only the transitions. */
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return
    // Carry each actor's owning beat (its group, matching the actor id
    // prefix). ACTOR_GROUPS is in beat order, so the group index is the
    // beat index.
    const entries = ACTOR_GROUPS.flatMap((group, groupIndex) =>
      group.actors.map((actor) => ({ actor, beat: beatLabel(groupIndex) })),
    )
    const active = new Array(entries.length).fill(false)

    const logActor = (event: "enter" | "exit", index: number, v: number) => {
      const { actor, beat } = entries[index]!
      const [start, end] = actor.window
      console.log(
        formatLine({
          event,
          actor: actor.id,
          window: `[${fmt(start)}, ${fmt(end)})`,
          progress: fmt(v),
          beat,
          play: playStateRef.current,
        }),
      )
    }

    const evaluate = (v: number) => {
      for (let i = 0; i < entries.length; i++) {
        const [start, end] = entries[i]!.actor.window
        if (active[i] && (v < start || v >= end)) {
          active[i] = false
          logActor("exit", i, v)
        }
      }
      for (let i = 0; i < entries.length; i++) {
        const [start, end] = entries[i]!.actor.window
        if (!active[i] && v >= start && v < end) {
          active[i] = true
          logActor("enter", i, v)
        }
      }
    }

    evaluate(progress.get())
    const unsubscribe = progress.on("change", evaluate)
    return () => unsubscribe()
  }, [progress])

  /* Navigation: the beat the visitor moved to, set by Play, Next, or Back. */
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return
    console.log(
      formatLine({
        event: "beat",
        actor: null,
        window: null,
        progress: fmt(progress.get()),
        beat: beatLabel(beatIndex),
        play: playState,
      }),
    )
  }, [beatIndex, playState, progress])
}
