# Converting the storyboard to a scroll-driven storyline

This is a handoff note for turning the Get-started "Visualizing key outcomes" storyboard into a scroll-driven storyline and merging it with the Learn map, using scrollama. Read [README.md](README.md) first for the architecture this note builds on.

The current storyboard is a click-through. The visitor clicks Play, then Next and Back, and an `animate()` tween moves the shared `progress` clock between beat checkpoints. It is built on three assumptions: forward playback, a clean "play to the end, settle, then interact" lifecycle, and beats that change only on deliberate Next/Back clicks. The goal would be to replace those controls with scroll position, so that scrolling the page would scrub the same `progress` clock.

## Context for the handoff

- There is an open branch and PR, `animation/improve map layer loading & unloading` (branch `animation/map-layer-loading-unloading`). Merge it before starting the scroll work. It simplifies the map layer load and unload that scroll scrubbing will rely on. This note describes the code as it stands after that PR lands.

## Using scrollama

The plan would be to use scrollama for the whole flow, the same library the Learn map uses. Steps would detect sections and drive the camera and layers the way Learn already does. Inside the outcomes steps, `onStepProgress` would write the existing `progress` `MotionValue` with `progress.set(v)`, so the engine, actors, and SVG morph would keep working unchanged. The driver would change, the engine would not.

It would make sense to drive the heavy SVG morphing through a `MotionValue`, not React or store state. The morph reshapes roughly 140 polygons per frame, so a per-frame `setState` would not work well. The rivers animation in `useLearnScrollama` is the precedent for the `onStepProgress` channel, except it writes a store value and the morph would need a `MotionValue` instead.


## Two systems over one map

There is only one map. `app/page.tsx` mounts a single persistent `MapInstance` shared across tabs, and both the Learn map and the outcomes storyboard already use the same `features/map/store`. So merging the maps means merging two controllers over one map, not combining two map instances.

The two controllers differ in how they track position:

- The Learn map is discrete. `onStepEnter` sets an `activeSection` in the store, and `useMapLayers` plus the section camera preset follow from it. Updates are coarse and fire at section boundaries.
- The outcomes storyboard is continuous. One `progress` `MotionValue` drives `BeatEngine`, and the arbiters (`MapPaintArbiter`, the popups, `narration`, `overlayMorph`, `CameraArbiter`, `InteractiveLayerDirector`) run per frame off actor windows.

The merge could keep both. Section steps would own the coarse camera and layer changes, and the continuous `progress` value would own the per-frame morph inside the outcomes steps.

## Different types of morphing

- **The SVG morph** is the per-frame reshaping of the SVG squares inside `OutcomeMorphOverlay`. Its frame applier (`latestMorphFrameRef.current`) recomputes the square paths through the visualization stages (distribution grid, bar glyphs, dots, radar, heat map) as a pure function of `v`.
- **The map morph beats** are beats 2 and 3 in the README beat table (`ag-rev-morph` and `all-other-morphs`), where the map's demand-units polygons visually become the distribution square grid. That transformation is painted on the Mapbox layers by `MapPaintArbiter`, separate from the SVG morph above.
- **The end-state transitions** are two `requestAnimationFrame` transitions that live inside `OutcomeMorphOverlay` but run only at `v = 1`: the encoding-mode crossfade (`encodingRafRef`) and the hydroclimate tier-change recolor (`tierChangeRafRef`). They reshape and recolor the same SVG, but they are clock transitions, not part of the scrubbed SVG morph.

## The good news

The whole storyboard is driven by one shared clock, a Framer `MotionValue` named `progress` created near the top of `TierAnimationSection.tsx` with `const progress = useMotionValue(0)`. Most of what is downstream reads that value as a pure function of `v` (the current progress):

- `useBeatEngine` holds the one driving `progress.on("change")` subscription (a dev-only debug logger in `useStoryboardDebugLog.ts` adds a second, read-only one),
- `OutcomeMorphOverlay` and `BeatTextOverlay` take `progress` as a prop, 
- and the SVG morph frame applier (`latestMorphFrameRef.current = (v) => {...}` in `OutcomeMorphOverlay.tsx`) recomputes its SVG paths from `v`. 

These per-frame paths keep no animation state, so they render the same result for the same `v` in either direction, which is what scroll needs. 

