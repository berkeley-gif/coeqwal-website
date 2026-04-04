# @repo/viz

React visualization components for the COEQWAL scenario explorer, built with D3.js and TypeScript.

## Package structure

```
packages/viz/src/
├── components/       # All chart and glyph components
├── hooks/            # useResizeObserver
├── utils/            # D3 helpers, color palettes
├── types.ts          # Shared interfaces (ChartConfig, DecileData, etc.)
└── index.ts          # Barrel exports
```

## Usage

```tsx
import { PercentileMatrix, DumbbellChart } from "@repo/viz"
```

All components are default-exported from their files and re-exported as named exports from the barrel.

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
glyphs (BarChart, RoseChart, etc.) it prevents re-diffing the JSX tree.

### Declarative vs. imperative components

Not every component needs D3 imperative rendering. Small glyphs like `BarChart`, `RoseChart`,
`StickChart`, and `OutcomeDotsGlyph` render pure JSX/SVG with no `useEffect` or `useCallback`.
They still follow the same definition/export/props conventions but skip the
`useResizeObserver` + `useCallback` + `useEffect` pattern since there is no imperative DOM
manipulation.

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
(e.g. ComparisonPanel), which re-renders the entire parent tree. Even if `React.memo` prevents
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

The barrel file (`src/index.ts`) re-exports every component as a named export alongside its
props type. It also exports:

- **`useResizeObserver`** - shared responsive sizing hook
- **D3 utilities** - `parseDecileData`, `createDecileColorScale`, `formatValue`, etc. from `utils/d3-utils.ts`
- **Color palettes** - `THEME_LINE_PALETTES`, `getThemeLineColor` from `utils/themeLineColors.ts`
