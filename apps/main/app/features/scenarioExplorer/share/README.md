# Share system

This directory owns everything user-facing for the share feature: the
drawer, the cards rendered in the tray and story canvas, the off-screen
capture pipeline, the localStorage envelope, and the URL grammar. The
goal is that adding a new visualization to the share system means adding
one capture function and one card; everything else is generic.

```
share/
  index.ts                  Barrel; the only stable public surface.
  types.ts                  ShareItem, ShareItemPatch, PersistedShareItem.
  persist.ts                loadShareState / saveShareState + storage key.
  url.ts                    encodeShareItems / parseShareUrl + SHARE_URL_VERSION.
  ShareItemView.tsx         Variant -> card dispatcher (single source of truth).
  ShareCardShell.tsx        Common card chrome (border, remove button, note).
  ShareDrawer.tsx           The right-edge tray.
  cards/
    ShareScenarioCard.tsx   barChart variant.
    ShareRadarCard.tsx      radar variant.
    ShareSnapshotCard.tsx   equity variant (and resilience tile snapshots).
    ResilienceShareCard.tsx resilience variant (panel + small multiples).
    SvgThumbnail.tsx        Inline-SVG renderer, prefer over <img>.
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
- `radar`
- `equity` (distribution view; renders via the snapshot card)
- `resilience` (heatmap panel + small multiples + leverage scatter)

Every variant captures `cachedSvg` (serialized SVG, computed styles
inlined) and `cachedImageDataUrl` (rasterized PNG companion) at share
time. The share cards render their thumbnail from `cachedSvg`. When
neither cache is present (URL-restored items), the card falls back to
a live re-render from `cachedChartData`.

Single-SVG charts (radar, equity TierGrid, resilience heatmap, leverage
quadrant) capture via `OffscreenCaptureHost`: the chart is mounted in a
hidden div with capture-mode props, awaits `onReady`, and serializes the
DOM SVG. Composed-React variants (the bar-chart row of OutcomeGlyphs and
the resilience small-multiples panel) capture via `composeAndRasterize`:
every descendant `<svg>` of the live container is stitched into one
stand-alone SVG document at its on-screen position.

`PersistedShareItem` is the on-disk shape. `persist.ts#toPersisted`
strips `cachedChartData` (live data, rebuilt at render time) and keeps
both `cachedSvg` and `cachedImageDataUrl` so reload restores the same
thumbnail and downloads continue to work without a fresh capture.

## Adding share to a new visualization

There are three things to wire up.

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

No further `PersistedShareItem` change is needed: it is defined as
`Omit<ShareItem, "cachedChartData">`, so a new variant is automatically
covered. `persist.ts#toPersisted` uses the same omit-driven shape.

### 2. Add a capture function

The capture function runs at share time and produces both an SVG string
and a rasterized PNG companion. It MUST NOT read from the live, on-
screen chart for single-SVG variants, that is where dot-loss bugs come
from. Render the chart off-screen via `OffscreenCaptureHost` instead.

```typescript
"use client"

import React from "react"
import { type Theme } from "@repo/ui/mui"
import { MyChartSnapshot } from "@repo/viz"
import { offscreenCapture } from "../share/capture/OffscreenCaptureHost"

export interface CaptureMyChartOffscreenInput {
  // ...the data your chart needs
  theme: Theme
  width?: number
  height?: number
}

export async function captureMyChartOffscreen(
  input: CaptureMyChartOffscreenInput,
): Promise<{ svg: string; dataUrl: string }> {
  const width = input.width ?? 600
  const height = input.height ?? 600

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
        responsive={false}
        onReady={onReady}
      />
    ),
  })
}
```

`offscreenCapture` handles the hidden-div lifecycle, the `onReady`
timeout, the SVG clone + style inlining, the PNG rasterization, and
diagnostics. Pass a `MyChartSnapshot` wrapper from `@repo/viz` that
pre-binds `interactive=false` and `animate=false` so any caller
forgetting the props still gets a deterministic capture. See
`packages/viz/src/components/RadarPlotSnapshot.tsx`,
`ResilienceHeatmapSnapshot.tsx`, `TierGridSnapshot.tsx`, and
`ResilienceQuadrantSnapshot.tsx` for reference snapshot wrappers.