Two parts are not pure functions of `v`: 
- the SVG morph reads `encodingMode` (the end-state view toggle, one of `distribution`, `bar`, or `average`) to choose which target shape to draw, and it drives the two end-state transitions defined above, the encoding-mode crossfade (`encodingRafRef`) and the hydroclimate tier-change recolor (`tierChangeRafRef`). Both only run once `progress` reaches 1 (the tier-change effect early-returns while `progress < 1`), so neither matters during the scrubbed part of the timeline. 
- and the right-panel view-mode header in `BeatTextOverlay` (the `VIEW_MODE_HEADER_BY_BEAT` overline label that reads "Distribution view", "List view", "Radar chart", or "Heat map" for beats 4 to 7) fades between labels with an `AnimatePresence` keyed on `beatIndex`, on a fixed wall-clock duration (`PARAGRAPH_FADE_SEC`) rather than off `v`. 

One caveat on top of that: the storyboard doesn't reverse animate. It snaps Back, so continuous reverse scrubbing isn't guaranteed, and the imperative pieces in item 4 below do not scrub backward cleanly. Those pieces are the camera flights (`CameraArbiter.flyHome` and the auto fly-home in `useStoryboardCamera`), the `InteractiveLayerDirector` cross-family handoff that fades the next layer in only after the map fires `idle`, and the two end-state transitions inside `OutcomeMorphOverlay` (the encoding-mode crossfade and the tier-change recolor).

The `progress` clock would stay the same type the storyboard already consumes, a `MotionValue<number>` that runs 0 to 1. What would change is who writes it. The engine and overlay wiring would not change at all, so this would be a driver swap, not a rewrite.

Today the clock is created and written by tweens inside the component:

```tsx
const progress = useMotionValue(0)
// ...later, the tweens and snaps in useStoryboardNavigation write it:
animate(progress, target, { duration })
progress.set(1)
```

After the swap, `progress` would still be created with `useMotionValue(0)`, but scrollama would write it instead of the tweens. As the visitor scrolls through the outcomes steps, `onStepProgress` would set it:

```tsx
const progress = useMotionValue(0)

// scrollama, inside the outcomes step:
const onStepProgress = ({ progress: stepProgress }) => {
  progress.set(toStoryboardProgress(stepProgress))
}
```

That same `progress` object would then flow into its three consumers exactly as before: the engine (`useBeatEngine`), the SVG morph overlay (`OutcomeMorphOverlay`), and the text overlay (`BeatTextOverlay`). Only the writer would be new, everything else is the existing wiring from `TierAnimationSection`:

```tsx
// 1. the engine
useBeatEngine({
  progress,
  actorGroups: ACTOR_GROUPS,
  context: engineContext,
  arbiters: arbitersRef.current,
  enabled: !isLoading,
})

// 2. the SVG morph overlay
<OutcomeMorphOverlay
  progress={progress}
  overlayMorphTickRef={overlayMorphTickRef}
  /* ...all the other existing props... */
/>

// 3. the text overlay
<BeatTextOverlay progress={progress} /* ...other existing props... */ />
```

What you would remove is the writer side: the `goTo` helper, `handlePlay`, `handleNext`, `handleBack`, `handleRestart`, the keyboard `useEffect`, and the `controlsRef` tween storage in `useStoryboardNavigation` (all returned from or held inside that hook), which exist only to push values into the old `useMotionValue(0)` clock. Scroll position would supply those values instead.

## The core change

1. Pin the overlay stage as a sticky graphic while the visitor scrolls through step elements, the same shell the Learn map uses. Note that the Mapbox map is the shared, persistent app map (`useMap()` from `@repo/map`), not something this component mounts. `TierAnimationSection` renders only the overlay stage (the `panelRef` Box holding the SVG morph and text overlays, absolutely positioned over the map) and drives the map by ref for camera and layer paint. So you do not pin the map itself. You pin the overlay stage, and you give the steps enough height to act as the scroll runway. The persistent map stays where it is behind the pinned stage, and the camera and paint continue targeting it by ref exactly as it is now.
2. Write `progress` from `onStepProgress` as the visitor scrolls the outcomes steps (see the starter skeleton below).
3. Feed that `progress` into `useBeatEngine({ progress })` and into the `progress` prop of `OutcomeMorphOverlay` and `BeatTextOverlay`, in place of the tween-driven clock.

The bridge that connects the engine to the SVG morph (`overlayMorphTickRef`, see "The bridge actors" in [README.md](README.md)) would keep working unchanged, because it only ever forwards `v`.

## Starter skeleton

This is the shape to start from, not a literal drop-in. The real `TierAnimationSection` passes many more props, and these three pieces are the existing ones from that component, unchanged:

