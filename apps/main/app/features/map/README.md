# Map feature

Persistent Mapbox GL map used across the Learn, Get Started, and Explore tabs.

## Architecture

- **`MapInstance.tsx`** single full-viewport `<Map>` component (position: fixed, 100vw × 100vh). Navigation and geolocate controls are placed bottom-left. In explore mode the whole control cluster slides to the bottom-right of the visible 25% strip.
- **`PersistentMapWrapper.tsx`** thin shell: `MapInstance` + `LayerOrchestrator`.
- **`LayerOrchestrator.tsx`** composes `BaseLayers` and `VisualizationLayers` and derives their visibility from map mode and the active outcome. The per-outcome layer activation itself lives in `VisualizationLayers` / `useOutcomeVisualization`.
- **`store.ts`** Zustand store for map mode, active outcome visualization, explore panel width / camera view, and tier-animation location highlights.
- **`config/outcomeLayerRegistry.ts`** single source of truth for all outcome layer configs (geometry type, Mapbox layer IDs, tooltip fields, camera presets/bounds).
- **`config/cameraPresets.ts`** named `CameraView` (center + zoom) and `cameraBounds` (`[[sw], [ne]]`) constants.
- **`config/resolveOutcomeCamera.ts`** pure resolver that turns an outcome + map mode into a camera action: `fitBounds` for `cameraBounds`, `easeTo` for `cameraPreset`, mode-specific default otherwise. Shared by the Learn/Explore reactive camera and the Get Started inline camera so the priority logic lives in one place.
- **`visualizationLayers/hooks/useOutcomeVisualization.ts`** activates/deactivates a layer, fetches tier data, drives camera on outcome click.

---

## How locations are resolved for the map

The tier API (`/api/tiers/scenarios/{scenario}/locations?codes={tier}`) returns `location_id`, `tier_level`, and `tier_value`. The API does not return coordinates or geometry. The map resolves positions from two separate sources depending on the outcome type.

This `/locations` endpoint serves the multi-value outcomes (CWS_DEL, AG_REV, GW_STOR, RES_STOR, ENV_FLOWS, FW_DELTA_USES), where each outcome has many per-location tier levels. Single-value outcomes (`requiresIdMatching: false`, e.g. DELTA_ECO, WRC_SALMON_AB) instead read one tier level from `/api/tiers/scenarios/{scenario}/tiers` (the same payload the glyphs use), and `useTierData` synthesizes a single location keyed by the outcome code. Either way the downstream shape is the same: an id plus a tier level, no geometry.

### Polygon outcomes (demand units, WBAs, reservoirs, delta)

Geometry comes from **Mapbox vector tilesets** (managed in Mapbox Studio). The API's `location_id` is matched to tileset features via an `idProperty` configured in `config/outcomeLayerRegistry.ts`:

| Outcome             | Mapbox layer           | `idProperty`  | Notes                                                                         |
| ------------------- | ---------------------- | ------------- | ----------------------------------------------------------------------------- |
| `CWS_DEL`, `AG_REV` | `demand-units`         | `DU_ID`       | Demand unit polygons                                                          |
| `GW_STOR`           | `calsim-wba`           | `WBA_ID`      | Water budget area polygons                                                    |
| `RES_STOR`          | `california-reservoir` | `gnisidlabel` | Uses `RESERVOIR_CALSIM_TO_GNISIDLABEL` to translate CalSim IDs -> tileset IDs |
| `DELTA_ECO`         | `delta-detaw`          | `WBA_ID`      | Single polygon filtered to `DETAW`                                            |

Runtime source injection (`config/tilesetSources.ts`) ensures these tilesets are available on all basemap styles, not just the satellite style that includes them in its composite source.

### Point/marker outcomes (env flows, pumping plants, compliance stations, reservoir labels)

Coordinates are **hardcoded** in a single file:

**`config/outcomeLocations.ts`**

