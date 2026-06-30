# Beat timeline

The storyboard runs on one `progress` value from 0 to 1. There are eight beats, indexed 0 through 7. Each beat is a checkpoint where `progress` comes to rest after you click Play, Next, or Back. The numbers here come from `TIMING_BEATS` in [animationTiming.ts](animationTiming.ts), the actors come from `ACTOR_GROUPS` in [engine/actorGroups.ts](engine/actorGroups.ts), and the morph stages come from the threshold constants in [OutcomeMorphOverlay.tsx](OutcomeMorphOverlay.tsx).

## How to use this while watching the animation

Click Play to start, then step through the storyboard with Next and Back. In development the browser console prints one `[storyboard]` line per event, each value labeled and aligned: `progress=  event=  actor=  window=  beat=  play=`.

A note on windows. A beat is a span of `progress`, but an actor's `window` does not have to match the beat it is filed under. Several windows spill across a boundary on purpose, so an actor listed under one beat can still be painting a little into the next. The spans below are the beat spans. The actor windows are given per actor.

## At a glance

| Beat | Id                    | Span (progress) | Duration | View header       | What you see                                                                       |
| ---- | --------------------- | --------------- | -------- | ----------------- | ---------------------------------------------------------------------------------- |
| 0    | `legend`              | 0.000 to 0.225  | 12s      | none              | Intro paragraphs fade in, tier legend appears, demand-unit polygons cycle and hold |
| 1    | `collapse-and-colors` | 0.225 to 0.365  | 9s       | none              | Intro collapses, legend floats up, dots cross-fade from blue to tier colors        |
| 2    | `ag-rev-morph`        | 0.365 to 0.400  | 5s       | none              | Agriculture revenue polygons morph into distribution squares                       |
| 3    | `all-other-morphs`    | 0.400 to 0.500  | 14s      | none              | The remaining eight outcomes morph into distribution squares back to back          |
| 4    | `loi-highlight`       | 0.500 to 0.620  | 9s       | Distribution view | One location of interest is highlighted in five steps                              |
| 5    | `list-bar`            | 0.620 to 0.720  | 5s       | List view         | Distribution grids morph into per-outcome bar glyphs                               |
| 6    | `radar`               | 0.720 to 0.870  | 7s       | Radar chart       | Bars collapse into dots that glide to polar vertices, then radar chrome fades in   |
| 7    | `heatmap`             | 0.870 to 1.000  | 5s       | Heat map          | Dots migrate into a stacked column of tier-colored cells, then chrome fades in     |

The view header is the overline label in the right panel, set in `VIEW_MODE_HEADER_BY_BEAT` in [BeatTextOverlay.tsx](BeatTextOverlay.tsx). Beats 0 through 3 have no header.

Two always-on bridge actors run across the whole `[0, 1]` span and are not repeated per beat below. `legend:narration:tick` drives the left-column narration through `NarrationArbiter`, and `legend:overlayMorph:tick` drives the SVG morph through `OverlayMorphArbiter`. They are filed under beat 0 only because they need a home. See "The bridge actors" in [README.md](README.md).

## Beat 0: legend (0.000 to 0.225)

What you see: The intro paragraphs fade in and the tier legend is revealed. The demand-unit polygons cycle through a blue palette, mimicking the idea of water flowing throughout the valley.

Actors: `mapPaint` through `MapPaintArbiter`.

| Actor id                | Window         | Effect                                            |
| ----------------------- | -------------- | ------------------------------------------------- |
| `legend:mapPaint:reset` | [0.000, 0.010] | Assert the full demand-units baseline             |
| `legend:mapPaint:cycle` | [0.010, 0.090] | Blue color-cycle and fade-in (`blue-cycle`)       |
| `legend:mapPaint:hold`  | [0.090, 0.260] | Hold the blue palette with a breath (`blue-hold`) |

Morph stage: The SVG squares are not visible yet. The morph bridge is running but no outcome has entered its morph window.

## Beat 1: collapse-and-colors (0.225 to 0.365)

What you see: The intro text collapses, the legend floats to the top, and the demand-unit layer cross-fades from the blue palette into the agriculture tier colors while the narration explains the colors.

Actors: `mapPaint` through `MapPaintArbiter`.

| Actor id                             | Window         | Effect                                                  |
| ------------------------------------ | -------------- | ------------------------------------------------------- |
| `collapse-and-colors:mapPaint:blend` | [0.260, 0.280] | Two-stage blue to tier-color blend (`tier-color-blend`) |
| `collapse-and-colors:mapPaint:tail`  | [0.280, 0.380] | Hold the tier colors (`tier-color-hold`)                |

The blend starts at 0.260, a little after the beat begins. The tail runs to 0.380, a little into beat 2. Both are intentional.

Morph stage: Still no SVG squares.

## Beat 2: ag-rev-morph (0.365 to 0.400)

What you see: The agriculture revenue polygons morph into distribution squares, with a before-and-after caption. This is the first outcome to morph.

Actors: `mapPaint` through `MapPaintArbiter`.