- `engineContext` is the memoized `BeatEngineContext` built in `TierAnimationSection` (it holds `mapRef`, `outcomeLocations`, `centroidLookup`, the demo setters, `getMode`, and the tick refs).
- `arbitersRef` is the stable `useRef` list of the five progress arbiters: `MapPaintArbiter`, `MapPopupArbiter`, `OverlayPopupArbiter`, `NarrationArbiter`, `OverlayMorphArbiter`.
- the bridge refs are `narrationTickRef` and `overlayMorphTickRef`, the two `useRef<((v: number) => void) | null>` slots each overlay writes its per-frame applier into.

The only change that matters is where `progress` comes from: today it is driven by tweens, and here it would be driven by scroll. The pattern to copy is `useLearnScrollama`, which wires `react-scrollama` step callbacks into the same shared map. The shape below keeps the `MotionValue` you already have and writes it from `onStepProgress`:

```tsx
"use client"
import { Scrollama, Step } from "react-scrollama"

function ScrollStoryboard() {
  const progress = useMotionValue(0) // same clock as today, written by scroll

  useBeatEngine({
    progress,
    actorGroups: ACTOR_GROUPS,
    context: engineContext,
    arbiters: arbitersRef.current,
    enabled: !isLoading,
  })

  // Map step index plus intra-step progress onto the global 0 to 1 axis.
  // Allocate height per beat so dense beats get more room (item 3).
  const onStepProgress = ({ data, progress: stepProgress }) => {
    progress.set(toStoryboardProgress(data, stepProgress))
  }

  return (
    <>
      {/* Sticky graphic: the pinned overlay stage over the persistent map. */}
      <StickyStage>
        <OutcomeMorphOverlay
          progress={progress}
          overlayMorphTickRef={overlayMorphTickRef}
          /* ...all other props, unchanged... */
        />
        <BeatTextOverlay progress={progress} /* ...other props... */ />
      </StickyStage>

      {/* Scroll runway: one Step per beat, each a tall spacer. */}
      <Scrollama onStepProgress={onStepProgress}>
        {BEAT_STEPS.map((step) => (
          <Step key={step.id} data={step}>
            <div style={{ height: "100vh" }} />
          </Step>
        ))}
      </Scrollama>
    </>
  )
}
```

## What not to touch

The premise of this migration is that the renderer does not change, only what drives it. Leave these alone:

- The SVG morph math in `OutcomeMorphOverlay.tsx` (the `latestMorphFrameRef` frame applier and the geometry helpers). It is already a function of `v`.
- The engine and arbiter dispatch loop in `engine/BeatEngine.ts`. Hand it a different `progress`, do not rewrite it.
- The bridges (`overlayMorphTickRef`, `narrationTickRef`). They only forward `v`.
- `BeatTextOverlay` rendering and the `useOutcomeLabelGeometry` label math.

The exceptions are what you mount these inside and which `progress` they receive, plus the arbiter side effects in item 4. The per-frame math itself stays.

## The files this migration touches

Everything you change lives in `TierAnimationSection.tsx` and its hooks. The renderer, the engine, and the arbiters stay as they are. The pieces you will actually edit:

- `TierAnimationSection.tsx` keeps the `useMotionValue(0)` clock but writes it from scroll instead of tweens, pins the stage as a sticky graphic with steps, and decides where the engine mode is set.
- `hooks/useStoryboardNavigation.ts` is the click transport. Most of it goes away under scroll (item 1).
- `hooks/useStoryboardCamera.ts` does the scroll-into-view detection and the one-time fly-home. Reconcile its trigger with the scroll section (item 4).
- `hooks/useScreenPolygonProjection.ts` is the panel-relative projection that positions the SVG morph squares. Verify it stays in sync inside a sticky container (item 7).
- `animationTiming.ts` holds the seconds-based fade widths you will re-author in progress units (item 2).

## Things to look out for

### 1. One MotionValue can have only one writer

`useStoryboardNavigation` owns `progress` today. It calls `animate(progress, target.progress)` and `progress.set(...)` from the `goTo` helper, the `handlePlay`, `handleNext`, `handleBack`, and `handleRestart` actions, the keyboard-shortcut effect, the reduced-motion auto-arrival, and the running tween it stores in `controlsRef`. Once `onStepProgress` writes `progress`, any leftover imperative write would fight the scroll position. That means the whole transport model (the Play gate, Next and Back, `beatIndex`, `playState`) has to be removed or rethought, not adapted. Scroll becomes the only control. Two follow-on questions to answer:

- What is the Play button now? Likely it goes away, or it becomes a "scroll to start" affordance.
- What does the beat counter read from? Derive the current beat by finding which `TIMING_BEATS` span contains the live progress.

### 2. Time-based authoring stops meaning anything

`TIMING_BEATS` in `animationTiming.ts` carries a `progress` checkpoint and a `duration` in seconds. `secondsToProgress()` converts clock fade widths (`PARAGRAPH_FADE_SEC`, `ITEM_FADE_SEC`, `ITEM_STAGGER_SEC`, `BLOCK_EXIT_SEC`) into progress widths using each beat's progress-per-second velocity. Under scroll the visitor owns velocity, so every fade authored in seconds will feel wrong. Plan a retuning pass that re-authors those fade widths directly in progress units (scroll distance), and treat `duration` as dead once scroll drives the animation.

### 3. Mapping scroll distance to beats

A linear scroll-to-progress map would make the dense beats race past. The SVG morph chain from progress 0.62 to 1.0 packs the bar, dot, radar, and heatmap stages into a small span for example (see the `LIST_BAR_*`, `RADAR_*`, and `HEATMAP_*` constants inside the SVG morph frame applier in `OutcomeMorphOverlay.tsx`), while earlier beats are sparse. Give each step enough height and map step progress into storyboard progress (the `toStoryboardProgress` helper in the skeleton) so heavy beats get more vertical room. Allocate scroll height by narrative density, not by the old seconds `duration`.

### 4. Audit every arbiter for bidirectional, any-speed safety

Several arbiters and drivers are imperative and assume forward playback with settle points. Scroll is bidirectional. Check each `onEnter`, `onUpdate`, and `onExit` to see if it would run forward then backward, repeatedly, at trackpad speed:

- `InteractiveLayerDirector` is the biggest one to think about. When the selected outcome moves to a different layer family (for example from the demand-units fill to a reservoir polygon layer), it fades the outgoing layer out right away, then waits for the map's `idle` event before fading the incoming layer in. It waits for `idle` because selecting an outcome almost always starts a camera flight, and gating on idle keeps the new layer from painting mid-flight. Scroll breaks that assumption: there may be no camera flight, the visitor can reverse mid-handoff, and a fast scrub can queue many selections before any `idle` fires. Decide how selection-driven layer swaps behave when scroll, not a click, is in control.

- `CameraArbiter.flyHome` runs animated camera flights and wires its continuation to the map's `moveend` event. A `moveend` callback here is just code passed to `map.once("moveend", ...)`, which Mapbox runs a single time when the camera finishes moving. `flyHome` uses it to run `onArrive` (collect polygons, prime the session, start the tween) after the flight settles, and if the camera is already home it skips the flight and runs that callback synchronously instead. The risk is that scrubbing back or scrubbing fast can dispatch a flight and then interrupt it, so `moveend` never fires and the continuation is stranded. One thing makes this easier: the playback beats themselves never move the camera. It sits at the home view for the whole sequence after `useStoryboardCamera` eases it there once on arrival. So the simplest reverse-safe approach is to ease to home once when the section is entered and then leave the camera alone while the visitor scrubs, which turns the remaining per-outcome flights into an end-state concern (see item 5). If a future beat does need to move the camera mid-scroll, the cleanest scrub-safe pattern is to drive it the way the morph is driven: define camera keyframes at progress breakpoints and set the camera from `v` each frame, instead of `easeTo` with a `moveend` callback. Setting the camera per frame carries no in-flight state, so reverse and fast scrubbing simply retrace the same path, whereas an `easeTo` or `flyTo` leaves an asynchronous `moveend` continuation that is exactly what gets stranded. 

Two things about our map package are worth knowing before you reach for a per-frame `map.jumpTo(...)`. First, the camera is a good fit for this in principle, because the shared app map (`MapInstance.tsx`, a single persistent `react-map-gl` instance) is uncontrolled, i.e. it takes an `initialViewState` only and is already driven imperatively through `mapRef.getMap()`, so there is no React `viewState` for per-frame writes to fight. It also sets `scrollZoom={false}`, so wheel scroll never moves the map out from under you. Second, there are two real costs. The map stays interactive (`dragPan`, `touchZoom`, `doubleClickZoom`, plus the navigation and geolocate controls), so a per-frame `jumpTo` will fight any user gesture, which means you should lock camera interaction for the pinned section if scroll is going to own the camera. And every `jumpTo` fires the map `move` event, which `useScreenPolygonProjection` listens on to reproject the SVG morph squares, so a camera that moves every frame also reprojects the overlay every frame. Given all that, prefer the first approach above (ease to home once on entry, then leave the camera fixed for the rest of the scroll) unless a beat genuinely needs camera motion.