| Lookup table            | Used by                                                    | Keyed on                                    |
| ----------------------- | ---------------------------------------------------------- | ------------------------------------------- |
| `ENV_FLOWS_COORDINATES` | `TierMarkers` (diamond markers for 17 env flow stations)   | CalSim station ID (e.g. `SAC049`)           |
| `STATION_COORDINATES`   | `TierLocationLabels` (compliance + pumping plant labels)   | Station ID (`EM`, `JP`, `CAA003`, `DMC000`) |
| `RESERVOIR_CONFIGS`     | `TierLocationLabels` (reservoir label positions + stagger) | GNIS name (e.g. `"Shasta Lake"`)            |

Each map marker component imports the specific table it needs directly.

`outcomeLocations.ts` also exports a unified helper, `getOutcomeLocationCoordinates(outcomeCode, locationId)`, plus `CWS_DEL_COORDINATES`, `AG_REV_COORDINATES`, and `SALMON_RIVER_CENTROID`. These are not used by the persistent map. They feed the Get Started animation (`scenarioExplorer/animation/`), which projects outcome locations to screen space and needs coordinates for the polygon outcomes too. On the map, `CWS_DEL`/`AG_REV` render as demand-unit polygons and salmon renders as a highlighted river line, so none of them resolve through this helper here.

### How to add a new point outcome to the map

1. Get `location_id` values from the tier API response
2. Add `[lng, lat]` coordinates to the appropriate table in `config/outcomeLocations.ts` (or create a new table), keyed by `location_id`
3. Register the outcome in `config/outcomeLayerRegistry.ts` with `geometryType: "react-marker"` and `layerType: "marker"`
4. Wire the new table into the marker component that renders it (`TierMarkers` or `TierLocationLabels`). These read their tables directly, so a new table is not picked up until you reference it there.
5. If the Get Started animation also needs these coordinates, add a case to `getOutcomeLocationCoordinates()` (animation only, not the map)

### Data flow

```
Tier API (/locations)
  -> location_id + tier_level
  -> useTierData hook builds tierColorMap / tierLevelMap / featureIds

Polygon path:
  featureIds + idProperty -> OutcomePolygonLayer matches against Mapbox tileset features

Point/marker path:
  location_id -> outcomeLocations.ts lookup -> TierMarkers / TierLocationLabels renders at [lng, lat]
```

---

## How to add a camera zoom for an outcome

When a user clicks a glyph or radar dot for an outcome, the map zooms to a view defined in `outcomeLayerRegistry.ts`. Two options:

| Field                        | Camera method              | Use when                                              |
| ---------------------------- | -------------------------- | ----------------------------------------------------- |
| `cameraPreset: CameraView`   | `map.easeTo(center, zoom)` | Single focal point (e.g. Delta, pumping plants)       |
| `cameraBounds: [[sw], [ne]]` | `map.fitBounds(bounds)`    | Distributed polygons spanning a region (e.g. CWS_DEL) |

`cameraBounds` takes priority over `cameraPreset`. `resolveOutcomeCamera` caps every `cameraBounds` fit at `maxZoom: 9`, so tight two-point extents (the `FW_*` station pairs) do not over-zoom.

### Example - adding bounds for a new outcome

**1. Measure the extent** (see section below).

**2. Add a constant to `config/cameraPresets.ts`:**

```ts
export const MY_OUTCOME_BOUNDS: [[number, number], [number, number]] = [
  [-122.5, 33.0], // SW [lng, lat]
  [-116.5, 38.8], // NE [lng, lat]
]
```

**3. Import and set it in `config/outcomeLayerRegistry.ts`:**

```ts
import { ..., MY_OUTCOME_BOUNDS } from "./cameraPresets"

MY_OUTCOME: {
  // ...existing fields...
  cameraBounds: MY_OUTCOME_BOUNDS,
},
```

---

## How to measure the extent of a Mapbox layer

The demand-unit (and other tileset) polygon geometries live only in Mapbox - not in the repo. To measure the actual bounding box of a layer:

### Step 1 Expose the map instance temporarily

`MapInstance.tsx` already exposes the Mapbox instance as `window.__mapInstance` in development mode (guarded by `process.env.NODE_ENV === "development"`). It is set inside `handleMapLoad` and is available after the map fires its first load event. No code change is needed - just make sure you are running the dev server.

