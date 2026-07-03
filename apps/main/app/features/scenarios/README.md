# Scenarios (scenario domain)

`app/features/scenarios` is the shared **scenario domain**: the common components, hooks, and helpers for rendering a water-allocation scenario, its operations, and its outcome tiers. It is a toolkit, not a view.

Two parts of the app consume it:

- **Learn mode**, the scrollytelling map panels in `app/features/map` (for example `KeyOutcomesPanel`).
- **Explore mode**, the `app/features/scenarioExplorer` feature (for example `StrategyGrid`, `ScenarioRow`, and `ListView`).

If you are looking for the Explore tab UI, its tools, and its state, see `app/features/scenarioExplorer/README.md`. This folder is the lower-level set of building blocks.

## Naming note

`scenarios` and `scenarioExplorer` could be easy to confuse.

- `scenarios` is the **domain layer**, shared by Learn and Explore.
- `scenarioExplorer` is **one consumer**, the Explore tab built on top of it.

## Directory layout

```
scenarios/
  index.ts                  Barrel re-exporting components and hooks
  hydroclimateConfig.ts      Hydroclimate option metadata
  components/
    ScenarioRow.tsx          Row layout for a scenario in Explore grids/lists
    TierLegend.tsx           Tier color legend
    HydroclimateChooser.tsx  Hydroclimate selector
    HydroclimateGate.tsx     Renders children, or a placeholder when the
                             active hydroclimate has no variant for a scenario
    HydroclimateUnavailablePlaceholder.tsx
    shared/                  Building blocks used by Learn and Explore
      OutcomeGlyphItem.tsx   One outcome's tier glyph plus label and controls
      OutcomeGrid.tsx        Grid of OutcomeGlyphItems
      OperationsIconGroup.tsx Scenario operation icons with tooltips
      StrategyHeader.tsx     Scenario title, theme badge, and description
      SmartSummary.tsx       Generated outcome summary text
      TierSummaryCell.tsx    Compact heatmap cell for tier data
      NoDataAtThisTime.tsx   Placeholder when an outcome has no data
      OpsCircleIcon.tsx      Generic circle-with-text SVG icon
      circleTextFit.ts       Math that fits text inside the circle icon
      iconRegistry.tsx       Icon definitions and scenario-to-icon mapping
      strategyGlossary.tsx   Glossary-link rendering for descriptions/tooltips
      strategyIcons.tsx      Icon sizing helper
      tierScore.ts           Tier score calculation and color blending
      types.ts               ChartDataPoint, ScenarioForDisplay, and helpers
  hooks/                     Data hooks (see below)
  utils/themeLabelWrap.ts    Theme-badge label wrapping helper
```

## Key building blocks

- **`OutcomeGlyphItem`** renders a single outcome as a tier glyph (bars, dots, or an animated distribution) with an optional label, info button, and sort button. It is meant to be a visual symbol for a scenario, but I'm not sure how effective it is at the end of the day because there are so many tier outcomes for it to represent. The internal `useStableTierTuples` hook keeps the glyph from re-rendering when only the `chartData` array identity changes, and the `GlyphVisual` subcomponent selects which glyph representation to draw.
- **`StrategyHeader`** renders a scenario's shortcode, theme badge, title, and description. Descriptions can link glossary terms and the text truncates with a more/less toggle.
- **`OperationsIconGroup`** reads `iconRegistry` to draw the ordered operation icons for a scenario, each with a tooltip.
- **Icon system** (`iconRegistry`, `OpsCircleIcon`, `circleTextFit`): the registry holds the data, `OpsCircleIcon` renders a circle-with-text icon, and `circleTextFit` computes the largest font size that fits.
- **`strategyGlossary`** provides `useGlossaryRenderer`, which turns a description string into React nodes where known glossary terms (for example TUCP, SGMA) become buttons that open the glossary drawer. Both `StrategyHeader` and `OperationsIconGroup` use it, so glossary links look and behave the same everywhere.

## Hooks

Exported from `hooks/` (see `hooks/index.ts`):

- **`useScenarioTiers` / `useMultipleScenarioTiers`** fetch and shape tier data into the `ChartDataPoint[]` form the glyphs consume.
- **`useOutcomeDefinitions` / `useOutcomeTierData`** expose outcome metadata and per-outcome score data.
- **`useScenarioSummary` / `useMultipleScenarioSummaries`** build the generated text summary for a scenario.
- **`useScenarioList`** lists scenarios available for display.
- **`useResolvedIdMapping` / `useResolvedIdMappings`** map sibling-group ids to the variant short codes for the active hydroclimate (and back).
- **`useHydroclimateAvailability`** splits a set of scenario ids into those that have data for the active hydroclimate and those that do not.

## Data shape

Outcome visualizations are driven by `ChartDataPoint[]` (`shared/types.ts`): one entry per tier, each with a label, color, value, and optional location count. `isSingleValueTier` distinguishes single-value outcomes (drawn as dots or squares) from multi-value distributions (drawn as bars).

## Future improvements

- **Move content from inline definitions to the database and API.** A lot of the content this feature renders is hand-authored inline in the `app/content/` module (`outcomes.ts`, `tiers.ts`, `themes.ts`, and the metadata in `scenarios.ts`) and in `iconRegistry.tsx`. This includes tier definitions, outcome definitions, theme assignments, and the operation tooltip copy. Some scenario fields such as labels and descriptions already come from the API, but the rest has not settled yet, so it is written by hand in the frontend for now. Ideally these definitions will be stored in the database and served through the API, giving the project a single stable source that is shared consistently everywhere rather than duplicated in frontend modules. That said, how would that work with translations? Maybe those would be in a separate module on the frontend.
- **Operation icons are provisional.** The operation icons in `iconRegistry.tsx` (the hand-built circle-with-text icons drawn by `OpsCircleIcon`, plus a few SVG files) are placeholders. They are meant to be replaced once someone has time to design proper icon sets.
