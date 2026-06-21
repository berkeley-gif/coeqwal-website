# Share system

This folder lets a user save a chart as a card, collect cards into a
story, and share or download them. Each kind of chart is a "variant"
(barChart, radar, equity, resilience).

The key idea: every variant is described by one `VariantHandler` row in
`variants.ts`. The dispatchers (card render, URL encode and decode,
filename, raster size, CSV) all read from that registry, so a missing
variant is a compile error in `variants.ts` instead of a silent failure
somewhere downstream.

## Files you will touch most

```
share/
  types.ts            ShareItem union (one arm per variant)
  variants.ts         VariantHandler interface + VARIANT_REGISTRY
  variants/*.ts        one handler file per variant
  cards/*.tsx          the card UI for each variant
  capture/
    dimensions.ts      CAPTURE_DIMENSIONS (fixed capture size per variant)
    adapters/index.ts  re-exports the per-tool capture functions
  ShareRadarLiveProvider.tsx  fetches live radar data for every hydroclimate
  hooks/
    useShareRenderContext.ts  data the cards and exporters need
  utils/
    shareRadarLiveData.ts     ShareRadarHydroKey + radar live data
  stage.ts            stageShareItem (run capture, then add the card)
```

## Add a variant

There are five files to write and one registry row to add. The radar
variant is the cleanest end to end example to copy from.

1. **Add an arm to `types.ts`.** Extend the `ShareItem` union with only
   the fields a reader actually needs. Anything you can rebuild from
   live data does not belong in `ShareItem`.

   ```typescript
   | (ShareItemBaseFields & {
       type: "myChart"
       scenarioIds: string[]
     })
   ```

2. **Add a `CAPTURE_DIMENSIONS` entry** in `capture/dimensions.ts`. This
   is the only place the capture size is declared, so the saved SVG and
   the downloaded PNG cannot drift apart.

   ```typescript
   myChart: { width: 600, height: 400 },
   ```

3. **Build a snapshot wrapper.** A thin component that renders the chart
   at a fixed size with no interactivity. It must accept `interactive`,
   `animate`, and `onReady`. `onReady` has to fire on every render path,
   including empty data bail outs, because the capture host waits for it
   before serializing. Copy `RadarPlotSnapshot` in `@repo/viz`.

4. **Build an `OffscreenMyChartCapture` adapter** next to the tool it
   captures (under `tools/panels/<tool>/`), then re-export it from
   `capture/adapters/index.ts`. It mounts the snapshot through
   `offscreenCapture` and returns `{ svg, dataUrl }`. It must never read
   from the live on screen chart.

5. **Build a `ShareMyChartCard`** in `cards/`. Wrap the body in
   `ShareCardShell` and render the image with `ChartThumbnail`. The
   shell already handles the remove button and the note editor.

6. **Register the variant** in `variants.ts`. Add a handler file in
   `variants/` and one row to `VARIANT_REGISTRY`.

   ```typescript
   const myChartHandler: VariantHandler<MyChartItem> = {
     type: "myChart",
     urlPrefix: "m", // one unused letter, unique across the registry
     rasterDimensionsKey: "myChart",
     renderCard(item, ctx) { /* return <ShareMyChartCard ... /> */ },
     encodeUrlToken(item) { /* token body, no prefix */ },
     decodeUrlToken(parts) { /* reverse of encodeUrlToken */ },
     filenameLabel(item, lookups) { /* download basename, no extension */ },
     exportCsv(item, lookups) { /* optional CSV body or null */ },
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

7. **Wire the capture site** through `stageShareItem` in `stage.ts`. It
   runs the capture in a try and catch, builds the item, and always
   adds the card so it still renders (from the live chart) if capture
   fails.

   ```typescript
   await stageShareItem({
     capture: () => captureMyChartOffscreen({ theme }),
     buildItem: (captured) => ({
       type: "myChart",
       id: makeId(),
       scenarioIds: [scenarioId],
       cachedSvg: captured?.svg,
       cachedImageDataUrl: captured?.dataUrl,
     }),
     addItem: addShareItem,
     errorLabel: "myChart:share",
   })
   ```

Optional last step: if something outside this folder mounts the card
directly (rare), re-export it from `index.ts`. Normally `ShareItemView`
is the only entry point and reaches the card through the registry.

## A note on the React rules of hooks

Two spots in this folder are shaped a certain way only because of the
rules of hooks (a hook must be called the same number of times, in the
same order, on every render). Both use the same trick: render one
component per item, so each component calls its hooks once.

**Hydroclimate fetches in `ShareRadarLiveProvider`.** A saved or
URL-loaded item can belong to any hydroclimate, so share needs
comparison data for all of them. The fetch is `useTierChartData`, a
hook, so it cannot run in a loop over the list:

```typescript
// Don't do this: the hook count changes when HYDROCLIMATES changes.
HYDROCLIMATES.map((hc) => useTierChartData(hc, true))
```

Instead the provider renders one invisible `RadarLiveFetcher` per
`HYDROCLIMATES` entry. Each fetcher calls `useTierChartData` once and
lifts its shaped fields up to the provider, which exposes the whole map
through `useShareRadarLive`. Mapping over the list to render components
is allowed, so the share radar data scales with the canonical list and
needs no hand edits when a hydroclimate is added.

**`DataRehydrator` is a component, not a hook.** A variant may need to
re-fetch data for several URL restored items at once. Looping and
calling hooks per item would break the rule above, so the handler
exposes a component instead. The host renders one inner component per
item, and that inner component is free to call hooks scoped to its own
item. It writes the resolved data back with
`context.updateShareItem(id, patch)`.

## Add a hydroclimate

Register the new hydroclimate app-wide (called `cc_new` here as a
placeholder, use the real value). That is the single source of truth and
covers the chooser, the resilience matrix, and share. See
[Add a hydroclimate](../../README.md#add-a-hydroclimate) in the scenario
explorer README. Share derives its key from that app-wide list:

```typescript
// utils/shareRadarLiveData.ts
export type ShareRadarHydroKey = Hydroclimate // from app/content/scenarios.ts
```

Share fetches every hydroclimate through `ShareRadarLiveProvider`, which
renders one fetcher per `HYDROCLIMATES` entry (see React
rules of hooks"). So once the climate is registered app-wide, share
picks it up with no code change.

### Add a download filename token (optional)

In `utils/filename.ts`, add a short token to the `HC_SLUG` map, for
example `cc_new: "ccnew"`. This keeps download filenames compact and
readable. It is optional. Without an entry, `hydroclimateSlug` falls
back to a generic slug of the value, so `cc_new` becomes `cc-new` in the
filename and the download still works, just less compact.

