# Animation (Get-started storyboard)

The scroll-and-click "Visualizing key outcomes" storyboard on the Get-started tab. It walks a visitor through how scenario outcomes are read, using a sequence of beats that paint the Mapbox map and animate SVG overlays together.

- **Mounted by**: `GetStartedView`
- **Map**: shared app Mapbox map via `@repo/map`
- **Animation**: `@repo/motion` (Framer Motion)

## Mental model

There is one shared clock, a `progress` value that runs from 0 to 1 across the whole animation. Clicking Next or Back animates that clock toward the next or previous checkpoint in [0, 1]. An engine watches the clock and, on every tick, decides which small units of choreography (actors) are currently active and tells the corresponding handler (arbiter) to do its work. The handlers paint the map and drive the overlays. The big `TierAnimationSection` component does not animate anything directly. It builds the data the engine needs and composes the pieces.

## Architecture

```
            Next / Back / Play
                    |
                    |  animate()
                    v
          +-----------------------+
          |   progress (0 to 1)   |   one shared MotionValue clock
          +-----------------------+
                    |
                    |  single "change" subscription
                    v
 ACTOR_GROUPS ----> +-----------------------+
 (actors grouped    |      BeatEngine       |
  by beat)          | walks actors per tick |
                    +-----------------------+
                     |                      |
         dispatch by kind           dispatch by kind
                     |               (mode gated)
                     v                      v
        +----------------------+   +-----------------------+
        |  Playback arbiters   |   | Interactive arbiters  |
        |  MapPaint            |   | DemandUnits paint     |
        |  MapPopup            |   | non-DU paint          |
        |  OverlayPopup        |   | location highlights   |
        |  Narration           |   +-----------------------+
        |  OverlayMorph        |              |
        +----------------------+              |
              |           |                   |
              v           v                   v
     +--------------+   +----------------------------+
     |   Overlays   |   |        Mapbox layers       |
     | text, morph  |   +----------------------------+
     +--------------+

   TierAnimationSection (thin): builds the engine context and composes
   the hooks and overlays. It does not subscribe to progress itself.
```

## What is an actor?

An actor is the smallest unit of the storyboard. It is plain data, not code. It describes one thing that should happen over one slice of the timeline. Every actor has four parts.

1. `id`: a human-readable label for debugging, like `"beat4:overlayPopup:ring"`.
2. `window`: a half-open progress interval `[start, end)`. The actor is active while `progress` is inside this range.
3. `kind`: which handler owns it. One of `mapPaint`, `mapPopup`, `overlayPopup`, `narration`, `overlayMorph`, or `camera`.
4. The work description: either a `payload` of parameters (for example a fade window and a peak opacity) or a `build...(ctx)` function that reads live data from the engine context when the actor runs.

An actor holds no logic of its own. It only says what should happen and when. The arbiter that owns its `kind` does the actual work.

The engine drives every actor through the same lifecycle:

- `onEnter` runs once, on the first tick that `progress` enters the window.
- `onUpdate` runs on every tick while inside the window, including the entry tick.
- `onExit` runs once, on the first tick that `progress` leaves the window.

Because `onUpdate` can fire many times, arbiters are written to be safe to call repeatedly with the same value.

Actors and their arbiters live in `engine/`. The current actor groups are in [engine/actorGroups.ts](engine/actorGroups.ts).

## TimingBeat and ActorGroup

A beat is the timing checkpoint. The grouping of actors that play around a beat is an actor group. For each beat there is one of each, and they use the same `id` value (such as `"legend"`), so you can match an actor group to its beat by that `id`.

### TimingBeat (a navigation checkpoint)

Defined by `TimingBeat` in [animationTiming.ts](animationTiming.ts). A timing beat is just an `id`, a target `progress` value, and a forward `duration` in seconds. These are the checkpoints that Next and Back move between. Clicking Next runs `animate(progress, nextBeat.progress, { duration })`.

### ActorGroup (the actors for one beat)

Defined by `ActorGroup` in [engine/actorGroups.ts](engine/actorGroups.ts). An actor group is an `id` plus a list of actors. Actor windows are independent of the timing checkpoints, so an actor in one group may have a window that spills into the next beat.

## The storyboard, beat by beat

