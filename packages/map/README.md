# @repo/map

A unified Map API for COEQWAL applications providing easy state sharing and full access to Mapbox functionality.

## Features

- **Context-based API**: Share map state across components easily
- **Full map access**: Direct access to all Mapbox GL methods
- **Convenience methods**: Common operations like `flyTo`, `addLayer`, etc.
- **TypeScript support**: Full type definitions for better developer experience
- **Performance optimization**: Uncontrolled approach for smooth animations
- **Animated markers**: Integration with Framer Motion for dynamic map elements
- **Automatic cleanup**: Resource management to prevent memory leaks
- **React Server Components support**: Special client entry point for Next.js

## Architecture Decisions

### Technology Stack

- **ReactMapGL v8.x**: We use react-map-gl as our base React wrapper for Mapbox GL
- **Mapbox GL v3.11.x**: The underlying mapping library
- **Context API**: For state sharing and providing helper methods
- **TypeScript**: For type safety and developer experience

### Uncontrolled vs. Controlled Approach

We've chosen an **uncontrolled approach** for map view state, where:

- The map manages its own internal state
- Camera movements are handled via imperative methods like `flyTo`
- Performance is optimized for animations and transitions

This decision was made because:

1. **Performance**: Controlled components with React state can cause stuttering during map animations
2. **Canvas rendering**: Mapbox GL renders to a WebGL canvas, where React's DOM reconciliation doesn't apply directly
3. **Animation control**: Imperative methods provide more direct control over complex animations

While we use this uncontrolled pattern for the map itself, we provide both imperative context methods and declarative components for working with the map:

- **Imperative context methods**: `addSource`, `addLayer`, `setPaintProperty`, etc.
- **Declarative components**: `<Marker>`, `<Popup>`, etc.

### Context API Design

Our map context provides:

1. **Access to map instance**: Via `mapRef` for direct access when needed
2. **Helper methods**: Simplified versions of common Mapbox GL operations
3. **Error handling**: Built-in existence checks and error recovery
4. **Utility functions**: Convenience methods like `getStyle()`, `hasSource()`, etc.

## Quick Start Guide

This guide shows how to set up and use the map package in your Next.js or React application.

### 1. Setup with Next.js (React Server Components)

When using this package with Next.js, use the client-side entry point in your layout:

```tsx
// In app/layout.tsx
import { MapProvider } from "@repo/map/client"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body>
        <MapProvider>{children}</MapProvider>
      </body>
    </html>
  )
}
```

### 2. Setup with Standard React (non-RSC)

For regular React applications without React Server Components:

```tsx
// In your app entry point
import { MapProvider } from "@repo/map"

function App() {
  return (
    <MapProvider>
      <YourApp />
    </MapProvider>
  )
}
```

### 3. Creating a Basic Map Component

```tsx
// In a component file
"use client"
import { Map } from "@repo/map"
import { Box } from "@repo/ui/mui" // or your preferred UI library

export default function MapContainer() {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""

  return (
    <Box sx={{ width: "100%", height: "100vh" }}>
      <Map
        mapboxToken={mapboxToken}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        initialViewState={{
          longitude: -122.4,
          latitude: 37.8,
          zoom: 8,
        }}
      />
    </Box>
  )
}
```

### 4. Using Map Operations with useMap

```tsx
// In your component
"use client"
import { useMap } from "@repo/map"
import { Button } from "@repo/ui/mui"

function MapControls() {
  const { flyTo } = useMap()

  return (
    <Button
      onClick={() =>
        flyTo({
          longitude: -121.5,
          latitude: 38.05,
          zoom: 10,
          transitionOptions: { duration: 2000 },
        })
      }
    >
      Fly to Sacramento
    </Button>
  )
}
```

## Real-World Examples

Here are examples from our COEQWAL applications showing how to use the map package effectively.

### Adding Data Sources and Layers

