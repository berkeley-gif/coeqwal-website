# Share system

This directory owns everything user-facing for the share feature: the
drawer, the cards rendered in the tray and story canvas, the off-screen
capture pipeline, the localStorage envelope, and the URL grammar. The
goal is that adding a new visualization to the share system means
implementing one capture adapter and one card; everything else is
generic.

```
share/
  index.ts                        Barrel; the only stable public surface.
  types.ts                        ShareItem, ShareItemPatch, PersistedShareItem.
  persist.ts                      loadShareState / saveShareState + storage key.
  url.ts                          encodeShareItems / parseShareUrl + SHARE_URL_VERSION.
  stage.ts                        stageShareItem: build -> capture -> add.
  ShareItemView.tsx               Variant -> card dispatcher.
  ShareCardShell.tsx              Common card chrome (border, remove button, note).
  ShareDrawer.tsx                 The right-edge tray.
  capture/
    OffscreenCaptureHost.tsx      Mounts a snapshot in a hidden div, returns SVG + PNG.
    dimensions.ts                 CAPTURE_DIMENSIONS: per-variant fixed size.
    types.ts                      CapturedVisual + capture function signatures.
    captureRegistry.ts            Documentation-only cross-reference.
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
strips `cachedChartData` (live data, rebuilt at render time) and keeps
both `cachedSvg` and `cachedImageDataUrl` so reload restores the same
thumbnail and downloads keep working without a fresh capture.

## Adding share to a new visualization

There are four things to wire up. Use the existing variants as
references; the radar pipeline is the cleanest end-to-end example.

### 1. Add a variant to `ShareItem`

In `share/types.ts`, extend the discriminated union with the metadata
your new card needs. Be conservative: only fields the card or download
path will read. Anything reconstructable from the live data should not
land here.

```typescript
export type ShareItem =
  | (ShareItemBaseFields & { type: "barChart"; /* ... */ })
  | (ShareItemBaseFields & { type: "radar";    /* ... */ })
  | (ShareItemBaseFields & { type: "equity";   /* ... */ })
  | (ShareItemBaseFields & { type: "resilience"; /* ... */ })
  | (ShareItemBaseFields & {
      type: "myNewChart"
      scenarioIds: string[]
      myFeatureFlag?: boolean
    })
```

`PersistedShareItem` is defined as `Omit<ShareItem, "cachedChartData">`,
so a new variant is automatically covered.

### 2. Build a snapshot wrapper

The snapshot is a thin React component that renders your chart with
capture-mode props pre-bound. It must accept three props:

- `interactive?: boolean` (default `true`). When `false`, the chart
  must skip mouse handlers, hover state, click pinning, cursor
  styling, and any DOM that exists only for interactivity (ghost
  rows, hidden tooltips, axis-detail placeholders).
- `animate?: boolean` (default `true`). When `false`, transitions
  should run with duration 0 so the chart settles in one frame and
  the capture is not racing the animation.
- `onReady?: () => void`. Called once after the chart has rendered to
  the DOM and any post-frame layout has settled. Schedule the call
  in a `requestAnimationFrame` from the end of your last build pass
  and guard against double fires.

Snapshot wrappers for the visualizations shipped from `@repo/viz`
live in `packages/viz/src/components/` (`RadarPlotSnapshot`,
`ResilienceHeatmapSnapshot`, `TierGridSnapshot`,
`ResilienceQuadrantSnapshot`). For locally composed views, define
the snapshot inside the feature folder
(`exploreView/ResiliencePanelChartView`,
`strategyGrid/BarChartRowSnapshot`). Either pattern is fine; the
snapshot's only job is to render at fixed dimensions without any
live-mount side effects.

### 3. Add fixed dimensions

Open `share/capture/dimensions.ts` and add an entry to
`CAPTURE_DIMENSIONS`:

```typescript
export const CAPTURE_DIMENSIONS = {
  // ...
  myNewChart: { width: 600, height: 400 },
} as const satisfies Record<string, CaptureSize>
```

This is the only place dimensions are declared. The off-screen
adapter, the PNG download path in `Share.tsx`, and any compose-mode
backdrop all read from here so the captured SVG and the downloaded
PNG cannot drift.

### 4. Add a capture adapter

The adapter mounts the snapshot in `OffscreenCaptureHost` at the
declared dimensions and returns `CapturedVisual` (`{ svg, dataUrl }`)
plus any per-variant extras. It MUST NOT read from the live, on-screen
chart, even as a fallback; that is where dot-loss and scaling bugs come
from.

```typescript
"use client"

import React from "react"
import { type Theme } from "@repo/ui/mui"
import { MyChartSnapshot } from "@repo/viz"
import { offscreenCapture } from "../share/capture/OffscreenCaptureHost"
import { CAPTURE_DIMENSIONS } from "../share/capture/dimensions"
import type { CapturedVisual } from "../share/capture/types"

export interface CaptureMyChartOffscreenInput {
  // ...the data your chart needs
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
        // ...your chart props...
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

### 5. Call the adapter via `stageShareItem`

Every call site funnels through `share/stage.ts#stageShareItem`, which
runs the capture inside a try/catch, hands the result (or `null`) to
your `buildItem` function, and always calls `addItem` so the share
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

### 6. Add a card

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

Then route the new variant in `ShareItemView.tsx`:

```typescript
if (item.type === "myNewChart") {
  return (
    <ShareMyChartCard
      id={item.id}
      title={/* ... */}
      cachedSvg={item.cachedSvg}
      cachedImageDataUrl={item.cachedImageDataUrl}
      liveChart={/* optional fallback */}
      note={item.note}
      onNoteChange={noteHandler}
      onRemove={onRemove}
    />
  )
}
```

### 7. Update the URL grammar

Pick a one-letter prefix for your variant in `share/url.ts` and add
`encodeOne` / `decodeOne` cases. Keep the encoding compact: skip
fields that equal the variant's default, use `~` for inner lists,
omit trailing empty segments. Bump `SHARE_URL_VERSION` if the change
is backwards-incompatible (adding a brand-new prefix is not, removing
or repurposing one is).

### 8. Update the download path

Add a row to `RASTER_SIZE` in
`apps/main/app/components/tabPanels/Share.tsx` so the PNG download
path picks up the same dimensions, and add a label fragment to
`shareItemFilenameLabel`. The bulk-download path uses the same
helpers.

## Download paths

`apps/main/app/components/tabPanels/Share.tsx` exposes
`downloadShareItemAsPng` and `downloadShareItemAsSvg`. The PNG path
prefers `cachedSvg` (rasterized on demand at the per-variant pixel
size from `CAPTURE_DIMENSIONS`), falls back to a live `html-to-image`
capture of the rendered card body, and finally to the legacy PNG.
The SVG button is shown whenever `cachedSvg` is present and embeds
an `@import` for the Neue Haas font family so renderers that honor
web fonts match the on-screen typography.

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
