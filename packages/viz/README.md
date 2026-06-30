# @repo/viz

React visualization components for the COEQWAL scenario explorer, built with D3.js and TypeScript.

## Package structure

```
packages/viz/src/
├── components/       # Chart and glyph components
├── hooks/            # useResizeObserver
├── utils/            # D3 helpers, color palettes, tier-scale math, shape morphing, clustering
├── types.ts          # Shared interfaces (ChartConfig, DecileData, etc.)
├── types/            # Ambient module declarations (e.g. mapbox-gl-compare)
└── index.ts          # Barrel exports
```

## Usage

```tsx
import { PercentileMatrix, RadarPlot } from "@repo/viz"
```

All components are default-exported from their files and re-exported as named exports from the barrel.

### D3 re-exports

`d3` is listed only in this package’s dependencies. Apps that need raw D3 helpers should import the curated named exports from `@repo/viz` (for example `scaleLinear`, `select`, `mean`, `extent`) rather than adding `d3` to the app. New symbols can be added to the barrel in `src/index.ts` when required.

## Component conventions

Every component in `src/components/` follows these patterns. New components should attempt to match.

### File skeleton

```tsx
"use client"

import React, { useRef, useEffect, useState, useCallback } from "react"
import { scaleLinear, select } from "d3"
import { useResizeObserver } from "../hooks/useResizeObserver"

export interface MyChartProps {
  data: SomeData[]
  responsive?: boolean
  width?: number
  height?: number
  // ...
}

const MyChart: React.FC<MyChartProps> = React.memo(
  ({ data, responsive = true, width = 600, height = 400 }) => {
    const svgRef = useRef<SVGSVGElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const dimensions = useResizeObserver(
      containerRef as React.RefObject<HTMLElement>,
    )
    const [currentWidth, setCurrentWidth] = useState(width)
    const [currentHeight, setCurrentHeight] = useState(height)

    // Sync dimensions from resize observer
    useEffect(() => {
      if (responsive && dimensions) {
        setCurrentWidth(dimensions.width)
        setCurrentHeight(dimensions.height)
      } else {
        setCurrentWidth(width)
        setCurrentHeight(height)
      }
    }, [responsive, dimensions, width, height])

    // D3 drawing logic
    const updateChart = useCallback(
      (w: number, h: number) => {
        if (!svgRef.current) return
        const svg = select(svgRef.current)
        svg.selectAll("*").remove()
        // ... imperative D3 code using w and h ...
      },
      [data /* , other props used in drawing */],
    )

    // Trigger redraw when dimensions or data change
    useEffect(() => {
      if (currentWidth > 0 && currentHeight > 0) {
        updateChart(currentWidth, currentHeight)
      }
    }, [currentWidth, currentHeight, updateChart])

    return (
      <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
        <svg
          ref={svgRef}
          width={responsive ? "100%" : width}
          height={responsive ? "100%" : height}
          style={{ display: "block" }}
        />
      </div>
    )
  },
)

MyChart.displayName = "MyChart"

export default MyChart
```

### Rules

| Convention               | Details                                                                                                                                                    |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`"use client"`**       | Every component file starts with this directive. All components use browser APIs or D3.                                                                    |
| **Component definition** | `const Name: React.FC<NameProps> = React.memo(({ ... }) => { ... })`                                                                                       |
| **Export**               | `export default Name` - memo wraps the definition, not the export.                                                                                         |
| **displayName**          | `Name.displayName = "Name"` after the closing `})` and before the export. Required because `React.memo` around an anonymous arrow loses the inferred name. |
| **Props interface**      | Named `ComponentNameProps`, exported, defined in the same file unless genuinely shared across components.                                                  |
| **D3 imports**           | Named imports only: `import { scaleLinear, select } from "d3"`. Never `import * as d3`.                                                                    |
| **D3 rendering**         | `useCallback` draw function + `useEffect` that calls it. Never a monolithic `useEffect` that mixes sizing and drawing.                                     |
| **Responsive sizing**    | `useResizeObserver` hook with `currentWidth`/`currentHeight` state, synced via a dedicated `useEffect`. Never use `clientWidth`.                           |

### When React.memo matters

All components are wrapped in `React.memo`. For D3 imperative charts this prevents unnecessary
`useEffect` -> full-redraw cycles when a parent re-renders with identical props. For pure-SVG
glyphs (`OutcomeGlyph`, `OutcomeDotsGlyph`, etc.) it prevents re-diffing the JSX tree.

### Declarative vs. imperative components

Not every component needs D3 imperative rendering. Small glyphs like `OutcomeGlyph`,
`OutcomeDotsGlyph`, and `StickChart` render pure JSX/SVG with no `useEffect` or `useCallback`.
They still follow the same definition/export/props conventions but skip the
`useResizeObserver` + `useCallback` + `useEffect` pattern since there is no imperative DOM
manipulation.