- `useStoryboardCamera` flies the camera home the first time the panel scrolls into view (an `IntersectionObserver`, then a one-time `easeTo`), and on `moveend` it primes the map session and runs the projection hook's first collect, `computePolygonDataRef.current()`, which queries Mapbox for each outcome's on-screen geometry (the `collectOutcomeShapes` step in `useScreenPolygonProjection`). While the overlay stage is pinned as the sticky graphic, the panel stays in view for the whole scroll, so make sure this collect still fires once on arrival and is neither re-triggered nor left stranded as the visitor scrubs.

- `MapPaintArbiter` is the progress-driven playback painter, and it is already written largely as a function of `v`. Each actor owns a progress window, meaning the `[start, end]` span of `v` over which it is active (for example the blue cycle might own roughly `0.1` to `0.2`). The engine fires `onEnter` when `v` crosses into that span, `onUpdate` each frame inside it, and `onExit` when `v` leaves it. On enter, the arbiter re-asserts the full layer state through `writeDemandUnitsBaseline` (filter, fill expression, opacities), with explicit handling so that scrubbing back from a later beat self-heals instead of inheriting stale paint, and the per-frame updates recompute opacity and color from `v`. The two parts to check under continuous scrubbing are its small bits of internal state: `frozenColorPhase` (written each frame by the blue cycle and read by the blue hold) and `loiGoldRingOn` (a one-shot on or off guard managed across enter, exit, and teardown). Both assume you pass through the normal enter sequence, so confirm they still settle correctly when a fast scrub jumps `v` past a window without ever landing a frame inside it, which can skip the `onEnter` that would have set that state.

- `PolygonLayerDriver` and `InteractivePaintArbiter` are not progress-driven, so they are not per-frame scrub writers. They paint from the current selection in interactive mode, driven by `InteractiveLayerDirector`, with timed crossfades and camera-idle gating. Camera-idle gating is the mechanism from the `InteractiveLayerDirector` bullet above: the incoming layer's fade-in is held until the map fires its `idle` event, which Mapbox emits once the camera has stopped moving and rendering has settled, so the new layer does not paint mid-flight. They only run in the end interactive state, so handle them through the selection handoff bullet above and the end-state in item 5, not as functions of `v`.

- The `playState` handoff in `settleToFinishedState` (in `useStoryboardNavigation.ts`) is a one-way settle with no inverse. It flips `playState` to `finished`, switches the engine to `interactive` mode, clears the outcome visualization and location highlights, and hides the animation polygon and line layers by forcing their opacity to 0. Nothing reverses it today because the storyboard never scrubs back out of the end-state. Under scroll the visitor can scroll back up from `v = 1`, so you need either an inverse path that returns to playback mode and repaints, or a rule that only commits this settle once progress holds at the bottom of the section.

- The two end-state transitions inside `OutcomeMorphOverlay.tsx` (the encoding-mode crossfade and the tier-change recolor) early-return when `progress.get() < 1` and assume a settled state, so verify they do not fight a visitor scrubbing near `v = 1`.

- The popup arbiters (`MapPopupArbiter`, `OverlayPopupArbiter`) are mostly symmetric already, so they should survive scrubbing with little change. `MapPopupArbiter` rebuilds its popup set every frame from the actors currently in window (enter adds, update rebuilds, exit removes) and commits to the store, so reversing direction clears popups on exit just as forward play added them. `OverlayPopupArbiter` sets the gold-ring and hover-popup state on enter and clears it on exit, with a teardown that clears whatever it wrote. The thing to confirm for `OverlayPopupArbiter` is that it only acts on enter and exit, with no per-frame update, so it relies on a clean `onExit` firing when a reverse scrub crosses back out of its window, and its enter silently does nothing if `buildInfo` returns null because centroid or tier data has not loaded yet, with no per-frame retry like `MapPopupArbiter` has.

