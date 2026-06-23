# Share system

This folder lets a user save a chart as a card, collect cards into a story, and share or download them. Each kind of chart is a "variant" (barChart, radar, equity, resilience).

The key idea: every variant is described by one `VariantHandler` row in `variants.ts`. The dispatchers (card render, URL encode and decode, filename, raster size, CSV) read from that registry.

## How it flows

When a user clicks a share button (in chart controls or the scenario sidebar), the tool's capture hook runs an off-screen snapshot, builds a `ShareItem`, and appends it to the workspace store. Both display sections (the Share drawer and the Share tab panel) render the saved items the same way, through `ShareItemView` and the variant registry. URL encoding, PNG/SVG download, and CSV export all dispatch through the same registry row.

```
Share button              (chart controls or scenario sidebar)
  -> useYourToolShareCapture   (off-screen snapshot, build ShareItem)
  -> stageShareItem            (capture in try/catch)
  -> workspaceStore.addShareItem
  -> ShareDrawer / SharePanel  (render the tray)
  -> ShareItemView             (single dispatcher per item)
  -> VARIANT_REGISTRY[type].renderCard
```

**Read path:**

| File | Role |
| ---- | ---- |
| `ShareItemView.tsx` | Single dispatcher: hands each `ShareItem` to `handlerForItem(item).renderCard` |
| `ShareDataRehydrationHost.tsx` | Mounts each variant's optional `DataRehydrator` for URL-restored items |
| `ShareDrawer.tsx` / `tab/SharePanel.tsx` | Share UI surfaces |
| `url.ts` / `useShareUrlRehydration.ts` | Encode and decode share deep links |
| `live/*` | Live fallback charts when `cachedSvg` is missing (e.g. URL load) |
| `export/csv/*` | CSV bodies that handlers delegate to via `exportCsv` |
| `persist.ts` | localStorage persistence for the share tray |
| `ShareRadarLiveProvider.tsx` / `hooks/useShareRenderContext.ts` | Build the shared `RenderContext` (scenario lookups, per-hydroclimate live radar data, outcome names) that both surfaces pass to `renderCard` |
| `utils/shareRadarLiveData.ts` | `ShareRadarHydroKey` and the per-climate field shaping the provider fetches |

## Files you will touch most

Adding a variant = about four new files plus a handful of one-line edits. Tags below: **new** (you write it), **edit** (usually one line), **optional**, **import** (use as-is).

```
share/
  variants/<tool>.ts       new       the handler (the substantive file)
  types.ts                 edit      add one arm to the ShareItem union
  variants.ts              edit      add one row to VARIANT_REGISTRY
  capture/dimensions.ts    edit      add one CAPTURE_DIMENSIONS size entry
  cards/ShareMyChartCard.tsx   optional  bespoke card, or reuse ShareSnapshotCard (like distribution/equity)
  export/csv/<tool>Csv.ts  new       CSV body for exportCsv
  capture/adapters/index.ts    optional  convenience re-export of the capture fn
  ShareCardShell.tsx       import    shared card chrome at the share root
  stage.ts                 import    stageShareItem helper, called from the hook

tools/panels/<tool>/
  OffscreenMyChartCapture.tsx  new   capture adapter (renders a @repo/viz snapshot, e.g. RadarPlotSnapshot)
  useMyToolShareCapture.ts     new   capture hook

explorer/
  useExploreShareCapture.ts    edit  compose the tool hook (step 8)
  ActiveToolPanel.tsx          edit  pass the share prop into controls (step 8)
```

The rest of the folder is shared machinery you read but do not edit per variant. See the **Read path** table above.

**Note:** `barChart` is a valid variant but is staged from the list grid (`tools/panels/list/grid/StrategyGridRow.tsx`), not from a tool-panel share hook. the list view has an overall different structure than the other tools because it was developed first and doesn't work with the scenario sidebar. When adding share to a new visualization tool, copy equity or radar, not barChart.

## How to add a variant