### A complete worked example

The skeleton above is intentionally minimal. `RadarPlot` (`src/components/RadarPlot.tsx`) is the fullest real example. Open it alongside this map of where each convention shows up:

- **Definition and export** - `const RadarPlot: React.FC<RadarPlotProps> = React.memo(...)`, then `RadarPlot.displayName = "RadarPlot"` and `export default RadarPlot`.
- **Plain props, events out** - inputs are data plus callbacks (`onLineHover`, `onLineClick`, `onDotClick`, `onPinnedToggle`, `onAxisPositions`, `onReady`). It reads no store and fetches nothing.
- **Callbacks held in refs** - `onLineHoverRef` and `onDotHoverRef` mirror the incoming callbacks so the D3 draw code calls the latest version without listing it as a `useCallback` dependency.
- **Debounced, deduped hover notifications** - the dot `mouseenter` handler compares against `lastNotifiedIdRef` and only fires after `HOVER_NOTIFY_MS` (80 ms), so sweeping across one scenario's dots notifies the parent at most once.
- **Guarded entrance animation** - `hasAnimatedRef` plays the fly-in once, then later redraws run at duration 0.
- **Hoisted constants** - sizing and color defaults (`RADAR_DOT_R`, `RADAR_DIM_OPACITY`, and friends) live at module scope rather than in destructuring defaults, so they keep a stable identity across renders.

