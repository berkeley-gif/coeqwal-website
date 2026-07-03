# Resilience tool

Heatmap panel + sentence controls.

| Piece                                | Role                                                                   |
| ------------------------------------ | ---------------------------------------------------------------------- |
| `ResiliencePanel.tsx`                | Heatmap rendering and interactions                                     |
| `ResilienceChartControls.tsx`        | Toolbar control row                                                    |
| `ResilienceControls.tsx`             | Sentence control UI                                                    |
| `ResilienceControlsParts.tsx`        | Presentational primitives (`PhraseButton`, `PopoverShell`, `RadioRow`) |
| `types.ts`                           | Capture/share result + chart-data types                                |
| `controls/`                          | read → plan → write (`readSnapshot`, `planPivotChange`, `writeChange`) |
| `useResilienceControlsWriter.ts`     | Controls facade for `ResilienceControls`                               |
| `hooks/useResilienceShareCapture.ts` | Share capture wiring                                                   |

**Store:** flat `resilience*` fields via `useResilienceSlice()`. Imperative batch writes use `applyResilienceControlsPatch` through `writeChange.ts`.

**Target split:** panel orchestration vs `heatmap/` render modules (see feature backlog).

## Refactor backlog

This panel was built in haste. The resilience tool was assembled quickly during a feature push. `ResiliencePanel.tsx` is large. It is sectioned, and has a TOC in its header comment with matching banners in the body.

The three capture functions rebuild the very same props object that the live chart renders from, and they reach back into roughly fifteen separate reactive values plus eight latest-value refs to do it. Those refs exist only because the values were never bundled. To keep the capture callbacks stable, each reactive value is mirrored into its own ref. So a single concern (snapshot the chart) ends up coupled to most of the component's derived state. A naive "move it into a hook" produces a hook with two dozen parameters, which creates a tangle.

The pattern should be a single cohesive render model. Build one memoized object that holds the chart-shaping inputs (rows, columns, tier colors, tier labels, palette, cell-render config, and the display flags) and have both the live `ResiliencePanelChartView` and the capture path consume that one object. Push the derivation logic that produces it into colocated hooks (for example a `useResilienceCells` hook for section 4). Once the model exists, capture collapses to a thin hook over that model (held in one ref) plus the three `onCapture*` callbacks, instead of two dozen loose inputs. Fix the data clump first...the extractions can then become more or less mechanical.

Remaining candidates for extraction from the large panel file, in rough order (check functionality often):

- **Section 4, cell value builders** (`buildValueFn`, `valueGrid`, `rows`/`cells`): these turn raw data into the values each cell shows. They could move into a `useResilienceCells` hook, but they rely on the current view and on helpers like `getCell` and `getDisplayName`, so you have to pass those in.
- **Section 11, capture** (`renderSoloScenarioForShare`, `captureResilience`, `captureResilienceTile`, and the effects that hand them out): these draw the chart into a saved image for share. They could move into `hooks/useResilienceCapture.ts`, but do the render-model bundling described above first. Right now they read a large amount of the panel's state, and two of the values they need (`chartViewStateRef`, `chartViewVisualsRef`) are created further down in section 12, so you would also have to move those up before the code that uses them.
- **Section 7, interaction handlers**: the riskiest to move, because they juggle hover timers, saved values, and pinned-square state that are easy to break. Save this one for last, if you do it at all.

Full resilience write model: [feature README](../../../../README.md#resilience-controls-write-model). Share capture (per-tool hooks): [feature README](../../../../README.md#share-capture-per-tool-hooks).