| Actor id                             | Window         | Effect                                                                   |
| ------------------------------------ | -------------- | ------------------------------------------------------------------------ |
| `ag-rev-morph:mapPaint:hideSchedule` | [0.380, 0.500] | Fade outcome polygons off the map on the per-outcome schedule            |
| `ag-rev-morph:mapPaint:lineFades`    | [0.380, 1.000] | Hide the line layers and keep them hidden for the rest of the storyboard |

Morph stage: The SVG morph squares begin appearing here. Each outcome has its own morph window built in [hooks/useStoryboardLayout.ts](hooks/useStoryboardLayout.ts) and applied per frame in [OutcomeMorphOverlay.tsx](OutcomeMorphOverlay.tsx) through the overlay-morph bridge.

## Beat 3: all-other-morphs (0.400 to 0.500)

What you see. The remaining eight outcomes morph into distribution squares back to back.

Actors: None. This beat has an empty actor array. Its visuals come entirely from the per-outcome morph windows in `OutcomeMorphOverlay`, driven by the always-on overlay-morph bridge.

Morph stage: The bulk of the per-outcome square morphs play out across this span.

## Beat 4: loi-highlight (0.500 to 0.620)

What you see: A single location of interest is highlighted in five steps: the layer fades in, a gold ring appears on the distribution square, a popup appears near the square, a gold stroke appears on the map polygon, and a popup appears near the polygon. The right-panel header reads "Distribution view".

Actors:

| Actor id                           | Kind           | Window          | Arbiter               | Effect                                      |
| ---------------------------------- | -------------- | --------------- | --------------------- | ------------------------------------------- |
| `loi-highlight:mapPaint:enter`     | `mapPaint`     | [0.500, 0.630]  | `MapPaintArbiter`     | One-shot filter swap at entry               |
| `loi-highlight:mapPaint:layerFade` | `mapPaint`     | [0.500, 0.630]  | `MapPaintArbiter`     | Opacity ramp for the AG layer               |
| `loi-highlight:overlayPopup:ring`  | `overlayPopup` | [0.540, 0.620]  | `OverlayPopupArbiter` | Gold ring on the square (step 2)            |
| `loi-highlight:overlayPopup:hover` | `overlayPopup` | [0.550, 0.620]  | `OverlayPopupArbiter` | Square-side popup (step 3)                  |
| `loi-highlight:mapPaint:polyRing`  | `mapPaint`     | [0.560, 0.620]  | `MapPaintArbiter`     | Gold stroke on the polygon (step 4)         |
| `loi-highlight:mapPopup:loi`       | `mapPopup`     | [0.565, 0.630]  | `MapPopupArbiter`     | `LocationHighlight` on the polygon (step 5) |
| `loi-highlight:mapPaint:exit`      | `mapPaint`     | [0.6295, 0.630] | `MapPaintArbiter`     | Clear the gold ring on the last frame       |

Morph stage: The squares sit at rest. The five highlight steps play on top of them.

## Beat 5: list-bar (0.620 to 0.720)

What you see: The distribution grids morph into per-outcome bar glyphs, the list view. The right-panel header reads "List view".

Actors, `mapPaint` through `MapPaintArbiter`.

| Actor id                    | Window         | Effect                                                                |
| --------------------------- | -------------- | --------------------------------------------------------------------- |
| `list-bar:mapPaint:restore` | [0.630, 1.000] | Take the demand-unit layers back from loi-highlight and pin them at 0 |

Morph stage: The bars blend in. See `LIST_BAR_START` (0.62), `LIST_BAR_BARS_END` (0.68), and `LIST_BAR_END` (0.72) in `OutcomeMorphOverlay`. The captions fade out as this beat ends, keyed off `RADAR_CAPTION_OUT` (0.72) in [useOutcomeLabelGeometry.ts](useOutcomeLabelGeometry.ts).

## Beat 6: radar (0.720 to 0.870)

What you see: The bars collapse into dots that glide out to polar vertices, then the radar chrome fades in. The right-panel header reads "Radar chart".

Actors: None. This beat has an empty actor array. Its visuals come from the morph stage below.

Morph stage, in `OutcomeMorphOverlay`: The average blend runs from `LIST_BAR_END` (0.72) to `RADAR_AVG_END` (0.75), the radar shape blend runs to `RADAR_SHAPE_END` (0.82), and the radar chrome fades in to `RADAR_CHROME_END` (0.87).

## Beat 7: heatmap (0.870 to 1.000)

What you see: The dots migrate into a stacked column of tier-colored cells, then the heatmap chrome fades in and the extra columns reveal one by one. The right-panel header reads "Heat map".

Actors: None. This beat has an empty actor array. Its visuals come from the morph stage below.

Morph stage, in `OutcomeMorphOverlay`: The radar chrome fades out to `HEATMAP_CHROME_OUT_END` (0.90), the cells blend in to `HEATMAP_CELL_END` (0.95), the primary column chrome settles to `HEATMAP_COL0_END` (0.97), and the extra columns fade in across `HEATMAP_COL1_END` (0.985) and `HEATMAP_COL2_END` (1.00).