```tsx
// From 02WaterSource.tsx
function loadRivers() {
  // Add Sacramento River source
  addSource("river-sac", {
    type: "geojson",
    data: "/rivers/SacramentoRiver_wo.geojson",
  })

  // Add Sacramento River layer
  addLayer(
    "river-sac-layer",
    "river-sac",
    riverLayerStyle.type,
    riverLayerStyle.paint,
    riverLayerStyle.layout,
  )

  // Make river visible
  setPaintProperty("river-sac-layer", "line-opacity", 1)
}
```

### Creating Animated Markers with Framer Motion

```tsx
// From 02WaterSource.tsx
const prepareMarkers = useCallback(
  (points: MarkerType[] = []) => {
    return points.map((data: MarkerType, idx) => {
      return (
        <Marker
          latitude={data.coordinates[1] as number}
          longitude={data.coordinates[0] as number}
          key={data.id}
          onClick={(e) => {
            e.originalEvent.stopPropagation()
            setPopupInfo(data)
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.2 }}
            className="marker"
          ></motion.div>

          {popupInfo && popupInfo.id === data.id && (
            <Popup
              latitude={data.coordinates[1] as number}
              longitude={data.coordinates[0] as number}
              anchor={data.anchor as mapboxgl.Anchor}
              closeOnClick={true}
              offset={{ bottom: [0, -10] }}
              onClose={() => setPopupInfo(null)}
            >
              <div className="popup">
                <h3>{data.name}</h3>
                <Image
                  src={`/variability/${data.image}`}
                  alt={data.caption}
                  width={470}
                  height={300}
                  style={{ objectFit: "cover" }}
                />
                <p>{data.caption}</p>
              </div>
            </Popup>
          )}
        </Marker>
      )
    })
  },
  [popupInfo],
)
```

### Adding Dynamic Elements with setMotionChildren

```tsx
// From 02WaterSource.tsx
function Variability() {
  const { mapRef, setMotionChildren } = useMap()
  const [selectedYear, setSelectedYear] = useState(null)

  // Add markers to map
  const addMarkersToMap = useCallback(() => {
    if (setMotionChildren) {
      const pointsToShow = selectedYear ? markers[selectedYear] : []
      const markerToAdd = prepareMarkers(pointsToShow)
      setMotionChildren(markerToAdd)
    }
  }, [setMotionChildren, prepareMarkers, selectedYear])

  // Remove markers from map
  const removeMarkersFromMap = useCallback(() => {
    if (setMotionChildren) {
      setMotionChildren(null)
      setSelectedYear(null)
    }
  }, [setMotionChildren])

  // Use with intersection observer for scroll-based activation
  useIntersectionObserver(
    visRef.ref,
    (isIntersecting) => {
      if (isIntersecting) {
        addMarkersToMap()
      } else {
        removeMarkersFromMap()
      }
    },
    { threshold: 1 },
  )

  // Rest of component...
}
```

### Camera Controls with flyTo

```tsx
// From 02WaterSource.tsx
function moveTo() {
  const closeMapViewState = {
    latitude: 38.8309,
    longitude: -124.8652,
    zoom: 7,
  }

  flyTo({
    longitude: closeMapViewState.longitude,
    latitude: closeMapViewState.latitude,
    zoom: closeMapViewState.zoom,
    transitionOptions: {
      duration: 3500,
    },
  })
}
```

## Adding new tile data via Mapbox Tiling Service

### Why MTS

Any geometry the COEQWAL map renders must come from a Mapbox vector tileset, not from the API. Points, lines, and polygons all travel through tiles. The API returns only identifiers (`short_code`, `du_id`, `location_id`, `wba_id`) which the frontend joins to tile features at render time. The rationale lives in the data platform [database/README.md](../../../coeqwal-data-platform/database/README.md) under "API conventions, geometry". Short version: vector tiles are pre-quantized, zoom-aware, CDN-cached, and consumed natively by Mapbox GL. A full demand-unit polygon `FeatureCollection` from the API is multiple MB. The equivalent tile request is typically tens of KB.

