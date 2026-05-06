# Share system

This directory owns everything user-facing for the share feature: the
drawer, the cards rendered in the tray and story canvas, the off-screen
capture pipeline, the localStorage envelope, the URL grammar, and the
per-variant registry that ties them together. Adding a new
visualization to the share system means writing four implementation
files and adding one row to the registry; the dispatchers (card render,
URL encode/decode, filename, raster size, CSV) all read from the
registry, so a missing arm is a compile error in `variants.ts` rather
than a silent `return null` somewhere downstream.

```
share/
  index.ts                        Barrel; the only stable public surface.
  types.ts                        ShareItem, ShareItemPatch, PersistedShareItem.
  variants.ts                     Per-variant registry + RenderContext / CsvLookups types.
  variants/
    barChart.ts                   barChart variant handler.
    radar.ts                      radar variant handler (with live-fallback builder).
    equity.ts                     equity / Distribution variant handler.
    resilience.ts                 resilience variant handler.
  persist.ts                      loadShareState / saveShareState + storage key.
  url.ts                          encodeShareItems / parseShareUrl + SHARE_URL_VERSION.
                                  Dispatches per-item to the registry by URL prefix.
  stage.ts                        stageShareItem: build -> capture -> add.
  ShareItemView.tsx               Variant -> card dispatcher (registry lookup).
  ShareCardShell.tsx              Common card chrome (border, remove button, note).
  ShareDrawer.tsx                 The right-edge tray.
  capture/
    OffscreenCaptureHost.tsx      Mounts a snapshot in a hidden div, returns SVG + PNG.
    dimensions.ts                 CAPTURE_DIMENSIONS: per-variant fixed size.
    types.ts                      CapturedVisual + capture function signatures.
    captureRegistry.ts            Re-export barrel for capture primitives.
  cards/
    ShareScenarioCard.tsx         barChart variant (header + chips only).
    ShareRadarCard.tsx            radar variant.
    ShareSnapshotCard.tsx         equity variant + resilience tile snapshot.
    ResilienceShareCard.tsx       resilience panel variant; delegates to ShareSnapshotCard.
    ChartThumbnail.tsx            cachedSvg -> cachedImageDataUrl -> liveChart -> placeholder.
    HydroclimateBadge.tsx         Shared hydroclimate chip used by every card.
    SvgThumbnail.tsx              Inline-SVG renderer.
  live/
    ShareRadarLiveChart.tsx       Live radar fallback when no cachedSvg.
    ShareResilienceLiveChart.tsx  Live heatmap fallback.
  note/
    ShareItemNoteBlock.tsx        Inline annotation editor.
  utils/
    shareRadarLiveData.ts         Fields the radar card needs from comparison hooks.
    getResilienceShareCardContent.ts
```

## Mental model

A `ShareItem` is the runtime record for one user-saved card. The
discriminated union has a variant per chart kind:

- `barChart` (decile / bar / average view of one scenario)
- `radar` (single trace or many overlaid traces on one chart)
- `equity` (distribution view; renders via the snapshot card)
- `resilience` (heatmap panel + small multiples + leverage scatter)

Every variant captures `cachedSvg` (serialized SVG with computed styles
inlined) and `cachedImageDataUrl` (rasterized PNG companion) at share
time. Cards render the thumbnail via `ChartThumbnail`, which prefers
the SVG, falls back to the PNG, then to a live re-render from
`cachedChartData`, then to a placeholder.

Every variant captures off-screen. The chart is mounted in a hidden
div by `OffscreenCaptureHost` with `interactive=false` and
`animate=false`, awaits `onReady`, and the host serializes the DOM
SVG. Variants that draw many small SVGs (the bar-chart row of glyphs,
the resilience small-multiples panel) pass `mode: "compose"` to the
host, which stitches every descendant `<svg>` into one composite at
the snapshot's fixed dimensions. There is no live-DOM cloning in any
capture path.

`PersistedShareItem` is the on-disk shape. `persist.ts#toPersisted`
preserves `cachedSvg`, `cachedImageDataUrl`, AND `cachedChartData`
so reload restores the same thumbnail, the PNG / SVG download paths
keep working without a fresh capture, and the data-download icons
stay enabled for radar / equity / resilience items (only the bar
chart variant has a live recompute path through
`useResolvedScenarioTiers`; the rest would otherwise lose their
data on every reload). `saveShareState` already swallows
quota-exceeded errors, so an oversized tray simply skips the persist
and in-memory state takes over for the rest of the session.

## The variant registry