### Step 2 Load the app and activate the outcome

Open the app in the browser, navigate to the Explore tab, enable the map, and click the glyph for the outcome you want to measure. Zoom out so the whole state is visible (tiles need to be loaded).

### Step 3 Run this in the browser console

```javascript
const map = window.__mapInstance // set automatically in dev mode by MapInstance.tsx

// Replace 'demand_units' and the filter to match your layer.
// Note: the Mapbox tileset source-layer is 'demand_units' (underscore).
const features = map.querySourceFeatures("composite", {
  sourceLayer: "demand_units",
})

let minLng = Infinity,
  maxLng = -Infinity
let minLat = Infinity,
  maxLat = -Infinity

features.forEach((f) => {
  const rings =
    f.geometry.type === "Polygon"
      ? f.geometry.coordinates
      : f.geometry.coordinates.flat() // MultiPolygon
  rings.flat().forEach(([lng, lat]) => {
    if (lng < minLng) minLng = lng
    if (lng > maxLng) maxLng = lng
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
  })
})

console.log("SW:", [minLng.toFixed(4), minLat.toFixed(4)])
console.log("NE:", [maxLng.toFixed(4), maxLat.toFixed(4)])
console.log(
  `cameraBounds: [[${minLng.toFixed(3)}, ${minLat.toFixed(3)}], [${maxLng.toFixed(3)}, ${maxLat.toFixed(3)}]]`,
)
```

> **Note:** `querySourceFeatures` only returns features whose tiles are currently loaded. Zoom out to the state overview before running to maximise coverage.
>
> This recipe queries the `composite` source, which only holds these tilesets on the **satellite** basemap. On the Light or Streets basemaps the tileset is injected as a standalone source (e.g. `coeqwal-demand-units`, see `config/tilesetSources.ts`), so switch to satellite before measuring, or pass that source id instead of `"composite"`.

### Step 4 Hardcode the result

Copy the output into `cameraPresets.ts` and set `cameraBounds` in the registry entry. The `window.__mapInstance` assignment in `MapInstance.tsx` is dev-only and does not need to be removed. It is a no-op in production.

---

## Existing camera bounds

All bounds constants live in `config/cameraPresets.ts` and are wired to outcomes in `config/outcomeLayerRegistry.ts`. `AG_REV` and `GW_STOR` reuse `CWS_DEL_BOUNDS`, so the constant name covers more than just CWS.

| Outcome(s)                     | Constant               | Value                                      | Coverage                                                                                                    |
| ------------------------------ | ---------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `CWS_DEL`, `AG_REV`, `GW_STOR` | `CWS_DEL_BOUNDS`       | `[[-123.525, 34.995], [-118.803, 41.745]]` | Urban demand units (167 features), measured from the `demand_units` tileset filtered to `Class === "Urban"` |
| `DELTA_ECO`                    | `DELTA_ECO_BOUNDS`     | `[[-122.0, 37.7], [-121.1, 38.85]]`        | Legal Delta (DETAW polygon), measured from the `geoschem` tileset (`WBA_ID === "DETAW"`)                    |
| `RES_STOR`                     | `RES_STOR_BOUNDS`      | `[[-123.68, 36.26], [-117.66, 42.8]]`      | 7 reservoir markers, with extra vertical padding for the label stack above Trinity Lake                     |
| `ENV_FLOWS`                    | `ENV_FLOWS_BOUNDS`     | `[[-123.804, 36.295], [-119.897, 41.72]]`  | 17 environmental-flow monitoring stations                                                                   |
| `FW_DELTA_USES`                | `FW_DELTA_USES_BOUNDS` | `[[-121.82, 37.95], [-121.47, 38.2]]`      | 2 Delta salinity compliance stations (Emmaton + Jersey Point), `maxZoom: 9`                                 |
| `FW_EXP`                       | `FW_EXP_BOUNDS`        | `[[-121.72, 37.75], [-121.49, 37.95]]`     | 2 export pumping plants (Banks + Jones), `maxZoom: 9`                                                       |