Mapbox Tiling Service (MTS) is the supported pipeline for uploading source GeoJSON or line-delimited GeoJSON, applying a recipe that controls zoom-level behavior, and publishing the result as a tileset under the `coeqwal` Mapbox account.

### Mapbox documentation

These are the authoritative how-tos. Read them first.

- MTS quick start tutorial: [https://docs.mapbox.com/help/tutorials/get-started-mts-and-tilesets-cli/](https://docs.mapbox.com/help/tutorials/get-started-mts-and-tilesets-cli/)
- Tilesets CLI install and command reference: [https://docs.mapbox.com/mapbox-tiling-service/guides/tilesets-cli/](https://docs.mapbox.com/mapbox-tiling-service/guides/tilesets-cli/)
- Recipe reference (recipe JSON schema and `layers` semantics): [https://docs.mapbox.com/mapbox-tiling-service/reference/](https://docs.mapbox.com/mapbox-tiling-service/reference/)
- Mapbox Studio (style editor used to bundle tilesets into a basemap style): [https://docs.mapbox.com/studio-manual/](https://docs.mapbox.com/studio-manual/)

### The join key

The API never sends geometry. It sends an identifier for each location. Each tile feature must carry that same identifier as a feature property. At render time the frontend matches the API identifier against the tile feature whose join-key property equals it, and then paints that feature.

So the join key (the location short code) must be the same string in both of these places:

- the identifier property baked into the tile features when you export the source data (step 1 of the workflow below), and
- the `idProperty` for the outcome in [apps/main/app/features/map/config/outcomeLayerRegistry.ts](../../apps/main/app/features/map/config/outcomeLayerRegistry.ts), which is the property the frontend reads off each feature with `["get", idProperty]` (see `OutcomePolygonLayer.tsx`).

For demand units the join key is `DU_ID` (`WBA_ID` for water budget areas, `gnisidlabel` for reservoirs).

Usually the tile property should carry the exact id the API returns. Where they intentionally differ, an explicit mapping table translates the API id first, and the translated value must then match exactly. Two outcomes do this: reservoirs (API `SHSTA` to tile `gnisidlabel`, via `RESERVOIR_CALSIM_TO_GNISIDLABEL`) and the delta (`DELTA_ECO` to tile `WBA_ID` value `DETAW`, via the per-outcome `featureIdMap`).

### Where the geometry comes from

Export the geometry from the latest COEQWAL GeoPackage, found in the data platform GIS folder, [coeqwal-data-platform/database/seed_tables/03_GIS](../../../coeqwal-data-platform/database/seed_tables/03_GIS), and confirm with the WAM team that you have the latest. The demand-unit source today is [`du_4326.gpkg`](../../../coeqwal-data-platform/database/seed_tables/03_GIS/du_4326.gpkg): layer `demandunits`, one dissolved `MULTIPOLYGON` per `DU_ID`, EPSG:4326.

Two things to know before you export:

- The same GeoPackage feeds the database loader [`load_du_geometries.py`](../../../coeqwal-data-platform/database/scripts/data_processing/load_du_geometries.py), so treating the GeoPackage as the single source keeps the database geometry and the tiles consistent. The Postgres `geom` columns are downstream of this file, not a separate source.
- Coverage is incomplete. Not every entity has a polygon yet. The demand units missing geometry are listed in [coeqwal-data-platform/database/topic_docs/geometry.md](../../../coeqwal-data-platform/database/topic_docs/geometry.md). There is a whole section of work around updating the Community Water Systems delivery polygons. Check with the backend team, the WAM team, and the Community Water System/Drinking Water team.

### COEQWAL workflow for a new tileset

1. **Export the source data from the GeoPackage.** Convert the relevant GeoPackage layer to line-delimited GeoJSON (one feature per line), projected to EPSG:4326, preserving the join-key property (see "The join key" above).

2. **Write the recipe.** Place a recipe JSON in [coeqwal-data-platform/scripts/mapbox_recipes/](../../../coeqwal-data-platform/scripts/mapbox_recipes/). The existing example `calsim_demand_units.json` uses `minzoom: 4` and `maxzoom: 16`. The naming convention is `<dataset_slug>.json` matching the final tileset id. The key under `layers` becomes the published source-layer name, so set it to the string `tilesetSources.ts` expects.

3. **Upload the source** to Mapbox.

   ```bash
   tilesets upload-source coeqwal <slug> <slug>.geojson.ld
   ```

4. **Create the tileset** from the recipe.

   ```bash
   tilesets create coeqwal.<slug> \
     --recipe coeqwal-data-platform/scripts/mapbox_recipes/<slug>.json \
     --name "<Human-readable name>"
   ```

5. **Publish the tileset.**

   ```bash
   tilesets publish coeqwal.<slug>
   ```

6. **Register the tileset on the website.** Add an entry to `COEQWAL_TILESETS` in [apps/main/app/features/map/config/tilesetSources.ts](../../apps/main/app/features/map/config/tilesetSources.ts).

   ```ts
   {
     sourceId: "coeqwal-<slug>",
     url: "mapbox://coeqwal.<slug>",
   }
   ```

   If the layer needs to be available on non-satellite basemaps (Light, Streets), also add an entry to `RUNTIME_LAYERS` so it is created on the fly when those basemaps are active.

### Authentication

The `tilesets` CLI uses a `MAPBOX_ACCESS_TOKEN` environment variable with `tilesets:write` scope.

### Existing COEQWAL tilesets

| Source id              | Tileset URL                             | Source layer           | Join key      | What it carries                                                                                                           |
| ---------------------- | --------------------------------------- | ---------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `coeqwal-demand-units` | `mapbox://coeqwal.calsim_demand_units`  | `demand_units`         | `DU_ID`       | CalSim demand-unit polygons (urban + ag)                                                                                  |
| `coeqwal-wba`          | `mapbox://coeqwal.calsim-wba`           | `geoschem`             | `WBA_ID`      | Water budget area polygons                                                                                                |
| `coeqwal-reservoir`    | `mapbox://coeqwal.california-reservoir` | `california-reservoir` | `gnisidlabel` | Reservoir polygons, currently keyed by `gnisidlabel` (TODO: add `calsim_id` property and drop the frontend mapping table) |
| `coeqwal-delta-water`  | `mapbox://coeqwal.delta-water`          | `delta_water`          | (context)     | Delta water body context layer (no join, not data-driven)                                                                 |

Anything in this table is consumed by `tilesetSources.ts`. New tilesets should follow the same registration pattern. The `delta-detaw` outcome layer is not its own tileset: it is a runtime layer defined in `tilesetSources.ts` from the `coeqwal-wba` source (`geoschem`) filtered to `WBA_ID == "DETAW"`.

### Naming: match the published names exactly

The ids in the table above are historical and not internally consistent. The tileset id may use an underscore (`calsim_demand_units`) or a hyphen (`calsim-wba`, `california-reservoir`, `delta-water`). The source-layer is a separate string (`demand_units`, `geoschem`, `california-reservoir`, `delta_water`), and the website `sourceId` (`coeqwal-...`) is different again. None of these are typos. Two separate matches are what actually matter:

- **Source-layer name.** The recipe `layers` key, the published source-layer, and the `sourceLayer` in `RUNTIME_LAYERS` (`tilesetSources.ts`) must be the same string, because that is what `ensureCustomLayers` passes as `"source-layer"` when it creates the layer. For demand units it is `demand_units` (underscore).
- **Join key.** The identifier property on the tile features must equal the outcome's `idProperty` in `outcomeLayerRegistry.ts` (see "The join key" above).

Note that `outcomeLayerRegistry.ts` also has a `sourceLayer` field that for demand units reads `demand-units` (hyphen) while the tileset's source-layer is `demand_units`. That field is not the binding string (`OutcomePolygonLayer` reads the source-layer back off the live map layer), so the mismatch is tolerated, but it is the kind of inconsistency to watch.

### Related documentation

- [apps/main/app/features/map/README.md](../../apps/main/app/features/map/README.md) - the consumer side: how the app resolves locations to tile features, the `idProperty` join, runtime source injection, and camera bounds. Read this alongside the publishing workflow here.
- [coeqwal-data-platform/database/topic_docs/geometry.md](../../../coeqwal-data-platform/database/topic_docs/geometry.md) - how geometry is stored in the database, the demand-unit coverage gaps, and the list of `DU_ID`s without polygons.
- [coeqwal-data-platform/database/README.md](../../../coeqwal-data-platform/database/README.md) - "API conventions, geometry" (the policy that no geometry flows through the API) and the Mapbox tile-work roadmap.
- [coeqwal-data-platform/database/scripts/data_processing/load_du_geometries.py](../../../coeqwal-data-platform/database/scripts/data_processing/load_du_geometries.py) - the loader that reads `du_4326.gpkg` into the database; rerun it when new polygons land in the GeoPackage.
- [coeqwal-data-platform/scripts/mapbox_recipes/](../../../coeqwal-data-platform/scripts/mapbox_recipes/) - where recipe JSON files live (`calsim_demand_units.json` is the worked example).

## Advanced Usage

### When to Use withMap

The `withMap` method provides direct, safe access to the Mapbox GL instance for specialized needs. Use it when:

1. **Accessing advanced Mapbox GL features** not exposed by our context API
2. **Adding custom controls or plugins** that require the raw map instance
3. **Setting up complex event listeners** not covered by standard props

Example:

```tsx
const { withMap } = useMap()

// Add a terrain control to the map
withMap((mapInstance) => {
  // Add a scale control
  const scale = new mapboxgl.ScaleControl({
    maxWidth: 100,
    unit: "imperial",
  })
  mapInstance.addControl(scale, "bottom-right")

  // Add a custom event listener
  mapInstance.on("contextmenu", (e) => {
    console.log("Right click at:", e.lngLat)
  })
})
```

For most common operations, prefer the context's helper methods which already include error handling and type safety.

## API Reference

### Context Methods

The `useMap` hook provides access to:

- `mapRef`: Reference to the MapRef object
- `flyTo`: Animate camera to location
- `addSource`: Add a data source
- `addLayer`: Add a visualization layer
- `removeSource`: Remove a data source
- `removeLayer`: Remove a layer
- `setPaintProperty`: Update layer paint property
- `setLayoutProperty`: Update layer layout property
- `setLayerVisibility`: Show/hide a layer
- `setMotionChildren`: Add React elements (markers, etc.)
- `withMap`: Safe access to raw Mapbox instance
- `getStyle`: Get current map style
- `hasSource`: Check if source exists
- `hasLayer`: Check if layer exists

### Components

- `Map`: Main map component
- `Marker`: Position elements on the map
- `Popup`: Display information in tooltips
- `Source`: Declarative data source component
- `Layer`: Declarative visualization layer
- `NavigationControl`: Zoom/rotate controls
- `GeolocateControl`: Location finder

### Hooks

- `useMap`: Access the map context
- `useMapLayers`: Declarative layer management
- `useMapSources`: Declarative source management

## Roadmap

Methods that app code currently reaches via `mapRef.current.getMap()` because they are not wrapped by `MapOperationsAPI` yet. Adding helpers for these would let consumers (notably the storyboard animation in `apps/main/app/features/scenarioExplorer/animation/`) drop the remaining raw `getMap()` call sites and route everything through the package:

- `easeTo` - imperative camera move used by `CameraArbiter` ("fly home" for the storyboard) and by `apps/main/app/features/map/MapInstance.tsx` for view transitions. Sibling of `flyTo` with a different easing curve and feel
- `once("moveend" | "idle")` and `on/off("move" | "idle" | ...)` - event sequencing for imperative work that has to run after a style load, camera arrival, or per-frame map movement
- `queryRenderedFeatures` and `querySourceFeatures` - hit testing for click/hover, and feature collection for screen-space overlays
- `project` (and `unproject`) - lng/lat to screen-pixel coordinate math for SVG overlays anchored to map features

Until these land, `withMap(...)` is the documented escape hatch. App code reaching for them should still type the returned instance as `MapboxGLMap` from `@repo/map`. Never duck-type a local `type FooMap = { ... }`, and never `import { ... } from "mapbox-gl"` from app code.

## TypeScript Support

This package provides full TypeScript definitions. Application code should import map-related types from `@repo/map` (for example `MapRef`, `MapboxGLMap`, `LngLatLike`), not from `mapbox-gl` or `react-map-gl` directly. Those dependencies remain encapsulated inside `@repo/map`.

Types for the mapbox-gl API are re-exported where needed; `mapbox-gl` ships its own type definitions.

Version Compatibility:

- Compatible with react-map-gl v8.x
- Compatible with mapbox-gl v3.x
- No need for @types/mapbox-gl (mapbox-gl includes its own types)

## Map Navigation

### Using the flyTo Method

The `flyTo` method provides a smooth animated transition to a specific location on the map. It supports two calling patterns:

#### Pattern 1: Individual Coordinates

```typescript
flyTo(
  longitude: number,
  latitude: number,
  zoom: number,
  pitch?: number,
  bearing?: number,
  transitionOptions?: { duration?: number, easing?: Function, essential?: boolean }
)
```

Example usage:

```typescript
// Basic usage with just coordinates and zoom
mapOperations.flyTo(-122.4, 37.8, 12)

// With camera angle (pitch and bearing)
mapOperations.flyTo(-122.4, 37.8, 12, 60, 45)

// With transition options
mapOperations.flyTo(-122.4, 37.8, 12, 60, 45, {
  duration: 3000, // Animation duration in milliseconds
  essential: true, // Whether this animation is considered essential
  easing: (t) => t * t, // Custom easing function
})
```

#### Pattern 2: ViewState Object

```typescript
flyTo(viewState: { longitude: number, latitude: number, zoom: number, pitch?: number, bearing?: number, transitionOptions?: object })
```

Example usage:

```typescript
// Flying to a location with a view state object (recommended approach)
mapOperations.flyTo({
  longitude: -122.4,
  latitude: 37.8,
  zoom: 12,
  pitch: 60, // Camera tilt in degrees
  bearing: 45, // Map rotation in degrees
  transitionOptions: {
    duration: 3000, // Animation duration in milliseconds
    easing: (t) => t * t, // Custom easing function
  },
})
```

## Troubleshooting

### Common Issues

1. **Map doesn't appear**:

   - Ensure the container has a defined height and width
   - Check if MapProvider is present in the component tree
   - Verify your Mapbox token is valid

2. **React Server Components error**:

   - For Next.js applications, use `import { MapProvider } from "@repo/map/client"`
   - Make sure the `client.ts` file is properly set up

3. **Markers not showing**:

   - Verify coordinates are in the correct format (longitude, latitude)
   - Check if the map is centered on the marker location
   - Very important: Ensure marker components are direct children of the Map component

4. **Animation stuttering**:

   - Use the imperative `flyTo` method rather than changing state
   - Avoid frequent state updates during animations

5. **Type errors**:
   - Import types from the map package, not directly from mapbox-gl (for example `MapboxGLMap` for the instance returned by `mapRef.current?.getMap()`)
   - Use proper type casting for layer types