The SVG path elements get written by two code paths: the per-frame progress applier (`latestMorphFrameRef.current` in `OutcomeMorphOverlay.tsx`) and the imperative RAF transitions (the encoding-mode crossfade and the hydroclimate tier-change), coordinated by checking whether refs are null (`encodingRafRef`, `tierChangeRafRef`). That coordination is safe under today's settle-then-interact lifecycle, but scroll makes the two regimes overlap. The visitor can scroll back up into the SVG morph after reaching the settled end-state, so an encoding or tier-change RAF can still be writing the paths at the moment the progress applier starts writing them again.

### 5. Decide the interactive end-state

Today the storyboard settles at `progress = 1` and flips into interactive mode (clickable squares, hover, heatmap cell clicks). Under scroll, `v = 1` is just the bottom of the section. Keep the visualization pinned and define a deliberate rule for when interactivity turns on, most likely a short hold band near `v = 1` while still pinned, or a handoff once the stage unpins into a normal interactive panel. Do not let interactivity flicker on and off as the visitor scrubs across the threshold.

The mode flip itself is one call, `engineApiRef.current.setMode(...)`. Today `useStoryboardNavigation` sets `playback` on Play and on every `goTo`, `interactive` in `settleToFinishedState`, and `idle` on Restart. Under scroll you make those same calls from progress thresholds instead, for example `playback` while the visitor is scrubbing and `interactive` once progress holds in the band near 1.

### 6. Reduced motion

Today the navigation handles `prefers-reduced-motion` by snapping `goTo` to a 0-second set and jumping the auto-arrival to the settled end-state (see "Reduced motion and accessibility" in [README.md](README.md)). Scroll has no automatic final-state render, so decide explicitly to either render the settled end-state and let the visitor scroll past a short section, or snap between beat checkpoints instead of continuously morphing.

### 7. Keep the SVG morph squares aligned inside the sticky container

The SVG morph squares are not drawn in map coordinates. `useScreenPolygonProjection` projects each outcome's geometry from Mapbox into panel-relative screen space, and `OutcomeMorphOverlay` draws into that space. The hook keeps the projection current with two refs, `computePolygonDataRef` to re-collect everything from Mapbox and `applyPanelOffsetRef` to cheaply re-apply the panel offset and catch scroll drift, plus a `reprojectOnMove` flag that is on only during active playback and before the SVG morph settles. A pinned sticky graphic shifts the panel relative to the viewport throughout the scroll, so confirm the offset stays correct while pinned and across the pin and unpin transitions, and decide what drives `reprojectOnMove` now that scrubbing is continuous rather than a one-time play. If the squares drift off their map features as you scroll, this is the first place to look.

## Possible approach

1. Build the shell first. The Mapbox map is the shared, persistent app map (`useMap()` from `@repo/map`), so you do not pin it. Pin the overlay stage only (the `panelRef` Box with `OutcomeMorphOverlay` and `BeatTextOverlay`) as the sticky graphic, lay out one step per beat behind it, leave the persistent map driven by ref as today, and write `progress` from `onStepProgress` into `OutcomeMorphOverlay` and `useBeatEngine`.
2. Remove `useStoryboardNavigation` and the `playState` and `beatIndex` machinery. Replace the beat indicator with a scroll-derived read from the live progress. Done when: there is no Play, Next, or Back, and the beat indicator updates from scroll position alone.
3. Tune the per-step scroll allocation and the step-progress to storyboard-progress remap. Done when: every beat gets enough scroll distance to read, with none racing past or dragging.
4. Re-author the `animationTiming.ts` fade windows from seconds into progress units. Done when: reveals look right at a normal scroll speed and nothing is still keyed to seconds.
5. Work arbiter by arbiter to make the side effects scrub-safe, starting with the camera, since it is the worst offender, and coordinating with the map layer loading branch. Done when: scrubbing fast in both directions and reversing mid-beat leaves no stuck camera, layer, or popup.
6. Re-add reduced motion and the interactive handoff.

## Library reference

The flow would use `react-scrollama`. The working example in this codebase is `useLearnScrollama` (`app/features/map/hooks/useLearnScrollama.ts`), which wires the step callbacks into the same persistent map, and `useScrollamaSection` in the storyline apps. The pieces you could reach for:

- `Scrollama` and `Step` for the scroll runway, one `Step` per beat
- `onStepEnter` and `onStepExit` for the discrete section, camera, and layer changes
- `onStepProgress` for the continuous 0 to 1 value, written into the `progress` `MotionValue`
- a step-progress to storyboard-progress helper for the non-linear remap (allocating more scroll to dense beats)
- a scan of `TIMING_BEATS` for reading the current beat from the live progress