Steps 1-6 build the variant's data shape, capture, card, and registry handler. Step 7 adds the tool capture hook. Step 8 wires that hook into the explorer shell. The work spans three places: this `share/` folder, `@repo/viz` (step 3), and the tool's own folder under `tools/panels/` (steps 4 and 7). See [Reference implementations](#reference-implementations) for which existing variant to reference if you like.

1. **Add to `types.ts`:** Extend the `ShareItem` union with only the fields a reader actually needs. Anything you can rebuild from live data does not belong in `ShareItem`.

   ```typescript
   | (ShareItemBaseFields & {
       type: "myChart"
       scenarioIds: string[]
     })
   ```

2. **Add a `CAPTURE_DIMENSIONS` entry** in `capture/dimensions.ts`. This is the only place the capture size is declared, so the saved SVG and the downloaded PNG cannot drift apart. Sorry that these are magic numbers. Still trying to figure out what dimensions work, and how to make them responsive, etc.

   ```typescript
   myChart: { width: 600, height: 400 },
   ```

The off-screen capture (the next two steps) has three layers. You write only the adapter; the other two you reuse:

- **Host** (`offscreenCapture` in `capture/OffscreenCaptureHost.tsx`): chart-agnostic engine. Mounts whatever element you give it into a hidden, fixed-size container, waits for `onReady`, then serializes the `<svg>` and rasterizes the PNG. You do not need to touch it.
- **Snapshot** (`RadarPlotSnapshot`, `TierGridSnapshot` in `@repo/viz`): the render target. A thin wrapper that pins `interactive={false}` / `animate={false}` and forwards `onReady` (step 3).
- **Adapter** (`Offscreen<Tool>Capture.tsx` in the tool folder): the glue you write (step 4). It shapes your chart's props, calls the host, and in the host's `render` callback returns the snapshot.

3. **Get a capture-mode snapshot of your chart, from `@repo/viz`:** A snapshot wrapper is a thin component that pins `interactive={false}` and `animate={false}` on the underlying chart and forwards `onReady`. `RadarPlotSnapshot` and `TierGridSnapshot` are existing examples. These live in `@repo/viz` (not in this folder...they could be though). The underlying chart (like `RadarPlot`, `TierGrid`) is must support `interactive`, `animate`, and an `onReady` that fires once on every render path, including empty-data bail outs, because the capture host waits for it before serializing.

4. **Build an `OffscreenMyChartCapture` adapter** next to the tool it captures (under `tools/panels/<tool>/`). It shapes the chart props, calls `offscreenCapture`, and returns `{ svg, dataUrl }`. The adapter's whole job in the render path is to mount the snapshot and hand it the host's `onReady`:

   ```typescript
   return offscreenCapture({
     theme,
     width,
     height,
     captureKind: "myChart:offscreen",
     render: (onReady) => <MyChartSnapshot {...props} onReady={onReady} />,
   })
   ```

   It must not read from the live on-screen chart. Radar's adapter is purely declarative. Equity's is heavier, mounting a hook-using component that resolves the scenario's data (SWR) before rendering the snapshot, so copy whichever shape matches your tool. By convention, re-export it from the `capture/adapters/index.ts` barrel.

5. **Render a card:** Reuse `cards/ShareSnapshotCard` (what equity does) when a title, subtitle, chips, and a thumbnail are enough, or build a `ShareMyChartCard` in `cards/` for a bespoke layout (what radar does, because it works differently...for example, layers multiple traces on one chart). Either way, import `ShareCardShell` from `../ShareCardShell` and render the image with `ChartThumbnail`. The shell already handles the remove button and the note editor.

6. **Register the variant** in `variants.ts`. Add a handler file in `variants/` and one row to `VARIANT_REGISTRY`.

   ```typescript
   const myChartHandler: VariantHandler<MyChartItem> = {
     type: "myChart",
     urlPrefix: "m", // one unused letter, unique across the registry
     rasterDimensionsKey: "myChart",
     renderCard(item, ctx) { /* return <ShareMyChartCard ... /> */ },
     encodeUrlToken(item) { /* token body, no prefix */ },
     decodeUrlToken(parts) { /* reverse of encodeUrlToken */ },
     filenameLabel(item, lookups) { /* download basename, no extension */ },
     exportCsv(item, lookups) { /* CSV body, or null when nothing to export */ },
     DataRehydrator: ({ items, context }) => null, // optional, see below
   }
   ```

   ```typescript
   export const VARIANT_REGISTRY = {
     barChart: barChartHandler,
     radar: radarHandler,
     equity: equityHandler,
     resilience: resilienceHandler,
     myChart: myChartHandler, // new
   } as const satisfies ShareVariantRegistry
   ```

   Cards reach the UI through `ShareItemView`, not direct imports. Re-export from `index.ts` only if something outside this folder mounts the card directly (rare).

7. **Add `useMyToolShareCapture.ts`** under `tools/panels/<tool>/`. Call `stageShareItem` from `share/stage.ts`. It runs the capture in a try/catch, builds the item, and always calls `addShareItem` so the card still renders (via live fallback) if capture fails. **Equity is the simplest template** (`useEquityShareCapture.ts`):

   ```typescript
   import { stageShareItem } from "../../../share/stage"
   import { useWorkspaceSlice } from "../../../store"
   import { captureMyChartOffscreen } from "./OffscreenMyChartCapture"

   export function useMyToolShareCapture() {
     const theme = useTheme()
     // Read whatever your item needs from the store slices, e.g. the
     // focused scenario and current hydroclimate.
     const { addShareItem, hydroclimate, myToolFocusScenario } =
       useWorkspaceSlice()

     const saveSnapshot = useCallback(async () => {
       await stageShareItem({
         capture: () => captureMyChartOffscreen({ theme }),
         buildItem: (captured) => ({
           type: "myChart",
           id: `myChart-${Date.now()}`,
           scenarioIds: [myToolFocusScenario],
           hydroclimate,
           cachedSvg: captured?.svg,
           cachedImageDataUrl: captured?.dataUrl,
         }),
         addItem: addShareItem,
         errorLabel: "useMyToolShareCapture",
       })
     }, [addShareItem, hydroclimate, myToolFocusScenario, theme])

     return useMemo(
       () => ({
         chartControlsProps: { onSaveSnapshot: () => void saveSnapshot() },
         sidebarProps: { onMyChartScenarioShare: (id: string) => { /* optional */ } },
       }),
       [saveSnapshot],
     )
   }
   ```

8. **Wire into the explorer shell:**

   - Add the hook to `ExploreShareCapture` and compose it in `explorer/useExploreShareCapture.ts`
   - Pass `share.myTool.chartControlsProps` into `YourToolChartControls` via `ActiveToolPanel`
   - If the tool supports sidebar share, thread `share.myTool.sidebarProps` through `ExplorerToolView` → `ExplorerSidebar` (see equity or radar)

   ```typescript
   // useExploreShareCapture.ts
   export type ExploreShareCapture = {
     radar: RadarShareCapture
     equity: EquityShareCapture
     resilience: ResilienceShareCapture
     myTool: MyToolShareCapture
   }

   // ActiveToolPanel.tsx
   controls={<YourToolChartControls share={share.myTool} />}
   ```

### Reference implementations

| Variant | Key files | Reference when |
| ------- | --------- | --------- |
| **Equity** | `useEquityShareCapture.ts`, `OffscreenEquityCapture.tsx`, `variants/equity.ts`, `live/ShareEquityLiveChart.tsx` | New chart tool with toolbar/sidebar share, no panel capture refs |
| **Radar** | `useRadarShareCapture.ts`, `RadarPanel.tsx` (staging), `OffscreenRadarCapture.tsx`, `variants/radar.ts` | Full pattern: panel ref registration, multi-scenario sidebar capture |
| **Resilience** | `hooks/useResilienceShareCapture.ts`, `OffscreenResilienceCapture.tsx`, `OffscreenResiliencePanelCapture.tsx`, `variants/resilience.ts`, `live/ShareResilienceLiveChart.tsx` | Matrix or heatmap tool: panel and tile capture, two off-screen adapters |
| **barChart** | `StrategyGridRow.tsx`, `variants/barChart.ts` | Row-level share from List view only, not a tool-panel template |

## A note on the React rules of hooks

Two spots in this folder are shaped a certain way only because of the rules of hooks (a hook must be called the same number of times, in the same order, on every render). Both use the same trick: render one component per item, so each component calls its hooks once.

**Hydroclimate fetches in `ShareRadarLiveProvider`:** A saved or URL-loaded item can belong to any hydroclimate, so share needs comparison data for all of them. The fetch is `useTierChartData`, a hook, so it cannot run in a loop over the list:

```typescript
// Don't do this: the hook count changes when HYDROCLIMATES changes.
HYDROCLIMATES.map((hc) => useTierChartData(hc, true))
```

Instead the provider renders one invisible `RadarLiveFetcher` per `HYDROCLIMATES` entry. Each fetcher calls `useTierChartData` once and lifts its shaped fields up to the provider, which exposes the whole map through `useShareRadarLive`. Mapping over the list to render components is allowed, so the share radar data scales with the canonical list and needs no hand edits when a hydroclimate is added.

**`DataRehydrator` is a component, not a hook:** A variant may need to re-fetch data for several URL restored items at once. Looping and calling hooks per item would break the rule above, so the handler exposes a component instead. [`ShareDataRehydrationHost.tsx`](ShareDataRehydrationHost.tsx) iterates `VARIANT_REGISTRY` and mounts each variant's `DataRehydrator` with the items that need backfill. Implement `DataRehydrator` on your handler only - no host edit. Each inner component calls hooks scoped to its own item and writes resolved data back with `context.updateShareItem(id, patch)`.

## Add a hydroclimate

Register the new hydroclimate app-wide (called `cc_new` here as a placeholder, use the real value). That is the single source of truth and covers the chooser, the resilience matrix, and share. See [How to add a hydroclimate](../../README.md#how-to-add-a-hydroclimate) in the scenario explorer README. Share derives its key from that app-wide list:

```typescript
// utils/shareRadarLiveData.ts
export type ShareRadarHydroKey = Hydroclimate // from app/content/scenarios.ts
```

Share fetches every hydroclimate through `ShareRadarLiveProvider`, which renders one fetcher per `HYDROCLIMATES` entry (see [A note on the React rules of hooks](#a-note-on-the-react-rules-of-hooks)). So once the climate is registered app-wide, share picks it up with no code change.

### Add a download filename token (optional)

In `utils/filename.ts`, add a short token to the `HC_SLUG` map, for example `cc_new: "ccnew"`. This keeps download filenames compact and readable. It is optional. Without an entry, `hydroclimateSlug` falls back to a generic slug of the value, so `cc_new` becomes `cc-new` in the filename and the download still works, just less compact.