The last three bullets are the [Avoiding hover flicker](#avoiding-hover-flicker-in-d3-charts) rules in practice. `RadarPlotSnapshot` is the capture sibling: it pre-binds `interactive={false}` and `animate={false}` so an offscreen host can paint a single static frame for share thumbnails, which only works because `RadarPlot` reads no store.

For how a consuming app wires one of these charts (store-driven data, memoized props, hover and share callbacks), see ["Write your visualization"](../../apps/main/app/features/scenarioExplorer/README.md#write-your-visualization-repoviz) in the Scenario Explorer README.

## Avoiding hover flicker in D3 charts

D3 imperative charts are sensitive to unnecessary React re-renders because each render of the
`updateChart` callback triggers `svg.selectAll("*").remove()`, a full tear-down and rebuild.
Even with `hasAnimatedRef` guards that skip entrance animations on subsequent draws, the
remove-and-rebuild cycle causes visible flicker.

The rules below were learned the hard way. Follow all of them for any chart that has
hover/tooltip interactions.

### 1. Never use React state for tooltips

`useState<TooltipState>` inside a chart component causes a React re-render on every
mouseenter/mouseleave. Even though `updateChart` may not re-fire (its deps haven't changed),
React still reconciles the JSX tree, and the conditional `{tooltip && <div>…</div>}` causes
DOM churn.

**Instead:** mount a permanent tooltip `<div>` with `display: none` and a `ref`. Toggle it
imperatively from the D3 event handlers:

```tsx
const tooltipRef = useRef<HTMLDivElement>(null)

// In D3 mouseenter handler:
tooltipRef.current!.style.display = "block"
tooltipRef.current!.style.left = `${x}px`
tooltipRef.current!.innerHTML = "…"

// In D3 mouseleave handler:
tooltipRef.current!.style.display = "none"
```

### 2. Debounce parent notifications

When a chart calls `onLineHover?.(scenario)`, this typically triggers `setState` in the parent
(e.g. RadarPanel), which re-renders the entire parent tree. Even if `React.memo` prevents
the chart from re-rendering, the parent reconciliation can block the main thread and delay paint
of the D3 hover visuals.

- **Debounce the notify** (80 ms works well) so rapid dot-to-dot movement fires at most one
  callback.
- **Deduplicate**: track the last notified scenario ID in a ref; skip the callback if hovering a
  different dot of the same scenario.
- **Use `startTransition`** in the parent's handler so the sidebar update is low-priority and
  doesn't block the next paint frame.

```tsx
// In the chart:
const lastNotifiedIdRef = useRef<string | null>(null)

// mouseenter handler:
if (lastNotifiedIdRef.current !== scenario.id) {
  hoverTimer = setTimeout(() => {
    lastNotifiedIdRef.current = scenario.id
    onLineHoverRef.current?.(scenario)
  }, 80)
}

// In the parent:
import { startTransition } from "react"
startTransition(() => setHoveredScenario(scenario))
```

### 3. Hoist default prop values to module scope

Default values in destructuring (`colors = { default: "#666", … }`) create **new object
references every render**, which defeats `React.memo` and recreates the `updateChart` callback.

```tsx
// BAD - new object identity every render
({ colors = { default: "#666", highlighted: "#1a3a5c" } }) => { … }

// GOOD - stable reference
const DEFAULT_COLORS = { default: "#666", highlighted: "#1a3a5c" }
({ colors = DEFAULT_COLORS }) => { … }
```

### 4. Use primitive `useMemo` dependencies for theme colors

MUI's `useTheme()` may return objects (`theme.palette.grey`, `theme.palette.waterThemes`) with
**new identity on every render** even though the values inside haven't changed. If you pass
these through `useMemo`, the memo will recompute every render.

```tsx
// BAD - theme.palette.grey is a new object ref each render
const chartColors = useMemo(
  () => ({
    default: theme.palette.grey[600],
  }),
  [theme.palette.grey],
) // unstable dep

// GOOD - extract primitive strings first
const grey600 = theme.palette.grey[600]
const chartColors = useMemo(
  () => ({
    default: grey600,
  }),
  [grey600],
) // stable primitive dep
```

### 5. Guard entrance animations

Use a `hasAnimatedRef` to ensure entrance transitions (dots flying in from baseline, etc.)
only play once. All subsequent `updateChart` calls should use `duration(0)`:

```tsx
const hasAnimatedRef = useRef(false)
// inside updateChart:
const T_DUR = hasAnimatedRef.current ? 0 : 500
hasAnimatedRef.current = true
```

### 6. Keep `updateChart` deps minimal

Every value in `updateChart`'s `useCallback` dependency array is a potential re-render trigger.
For callbacks like `onLineHover` and `onLineClick`, use refs instead of putting them in the
dep array:

```tsx
const onLineHoverRef = useRef(onLineHover)
useEffect(() => {
  onLineHoverRef.current = onLineHover
}, [onLineHover])

// Inside updateChart, use onLineHoverRef.current - not onLineHover
```

### Quick checklist for new D3 charts

- [ ] Tooltip via ref, not `useState`
- [ ] `onLineHover` / `onLineClick` stored in refs, not in `updateChart` deps
- [ ] Default prop values hoisted to module constants
- [ ] Parent uses `startTransition` for hover state updates
- [ ] `hasAnimatedRef` guards entrance animations
- [ ] All `useMemo` deps are primitives (strings, numbers, booleans), not theme objects

## Adding a new component

1. Create `src/components/MyChart.tsx` following the skeleton above.
2. Export it from `src/index.ts`:
   ```ts
   export { default as MyChart } from "./components/MyChart"
   export type { MyChartProps } from "./components/MyChart"
   ```
3. Run `pnpm --filter @repo/viz build` and `pnpm --filter @repo/viz lint` to verify.

## Exports

The barrel file (`src/index.ts`) is the authoritative export list. It re-exports each public
component as a named export, usually alongside its props type, plus:

- **Curated D3 re-exports** - a hand-picked set of D3 functions and types so consumers import them from `@repo/viz` rather than adding `d3` themselves. Currently includes the scales (`scaleLinear`, `scaleBand`, `scalePoint`, `scaleTime`), shape generators (`line`, `area`, the `curve*` family), selection (`select`), array/stat helpers (`extent`, `max`, `min`, `mean`, `range`, `ticks`, `bisector`), formatting (`format`, `timeFormat`, `interpolateRgb`), CSV helpers (`csv`, `csvParse`, `autoType`), and the types `Area`, `ScaleLinear`, `ScalePoint`, `ScaleTime`. Add to this list in `src/index.ts` when a consumer needs a new symbol.
- **`useResizeObserver`** - shared responsive sizing hook
- **D3 utilities** (`utils/d3-utils.ts`) - `parseDecileData`, `createDecileColorScale`, `createCategoricalColorScale`, `formatValue`, `calculateChartDimensions`, `getNestedValue`
- **Tier-scale helpers** (`utils/tierScale.ts`) - `TIER_COUNT`, `TIER_LEVELS`, `normalizedToRadar`, `radarValueToTier`, `clampTier`
- **Color palettes** (`utils/themeLineColors.ts`) - `THEME_LINE_PALETTES`, `THEME_LINE_PALETTES_LIGHT_TO_DARK` (light-to-dark for chart indices), `getThemeLineColor`, and the `ThemeKey` type
- **Shape morphing** (`utils/shape-morph.ts`) - `resampleClosedPath`, `rectPoints`, `diamondPoints`, `circlePoints`, `lineSegmentPoints`, `pointsToD`, `easeInOut`, `lerp`, the `POINTS_PER_SHAPE` / `SQUARE_SIZE` / `SQUARE_GAP` constants, and the `ShapeMorphData` type
- **Clustering** (`utils/clustering.ts`) - `hierarchicalRowOrder`
- **Sidebar-highlight policy** (`utils/sidebarHighlightPolicy.ts`) - `isFullOpacityDuringSidebarHighlight`