#### Composed-React variants

When the live card is a layout of many small SVG glyphs (e.g. the
list-view bar-chart row, the resilience small-multiples panel), use
`composeAndRasterize(hostEl)` from `dataExplorer/utils/exportUtils`
instead. It clones every descendant `<svg>` of `hostEl`, inlines
their computed styles, and stitches them into one composite SVG at
their on-screen positions. Add a stable `data-*-scenario-id`
attribute on the host so the share button can locate it without
prop drilling, then call `composeAndRasterize` from your share
handler.

#### Capture-mode props

For the off-screen capture to be deterministic, the chart component
itself needs three props the live mount does not need:

- `interactive?: boolean` (default `true`). When `false`, the chart
  must skip mouse handlers, hover state, click pinning, cursor
  styling, and any DOM that exists only for interactivity (think
  ghost rows, hidden tooltips, axis-detail placeholders).
- `animate?: boolean` (default `true`). When `false`, transitions
  should run with duration 0 so the chart settles in one frame and
  the capture is not racing the animation.
- `onReady?: () => void`. Called once after the chart has rendered
  to the DOM and any post-frame layout has settled. The capture
  function awaits this before serializing. Schedule the call in a
  `requestAnimationFrame` from the end of your last build pass, and
  guard against double fires.

`RadarPlot.tsx` is the reference implementation; copy its pattern.

### 3. Add a card

Add a `cards/ShareMyChartCard.tsx` that wraps content in
`<ShareCardShell>` and renders a thumbnail. Prefer `<SvgThumbnail svg={cachedSvg}>`
when `cachedSvg` is present; otherwise fall through to a live
re-render component, otherwise show a placeholder. The shell handles
the close button and note block, so the card body should only be the
header (title, badges, scenario list) and the thumbnail.

```typescript
"use client"

import React from "react"
import { Box, useTheme } from "@repo/ui/mui"
import ShareCardShell from "../ShareCardShell"
import SvgThumbnail from "./SvgThumbnail"

export interface ShareMyChartCardProps {
  id: string
  title: string
  cachedSvg?: string
  liveChart?: React.ReactNode
  note?: string
  onNoteChange?: (note: string) => void
  onRemove?: (id: string) => void
}

export default function ShareMyChartCard({
  id,
  title,
  cachedSvg,
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
      {cachedSvg ? (
        <SvgThumbnail svg={cachedSvg} ariaLabel={title} />
      ) : (
        liveChart ?? null
      )}
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
      liveChart={/* optional fallback */}
      note={item.note}
      onNoteChange={noteHandler}
      onRemove={onRemove}
    />
  )
}
```

### 4. Update the URL grammar

Pick a one-letter prefix for your variant in `share/url.ts` and add
`encodeOne` / `decodeOne` cases. Keep the encoding compact: skip
fields that equal the variant's default, use `~` for inner lists,
omit trailing empty segments. Bump `SHARE_URL_VERSION` if the change
is backwards-incompatible (adding a brand-new prefix is not, removing
or repurposing one is).

## Download paths

`apps/main/app/components/tabPanels/Share.tsx` exposes
`downloadShareItemAsPng` and `downloadShareItemAsSvg`. The PNG path
prefers `cachedSvg` (rasterized on demand at the per-variant pixel
size declared in `RASTER_SIZE`), falls back to a live `html-to-image`
capture of the rendered card body, and finally to the legacy PNG.
The SVG button is shown whenever `cachedSvg` is present and embeds an
@import for the Neue Haas font family so renderers that honor web
fonts match the on-screen typography.

Adding a new variant means adding a row to `RASTER_SIZE` and a label
fragment to `shareItemFilenameLabel`. The bulk-download path uses the
same helpers.

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
`shareUrlVersionMismatch` flag and a `dismiss…` action; the Share tab
will render a notice (P2.7) so the recipient understands why their
view may differ from the sender's.

Bump `SHARE_URL_VERSION` for any backward-incompatible grammar
change. Adding a new variant prefix is not a breaking change.
