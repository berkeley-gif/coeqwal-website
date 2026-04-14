# Map Feature

Persistent Mapbox GL map used across the Learn, Get Started, and Explore tabs.

## Architecture

- **`MapInstance.tsx`** — single full-viewport `<Map>` component (position: fixed, 100vw × 100vh). Navigation and geolocate controls are placed bottom-left; in explore mode the whole control cluster slides to the bottom-right of the visible 25% strip.
- **`PersistentMapWrapper.tsx`** — thin shell: `MapInstance` + `LayerOrchestrator`.
- **`LayerOrchestrator.tsx`** — mounts/unmounts visualization layer hooks based on active outcome.
- **`store.ts`** — Zustand store for map mode, active outcome visualization, camera padding, and tier animation highlights.
- **`config/outcomeLayerRegistry.ts`** — single source of truth for all outcome layer configs (geometry type, Mapbox layer IDs, tooltip fields, camera presets/bounds).
- **`config/cameraPresets.ts`** — named `CameraView` (center + zoom) and `cameraBounds` (`[[sw], [ne]]`) constants.
- **`visualizationLayers/hooks/useOutcomeVisualization.ts`** — activates/deactivates a layer, fetches tier data, drives camera on outcome click.

---

## Adding a camera zoom for an outcome

When a user clicks a glyph or radar dot for an outcome, the map zooms to a view defined in `outcomeLayerRegistry.ts`. Two options:

| Field                        | Camera method              | Use when                                              |
| ---------------------------- | -------------------------- | ----------------------------------------------------- |
| `cameraPreset: CameraView`   | `map.easeTo(center, zoom)` | Single focal point (e.g. Delta, pumping plants)       |
| `cameraBounds: [[sw], [ne]]` | `map.fitBounds(bounds)`    | Distributed polygons spanning a region (e.g. CWS_DEL) |

`cameraBounds` takes priority over `cameraPreset`.

### Example — adding bounds for a new outcome

**1. Measure the true extent** (see section below).

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

## Measuring the true extent of a Mapbox layer

The demand-unit (and other tileset) polygon geometries live only in Mapbox — not in the repo. To measure the actual bounding box of a layer:

### Step 1 — Expose the map instance temporarily

`MapInstance.tsx` already exposes the Mapbox instance as `window.__mapInstance` in development mode (guarded by `process.env.NODE_ENV === "development"`). It is set inside `handleMapLoad` and is available after the map fires its first load event. No code change is needed — just make sure you are running the dev server.

### Step 2 — Load the app and activate the outcome

Open the app in the browser, navigate to the Explore tab, enable the map, and click the glyph for the outcome you want to measure. Zoom out so the whole state is visible (tiles need to be loaded).

### Step 3 — Run this in the browser console

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

### Step 4 — Hardcode the result

Copy the output into `cameraPresets.ts` and set `cameraBounds` in the registry entry. The `window.__mapInstance` assignment in `MapInstance.tsx` is dev-only and does not need to be removed — it is a no-op in production.

---

## Existing camera bounds

| Outcome         | Constant               | Coverage                                                                                                                                             |
| --------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CWS_DEL`       | `CWS_DEL_BOUNDS`       | `[[-123.525, 34.995], [-118.803, 41.745]]` — Urban demand units (167 features), measured from `demand_units` tileset with `Class === "Urban"` filter |
| `DELTA_ECO`     | `DELTA_ECO_BOUNDS`     | `[[-121.862, 37.676], [-121.24, 38.589]]` — Legal Delta (DETAW polygon), measured from `geoschem` tileset with `WBA_ID === "DETAW"` filter           |
| `FW_EXP`        | `FW_EXP_BOUNDS`        | `[[-121.77, 37.65], [-121.44, 37.95]]` — Two SWP/CVP export pumping plants (Banks + Jones), computed from `STATION_COORDINATES`                      |
| `FW_DELTA_USES` | `FW_DELTA_USES_BOUNDS` | `[[-121.89, 37.92], [-121.54, 38.23]]` — Two Delta salinity compliance stations (Emmaton + Jersey Point), computed from `STATION_COORDINATES`        |
| `ENV_FLOWS`     | `ENV_FLOWS_BOUNDS`     | `[[-123.804, 36.295], [-119.897, 41.72]]` — 17 environmental flow monitoring stations, computed from `ENV_FLOWS_COORDINATES`                         |
| `RES_STOR`      | `RES_STOR_BOUNDS`      | `[[-123.68, 36.26], [-117.66, 41.73]]` — 7 reservoirs, computed from `RESERVOIR_CONFIGS`                                                             |
