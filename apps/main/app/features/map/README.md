# Map feature

Persistent Mapbox GL map used across the Learn, Get Started, and Explore tabs.

## Architecture

- **`MapInstance.tsx`** single full-viewport `<Map>` component (position: fixed, 100vw × 100vh). Navigation and geolocate controls are placed bottom-left. In explore mode the whole control cluster slides to the bottom-right of the visible 25% strip.
- **`PersistentMapWrapper.tsx`** thin shell: `MapInstance` + `LayerOrchestrator`.
- **`LayerOrchestrator.tsx`** mounts/unmounts visualization layer hooks based on active outcome.
- **`store.ts`** Zustand store for map mode, active outcome visualization, camera padding, and tier animation highlights.
- **`config/outcomeLayerRegistry.ts`** single source of truth for all outcome layer configs (geometry type, Mapbox layer IDs, tooltip fields, camera presets/bounds).
- **`config/cameraPresets.ts`** named `CameraView` (center + zoom) and `cameraBounds` (`[[sw], [ne]]`) constants.
- **`visualizationLayers/hooks/useOutcomeVisualization.ts`** activates/deactivates a layer, fetches tier data, drives camera on outcome click.

---

## How locations are resolved for the map

The tier API (`/api/tier-map/{scenario}/{tier}/locations`) returns `location_id`, `tier_level`, and `tier_value` -- not coordinates or geometry. The map resolves positions from two separate sources depending on the outcome type.

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
| `SALMON_RIVER_CENTROID` | Single point for Sacramento River salmon outcome           | N/A                                         |

A unified helper `getOutcomeLocationCoordinates(outcomeCode, locationId)` resolves any outcome + location ID to `[lng, lat]`.

### Adding a new point outcome to the map

1. Get `location_id` values from the tier API response
2. Add `[lng, lat]` coordinates to the appropriate table in `config/outcomeLocations.ts` (or create a new table), keyed by `location_id`
3. If the outcome needs a new lookup table, add a case to `getOutcomeLocationCoordinates()`
4. Register the outcome in `config/outcomeLayerRegistry.ts` with `geometryType: "react-marker"` and `layerType: "marker"`
5. The map components (`TierMarkers`, `TierLocationLabels`) will pick up the new coordinates

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

## Adding a camera zoom for an outcome

When a user clicks a glyph or radar dot for an outcome, the map zooms to a view defined in `outcomeLayerRegistry.ts`. Two options:

| Field                        | Camera method              | Use when                                              |
| ---------------------------- | -------------------------- | ----------------------------------------------------- |
| `cameraPreset: CameraView`   | `map.easeTo(center, zoom)` | Single focal point (e.g. Delta, pumping plants)       |
| `cameraBounds: [[sw], [ne]]` | `map.fitBounds(bounds)`    | Distributed polygons spanning a region (e.g. CWS_DEL) |

`cameraBounds` takes priority over `cameraPreset`.

### Example — adding bounds for a new outcome

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

## Measuring the extent of a Mapbox layer

The demand-unit (and other tileset) polygon geometries live only in Mapbox — not in the repo. To measure the actual bounding box of a layer:

### Step 1 Expose the map instance temporarily

`MapInstance.tsx` already exposes the Mapbox instance as `window.__mapInstance` in development mode (guarded by `process.env.NODE_ENV === "development"`). It is set inside `handleMapLoad` and is available after the map fires its first load event. No code change is needed — just make sure you are running the dev server.

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

### Step 4 Hardcode the result

Copy the output into `cameraPresets.ts` and set `cameraBounds` in the registry entry. The `window.__mapInstance` assignment in `MapInstance.tsx` is dev-only and does not need to be removed — it is a no-op in production.

---

## Existing camera bounds

| Outcome   | Constant         | Coverage                                                                                                                                             |
| --------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CWS_DEL` | `CWS_DEL_BOUNDS` | `[[-122.525, 35.995], [-119.803, 40.745]]` — Urban demand units (167 features), measured from `demand_units` tileset with `Class === "Urban"` filter |