Eight timing beats run from `progress` 0 to 1. The progress thresholds were compressed into the lower half of the range to leave room for later beats, so the numbers below are the live values. Full per-beat timing lives in [animationTiming.ts](animationTiming.ts).

| Index | Id | Ends at progress | What the user sees |
| ----- | -- | ---------------- | ------------------ |
| 0 | `legend` | 0.225 | Intro paragraphs fade in and the tier legend is revealed. Plays automatically on arrival. |
| 1 | `collapse-and-colors` | 0.365 | Intro text collapses, the legend floats to the top, and the demand-unit layer cross-fades from a blue palette into agriculture tier colors while narration explains the colors. |
| 2 | `ag-rev-morph` | 0.40 | The agriculture revenue polygons morph into distribution squares, with a before and after caption. |
| 3 | `all-other-morphs` | 0.50 | The remaining eight outcomes morph into distribution squares back to back. |
| 4 | `loi-highlight` | 0.62 | A single location of interest is highlighted in five steps: layer fade in, gold ring on the square, popup near the square, gold stroke on the map polygon, popup near the polygon. |
| 5 | `list-bar` | 0.72 | The distribution grids morph into per-outcome bar glyphs (the list view). |
| 6 | `radar` | 0.87 | The bars collapse into dots that glide out to polar vertices, then the radar chrome fades in. |
| 7 | `heatmap` | 1.0 | The dots migrate into a stacked column of tier-colored cells, then the heatmap chrome fades in. |

Note on naming: the engine constants for beat index 4 carry a `BEAT5_` prefix for historical reasons. They refer to the `loi-highlight` beat.

Beats 3, 6, and 7 have empty actor arrays in the table. That is intentional, not a gap. Their visuals come entirely from the SVG overlays, which the engine drives through always-on bridge actors (see below). The map work for the rest of the storyboard has already finished by then.

## Who paints the map

Exactly one owner writes the `demand-units` layers at any time. Ownership follows the engine mode and the play state.

| Mode | When | Owner of demand-units |
| ---- | ---- | --------------------- |
| `idle` | Before Play, or after Restart | No one. The layer sits at its invisible baseline. |
| `playback` | A beat is tweening (`playState` is `playing`) | `MapPaintArbiter`, driven by progress-keyed actors. |
| `interactive` | The storyboard has settled on the final beat and the user can click | `InteractivePaintArbiter` for the demand-units layers. Non-demand-unit polygon paint and location highlights are driven by the interactive layer. |

`TierAnimationSection` sets the mode from its navigation handlers (Play sets `playback`, settling on the final beat sets `interactive`, Restart sets `idle`).

## The bridge actors (narration and overlay morph)

Narration text and the SVG morph are hundreds of lines of per-frame opacity and transform math that lives inside `BeatTextOverlay` and `OutcomeMorphOverlay`. Rather than rewrite all of it as actors, each overlay registers a single callback on the engine context (`narrationTickRef` and `overlayMorphTickRef`). The table holds one narration actor and one overlay-morph actor, each with the full `[0, 1)` window, so the matching arbiter calls the registered callback on every tick. This earns the "one subscription" rule while letting the overlays keep their own refs and timing.

## Where motion fits

Motion drives the `progress` clock and a few simple overlay fades. That is the right tool for a time-driven value and should stay.

The map and the SVG morph are painted imperatively. Mapbox paint properties and per-frame SVG transforms cannot be expressed as declarative motion components, so the arbiters read `progress` and write the changes by hand. Do not convert these to declarative motion components.

## How to add or change a beat

1. **Tune timing**: edit the beat's `progress` target or `duration` in [animationTiming.ts](animationTiming.ts). The seconds-based fade helpers keep reveal pacing consistent when you retune.
2. **Change what happens**: edit that beat's actor list in [engine/actorGroups.ts](engine/actorGroups.ts). Add an actor with a `kind`, a `window`, and either a `payload` or a `build...` function.
3. **Add a new kind of effect**: if no existing arbiter does what you need, add a new arbiter under [engine/arbiters/](engine/arbiters/), give it a `kind`, and register it in the arbiters array in `TierAnimationSection`.
4. **Map vs overlay**: if the effect paints the map, use a `mapPaint` or `mapPopup` actor. If it animates the SVG overlay, drive it through the overlay bridge rather than adding per-frame map actors.
