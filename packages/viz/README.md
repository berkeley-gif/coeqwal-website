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
| **Export**               | `export default Name` — memo wraps the definition, not the export.                                                                                         |
| **displayName**          | `Name.displayName = "Name"` after the closing `})` and before the export. Required because `React.memo` around an anonymous arrow loses the inferred name. |
| **Props interface**      | Named `ComponentNameProps`, exported, defined in the same file unless genuinely shared across components.                                                  |
| **D3 imports**           | Named imports only: `import { scaleLinear, select } from "d3"`. Never `import * as d3`.                                                                    |
| **D3 rendering**         | `useCallback` draw function + `useEffect` that calls it. Never a monolithic `useEffect` that mixes sizing and drawing.                                     |
| **Responsive sizing**    | `useResizeObserver` hook with `currentWidth`/`currentHeight` state, synced via a dedicated `useEffect`. Never `clientWidth`.                               |

### When React.memo matters

All components are wrapped in `React.memo`. For D3 imperative charts this prevents unnecessary
`useEffect` → full-redraw cycles when a parent re-renders with identical props. For pure-SVG
glyphs (BarChart, RoseChart, etc.) it prevents re-diffing the JSX tree.

### Declarative vs. imperative components

Not every component needs D3 imperative rendering. Small glyphs like `BarChart`, `RoseChart`,
`StickChart`, and `OutcomeDotsGlyph` render pure JSX/SVG with no `useEffect` or `useCallback`.
They still follow the same definition/export/props conventions but skip the
`useResizeObserver` + `useCallback` + `useEffect` pattern since there is no imperative DOM
manipulation.

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

- **`useResizeObserver`** — shared responsive sizing hook
- **D3 utilities** — `parseDecileData`, `createDecileColorScale`, `formatValue`, etc. from `utils/d3-utils.ts`
- **Color palettes** — `THEME_LINE_PALETTES`, `getThemeLineColor` from `utils/themeLineColors.ts`

## Scripts

| Command                               | What it does           |
| ------------------------------------- | ---------------------- |
| `pnpm --filter @repo/viz build`       | TypeScript compilation |
| `pnpm --filter @repo/viz lint`        | ESLint check           |
| `pnpm --filter @repo/viz check-types` | `tsc --noEmit`         |
| `pnpm --filter @repo/viz format`      | Prettier               |
