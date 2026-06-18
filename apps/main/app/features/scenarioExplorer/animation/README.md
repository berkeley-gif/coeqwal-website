# Animation (Get-started storyboard)

The "Visualizing key outcomes" click-through animation on the Get-started tab walks a visitor through how scenario key outcomes are read, using a sequence of beats that paint the Mapbox map and animate SVG overlays together.

- **Mounted by**: `GetStartedView`
- **Map**: shared app Mapbox map via `@repo/map`
- **Animation**: `@repo/motion` (Framer Motion)

> Planning to make this scroll-driven instead of click-through? See [SCROLL_MIGRATION.md](SCROLL_MIGRATION.md) for a handoff note on converting the storyboard to a scroll-driven storyline with `@repo/scrollytelling`.

## Mental model

There is one shared clock, a `progress` value that runs from 0 to 1 across the whole animation (a Framer `MotionValue` created in `TierAnimationSection`). Clicking Next or Back animates that clock toward the next or previous checkpoint in [0, 1]. An engine (`BeatEngine`, in `engine/BeatEngine.ts`) watches the clock and, on every frame, decides which small units of choreography (actors, for example "fade in this region's fill" or "show this popup") are currently active and tells the corresponding handler (arbiter, for example `MapPaintArbiter`, `MapPopupArbiter`, `CameraArbiter`, `NarrationArbiter`, `OverlayMorphArbiter`) to do its thing. The handlers paint the map and drive the overlays. The `TierAnimationSection` component does not animate anything directly. It builds the data the engine needs and composes the pieces.

Vocab:

- **`progress`**: the shared clock, one number from 0 to 1. Everything visible is a function of it.
- **beat**: one step of the storyboard, and the main organizing principle. Each beat is a chunk of the narrative with its own intent, narration, and actors (the `legend` beat, the `radar` beat, and so on), and it is what the visitor advances through one step at a time with Play, Next, and Back. In code a beat is encoded as a `TimingBeat` (an id, a target `progress`, and a `duration`). The target `progress` is just the checkpoint the clock rests on at the end of the step. The narrative meaning is the larger part.
- **actor**: the smallest unit of choreography. Plain data: an `id`, a `kind`, a `window`, and a `payload` or a `build(ctx)` function. It says what should happen and when, never how.
- **window**: the progress interval `[start, end)` during which an actor is active. This is the actor's "when," and it is independent of the beats.
- **arbiter**: the handler that owns one `kind` and does the actual work (paint, popup, narration, morph).

Two principles tie these together.

**Beats organize the narrative and navigation. Actors and windows are for execution.** The per-frame dispatch loop never looks at beats. It walks the flat list of actors and asks only whether `progress` is inside each actor's window. Beats conceptually group actors for authoring and drive the Play, Next, and Back tweens, but at dispatch time they do not exist. That is why an actor's window can start or end partway through a neighboring beat.

**The SVG morph and the left-column narration are actors.** Each is an ordinary actor, of `kind` `overlayMorph` or `narration`, with a `[0, 1]` window.

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
  by beat)          | walks actors per frame|
                    +-----------------------+
                     |                      |
      clock-driven,*              click-driven,*
      during playback             after playback
                     |                      |
                     v                      v
        +----------------------+   +-------------------------+
        |  Playback arbiters   |   | Interactive drivers     |
        |  ------------------  |   | ----------------------- |
        |  MapPaint            |   | InteractiveLayerDirector|
        |  MapPopup            |   |  - InteractivePaint-     |
        |  OverlayPopup        |   |    Arbiter (demand-units)|
        |  Narration           |   |  - PolygonLayerDriver    |
        |                      |   |    (other polygons)      |
        |  OverlayMorph        |   +-------------------------+
        +----------------------+              |
              |           |                   |
              v           v                   v
     +--------------+   +----------------------------+
     |   Overlays   |   |        Mapbox layers       |
     | text, morph  |   +----------------------------+
     +--------------+

   TierAnimationSection: builds the engine context and composes
   the hooks and overlays. It does not subscribe to `progress` itself.

   * Two paths, triggered differently.
     While the storyboard is playing (the `playback` mode, driven by
     Play / Next / Back), the `progress` clock is moving and the engine
     repaints on every frame, routing each actor to the arbiter that
     owns its kind (mapPaint, mapPopup, overlayPopup, narration,
     overlayMorph). Once the storyboard reaches the last beat and
     stops, the clock is no longer moving and the user can click
     demand-unit/location squares. Those clicks change React state, which fires
     an effect that calls the InteractiveLayerDirector. The director owns
     the InteractivePaintArbiter (demand-units) and the PolygonLayerDriver
     (the other polygon outcomes) and sequences the handoff between them.
     So the left column is driven by the clock, the right column by clicks,
     and only the left is dispatched by the engine.

   CameraArbiter is event-driven in the same way. Nav handlers call it
   directly to fly the map back to its home view. See the "Two families of
   arbiter" section below and engine/arbiters/CameraArbiter.ts.
