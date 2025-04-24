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

## TypeScript Support

This package provides full TypeScript definitions. Types for the mapbox-gl API are
imported directly from the mapbox-gl package, which provides its own type definitions.

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
   - Import types from the map package, not directly from mapbox-gl
   - Use proper type casting for layer types