`variants.ts` exports one `VariantHandler<T>` per `ShareItem["type"]`,
keyed in `VARIANT_REGISTRY` by that literal type. The registry is
typed with `satisfies Record<ShareItem["type"], …>`, so adding a new
arm to the `ShareItem` union without registering its handler is a
compile error in this file.

Each handler owns:

| Field | Purpose | Used by |
|---|---|---|
| `type` | Discriminator value. | Self-documenting; matches the registry key. |
| `urlPrefix` | One-letter token segment (e.g. `b`, `r`, `e`, `q`). | `url.ts` encode/decode. |
| `rasterDimensionsKey` | Key into `CAPTURE_DIMENSIONS`. | `Share.tsx` PNG fallback when rasterizing `cachedSvg`. |
| `renderCard(item, ctx)` | Returns the card React node. | `ShareItemView.tsx`. |
| `encodeUrlToken(item)` | Body of the URL token (no prefix, no leading dot). | `url.ts#encodeOne`. |
| `decodeUrlToken(parts)` | Inverse; receives parts after the prefix is stripped. | `url.ts#decodeOne`. |
| `filenameLabel(item)` | Fragment fed to `getTimestampedFilename`. | `Share.tsx` PNG/SVG/CSV downloads. |
| `exportCsv(item, lookups)` | Returns a CSV body string or `null`. Optional. | `exportUtils.ts` single + bulk CSV export. |

Dispatchers do not branch on `item.type`. They look up the handler
once and delegate, so a new variant only has to fill in the registry
row to wire all four download paths and the URL grammar.

## Adding share to a new visualization

There are five files to write and one registry row to add. Use the
existing variants as references; the radar pipeline is the cleanest
end-to-end example.

### 1. Add a variant arm to `share/types.ts`

Extend the discriminated union with the metadata the card or download
path needs. Be conservative: only fields a downstream reader will
read. Anything reconstructable from the live data should not land in
`ShareItem`.

```typescript
export type ShareItem =
  | (ShareItemBaseFields & { type: "barChart"; /* ... */ })
  // ...
  | (ShareItemBaseFields & {
      type: "myNewChart"
      scenarioIds: string[]
      myFeatureFlag?: boolean
    })
```

`PersistedShareItem` is currently `ShareItem` itself (the alias is
kept so a future strip-on-save policy can reintroduce an
`Omit<...>` without rewriting every caller), so a new variant is
automatically covered.

### 2. Add a `CAPTURE_DIMENSIONS` entry

```typescript
// share/capture/dimensions.ts
export const CAPTURE_DIMENSIONS = {
  // ...
  myNewChart: { width: 600, height: 400 },
} as const satisfies Record<string, CaptureSize>
```

This is the only place dimensions are declared. The off-screen
adapter, the PNG download fallback, and any compose-mode backdrop all
read from here so the captured SVG and the downloaded PNG cannot
drift.

### 3. Build a snapshot wrapper (with the `onReady` contract)

The snapshot is a thin React component that renders the chart with
capture-mode props pre-bound. It must accept three props:

- `interactive?: boolean` (default `true`). When `false`, the chart
  must skip mouse handlers, hover state, click pinning, cursor
  styling, and any DOM that exists only for interactivity (ghost
  rows, hidden tooltips, axis-detail placeholders).
- `animate?: boolean` (default `true`). When `false`, transitions
  should run with duration 0 so the chart settles in one frame and
  the capture is not racing the animation.
- `onReady?: () => void`. **Contract:** must fire on **every**
  render path, including empty-data and zero-dimension bail-outs.
  The capture host waits on this signal before serializing; a missed
  fire surfaces as `onReady did not fire within timeout` after a 4 s
  deadlock. Empty data is the caller's job to filter (bail before
  invoking the capture adapter); the chart's job is just to honor
  the render-attempt handshake. See `ResilienceHeatmap.tsx` and
  `RadarPlot.tsx` for the canonical pattern: every early return
  fires `onReady` first.

#### Capture-mode visual tweaks: bundle them under one `captureMode` prop

A handful of charts need small layout differences during capture
(don't clip an `overflowY: auto` container, force a fixed column
count instead of responsive auto-fit, render an HTML title as inline
SVG `<text>` so it survives the SVG composer). Bundle every such
tweak under one `captureMode?: boolean` prop on the chart component
and have the snapshot wrapper / capture host opt in via
`captureMode={true}`.

`ResilienceHeatmapSmallMultiples` is the canonical example: it
collapses what used to be three separate flags (`forceColumns`,
`noScroll`, `titleAsSvg`) into one `captureMode` prop. New charts
should follow the same pattern; new flags accumulating one per quirk
will rot fast.