```

### Files for each box above

| Box | File |
| --- | --- |
| progress clock, engine context | `TierAnimationSection.tsx` |
| ACTOR_GROUPS | `engine/actorGroups.ts` |
| BeatEngine | `engine/BeatEngine.ts` |
| Playback arbiters | `engine/arbiters/{MapPaint, MapPopup, OverlayPopup, Narration, OverlayMorph}Arbiter.ts` |
| Interactive layer director | `engine/InteractiveLayerDirector.ts`, `engine/arbiters/InteractivePaintArbiter.ts`, `engine/arbiters/PolygonLayerDriver.ts`, `interactiveLayerSchema.ts` |
| Overlays (text, morph) | `BeatTextOverlay.tsx` (panel shell), `Narration.tsx` (left-column copy), `StoryboardControls.tsx` (controls), `useOutcomeLabelGeometry.ts` (label math), `OutcomeMorphOverlay.tsx` (SVG morph) |
| Mapbox layers | shared app map via `@repo/map` |

## TierAnimationSection

This component is long because it wires many pieces together, but it reads top to bottom in this order:

**state → navigation → selection → engine → render**

- **state**: the `progress` clock, the beat cursor, play state, and the loaded tier data.
- **navigation**: the Play / Next / Back / Restart handlers and keyboard shortcuts that move the `progress` clock between beats.
- **selection**: interactive hover, pinning, and spotlighting once the storyboard has settled on the final beat.
- **engine**: the `BeatEngineContext`, the arbiters array, and the `useBeatEngine` call that subscribes to `progress`.
- **render**: the overlays (`BeatTextOverlay`, `OutcomeMorphOverlay`) over the shared map.

Related code is pulled into `hooks/`:

- `useStoryboardNavigation` owns the Play / Next / Back / Restart handlers, the keyboard shortcuts, and the reduced-motion auto-arrival. The cursor state stays in the component and is passed in via setters.
- `useInteractiveLayerDirector` wires the `InteractiveLayerDirector`, which owns the `InteractivePaintArbiter` (demand-units) and the `PolygonLayerDriver` (non-DU polygons) and sequences cross-family handoffs during interactive mode.
- `useScreenPolygonProjection` projects outcome geometry from Mapbox into panel-relative screen polygons and keeps them in sync on map move, scroll, and resize.
- `useStoryboardLayout` turns those screen polygons into the Beat 2 grid layout, the morph windows, and the per-outcome feature hide schedule the engine reads.
- `useStoryboardCamera` detects when the panel scrolls into view, flies the camera home, and primes the map session.

These hooks share a few refs so the handlers and effects can reach the engine without depending on its memoized identity:

- `engineApiRef`: the `BeatEngineApi` (dispatch a frame, `setMode`, teardown).
- `engineContextRef`: the current `BeatEngineContext` handed to arbiters.
- `interactiveLayerDirectorRef`: the `InteractiveLayerDirector` and its two drivers.
- `computePolygonDataRef`: the screen-polygon recompute callback (created in `useScreenPolygonProjection` and threaded through the component).

## What is an actor?

An actor is the smallest unit of the storyboard. It is plain data, not code. It describes one thing that should happen over one slice of the timeline. Every actor has four parts.

1. `id`: a human-readable label for debugging, like `"loi-highlight:overlayPopup:ring"`.
2. `window`: a half-open progress interval `[start, end)`. The actor is active while `progress` is inside this range.
3. `kind`: which handler owns it. One of `mapPaint`, `mapPopup`, `overlayPopup`, `narration`, or `overlayMorph`.
4. The work description: either a `payload` of parameters (for example a fade window and a peak opacity) or a `build...(ctx)` function that reads live data from the engine context when the actor runs.

An actor holds no logic of its own. It only says what should happen and when. The arbiter that owns its `kind` does the actual work. Two kinds, `narration` and `overlayMorph`, are bridge actors whose work is a per-frame callback the overlay component registers rather than a payload. See "The bridge actors" below. The morph and the narration are actors, not a separate mechanism.

The engine drives every actor through the same lifecycle, evaluated fresh every frame against the actor's window:

- `onEnter` runs on the frame the actor becomes active, when `progress` crosses into the window. It fires in either direction, so scrubbing backward into a window enters it again. It means "I just became active," not "the beat started."
- `onUpdate` runs on every frame while inside the window, including the entry frame.
- `onExit` runs on the frame the actor leaves the window, in either direction (`progress` moving past `end`, or back below `start`). It also runs on teardown and unmount for any still-active actor, so nothing is left stranded.

Each frame the engine runs all exits first, then all enters, then all updates, then one `commit` per arbiter. Exits before enters means an outgoing actor releases a layer or popup before an incoming one claims it.

Because `onUpdate` can fire many times, and `onEnter` can fire more than once across reverse scrubs, arbiters are written to be safe to call repeatedly with the same value. The clearest example is `MapPopupArbiter.commit()` in [engine/arbiters/MapPopupArbiter.ts](engine/arbiters/MapPopupArbiter.ts). It compares the current frame against the last write and skips the store update when nothing changed.

Actors and their arbiters live in `engine/`. The current actor groups are in [engine/actorGroups.ts](engine/actorGroups.ts).

## The engine context

When an actor uses a `build...(ctx)` function instead of a static `payload`, and whenever an arbiter runs, the engine hands it a `BeatEngineContext`. This is how an actor reads live data at the moment it runs. It holds refs and read-only values, not React state, so dispatch stays synchronous and in order. The full shape is `BeatEngineContext` in [engine/types.ts](engine/types.ts). The main things on it:

- `mapRef`: the `react-map-gl` map ref from `@repo/map`. Call `getMap()` on it to reach the underlying Mapbox GL instance (the type `@repo/map` exports as `MapboxGLMap`). It can be null before the map attaches, so always guard with `mapRef?.current?.getMap?.()`.
- `outcomeLocations`: current tier data per outcome (each entry has the unit `ids`, a `tierMap`, a `colorMap`, and a `nameMap`).
- `centroidLookup`: demand-unit id to centroid `{ lng, lat }`.
- `resolveDuName(duId)` and `resolveTierLabel(tier)`: display-name and tier-label resolvers.
- `buildBlendedTierExpr(fromHex, t)`: builds a Mapbox color expression blending from a starting color toward each unit's tier color.
- `getHideSchedule()`: the current fade-out schedule. Read it fresh each frame. Do not hold the array across frames or mutate it.
- `setDemoLocation` and `setDemoHoveredLocation`: setters for the demo highlight React state (the gold ring and the square popup).
- `narrationTickRef` and `overlayMorphTickRef`: the bridge slots described above.
- `getMode()`: the current engine mode, for arbiters that only act in one mode.

## TimingBeat and ActorGroup

A beat is the timing checkpoint. The grouping of actors that play around a beat is an actor group. For each beat there is one of each, and they use the same `id` value (such as `"legend"`), so you can match an actor group to its beat by that `id`.

### TimingBeat (a navigation checkpoint)

Defined by `TimingBeat` in [animationTiming.ts](animationTiming.ts). A timing beat is just an `id`, a target `progress` value, and a forward `duration` in seconds. These are the checkpoints that Next and Back move between. Clicking Next runs `animate(progress, nextBeat.progress, { duration })`.

### ActorGroup (the actors for one beat)

Defined by `ActorGroup` in [engine/actorGroups.ts](engine/actorGroups.ts). An actor group is an `id` plus a list of actors. Actor windows are independent of the timing checkpoints, so an actor in one group may have a window that spills into the next beat.

### Key files

If you want to change the storyboard, these are the files to start from.

| To change                                                             | Edit                                 | File                                                                       |
| --------------------------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------- |
| Beat timing (progress targets, durations)                             | `TIMING_BEATS`                       | [animationTiming.ts](animationTiming.ts)                                   |
| What plays during a beat (the actors)                                 | `ACTOR_GROUPS`                       | [engine/actorGroups.ts](engine/actorGroups.ts)                             |
| Actor and payload shapes                                              | `Actor`, `ActorKind`, payload types  | [engine/types.ts](engine/types.ts)                                         |
| How an effect is carried out                                          | the arbiter for that `kind`          | [engine/arbiters/](engine/arbiters/)                                       |
| The dispatch loop (enter, update, exit)                               | `BeatEngine`                         | [engine/BeatEngine.ts](engine/BeatEngine.ts)                               |
| Wiring and engine context                                             | `TierAnimationSection`               | [TierAnimationSection.tsx](TierAnimationSection.tsx)                       |
| Play / Next / Back / Restart and keyboard shortcuts                   | `useStoryboardNavigation`            | [hooks/useStoryboardNavigation.ts](hooks/useStoryboardNavigation.ts)       |
| Interactive layer ownership + handoff                                 | `useInteractiveLayerDirector`        | [hooks/useInteractiveLayerDirector.ts](hooks/useInteractiveLayerDirector.ts) |
| Projecting outcome geometry to screen polygons                        | `useScreenPolygonProjection`         | [hooks/useScreenPolygonProjection.ts](hooks/useScreenPolygonProjection.ts) |
| The Beat 2 grid layout and feature hide schedule                      | `useStoryboardLayout`                | [hooks/useStoryboardLayout.ts](hooks/useStoryboardLayout.ts)               |
| Panel-in-view detection and camera fly-home                           | `useStoryboardCamera`                | [hooks/useStoryboardCamera.ts](hooks/useStoryboardCamera.ts)               |
| Narration copy and intro timing                                       | `NARRATION_BY_BEAT`, intro constants | [Narration.tsx](Narration.tsx)                                             |
| Storyboard navigation buttons                                         | `StoryboardControls`                 | [StoryboardControls.tsx](StoryboardControls.tsx)                           |
| Per-frame label geometry (titles, captions, radar and heatmap labels) | `useOutcomeLabelGeometry`            | [useOutcomeLabelGeometry.ts](useOutcomeLabelGeometry.ts)                   |
| The overlay panel shell and right-column grid                         | `BeatTextOverlay`                    | [BeatTextOverlay.tsx](BeatTextOverlay.tsx)                                 |
| The SVG morph overlay                                                 | `OutcomeMorphOverlay`                | [OutcomeMorphOverlay.tsx](OutcomeMorphOverlay.tsx)                         |

## The storyboard, beat by beat

Eight timing beats run from `progress` 0 to 1. Full per-beat timing lives in [animationTiming.ts](animationTiming.ts). For a per-beat breakdown of the progress span, the actors and arbiters that fire, and the SVG morph stage, see [BEATS.md](BEATS.md). To follow the beats and actors live while the animation plays, open the browser console in development, where [useStoryboardDebugLog.ts](useStoryboardDebugLog.ts) prints one labeled line per event.

| Index | Id                    | Ends at progress | What the user sees                                                                                                                                                                 |
| ----- | --------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0     | `legend`              | 0.225            | Intro paragraphs fade in and the tier legend is revealed. Starts when the visitor clicks Play, reduced motion jumps straight to the final beat.                                     |
| 1     | `collapse-and-colors` | 0.365            | Intro text collapses, the legend floats to the top, and the demand-unit layer cross-fades from a blue palette into agriculture tier colors while narration explains the colors.    |
| 2     | `ag-rev-morph`        | 0.40             | The agriculture revenue polygons morph into distribution squares, with a before and after caption.                                                                                 |
| 3     | `all-other-morphs`    | 0.50             | The remaining eight outcomes morph into distribution squares back to back.                                                                                                         |
| 4     | `loi-highlight`       | 0.62             | A single location of interest is highlighted in five steps: layer fade in, gold ring on the square, popup near the square, gold stroke on the map polygon, popup near the polygon. |
| 5     | `list-bar`            | 0.72             | The distribution grids morph into per-outcome bar glyphs (the list view).                                                                                                          |
| 6     | `radar`               | 0.87             | The bars collapse into dots that glide out to polar vertices, then the radar chrome fades in.                                                                                      |
| 7     | `heatmap`             | 1.0              | The dots migrate into a stacked column of tier-colored cells, then the heatmap chrome fades in.                                                                                    |

Beats 3, 6, and 7 have empty actor arrays in the table. That is intentional, not a gap. Their visuals come entirely from the SVG overlays, which the engine drives through always-on bridge actors (see below). The map work for the rest of the storyboard has already finished by then.

## Who paints the map

Exactly one owner writes each interactive map layer at any time. The `interactiveLayerSchema.ts` lookup (derived from `OUTCOME_LAYER_REGISTRY`) maps each outcome to its layer family (`demand-units`, `polygon`, `river`, `marker`), the fill/outline ids, and the transition timings. The `InteractiveLayerDirector` reads that schema to pick the driver for a selection and to sequence the handoff: a same-layer change recolors in place, while a cross-family change fades the outgoing driver out and fades the incoming one in once the camera goes idle (a selection almost always flies the camera, so gating the fade-in on `idle` keeps the new layer from painting mid-flight). Ownership follows the engine mode and the play state.

| Mode          | When                                                                | Owner of demand-units                                  |
| ------------- | ------------------------------------------------------------------- | ------------------------------------------------------ |
| `idle`        | Before Play, or after Restart                                       | No one. The layer sits at its invisible baseline.      |
| `playback`    | A beat is tweening (`playState` is `playing`)                       | `MapPaintArbiter`, driven by progress-keyed actors.    |
| `interactive` | The storyboard has settled on the final beat and the user can click | `InteractiveLayerDirector`, routing to the driver for the selected family. |

`TierAnimationSection` sets the mode from its navigation handlers (Play sets `playback`, settling on the final beat sets `interactive`, Restart sets `idle`).

The other (non-demand-unit) polygon outcomes, like reservoirs and the Delta, are painted in interactive mode by `PolygonLayerDriver`. It is the single imperative writer for those fills and outlines (the `OutcomePolygonLayer` React component still owns them in Explore and Learn modes, but is skipped in get-started), folds the gold highlight into its own `applyOverlay` pass, and shares the gold-outline and fill-opacity expression builders in [demandUnitsPaint.ts](demandUnitsPaint.ts) with `InteractivePaintArbiter` so the two stay in step. The popup data behind both (the `LocationHighlight[]` the store reads) is derived separately in `TierAnimationSection`, since it is data rather than paint.

## Two families of arbiter

Not every arbiter is dispatched by the engine.

- **Playback arbiters** run from the `progress` clock through the engine's dispatch loop: `MapPaintArbiter`, `MapPopupArbiter`, `OverlayPopupArbiter`, `NarrationArbiter`, `OverlayMorphArbiter`. These are the ones in the `ACTOR_GROUPS` table and the arbiters array.
- **Event-driven arbiters/drivers** are held in refs and called directly from effects or nav handlers, because their work is driven by React state or user events, not by `progress`: `CameraArbiter`, the `InteractiveLayerDirector`, and the two drivers it holds (`InteractivePaintArbiter` and `PolygonLayerDriver`). They are not in the engine dispatch list. The `getMode()` value is an input to their decisions, not an engine-wide gate.

## The bridge actors (narration and overlay morph)

The SVG morph and the narration are ordinary actors, not a separate concept. Each is one actor in `actorGroups.ts` (`kind: "overlayMorph"` and `kind: "narration"`) with a `[0, 1]` window, so the engine drives it through the same enter, update, exit lifecycle as every other actor. The only difference is the work description. A bridge actor does no work of its own. It is a pass-through that connects the engine's per-frame loop to a React component that owns the real animation.

**Why they exist:** the narration overlay and the SVG morph are per-frame opacity and transform math. The narration math lives in `useOutcomeLabelGeometry.ts`, the hook that `BeatTextOverlay` mounts for its side panel. The SVG morph lives in `OutcomeMorphOverlay`, the SVG layer over the map. That logic is too stateful to express as a declarative actor payload, and it belongs with the component that owns the DOM and SVG refs.

How the handoff works:

1. On mount, each component writes its per-frame function into a ref on the engine context (`narrationTickRef` and `overlayMorphTickRef`), and clears it on unmount.
2. `actorGroups.ts` holds one narration actor and one overlay-morph actor, each with the full `[0, 1]` window, so they are active for the whole storyboard.
3. The matching arbiter fires `onUpdate` every frame and just calls the registered callback. When no component is mounted the call is a silent no-op.

So each frame the value flows from `progress` to `BeatEngine` to the arbiter to the context ref to the component callback to the DOM or SVG writes. This keeps everything on the engine's single `progress` subscription while letting the overlays keep their own refs and timing. It is also why beats 3, 6, and 7 can have empty actor arrays. Their visuals come entirely from these always-on bridge actors.

## Where Motion fits

Motion drives the `progress` clock and a few simple overlay fades.

The map and the SVG morph are painted imperatively. Mapbox paint properties and per-frame SVG transforms cannot be expressed as declarative motion components, so the arbiters read `progress` and write the changes by hand. Do not convert these to declarative motion components.

## Reduced motion and accessibility

The animation honors `prefers-reduced-motion: reduce`. It is handled in one place, at the orchestration level in `TierAnimationSection`, through `useReducedMotion()`. When reduced motion is on, every `goTo` collapses to a 0-second snap (`progress.set`) instead of a tween, and the auto-play arrival jumps straight to the settled end-state.

Because every overlay and arbiter is just a function of `progress`, the child listeners resolve themselves to their `progress = 1` branches, so there is no per-listener reduced-motion code to maintain. If you add a new animated piece, drive it from `progress` the same way and it gets reduced-motion support for free. Do not start your own timers or tweens that ignore `progress`, or they will bypass this.

One exception: the camera fly-home that Next triggers (the `viaCamera` path in `goTo`) still runs its fixed 800ms flight under reduced motion. Only the `progress` tween snaps. If that flight should also be instant under reduced motion, gate its duration on `prefersReducedMotion`.

## How to add or change a beat

1. **Tune timing**: edit the beat's `progress` target or `duration` in [animationTiming.ts](animationTiming.ts). The seconds-based fade helpers keep reveal pacing consistent when you retune.
2. **Change what happens**: edit that beat's actor list in [engine/actorGroups.ts](engine/actorGroups.ts). Add an actor with a `kind`, a `window`, and either a `payload` or a `build...` function.
3. **Add a new kind of effect**: if no existing arbiter does what you need, add a new arbiter under [engine/arbiters/](engine/arbiters/), give it a `kind`, and register it in the arbiters array in `TierAnimationSection`.
4. **Map vs overlay**: if the effect paints the map, use a `mapPaint` or `mapPopup` actor. If it animates the SVG overlay, drive it through the overlay bridge rather than adding per-frame map actors.
