---
name: get started animation spec
overview: Reference spec for the "Visualizing key outcomes" storyboard (`TierAnimationSection`). Section 1 is viewer-facing; Section 2 is an engineering inventory of the actors each beat drives; Section 3 is a cross-cutting "who writes what" table for the shared state every beat touches; Section 4 lists the structural fragility points the inventory makes visible. No refactor plan in this document — that comes next, keyed off this spec.
---

# Visualizing key outcomes — animation spec

This is a ground-truth reference for the eight-beat storyboard rendered by [TierAnimationSection.tsx](apps/main/app/features/scenarioExplorer/getStarted/TierAnimationSection.tsx). The canonical beat list lives in [animationTiming.ts](apps/main/app/features/scenarioExplorer/getStarted/animationTiming.ts); every beat listed below is one entry in `BEATS`. Progress values are on the compressed `[0, 1]` timeline (`progress` MotionValue); wall-clock durations are the beat's `duration` (seconds) and are what tuning should be expressed in.

## Shared primitives

- `progress`: `MotionValue<number>` on `[0, 1]`, owned by [TierAnimationSection.tsx](apps/main/app/features/scenarioExplorer/getStarted/TierAnimationSection.tsx) at line 349. Every visual actor below is a pure function of `progress`.
- `BEATS`: readonly array in [animationTiming.ts](apps/main/app/features/scenarioExplorer/getStarted/animationTiming.ts) lines 38-131. Each `BeatDef` has `{ id, progress, duration }`; `progress` is the value at the end of the beat, `duration` is forward tween time in seconds.
- Fade primitives: `PARAGRAPH_FADE_SEC` (1.1s), `ITEM_FADE_SEC` (0.55s), `ITEM_STAGGER_SEC` (1.3s), `BLOCK_EXIT_SEC` (0.45s) in [animationTiming.ts](apps/main/app/features/scenarioExplorer/getStarted/animationTiming.ts) lines 152-155. `secondsToProgress(beatIndex, seconds)` converts so wall-clock feel stays consistent across beats with different progress-per-second rates.
- `progress` subscribers (6 total): `BeatTextOverlay` at [BeatTextOverlay.tsx](apps/main/app/features/scenarioExplorer/getStarted/BeatTextOverlay.tsx) lines 392 and 422, `TierAnimationSection` at lines 1827, 2486, and 2610 of [TierAnimationSection.tsx](apps/main/app/features/scenarioExplorer/getStarted/TierAnimationSection.tsx), and `OutcomeMorphOverlay` at line 1207 of [OutcomeMorphOverlay.tsx](apps/main/app/features/scenarioExplorer/getStarted/OutcomeMorphOverlay.tsx).
- Beat entry is a `Play` click (triggers `playArrival` at [TierAnimationSection.tsx](apps/main/app/features/scenarioExplorer/getStarted/TierAnimationSection.tsx) line 536). Beat-to-beat navigation uses `handleNext`, `handleBack`, `handleRestart` at [TierAnimationSection.tsx](apps/main/app/features/scenarioExplorer/getStarted/TierAnimationSection.tsx) lines 520, 578, 656.

---

## Section 1 — Viewer storyboard (beat by beat)

### Pre-play (idle, `progress == 0`)

On arrival the user sees the page title "Visualizing key outcomes" and a subtitle "How are scenario results measured?", plus an inline Play button beside the title. The map behind the panel shows the satellite basemap with no demand-unit polygons visible. No beat text, no tier legend, no distribution squares. On `prefers-reduced-motion`, the view jumps straight to the fully settled Beat 8 end-state; see [TierAnimationSection.tsx](apps/main/app/features/scenarioExplorer/getStarted/TierAnimationSection.tsx) lines 755-764.

### B0 — legend — progress `[0, 0.225]`, duration 12s

Narration (verbatim, from [BeatTextOverlay.tsx](apps/main/app/features/scenarioExplorer/getStarted/BeatTextOverlay.tsx) lines 956-964 and 988-1006):

- "Different scenarios change how water is allocated among different users and the environment."
- "To compare results on a common scale, we group key outcomes into levels:"
- The tier legend rows: "Optimal — Water supplies support strong, desired system performance.", "Acceptable — Water supply shortages occur, but impacts remain manageable.", "At risk — Water supply shortages lead to significant impacts.", "Critical — Severe water supply shortages threaten long-term viability."

What the viewer sees:

- The left-column body block fades in over progress `[0.01, 0.01 + PARAGRAPH_FADE_SEC]` (~1.1s). Intro paragraph lands first; "To compare results..." follows at progress 0.10.
- On the map, the Central Valley `demand-units` polygons fade in from 0 to 0.65 opacity while cycling through three shades of blue (cycle period `BEAT1_CYCLE = 90` polygon-id steps). The cycle runs until progress `FREEZE_AT = 0.09`, then freezes so all three blues sit still.
- The basemap darkens via `basemap-dim-overlay` ramping from 0 to `BASEMAP_DIM_OPACITY` over `[0, ~0.03]` (~1.5s of the beat's 12s).
- Tier legend rows stagger in starting at progress `0.13`, one every `ITEM_STAGGER_SEC` (~1.3s), each row fading in over `ITEM_FADE_SEC` (~0.55s). The four rows complete around progress 0.17.
- The rest of the beat (progress 0.17 → 0.225) is a reading pause: legend visible, blue polygons frozen, bottom nav hidden.

Entry: pre-play view. Exit: intro paragraphs + tier legend fully visible on the left; frozen three-blue `demand-units` layer on the map; bottom Back / N-of-T / Next row fades in at settle (gated on `playState === "paused"`).

### B1 — collapse-and-colors — progress `[0.225, 0.365]`, duration 9s

Narration (from [BeatTextOverlay.tsx](apps/main/app/features/scenarioExplorer/getStarted/BeatTextOverlay.tsx) lines 1102-1124):

- "For example, each colored location on the map represents an agricultural water district in the Central Valley receiving surface water deliveries."
- "The colors correspond to different water delivery outcome levels that affect **agricultural revenue**, ranging from optimal levels (blue) to critical levels (red)."

What the viewer sees:

- Sub-step 1 (~0.23 → 0.245, ~1.3s): intro paragraphs and the "How are scenario results measured?" subtitle cross-fade out and collapse their vertical space via `grid-template-rows: 1fr → 0fr`. The tier legend slides up into the vacated space via document flow so it sits directly under the page title.
- Sub-step 2 (0.245 → 0.26, ~1s): the `demand-units` Mapbox layer cross-fades out (frozen blues → opacity 0). At progress 0.26, while the layer is invisible, the filter swaps to Agriculture-only and the fill-color expression flips from the three-blue cycle to the per-DU AG_REV tier-color expression.
- Sub-step 3 (0.26 → 0.28, ~1.3s): the `demand-units` layer fades back in (opacity 0 → 0.65) already wearing its AG_REV tier colors. Visually the viewer sees the water dissolve, then colored agricultural districts paint in together.
- Sub-step 4 (0.245 → 0.325, ~7s): Beat 1C narration plays concurrently with the map cross-fade. The "example" paragraph fades in over `[0.245, 0.245 + PARAGRAPH_FADE_SEC]`, landing by 0.26; the "delivery" paragraph fades in over `[0.325, 0.325 + PARAGRAPH_FADE_SEC]`, landing by 0.34.
- Sub-step 5 (0.345 → 0.38, ~2.3s): five example location popups fade in, staggered, each anchored at a curated AG district (Glenn Colusa, Turlock, Westlands East, Madera, Modesto). All popups are `pinned: true` with keys `beat1c:AG_REV:<DU_ID>`. They sit on the map in their final positions until Beat 2's `clearAll` at progress 0.38.
- Final reading pause (~0.38 → 0.365): both Beat 1C paragraphs sit visible with all five map popups while the AG demand units hold steady on the agriculture filter and tier colors.

Entry: frozen three-blue demand units; legend + intro paragraphs visible on the left. Exit: tier-colored Agriculture-only demand units on the map; both Beat 1C paragraphs and five popups visible; intro paragraphs + subtitle collapsed.

### B2 — ag-rev-morph — progress `[0.365, 0.4]`, duration 10s

Narration (from [BeatTextOverlay.tsx](apps/main/app/features/scenarioExplorer/getStarted/BeatTextOverlay.tsx) lines 1136-1157):

- "Each location can be symbolized as a square colored with the outcome level."
- "These can be gathered together in a distribution view."
- (after the morph) "The distribution shows how agricultural revenue plays out in this scenario across the Central Valley agricultural districts in CalSim at a glance."

What the viewer sees:

- Text swap in the left slot (0.365 → 0.3725, ~2s): the two Beat 1C paragraphs fade out and collapse; the "before" paragraph ("Each location can be symbolized...") fades into the freed slot.
- Five Beat 1C popups clear at progress 0.38 (synchronously with the AG_REV morph trigger).
- Right-panel backdrop (0.3775 → 0.3875): a translucent white backdrop (0.75 alpha) fades in behind the right-third column so the upcoming distribution squares have a reading surface.
- AG_REV outcome title and caption fade in on the right panel, synced to the morph start (`TITLE_LEAD = 0.004` before morph, `TITLE_FADE = 0.009`; caption ends at `morphEnd + (CAPTION_FADE - CAPTION_LEAD)`).
- AG_REV morph (0.38 → 0.39, ~2.9s): every AG_REV polygon on the map (Agriculture demand units) interpolates from its real-world shape (in screen space) toward its landing square in the right-column distribution grid. During the morph, the underlying Mapbox `demand-units` paint is driven by a per-DU fade schedule (`duEntries` in the main choreography effect at [TierAnimationSection.tsx](apps/main/app/features/scenarioExplorer/getStarted/TierAnimationSection.tsx) lines 2189-2242) so each AG polygon's fill-opacity drops from 0.65 → 0 over its personal `[fadeStart, morphStart]` window just as the SVG square arrives on the right panel.
- Text swap again (0.39 → 0.3975, ~2.1s): "before" paragraph fades out / collapses; "after" paragraph ("The distribution shows...") fades in.
- Reading pause (0.3975 → 0.40): AG_REV's distribution squares sit on the right panel with title + caption + "after" paragraph all visible.

Entry: AG tier-colored demand units on the map, two Beat 1C paragraphs and five popups on the left. Exit: AG_REV's distribution grid of squares on the right panel; AG Mapbox polygons hidden; "after" paragraph in the left slot below the tier legend; eyebrows ("Consumptive uses / Non-consumptive uses") fading in above the two outcome columns.

### B3 — all-other-morphs — progress `[0.4, 0.5]`, duration 14s

Narration (from [BeatTextOverlay.tsx](apps/main/app/features/scenarioExplorer/getStarted/BeatTextOverlay.tsx) lines 1169-1171):

- "For each scenario, outcome levels are calculated for all key outcomes across locations."

What the viewer sees:

- Text swap (0.4 → 0.42, ~2.8s): "after" paragraph fades out; "For each scenario..." paragraph fades into the same slot and holds.
- Eyebrow labels finish fading in above the two-column outcome grid by progress ~0.39 (authored in Beat 2 but completes here).
- Remaining 8 outcomes morph in sequence (0.42 → 0.50, ~11s total, each 0.01-wide slice ≈ 1.4s). Order is whatever `activeOutcomeGroups` provides in layout order. Each outcome's title fades in just before its morph slice begins, caption fades in over the last ~6/1000 of the slice, and the outcome's map layer (e.g. `calsim-wba`, `california-reservoir`, `delta-detaw`, the `sacramento-river-body` line) fades out over the slice if it was visible. Station / reservoir outcomes have no on-map polygons to fade; their polygons are drawn in the SVG overlay straight into the squares.
- End of beat (0.50): all nine outcome distribution grids are laid out on the right-column. The left column shows the page title + tier legend + "For each scenario..." paragraph; the map shows only the satellite basemap (all anim polygon/line layers hidden).

Entry: AG_REV distribution grid only. Exit: all 9 outcome distribution grids settled on the right panel; map empty of anim polygons; bottom nav visible.

### B4 — loi-highlight — progress `[0.5, 0.62]`, duration 9s

Narration (from [BeatTextOverlay.tsx](apps/main/app/features/scenarioExplorer/getStarted/BeatTextOverlay.tsx) lines 1184-1202):

- S1: "Outcomes can be displayed in different ways. The **distribution view** displays outcomes at individual locations of interest."
- S2: "Locations of interest can be selected on the map or from the chart."

What the viewer sees:

- Text handoff (0.50 → 0.56, ~4.5s): "For each scenario..." fades out + collapses; S1 fades in (0.51 → 0.53); a "Distribution view" header fades in above the outcome grid on the right panel (same window as S1), replacing the eyebrows which fade out 0.50 → 0.51.
- S2 paragraph fades in (0.545 → 0.560) just before the LOI choreography kicks in.
- Five-step LOI demo, all on a single AG_REV LOI (Glenn Colusa I.D., `BEAT5_LOI_ID = "08N_SA2"`). See [TierAnimationSection.tsx](apps/main/app/features/scenarioExplorer/getStarted/TierAnimationSection.tsx) lines 216-244 for the thresholds.
  - Step 1 (0.555 → 0.575, ~1.5s): AG demand-units map layer fades back in from 0 → 0.65 opacity, Agriculture-only filter, AG_REV tier colors.
  - Step 2 (0.580, onset; holds through settle): gold ring appears on the Glenn Colusa distribution square in the right panel (driven by `demoLocation` → `OutcomeMorphOverlay.demoHighlightedLocationKey`).
  - Step 3 (0.590, onset; holds through settle): name + tier popup fades in next to the square in the overlay (driven by `demoHoveredLocation` → `OutcomeMorphOverlay.hoveredLocation`, which the overlay renders as a `foreignObject` hover tooltip).
  - Step 4 (0.600, onset; holds through settle): gold stroke appears on the Glenn Colusa polygon on the map (driven by a `case` expression on `demand-units-outline` `line-color` / `line-width`, written by the main choreography effect).
  - Step 5 (0.605, onset; holds through tail end at 0.63): map popup fades in anchored to the Glenn Colusa polygon (driven by a `pinned: true` `LocationHighlight` written to the store by the Beat 5 driver).
- Settle (0.62 → 0.63): demand-units layer fades back out from 0.65 → 0 over a ~0.75s tail. All demo highlights / overlay popup / map popup / gold stroke tear down at progress 0.63.

Entry: nine distribution grids on the right panel; empty map. Exit: distribution grids still present; "Distribution view" header visible; Agriculture demand units cleared off the map again; ready for Beat 5's list view transformation.

### B5 — list-bar — progress `[0.62, 0.72]`, duration 5s

Narration (from [BeatTextOverlay.tsx](apps/main/app/features/scenarioExplorer/getStarted/BeatTextOverlay.tsx) lines 1215-1218):

- "The **list view** summarizes key outcomes as bar charts."

What the viewer sees:

- Text + header swap: Beat 4's S1+S2 fade out (0.62 → 0.63), "Distribution view" header fades out on the same window, "List view" header fades in (0.63 → 0.65), and "The list view..." paragraph fades in into the slot below the tier legend.
- Morph (0.62 → 0.72, 5s): all nine distribution grids morph in parallel — each shape interpolates from its settled `squareTarget` toward its `barTarget`, driven by `barBlend` inside `OutcomeMorphOverlay`'s listener. Non-representative squares fade out; representative shapes (one per tier per outcome) take on the bar dimensions. Bar-track chrome fades in over each outcome (same window as `barBlend`).
- At settle (0.72): each outcome on the right panel reads as a small four-row bar chart (tier 1-4, widths proportional to the outcome's distribution).

Entry: nine distribution grids. Exit: nine bar-chart glyphs, one per outcome.

### B6 — radar — progress `[0.72, 0.87]`, duration 7s

Narration (from [BeatTextOverlay.tsx](apps/main/app/features/scenarioExplorer/getStarted/BeatTextOverlay.tsx) lines 1230-1234):

- "The **radar chart** displays the average values of key outcomes on a circular plot and is useful for scenario comparison."

What the viewer sees:

- Text + header swap: "List view" header + paragraph fade out (0.72 → 0.73), "Radar chart" header + paragraph fade in (0.73 → 0.75).
- Collapse-to-dot (0.72 → 0.75, ~1s): bars collapse into single dots at each outcome's grid center (`avgBlend`).
- Migrate-to-vertices (0.75 → 0.82, ~3.3s): dots glide from their grid columns to their polar-vertex positions on a shared radar canvas (`radarBlend`). Shapes also re-color from their per-tier color toward their outcome's averageColor as they move.
- Chrome fade-in (0.82 → 0.87, ~2.3s): concentric tier rings, radial axes, and the connecting polygon through the per-outcome vertices fade in (`radarChromeBlend`).

Entry: nine bar-chart glyphs. Exit: radar polygon with nine vertices, tier rings, axis spokes.

### B7 — heatmap — progress `[0.87, 1.0]`, duration 5s

Narration (from [BeatTextOverlay.tsx](apps/main/app/features/scenarioExplorer/getStarted/BeatTextOverlay.tsx) lines 1247-1249):

- "The **heat map** displays how key outcomes change under different hydroclimate futures."

What the viewer sees:

- Text + header swap: "Radar chart" header + paragraph fade out (0.87 → 0.88, ~0.4s), "Heat map" header + paragraph fade in (0.88 → 0.9, ~0.8s).
- Radar chrome fades out on the same 0.87 → 0.90 window (`radarChromeBlend` falls via its `radarChromeOut` factor).
- Cell migration (0.87 → 0.95, ~3.1s): representative dots at the polar vertices migrate into a single stacked column of tier-colored cells (`heatmapBlend`).
- Heatmap chrome fade-in (0.95 → 1.0, ~1.9s): outcome labels appear alongside each cell and a column header labels the single hydroclimate column (`heatmapChromeBlend`).

Entry: radar polygon. Exit: single-column heatmap with outcome-labeled cells; at progress 1.0 the storyboard settles into the "finished" state — `settleToFinishedState` fires, clearing outcome visualization + location highlights and hiding all anim polygon/line layers; `playState` flips to `"finished"` which lights up the interactive UI.

### Post-settle interactive state (`progress == 1.0`, `playState == "finished"` or `"paused"`)

Interactive affordances (see [TierAnimationSection.tsx](apps/main/app/features/scenarioExplorer/getStarted/TierAnimationSection.tsx) line 816 gate `isInteractive`):

- Hovering a distribution square shows the overlay popup near the square (no map popup).
- Clicking a square does a sticky single-select: gold ring on square, gold stroke on map polygon, overlay popup near square + anchored map popup, and sets that outcome's map visualization layer. Re-clicking the same square deselects. Clicking a different outcome's square swaps the pin + layer and flies the camera to the new outcome via `resolveOutcomeCamera`.

Navigation transitions (always clear interactive state first):

- `handleNext` (line 520): clears interactive state, ease camera to `CAM_CENTER` / `CAM_ZOOM` if it moved, then tween `progress` to the next beat's checkpoint.
- `handleBack` (line 578): clears interactive state, ease camera home, snap `progress` to previous beat (no reverse tween). Back-from-B0 animates `backOutOpacity` 1 → 0 and parks in the pre-play gate.
- `handleRestart` (line 656): clears interactive state + all anim layer paint, flies camera home, snaps to pre-play gate.

---

## Section 2 — Engineering actors per beat

Notation: "progress window" is the `[start, end]` in the compressed `[0, 1]` progress domain. "Source" is the `file:line` where the actor lives. Effect-owned state lives inside the listed `useEffect`'s closure.

### B0 — legend

- Narration actors (all in [BeatTextOverlay.tsx](apps/main/app/features/scenarioExplorer/getStarted/BeatTextOverlay.tsx) line 422 listener):
  - `beat1Ref` opacity: `[0.01, 0.01 + B0_PARA]`. Multiplied by `backOutOpacity` for Back-from-B0 gesture. Separate listener at line 392 (uses two MotionValue subs).
  - `beat2IntroRef` ("To compare results..."): `[0.10, 0.10 + B0_PARA]`. Line 426.
  - `tierLegendRowRefs[0..3]`: staggered reveal. Start at `TIER_LEGEND_FIRST_START = 0.13`, step `B0_STEP`, fade `B0_ITEM`. Line 561-570.
- Overlay morph actors: none.
- Map paint actors: [TierAnimationSection.tsx](apps/main/app/features/scenarioExplorer/getStarted/TierAnimationSection.tsx) line 1827 listener (main choreography):
  - `demand-units` fill-opacity: ramps 0 → 0.65 over `[0, FREEZE_AT/3]` (≈ `[0, 0.03]`), then cycles with color-phase breathing until FREEZE_AT, then holds at 0.65. Lines 1897-1968.
  - `demand-units` fill-color / fill-outline-color: `beat1FillExpr(phase)` three-blue cycle. Cycle phase = `(v/FREEZE_AT) * BEAT1_CYCLE` until FREEZE_AT, frozen thereafter.
  - `demand-units-outline` line-color + line-opacity: mirrored with fill.
  - `basemap-dim-overlay` fill-opacity: ramps `[0, FREEZE_AT*0.33]` (~`[0, 0.03]`) from 0 to `BASEMAP_DIM_OPACITY`. Lines 1883-1895.
- Map popup actors: none.
- Overlay popup actors: none.
- Camera actors: initial fly-in via the `panelInView` effect at [TierAnimationSection.tsx](apps/main/app/features/scenarioExplorer/getStarted/TierAnimationSection.tsx) line 1578, not beat-driven. Eases to `CAM_CENTER / CAM_ZOOM` when panel scrolls into view.

### B1 — collapse-and-colors

- Narration actors (listener at [BeatTextOverlay.tsx](apps/main/app/features/scenarioExplorer/getStarted/BeatTextOverlay.tsx) line 422):
  - `introCollapseRef` (intro paragraphs): opacity fade-out `[0.23, 0.23 + B1_EXIT]`; grid-rows collapse `[0.2375, 0.2375 + B1_EXIT]`. Lines 449-456.
  - `subtitleCollapseRef` (subtitle): same window. Lines 457-461.
  - `beat1cExampleRef`: fade-in `[0.245, 0.245 + B1_PARA]`, fade-out `[0.365, 0.365 + B2_EXIT]`; grid row active `[0.2425, 0.3675]`. Lines 592-598.
  - `beat1cDeliveryRef`: fade-in `[0.325, 0.325 + B1_PARA]`, fade-out `[0.365, 0.365 + B2_EXIT]`; grid row active `[0.3225, 0.3675]`. Lines 600-606.
- Overlay morph actors: none (AG_REV outcome title fades in anticipating B2; see below).
- Map paint actors (main choreography, [TierAnimationSection.tsx](apps/main/app/features/scenarioExplorer/getStarted/TierAnimationSection.tsx) line 1827 listener):
  - Sub-step 2 — `demand-units` cross-fade OUT while frozen blues retained: `[0.245, 0.26]` fills 0.65 → 0, `demand-units-outline` mirrored. Phase = "beat1" still. Lines 1970-2022.
  - Sub-step 3 — filter swap + tier-color fade IN: at progress 0.26, `setFilter("demand-units", DU_AG_ONLY_FILTER)` + `fill-color = buildBlendedTierExpr(BEAT1_MID, 1)`. Fade in `[0.26, 0.28]` opacity 0 → 0.65. Phase flips to "beat1c". Lines 2023-2082.
  - Sub-step 4 — hold on Ag-only colors through Beat 1C tail. `[0.28, BEAT2_START = 0.38]`. Lines 2083-2120.
- Map popup actors: Beat 1C popup effect at [TierAnimationSection.tsx](apps/main/app/features/scenarioExplorer/getStarted/TierAnimationSection.tsx) line 2467 listener. Window `[POPUPS_IN = 0.345, POPUPS_OUT = 0.38]`. Per-tick `Math.floor((v - 0.345) / perPopup) + 1` popups visible, staggered across the 0.035-wide window. Each highlight `{ key: "beat1c:AG_REV:<DU_ID>", pinned: true }`. List: `BEAT1C_POPUP_DU_IDS` in [TierAnimationSection.tsx](apps/main/app/features/scenarioExplorer/getStarted/TierAnimationSection.tsx) lines 194-200.
- Overlay popup actors: none.
- Camera actors: none.

### B2 — ag-rev-morph

- Narration actors ([BeatTextOverlay.tsx](apps/main/app/features/scenarioExplorer/getStarted/BeatTextOverlay.tsx) line 422 listener):
  - `beat1cExampleRef` / `beat1cDeliveryRef`: fade-out `[0.365, 0.365 + B2_EXIT]`; row collapse at 0.3675. (Same refs as B1; this is their exit half.)
  - `beat3BeforeRef` ("Each location can be symbolized..."): fade-in `[0.3675, 0.3675 + B2_PARA]`, fade-out `[0.39, 0.39 + B2_EXIT]`. Lines 614-620.
  - `beat3AfterRef` ("The distribution shows..."): fade-in `[0.3925, 0.3925 + B2_PARA]`, bespoke fade-out `[0.40, 0.41]`. Lines 622-632.
  - `beat2PanelRef` (right-column backdrop): fade-in `[0.3775, 0.3875]`. Lines 463-472.
  - AG_REV outcome title: `[morphStart - 0.004, morphStart + 0.005]` = `[0.376, 0.385]`. Lines 497-521.
  - AG_REV outcome caption: fadeEnd `min(morphEnd + (CAPTION_FADE - CAPTION_LEAD), 0.495)` = `morphEnd + 0` = 0.39; fadeStart = fadeEnd - CAPTION_FADE = 0.384. Lines 523-533.
  - Two-column eyebrow labels (`eyebrowRefs`): fade-in `[animationStart, animationStart + 0.01]`; fade-out `[0.50, 0.50 + B4_EXIT]`. Lines 537-552.
- Overlay morph actors ([OutcomeMorphOverlay.tsx](apps/main/app/features/scenarioExplorer/getStarted/OutcomeMorphOverlay.tsx) line 1207 listener):
  - AG_REV per-polygon morph from screen-space `rawD` toward `squareTarget`. Window from `getOutcomeProgressRange("AG_REV", ...)` = `[0.38, 0.39]`. Per-polygon fade-in leads morph by `0.015`. Lines 1061-1098.
- Map paint actors (main choreography, `[0.38, ...]` branch):
  - Enters phase "beat2" via `enterBeat2Phase()`: restores `DU_CLASS_FILTER` on `demand-units` + `demand-units-outline`, sets `fill-color` / `fill-outline-color` / `line-color` to `buildBlendedTierExpr(BEAT1_MID, 1)` (final tier colors, `t=1`). Lines 2143-2182.
  - `paintDuHideSchedule()` writes a `case` expression on `fill-opacity` + `line-opacity`: for each entry, either 0.65 (before `fadeStart`), interpolated 0.65 → 0 during `[fadeStart, morphStart]`, or 0 (after). Untracked DUs fall through to 0. Lines 2200-2242. `hideScheduleRef` is built in a separate `useMemo`/effect (see Section 3).
- Map popup actors: the Beat 1C popup effect fires its `clearAll()` at v ≥ 0.38 (POPUPS_OUT), removing all five highlights. [TierAnimationSection.tsx](apps/main/app/features/scenarioExplorer/getStarted/TierAnimationSection.tsx) lines 2479-2489.
- Overlay popup actors: none.
- Camera actors: none.

### B3 — all-other-morphs

- Narration actors ([BeatTextOverlay.tsx](apps/main/app/features/scenarioExplorer/getStarted/BeatTextOverlay.tsx) line 422 listener):
  - `allOtherOutcomesRef` ("For each scenario..."): fade-in `[0.41, 0.41 + B3_PARA]`, fade-out `[0.50, 0.50 + B4_EXIT]`. Lines 640-646.
  - `beat3AfterRef` exit half: fade-out `[0.40, 0.41]` (bespoke 0.01 width).
  - Per-outcome title + caption actors for the 8 non-AG_REV codes, using each outcome's `getOutcomeProgressRange(code, activeCodes)` window = a 0.01-wide slice inside `[0.42, 0.50]`.
- Overlay morph actors ([OutcomeMorphOverlay.tsx](apps/main/app/features/scenarioExplorer/getStarted/OutcomeMorphOverlay.tsx) line 1207 listener): same per-polygon morph from `rawD` → `squareTarget` for each of the 8 remaining outcomes, serialized across their slices.
- Map paint actors (main choreography, `[0.4, BEAT5_ENTER = 0.5]` sub-branch of the "beat2+" block):
  - Continues `paintDuHideSchedule()` each tick. The schedule entries for non-AG demand-unit outcomes (CWS_DEL and others whose geometry lives in `demand-units`) fade their fills 0.65 → 0 over each entry's personalized `[fadeStart, morphStart]` window.
  - Line-layer entries (e.g. `sacramento-river-body` for ENV_FLOWS / WRC_SALMON_AB): global `line-opacity` 1 → 0 over `[entry.fadeStart, entry.morphStart]`. Lines 2416-2432.
  - Non-demand-unit polygon layers (`calsim-wba`, `california-reservoir`, `delta-detaw`): written exclusively by the applyPaintChanges effect at line 1041 (gated on `selectedOutcomeCode`, so during non-interactive playback they stay at opacity 0, which is the correct hidden state for B3). They do not have a dedicated fade-out path in the main choreography.
- Map popup actors: none.
- Overlay popup actors: none.
- Camera actors: none.

### B4 — loi-highlight

- Narration actors ([BeatTextOverlay.tsx](apps/main/app/features/scenarioExplorer/getStarted/BeatTextOverlay.tsx) line 422 listener):
  - `allOtherOutcomesRef` exit half: fade-out `[0.50, 0.51]`.
  - `beat5LoiS1Ref` ("Outcomes can be displayed..."): fade-in `[0.51, 0.51 + B4_PARA]`, fade-out `[0.62, 0.62 + B5_EXIT]`. Lines 657-663.
  - `beat5LoiS2Ref` ("Locations of interest..."): fade-in `[0.545, 0.545 + B4_PARA]`, fade-out `[0.62, 0.62 + B5_EXIT]`. Lines 664-670.
  - `distributionHeaderRef`: same windows as S1. Lines 712-717.
  - Eyebrow labels exit half: fade-out `[0.50, 0.50 + B4_EXIT]`.
- Overlay morph actors: none (all outcomes settled on `squareTarget`; bar chain inactive until B5).
- Map paint actors:
  - Main choreography `[BEAT5_ENTER = 0.5, BEAT5_TAIL_END = 0.63]` branch at [TierAnimationSection.tsx](apps/main/app/features/scenarioExplorer/getStarted/TierAnimationSection.tsx) lines 2251-2375:
    - One-time entry (phase → "beat5"): `setFilter("demand-units", DU_AG_ONLY_FILTER)`, `fill-opacity = 0`, `line-opacity = 0`, `line-width = 0.5`. Lines 2257-2287.
    - Piecewise `fill-opacity` = `line-opacity` as a function of v: 0 before S1_LAYER_IN_START (0.555); ramp 0 → 0.65 over `[0.555, 0.575]`; hold 0.65 `[0.575, 0.62]`; ramp 0.65 → 0 over `[0.62, 0.63]`. Lines 2289-2325.
    - Step 4 gold stroke: `wantPolyRing = [0.6, 0.62)`. Writes a `case` expression on `demand-units-outline` `line-color` (HIGHLIGHT_GOLD for `DU_ID == BEAT5_LOI_ID`, else base tier expr) and `line-width` (2 for LOI, 0.5 otherwise). Idempotent via `beat5PolyRingOn` closure flag. Lines 2327-2375.
  - One-time exit at BEAT5_TAIL_END: restore base tier expression on outline, re-enter beat2 phase (full DU_CLASS_FILTER), resume hide schedule. Lines 2377-2407.
- Map popup actors: Beat 5 driver effect at [TierAnimationSection.tsx](apps/main/app/features/scenarioExplorer/getStarted/TierAnimationSection.tsx) line 2610 listener:
  - `wantPopup = [BEAT5_S5_POLYGON_POPUP_AT = 0.605, BEAT5_TAIL_END = 0.63)`.
  - On enter: `mapActions.setLocationHighlights([{ key: "beat5:AG_REV:08N_SA2", longitude, latitude, name, tierLevel, tierLabel, tierColor, pinned: true }])`. Lines 2646-2649.
  - On exit / teardown: `mapActions.clearLocationHighlights()`.
- Overlay popup actors: Beat 5 driver effect:
  - `wantRing = [BEAT5_S2_SQUARE_RING_AT = 0.58, BEAT5_SETTLE = 0.62)` → toggles `demoLocation` via `setDemoLocation`. Passed to `OutcomeMorphOverlay` as `demoHighlightedLocationKey`. Lines 2620-2629.
  - `wantHover = [BEAT5_S3_SQUARE_POPUP_AT = 0.59, BEAT5_SETTLE = 0.62)` → toggles `demoHoveredLocation` via `setDemoHoveredLocation`. Passed to `OutcomeMorphOverlay` as `hoveredLocation` (since `!isInteractive`). Renders as a `foreignObject` tooltip next to the square. Lines 2630-2643.
  - Teardown runs on effect cleanup and on v outside `[BEAT5_ENTER, BEAT5_TAIL_END)`, clearing `demoLocation`, `demoHoveredLocation`, and `locationHighlights`. Lines 2595-2609.
- Camera actors: none within the beat. (`handleNext` from B3→B4 runs `clearInteractiveState` + viaCamera fly-home via `goTo`.)

### B5 — list-bar

- Narration actors ([BeatTextOverlay.tsx](apps/main/app/features/scenarioExplorer/getStarted/BeatTextOverlay.tsx) line 422 listener):
  - `beat5LoiS1Ref` / `beat5LoiS2Ref` exit half: fade-out `[0.62, 0.62 + B5_EXIT]`.
  - `beat6ListRef` ("The list view..."): fade-in `[0.63, 0.63 + B5_PARA]`, fade-out `[0.72, 0.72 + B6_EXIT]`. Lines 676-682.
  - `distributionHeaderRef` exit half: fade-out `[0.62, 0.62 + B5_EXIT]`. Lines 714-717.
  - `listHeaderRef`: fade-in `[0.63, 0.63 + B5_PARA]`, fade-out `[0.72, 0.72 + B6_EXIT]`. Lines 718-723.
- Overlay morph actors ([OutcomeMorphOverlay.tsx](apps/main/app/features/scenarioExplorer/getStarted/OutcomeMorphOverlay.tsx) line 1207 listener):
  - `barBlend` = `easeInOut(clampRange(BEAT6_START = 0.62, BEAT6_END = 0.72))`. Applied to every shape in every outcome: `squareTarget → barTarget`, plus representative-fill re-coloring and non-representative fade-out. Lines 1012, 1113-1177.
  - Per-outcome bar-track chrome: `chromeOpacity = barBlend * (1 - avgBlend)`. Lines 1193-1203.
- Map paint actors: main choreography `[BEAT5_TAIL_END = 0.63, ...]` branch re-enters "beat2" phase and evaluates `paintDuHideSchedule()` — which at this point holds every tracked DU at opacity 0 (all past their morphStart). Effectively the DU layer stays invisible. Lines 2377-2407.
- Map popup actors: none.
- Overlay popup actors: none (Beat 5 driver teardown already ran at v ≥ BEAT5_TAIL_END).
- Camera actors: none.

### B6 — radar

- Narration actors ([BeatTextOverlay.tsx](apps/main/app/features/scenarioExplorer/getStarted/BeatTextOverlay.tsx) line 422 listener):
  - `beat6ListRef` exit half: `[0.72, 0.72 + B6_EXIT]`.
  - `beat7RadarRef` ("The radar chart..."): fade-in `[0.73, 0.73 + B6_PARA]`, fade-out `[0.87, 0.87 + B6_EXIT]`. Lines 689-695.
  - `listHeaderRef` exit half: `[0.72, 0.72 + B6_EXIT]`.
  - `radarHeaderRef`: fade-in `[0.73, 0.73 + B6_PARA]`, fade-out `[0.87, 0.87 + B6_EXIT]`. Lines 724-729.
- Overlay morph actors ([OutcomeMorphOverlay.tsx](apps/main/app/features/scenarioExplorer/getStarted/OutcomeMorphOverlay.tsx) line 1207 listener):
  - `avgBlend` = `easeInOut(clampRange(0.72, 0.75))`. Composition: post-bar points lerp toward `dotTarget`. Representative fill migrates toward `averageColor`. Lines 1013, 1134-1177.
  - `radarBlend` = `easeInOut(clampRange(0.75, 0.82))`. Post-dot points lerp toward the per-outcome `radarTarget` (from `radarTargetsByCode`). Stroke-opacity falls. Lines 1014, 1138-1141.
  - `radarChromeBlend` rising limb = `easeInOut(clampRange(0.82, 0.87))`. Applied to `radarChromeRef` opacity. Lines 1015, 1036-1039.
- Map paint actors: none beyond the "beat2" phase steady state from B5.
- Map popup actors: none.
- Overlay popup actors: none.
- Camera actors: none.

### B7 — heatmap

- Narration actors ([BeatTextOverlay.tsx](apps/main/app/features/scenarioExplorer/getStarted/BeatTextOverlay.tsx) line 422 listener):
  - `beat7RadarRef` exit half: fade-out `[0.87, 0.87 + B6_EXIT]`.
  - `beat8HeatmapRef` ("The heat map..."): fade-in `[0.88, 0.88 + B7_PARA]`. No fade-out (terminal beat). Lines 701-705.
  - `radarHeaderRef` exit half: `[0.87, 0.87 + B6_EXIT]`.
  - `heatmapHeaderRef`: fade-in `[0.88, 0.88 + B7_PARA]`. Lines 730-733.
- Overlay morph actors ([OutcomeMorphOverlay.tsx](apps/main/app/features/scenarioExplorer/getStarted/OutcomeMorphOverlay.tsx) line 1207 listener):
  - `radarChromeBlend` falling limb: `radarChromeIn * (1 - radarChromeOut)` where `radarChromeOut = clampRange(0.87, 0.90)`. Net: chrome fades out across `[0.87, 0.90]`. Lines 1010, 1015.
  - `heatmapBlend` = `easeInOut(clampRange(0.87, 0.95))`. Post-radar points lerp toward `heatmapTarget` (from `heatmapTargetsByCode`). Lines 1016, 1142-1145.
  - `heatmapChromeBlend` = `easeInOut(clampRange(0.95, 1.0))`. Applied to `heatmapChromeRef` opacity. Lines 1017, 1042-1045.
- Map paint actors: `settleToFinishedState` fires at `progress == 1.0` via `goTo.onComplete` when the target is `FINAL_BEAT_INDEX`. Sets `fill-opacity` to 0 and `filter` to null on every `ANIM_POLYGON_LAYERS` entry; `line-opacity` to 0 on every outline + every `ANIM_LINE_LAYERS` entry. Lines 376-406.
- Map popup actors: `settleToFinishedState` also calls `mapActions.clearLocationHighlights()` + `clearOutcomeVisualization()`.
- Overlay popup actors: none.
- Camera actors: none beat-driven. Interactive handlers take over after `playState` flips to `"finished"`.

### Post-settle interactive handlers

Not beat-driven, but they read and write the same shared state:

- `locHandlers.onClick` (sticky single-select): [TierAnimationSection.tsx](apps/main/app/features/scenarioExplorer/getStarted/TierAnimationSection.tsx) lines 869-947.
  - Writes `pinnedLocations` (sets to `new Map([[key, info]])` or empty), `hoveredLocation = null`, `setOutcomeVisualization` / `clearOutcomeVisualization`, and on cross-outcome switches flies camera via `resolveOutcomeCamera`.
- `locHandlers.onMouseEnter` / `onMouseLeave`: set / clear `hoveredLocation`.
- Pinned-state paint effect at [TierAnimationSection.tsx](apps/main/app/features/scenarioExplorer/getStarted/TierAnimationSection.tsx) line 1041. For the currently selected outcome's Mapbox fill layer, writes a `case` expression on `line-color` (gold for any `activeLocationSet` id), `line-width` (2 vs 1), `line-opacity` (1 vs 0), and a bucketed `fill-opacity` that boosts pinned features to 1.
- Popup highlight builder at [TierAnimationSection.tsx](apps/main/app/features/scenarioExplorer/getStarted/TierAnimationSection.tsx) lines 1207-1262: for every entry in `activeLocationSet`, assembles a `LocationHighlight` and calls `mapActions.setLocationHighlights(highlights)`. `VisualizationLayers` filters to `pinned: true` only in get-started mode (see [VisualizationLayers.tsx](apps/main/app/features/map/visualizationLayers/VisualizationLayers.tsx) lines 425-435).

---

## Section 3 — Cross-cutting state ("who writes what")

### `progress` MotionValue (central orchestrator)

Owned by: [TierAnimationSection.tsx](apps/main/app/features/scenarioExplorer/getStarted/TierAnimationSection.tsx) line 349 via `useMotionValue(0)`.

Writers (only three; navigation-only):

- `playArrival` ([TierAnimationSection.tsx](apps/main/app/features/scenarioExplorer/getStarted/TierAnimationSection.tsx) line 536): `animate(progress, BEATS[0].progress, { duration, ease: "linear" })`.
- `goTo` (line 429): `animate(progress, target.progress, { duration, ease: "linear" })` for forward and reverse beat-to-beat transitions.
- `handleBack` (line 578): `progress.set(target.progress)` for back to an earlier beat (snap, not tween). Also `progress.set(0)` on back-from-B0 completion.
- `handleRestart` (line 656): `progress.set(0)`.

Subscribers (6 in 4 files, all pure functions of `v`):

- [BeatTextOverlay.tsx](apps/main/app/features/scenarioExplorer/getStarted/BeatTextOverlay.tsx) line 392: `applyBeat1Opacity` — `beat1Ref` opacity = progress-driven fade × `backOutOpacity`. Deps `[progress, backOutOpacity, textHidden]`.
- [BeatTextOverlay.tsx](apps/main/app/features/scenarioExplorer/getStarted/BeatTextOverlay.tsx) line 422: ~40 separate fade windows for every narration paragraph / header / caption / legend row. Deps `[progress]`.
- [TierAnimationSection.tsx](apps/main/app/features/scenarioExplorer/getStarted/TierAnimationSection.tsx) line 1827: main choreography (all `demand-units` paint, `basemap-dim-overlay`, line-layer fades, per-DU hide schedule, Beat 5 LOI gold stroke). Deps `[progress, mapAPI.mapRef, isLoading]`.
- [TierAnimationSection.tsx](apps/main/app/features/scenarioExplorer/getStarted/TierAnimationSection.tsx) line 2486: Beat 1C progressive popups. Deps `[progress, outcomeLocations, isLoading]`.
- [TierAnimationSection.tsx](apps/main/app/features/scenarioExplorer/getStarted/TierAnimationSection.tsx) line 2610: Beat 5 LOI demo driver. Deps `[progress, outcomeLocations, isLoading]`.
- [OutcomeMorphOverlay.tsx](apps/main/app/features/scenarioExplorer/getStarted/OutcomeMorphOverlay.tsx) line 1207: SVG morph chain (per-outcome Beat 2/3 morph + Beat 5-7 `barBlend / avgBlend / radarBlend / heatmapBlend` + chrome). Deps include `outcomeShapes`, `encodingMode`, `radarTargetsByCode`, `heatmapTargetsByCode`.

### Mapbox paint writers

`demand-units` (fill layer):

- Styled-layer setup (one-time): [TierAnimationSection.tsx](apps/main/app/features/scenarioExplorer/getStarted/TierAnimationSection.tsx) lines 1608-1625 (inside `panelInView` camera effect at line 1578).
- Suppress interval (repeats every 50ms until `polygonsAllowedRef` true): lines 1515-1531.
- Main choreography listener (the single authorized per-frame writer during playback): line 1827.
  - `filter`: `DU_CLASS_FILTER` for Beats 0/1a/2+; `DU_AG_ONLY_FILTER` for Beat 1C and Beat 5; null on settle.
  - `fill-color` / `fill-outline-color`: `beat1FillExpr(phase, convergence)` during B0/B1; `buildBlendedTierExpr(BEAT1_MID, 1)` from B1C onward.
  - `fill-opacity`: various scalars and `case` expressions (per-DU hide schedule in B2-B7, piecewise scalar during Beat 5).
  - `fill-opacity-transition`: pinned to `{duration: 0, delay: 0}` at setup and on v < 0.01 reset.
- Per-outcome active-selection overlay (post-settle interactive): [TierAnimationSection.tsx](apps/main/app/features/scenarioExplorer/getStarted/TierAnimationSection.tsx) line 1041 effect. Writes `fill-opacity` case expression when `spotlightedTier` or any pinned DUs exist. Active only when `selectedOutcomeCode != null`.
- `settleToFinishedState`: lines 376-406. Clears `fill-opacity` to 0 and `filter` to null on storyboard finish.
- `handleRestart`: lines 656-714. Same clears plus explicit `fill-color` reset to `beat1FillExpr(0)`.
- Main choreography cleanup (effect return at line 2436): `fill-opacity` to 0.

**Multiple writers on the same frame**: the main choreography listener and the `setMapMode` suppress interval (line 1515) can both write `fill-opacity` during startup. After `polygonsAllowedRef` flips true, only the choreography listener writes per-frame. The interactive applyPaintChanges effect at line 1041 also writes `fill-opacity` when an outcome is selected post-settle — in principle only active when `isInteractive`, but the main choreography listener continues to run (it's subscribed to `progress`, never unsubscribed outside component unmount), and because `progress == 1.0` puts the listener in the `v >= BEAT5_TAIL_END` branch which re-applies the hide schedule's `case` expression on `fill-opacity`, clicking a square while `progress == 1.0` can theoretically produce a race between the two writers on the same property. In practice the hide schedule evaluates to 0 for all DUs at v=1 and the click does not change v, so the two writes converge on compatible values — but there is no structural guarantee.

`demand-units-outline` (line layer):

- Styled-layer setup: [TierAnimationSection.tsx](apps/main/app/features/scenarioExplorer/getStarted/TierAnimationSection.tsx) lines 1635-1684 — includes `addLayer` if the outline doesn't already exist (this component owns the layer while `OutcomePolygonLayer` doesn't mount in get-started mode).
- Main choreography listener: line 1827. Mirrors the fill writes plus the Beat 5 gold-ring `case` expression on `line-color` + `line-width`.
- Interactive applyPaintChanges at line 1041: `case` expression for gold outlines on active features, and cached `origLineColorRef` / `origLineWidthRef` to restore.
- Cleanup: `line-opacity` to 0.

Other polygon layers (`calsim-wba`, `california-reservoir`, `delta-detaw`) + outlines:

- Styled-layer setup: suppressed to opacity 0 at mount via the suppress interval and the `panelInView` camera effect.
- Written by `applyPaintChanges` at line 1041 only when an outcome selection makes them the active layer post-settle.

`basemap-dim-overlay`:

- Setup (disable transition): [TierAnimationSection.tsx](apps/main/app/features/scenarioExplorer/getStarted/TierAnimationSection.tsx) lines 1699-1706.
- Main choreography listener lines 1883-1895: ramps 0 → `BASEMAP_DIM_OPACITY` during B0, holds thereafter. Also reset to 0 in the `v < 0.01` branch.
- `handleRestart`: explicit reset lines 705-712.

Line layers (`sacramento-river-body`, etc.):

- Main choreography listener lines 2416-2432 for the Beat 3 per-outcome fade-out.
- `settleToFinishedState` + main choreography cleanup: `line-opacity` → 0 (and the cleanup branch flips it to 1 for non-anim resting state — note the inconsistency).
- `handleRestart`: `line-opacity` → 0.

### `locationHighlights` store writers

Store owned in `useMapStore`. Read by [VisualizationLayers.tsx](apps/main/app/features/map/visualizationLayers/VisualizationLayers.tsx) line 425 (filtered to `pinned && code not in {RES_STOR, FW_EXP, FW_DELTA_USES}` in get-started mode).

- `settleToFinishedState`: `mapActions.clearLocationHighlights()`. Lines 378-379.
- `clearInteractiveState`: `mapActions.clearLocationHighlights()`. Line 516.
- `handleRestart`: `mapActions.clearLocationHighlights()`. Line 660.
- Post-settle pinned-state paint effect (line 1041): `mapActions.setLocationHighlights(highlights)` at line 1262, building one highlight per entry in `activeLocationSet`. Fires whenever `activeLocationSet`, `hoveredLocation`, `pinnedLocations`, `selectedOutcomeCode`, or `spotlightedTier` change.
  - Same effect at line 1047: `mapActions.clearLocationHighlights()` when no outcome is selected and `activeLocationSet` is empty.
- Beat 1C progressive popups effect (line 2467): `mapActions.setLocationHighlights(highlights)` at line 2519 per tick inside the window, `mapActions.clearLocationHighlights()` at line 2481 on exit / teardown.
- Beat 5 LOI driver (line 2610): `mapActions.setLocationHighlights([highlight])` at line 2649, `mapActions.clearLocationHighlights()` at line 2605 and 2652.

### `demoLocation` / `demoHoveredLocation` (local state)

Owned in [TierAnimationSection.tsx](apps/main/app/features/scenarioExplorer/getStarted/TierAnimationSection.tsx) lines 971-974 via `useState`.

- Writers: Beat 5 LOI driver only (line 2610). Gate windows `[BEAT5_S2_SQUARE_RING_AT, BEAT5_SETTLE)` and `[BEAT5_S3_SQUARE_POPUP_AT, BEAT5_SETTLE)`.
- Teardown: effect cleanup + v outside `[BEAT5_ENTER, BEAT5_TAIL_END)`.
- Consumers: `OutcomeMorphOverlay` props `demoHighlightedLocationKey` (via `demoLocationKey = locKey(demoLocation)`) and `hoveredLocation` (when not interactive, passes `demoHoveredLocation`).

### `pinnedLocations` / `hoveredLocation` (local state)

Owned in [TierAnimationSection.tsx](apps/main/app/features/scenarioExplorer/getStarted/TierAnimationSection.tsx) lines 845-850.

- Writers:
  - `locHandlers.onClick` (line 873): sets either `new Map([[key, info]])` or `new Map()` (sticky single-select).
  - `locHandlers.onMouseEnter` / `onMouseLeave` (lines 871-872): set / clear `hoveredLocation`.
  - `clearInteractiveState`, `handleBack`, `handleRestart`: clear both.
  - Post-click onClick also sets `setHoveredLocation(null)` to avoid a hover tooltip stacking on the sticky select.
- Ref mirror `pinnedLocationsRef` updated in the `useEffect` at line 865.
- Consumers: `activeLocationSet` memo at line 949; applyPaintChanges effect at line 1041; `OutcomeMorphOverlay` props `activeLocationSet` / `hoveredLocation`.

### Camera writers

`mapAPI.mapRef.current` (a `MapRef` that exposes `easeTo` and `fitBounds`). Writers:

- Initial fly-in: `panelInView` effect, [TierAnimationSection.tsx](apps/main/app/features/scenarioExplorer/getStarted/TierAnimationSection.tsx) line 1713.
- Forward navigation via `goTo` with `viaCamera: true`: line 492 (`easeTo({CAM_CENTER, CAM_ZOOM})`).
- `handleBack` inline camera-home: line 609.
- `handleRestart` camera-home: line 727.
- Component-unmount reset: line 1540 (`easeTo({padding: 0})` with `duration: 0`).
- Interactive cross-outcome switch (`locHandlers.onClick`): lines 928-941 (either `easeTo` or `fitBounds` from `resolveOutcomeCamera`).
- `_handleOutcomeClick` (currently unused, kept behind `_` prefix): lines 1382-1401 (`easeTo` for toggle-off; `resolveOutcomeCamera` for select).

No beat listener writes to the camera. Navigation handlers are the only beat-adjacent camera writers.

### `activeOutcomeVisualization` (Zustand store)

- Writers:
  - `settleToFinishedState`, `clearInteractiveState`, `handleRestart`: `mapActions.clearOutcomeVisualization()`.
  - `locHandlers.onClick`: `mapActions.clearOutcomeVisualization()` on deselect, `mapActions.setOutcomeVisualization(info.code, resolvedScenarioId)` on select.
  - Hydroclimate-change effect (line 1552): `mapActions.setOutcomeVisualization(activeViz.outcomeCode, resolvedScenarioId)` to keep the scenario id in sync when the user changes hydroclimate.
  - Component unmount (line 1536): `mapActions.clearOutcomeVisualization()`.
  - `_handleOutcomeClick` (unused): `mapActions.toggleOutcomeVisualization`.

### `hideScheduleRef` (internal ref)

[TierAnimationSection.tsx](apps/main/app/features/scenarioExplorer/getStarted/TierAnimationSection.tsx) line 1761. Populated by the `computePolygonData` ref logic (see `computePolygonDataRef.current()` callers). Consumed only by the main choreography listener's `paintDuHideSchedule()` at lines 2200-2242 plus the line-fade loop at lines 2416-2432.

### `outcomeLocations` / `centroids` (from `useTierAnimationData`)

[useTierAnimationData.ts](apps/main/app/features/scenarioExplorer/getStarted/useTierAnimationData.ts). Now stably memoized against `theme.palette.tiers.*` primitive color strings (fix from the previous session's regression).

- Consumed by the Beat 1C popup effect and the Beat 5 driver via their listener deps.
- Mirrored into `outcomeLocationsRef` at [TierAnimationSection.tsx](apps/main/app/features/scenarioExplorer/getStarted/TierAnimationSection.tsx) lines 1729-1730 (used by the interactive pinned-state paint effect to read the latest data without causing that effect to re-run on identity change).
- Mirrored into `centroidLookupRef` at line 1030-1034.

---

## Section 4 — Known bug-risk hotspots

The inventory above surfaces the following structural issues. Each is pinned to a source location. These are not individual tuning bugs — they are cross-cutting fragility that a refactor should address.

### H1 — Beat driver effects re-mount on non-memoized deps

The Beat 5 LOI driver at [TierAnimationSection.tsx](apps/main/app/features/scenarioExplorer/getStarted/TierAnimationSection.tsx) line 2610 lists `outcomeLocations` as a dep. `outcomeLocations` was regenerating on every render in the previous session because `tierColors` wasn't memoized; each remount reset the closure-local `ringActive / hoverActive / popupActive` flags and wiped state. The fix stabilized `useTierAnimationData`'s color lookup (see [useTierAnimationData.ts](apps/main/app/features/scenarioExplorer/getStarted/useTierAnimationData.ts) lines 110-134). The same structural pattern exists in the Beat 1C popup effect at line 2486 (same dep list). **Risk**: any future change that adds a non-memoized value to either effect's dep array will silently break the beat again, because the symptom is "beat mostly works but a specific element never appears" and the chain to an identity-instability upstream is not obvious.

### H2 — Multiple writers on the same Mapbox paint property

`demand-units` fill-opacity has at least five distinct writers: the setMapMode suppress interval (line 1515), the main choreography listener (line 1827), the interactive applyPaintChanges effect (line 1041), `settleToFinishedState` (line 376), and `handleRestart` (line 656). The same applies to `demand-units-outline` line-color / line-width / line-opacity. The ordering contract is implicit and enforced by comments, not code ("Beat 2+: this branch owns all `demand-units` paint writes"). **Risk**: this class of race was the root cause of the Beat 5 AG-layer flicker previously. Any new beat that needs to touch these layers must first audit all five writers and figure out which branch of which listener to extend. Structurally, only the main choreography listener should own these properties during playback; the others are setup / teardown / interactive-only and are safe, but the convention is not enforceable.

### H3 — Implicit single-source-of-truth for Beat 5 thresholds only

Beat 5 hoists its sub-step thresholds to module scope ([TierAnimationSection.tsx](apps/main/app/features/scenarioExplorer/getStarted/TierAnimationSection.tsx) lines 216-244) because two different listeners (main choreography + Beat 5 driver) share them. Every other beat inlines its thresholds inside the listener closure. For example, B0 owns `FREEZE_AT = 0.09` at line 1812; B1 owns `BEAT1B_START = 0.245`, `BEAT1C_BLEND_START = 0.26`, `BEAT1C_BLEND_END = 0.28`, `BEAT2_START = 0.38` at lines 1813-1823; Beat 1C popups own `POPUPS_IN = 0.345`, `POPUPS_OUT = 0.38` at lines 2472-2473; B5 owns `BEAT6_START = 0.62` through `BEAT8_CHROME_IN_END = 1.0` at [OutcomeMorphOverlay.tsx](apps/main/app/features/scenarioExplorer/getStarted/OutcomeMorphOverlay.tsx) lines 997-1004; per-outcome morph slice origin `0.38 / 0.42 / 0.50` is hard-coded in [OutcomeMorphOverlay.tsx](apps/main/app/features/scenarioExplorer/getStarted/OutcomeMorphOverlay.tsx) lines 364-373. **Risk**: retuning a beat's feel means editing three or more files and hoping all inlined constants move in lockstep. The Beat 5 refactor hoisted the constants exactly because two files needed them; every other beat either has only one consumer or has not yet tripped over this.

### H4 — Beat boundaries are constants in multiple files

Progress-domain boundaries between beats are authored in [animationTiming.ts](apps/main/app/features/scenarioExplorer/getStarted/animationTiming.ts) (`BEATS[i].progress`), but those values are then re-hard-coded as literals at the hand-off points in every listener. For example, the "Beat 2 starts at 0.38" boundary appears as `BEAT2_START = 0.38` in the main choreography (line 1823), as `[0.38, 0.39]` in `getOutcomeProgressRange` (line 365), and as the `beat2IntroRef` fade-in start in BeatTextOverlay (line 470). **Risk**: shifting a beat boundary requires finding and updating every literal copy; forgetting one produces a silent mis-synchronization (narration leads or lags the visual).

### H5 — Teardown is hand-rolled per effect

Every `useEffect` that subscribes to `progress` writes its own teardown block in the effect's cleanup, and each of those has to know exactly which stores / refs / Mapbox paint properties it owns and how to unwind them. Examples: main choreography cleanup [TierAnimationSection.tsx](apps/main/app/features/scenarioExplorer/getStarted/TierAnimationSection.tsx) lines 2436-2455; Beat 1C popup cleanup lines 2522-2525; Beat 5 driver cleanup lines 2598-2608 (via `teardown()`). There is no shared framework that enforces "any state I wrote while v was inside my window must be cleared when v leaves it". The symptom of a missing clear-on-exit is state leaking into the next beat (pinned location carrying over, a map popup surviving from Beat 1C into Beat 2, etc.). **Risk**: adding a new beat that writes to any shared store has to remember to clear it on every exit path (v < start, v >= end, effect cleanup, navigation handler, finished settle, restart). There are at least five exit paths today; new code missing any one of them produces a subtle state leak.

### H6 — `progress.on("change")` listeners never unsubscribe outside component unmount

Every listener's cleanup runs only on `useEffect` teardown (dep change or component unmount). While the component is mounted, all 6 listeners fire on every frame, even during beats where only 2 of them are doing useful work. **Risk**: mild CPU waste on animation frames; more importantly, makes it impossible to gate any listener on "we're in my beat window" at the subscription level — the listener itself has to early-return on every tick. That's why every listener begins with a window check like `if (v < BEAT5_ENTER || v >= BEAT5_TAIL_END) { teardown(); return }`. The pattern is easy to get wrong (forget the teardown, forget an edge-case early-return value).

### H7 — "beat navigation clears state" is reimplemented in three places

`handleNext` (line 520), `handleBack` (line 578), and `handleRestart` (line 656) each do their own variant of "clear interactive state + fly camera home". `clearInteractiveState` (line 513) captures part of this but not all (`handleRestart` has its own wider clear block for Mapbox paint, and `handleBack`'s camera fly is inlined rather than routed through `goTo`'s `viaCamera` path). **Risk**: future changes to "what belongs in a pre-beat clean slate" (e.g. adding a new piece of state) need to be applied in three places. `settleToFinishedState` is a fourth place that resembles but doesn't match these.

### H8 — Actor/beat relationship is implicit

The spec in Sections 1 and 2 shows that each beat drives a set of actors (narration, morph, map paint, map popups, overlay popup, camera). The code does not represent this. Instead, actors are scattered across 6 listeners; to answer "what does Beat 3 do?" you have to read all 6 listeners and grep for a window whose range includes `[0.4, 0.5]`. **Risk**: the mental model is exactly "beats drive actors", and the implementation doesn't match the model, so reasoning about a beat or authoring a new one is manual and error-prone. This is the structural issue that H1-H7 are individual symptoms of, and the one a refactor should target most directly.

---

## Out of scope

- No refactor plan here. Once this spec is stable, the follow-up plan can key off H1-H8 and propose a concrete actor/beat decomposition.
- No code changes, no file moves, no dependency updates.