Snapshot wrappers for the visualizations shipped from `@repo/viz`
live in `packages/viz/src/components/` (`RadarPlotSnapshot`,
`ResilienceHeatmapSnapshot`, `TierGridSnapshot`,
`ResilienceQuadrantSnapshot`). For locally composed views, define
the snapshot inside the feature folder
(`exploreView/ResiliencePanelChartView`,
`strategyGrid/BarChartRowSnapshot`). Either pattern is fine; the
snapshot's only job is to render at fixed dimensions without any
live-mount side effects.

### 4. Build an `Offscreen<Variant>Capture` adapter

The adapter mounts the snapshot in `OffscreenCaptureHost` at the
declared dimensions and returns `CapturedVisual` (`{ svg, dataUrl }`)
plus any per-variant extras. It MUST NOT read from the live, on-screen
chart, even as a fallback; that is where dot-loss and scaling bugs
come from.

```typescript
"use client"

import React from "react"
import { type Theme } from "@repo/ui/mui"
import { MyChartSnapshot } from "@repo/viz"
import { offscreenCapture } from "../share/capture/OffscreenCaptureHost"
import { CAPTURE_DIMENSIONS } from "../share/capture/dimensions"
import type { CapturedVisual } from "../share/capture/types"

export interface CaptureMyChartOffscreenInput {
  // ...the data the chart needs
  theme: Theme
}

export async function captureMyChartOffscreen(
  input: CaptureMyChartOffscreenInput,
): Promise<CapturedVisual> {
  const { width, height } = CAPTURE_DIMENSIONS.myNewChart
  return offscreenCapture({
    theme: input.theme,
    width,
    height,
    captureKind: "myChart:offscreen",
    render: (onReady) => (
      <MyChartSnapshot
        // ...chart props...
        width={width}
        height={height}
        onReady={onReady}
      />
    ),
  })
}
```

For variants that draw many small SVGs (a row of glyphs, a grid of
small multiples), pass `mode: "compose"` to `offscreenCapture`. The
host stitches every descendant `<svg>` of the rendered snapshot into
one composite at the same fixed dimensions. See
`OffscreenBarChartRowCapture.tsx` and
`OffscreenResiliencePanelCapture.tsx` for reference compose-mode
adapters.

### 5. Build a `Share<Variant>Card` component

Add `cards/ShareMyChartCard.tsx`. Wrap content in `<ShareCardShell>`
and render the thumbnail via `<ChartThumbnail>`; the shell handles
the close button and note block, so the card body should only be the
header (title, badges, scenario list) and the thumbnail.

```typescript
"use client"

import React from "react"
import { Box, useTheme } from "@repo/ui/mui"
import ShareCardShell from "../ShareCardShell"
import ChartThumbnail from "./ChartThumbnail"

export interface ShareMyChartCardProps {
  id: string
  title: string
  cachedSvg?: string
  cachedImageDataUrl?: string
  liveChart?: React.ReactNode
  note?: string
  onNoteChange?: (note: string) => void
  onRemove?: (id: string) => void
}

export default function ShareMyChartCard({
  id,
  title,
  cachedSvg,
  cachedImageDataUrl,
  liveChart,
  note,
  onNoteChange,
  onRemove,
}: ShareMyChartCardProps) {
  const theme = useTheme()
  return (
    <ShareCardShell
      note={note}
      onNoteChange={onNoteChange}
      onRemove={onRemove ? () => onRemove(id) : undefined}
    >
      <Box sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
        {title}
      </Box>
      <ChartThumbnail
        cachedSvg={cachedSvg}
        cachedImageDataUrl={cachedImageDataUrl}
        liveChart={liveChart}
        ariaLabel={title}
        variant="bordered"
      />
    </ShareCardShell>
  )
}
```

### 6. Register the variant in `share/variants.ts`

Create `share/variants/myNewChart.ts` and register it in the table:

```typescript
// share/variants/myNewChart.ts
import React from "react"
import ShareMyChartCard from "../cards/ShareMyChartCard"
import type { ShareItemOfType } from "../types"
import type { VariantHandler } from "../variants"

type MyChartItem = ShareItemOfType<"myNewChart">

const myNewChartHandler: VariantHandler<MyChartItem> = {
  type: "myNewChart",
  urlPrefix: "m",                  // pick an unused letter
  rasterDimensionsKey: "myNewChart",

  renderCard(item, ctx) {
    return React.createElement(ShareMyChartCard, {
      id: item.id,
      title: ctx.scenarioLookup.get(item.scenarioIds[0]!)?.name ?? "Chart",
      cachedSvg: item.cachedSvg,
      cachedImageDataUrl: item.cachedImageDataUrl,
      note: item.note,
      onNoteChange: ctx.onNoteChange,
      onRemove: ctx.onRemove,
    })
  },

  encodeUrlToken(item) {
    const ids = item.scenarioIds.join("~")
    const flag = item.myFeatureFlag ? "1" : ""
    return `${ids}.${flag}`
  },

  decodeUrlToken(parts) {
    if (parts.length < 1) return null
    return {
      id: crypto.randomUUID(),
      type: "myNewChart",
      scenarioIds: (parts[0] ?? "").split("~").filter(Boolean),
      myFeatureFlag: (parts[1] ?? "") === "1",
    }
  },

  filenameLabel(item) {
    return `coeqwal-mychart-${item.scenarioIds.length}scenarios`
  },

  // Optional. Implement if cachedChartData carries a meaningful payload
  // and downstream tools should be able to download it as a table.
  // Always start the section with `buildCsvHeaderBlock` so the
  // preamble (variant title, scenario(s), hydroclimate, tier legend)
  // matches every other variant. If your data has tier columns, set
  // `includeTierScale: true` and emit tier values as integers 1-4 -
  // see "CSV pipeline" below for the full convention.
  exportCsv(item, lookups) {
    if (!item.cachedChartData) return null
    const scenarios = item.scenarioIds.map((id) => ({
      id,
      label: lookups.scenarioNameLookup(id),
    }))
    const header = buildCsvHeaderBlock({
      variantTitle: "My new chart",
      scenarios,
      includeTierScale: true, // drop if your data has no tier column
    })
    const rows = /* build data rows from item.cachedChartData */
    return [...header, "", ...rows].join("\n")
  },
}

export default myNewChartHandler
```

```typescript
// share/variants.ts
import myNewChartHandler from "./variants/myNewChart"

export const VARIANT_REGISTRY = {
  barChart: barChartHandler,
  radar: radarHandler,
  equity: equityHandler,
  resilience: resilienceHandler,
  myNewChart: myNewChartHandler, // <- new
} as const satisfies ShareVariantRegistry
```

The `satisfies` clause turns a missing handler into a compile error
right here. Once the row is added, `ShareItemView`, `url.ts`, the
PNG/SVG/CSV download paths in `Share.tsx`, and `exportUtils.ts` all
pick up the new variant automatically.

### 7. Wire the capture site via `stageShareItem`

Every call site funnels through `share/stage.ts#stageShareItem`, which
runs the capture inside a try/catch, hands the result (or `null`) to
the `buildItem` function, and always calls `addItem` so the share
card still renders if capture fails (the card falls back to the live
chart).

```typescript
import { stageShareItem } from "../share/stage"

await stageShareItem({
  capture: () => captureMyChartOffscreen({ theme, /* ... */ }),
  buildItem: (captured) => ({
    type: "myNewChart",
    id: makeId(),
    scenarioIds: [scenarioId],
    cachedSvg: captured?.svg,
    cachedImageDataUrl: captured?.dataUrl,
    cachedChartData: liveChartData,
  }),
  addItem: addShareItem,
  errorLabel: "myNewChart:share",
})
```

### 8. (Optional) Re-export the new card from `share/index.ts`

If something outside the `share/` folder will mount the card directly
(rare; usually `ShareItemView` is the only entry point), add it to
the barrel export. Most variants don't need this step — `ShareItemView`
is the public render entry point and reaches the card through the
registry.

## Bulk download paths

`apps/main/app/components/tabPanels/Share.tsx` exposes
`downloadShareItemAsPng` and `downloadShareItemAsSvg`. The PNG path
prefers `cachedSvg` (rasterized on demand at the per-variant pixel
size from `CAPTURE_DIMENSIONS`), falls back to a live `html-to-image`
capture of the rendered card body, and finally to the legacy PNG.
The SVG button is shown whenever `cachedSvg` is present and embeds
an `@import` for the Neue Haas font family so renderers that honor
web fonts match the on-screen typography.

CSV export for the whole tray flows through
`exportAllShareItemsAsCSV` (in `dataExplorer/utils/exportUtils.ts`),
which iterates the items and asks each handler's `exportCsv` for its
section. Per-variant CSV body builders (`barChartDataToCSV`,
`radarDataToCSV`, `equityDataToCSV`,
`resilienceHeatmapDataToCSV`, `resilienceQuadrantDataToCSV`) live in
the same file and are imported by the handlers; they are pure
string-builders so the same code drives single-item and bulk export.

### CSV pipeline conventions

Every variant CSV section, single-card or bulk, uses the same shape:

```
Coeqwal export,<variant title>
Scenario,<label>                   (or Scenarios,<a>; <b>; <c>)
Hydroclimate,<hc>                  (when present)
Compared to baseline,yes|no        (when applicable)
<extra key,value rows>             (e.g. Subject / View / Encoding for resilience)
Tier scale,1 = Optimal | 2 = Acceptable | 3 = At-risk | 4 = Critical
                                   (blank line)
<table header row>
<data rows...>
```

The header block is emitted by `buildCsvHeaderBlock(input)` in
`exportUtils.ts`. New variant CSV writers MUST call it; do not roll
your own `Scenario,…` / `Compared to baseline,…` rows. The variant
handler is the right place to populate `CsvHeaderInput`: it has the
share item, the scenario-name lookup, and the per-variant context.

#### Tier representation

Wherever a tier value appears as a data cell, emit it as an integer
1-4 (decimal sub-tier scores are allowed when the chart axis is
continuous, e.g. radar). Set `includeTierScale: true` so the legend
ships in the header block. Bar chart's pivoted layout keeps tier
**labels** as column headers (those are bin labels, not values); it
still passes `includeTierScale: true` for consistency.

For comparison columns (e.g. `Tier` vs `Baseline tier`) both columns
must use the same representation. The equity payload now carries
`tierLevel: number` and `baselineTierLevel: number` (added in
`useEquityObjectives`); use those rather than the legacy formatted
`"Tier N"` strings.

#### Bulk export section banners

`exportAllShareItemsAsCSV` prefixes each section with a single-cell
banner row of the form `########  <variant title> - <scenario(s)>`,
extracted from the section's own header block. The banner makes
section boundaries trivial to find when the file is opened in a
spreadsheet without breaking column alignment.

#### Filename convention

PNG, SVG, and CSV downloads all derive their filename from
`handler.filenameLabel(item)`, with extension and timestamp added by
`getTimestampedFilename`. The CSV path additionally appends a
`-data` suffix so a user with all three downloads from the same card
can sort them next to each other:

```
coeqwal-distribution-s0042-2026-XX-XX.png
coeqwal-distribution-s0042-2026-XX-XX.svg
coeqwal-distribution-s0042-data-2026-XX-XX.csv
```

`filenameLabel` should always include the scenario identity (a
single id, a count, or a stable feature like view name); two cards
of the same variant from different scenarios must produce different
filenames or the user can't tell their downloads apart.

### Known limitation: one raster size per variant type

`shareItemRasterSize` (in `Share.tsx`) currently maps each
`ShareItem["type"]` to one entry in `CAPTURE_DIMENSIONS` via the
handler's `rasterDimensionsKey`. That's fine for `barChart`, `radar`,
and `equity`, which capture at one fixed size. It rounds resilience
panel / single-tile / quadrant captures down to one shared size
(`resiliencePanel`) when PNG fallback rasterization happens — a
URL-restored resilience tile rasterizes against the panel size, not
its own size.

Live behavior is unaffected today because `cachedSvg` carries the
correct viewBox and the live card path uses `html-to-image` against
the rendered card. The only path that hits the wrong size is
PNG-from-cachedSvg with no live element mounted (a tray-only
URL-restored resilience tile, which is rare). When that becomes a
real problem, replace `rasterDimensionsKey` with an item-level
resolver: `rasterDimensions: (item) => CaptureSize`. The handler
can then look at `item.tileScope` (panel / scenario / outcome /
hydroclimate / quadrant) and pick the correct
`CAPTURE_DIMENSIONS` entry. **Out of scope for now.**

## Persistence

`share/persist.ts` is the single owner of the localStorage envelope.
Every change to `shareItems` or `storyItemIds` flows through
`saveShareState` via the store subscription, and the store hydrates
once at startup with `loadShareState`. The storage key is
`SHARE_STORAGE_KEY` and the on-disk shape is `PersistedShareItem`.

Two layers of versioning, used independently:

- `SHARE_STORAGE_KEY` is the localStorage key. Bumping it silently
  discards every prior version's items. Use when no migration can
  express the change ("start fresh" is the right user-facing
  behavior).
- `SHARE_STORAGE_VERSION` is the envelope schema version, walked
  forward by `migrateEnvelope`. Use when the new build CAN read old
  data with a transformation.

## URL versioning

Share URLs always include `v=<SHARE_URL_VERSION>`. `parseShareUrl`
returns `versionMismatch: true` when the URL declares a version
different from the current build. The store has a
`shareUrlVersionMismatch` flag and a `dismiss…` action; the Share
tab renders a notice so the recipient understands why their view may
differ from the sender's.

Bump `SHARE_URL_VERSION` for any backward-incompatible grammar
change. Adding a new variant prefix is not a breaking change.
