# @repo/map

A wrapper around `react-map-gl/mapbox` that provides a safer and more convenient API for working with Mapbox maps.

## Features

- Safe patterns for working with map instances
- TypeScript support with full type definitions
- Simplified view state management
- Ref-based API for easy integration in React components

## Installation

To install the package, run the following command from the monorepo root:

```bash
pnpm add @repo/map
```

## Basic Usage

Here's a basic example of how to use the `MapboxMap` component:

```tsx
import { MapboxMap } from "@repo/map"
import { useRef, useState } from "react"
import type { MapboxMapRef } from "@repo/map"

export default function MyMapComponent() {
  const mapRef = useRef<MapboxMapRef>(null)
  const [viewState, setViewState] = useState({
    longitude: -122.4,
    latitude: 37.8,
    zoom: 12,
    pitch: 0,
    bearing: 0,
  })

  return (
    <MapboxMap
      ref={mapRef}
      mapboxToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""}
      viewState={viewState}
      onViewStateChange={setViewState}
      onLoad={() => {
        console.log("Map loaded!")
      }}
    />
  )
}
```

## Working with the Map Instance

The package provides three primary patterns for interacting with the Mapbox GL map instance:

### 1. The `withMap` Pattern (Recommended)

The `withMap` method provides a functional approach to safely work with the map instance. It automatically handles null checking and provides fallback handling.

```tsx
// Get source data with a fallback if map or source doesn't exist
const data = mapRef.current?.withMap(
  (map) => map.getSource("mySource")?.getData(),
  defaultData,
)

// Perform an operation with no return value
mapRef.current?.withMap((map) => {
  if (map.getLayer("myLayer")) {
    map.setPaintProperty("myLayer", "fill-color", "red")
  }
})

// Chain multiple operations safely
const result = mapRef.current?.withMap((map) => {
  const source = map.getSource("mySource")
  if (!source) return null

  const data = source.getData()
  // Process data...
  return processedData
}, fallbackData)
```

### 2. Direct Map Access with `getMap`

When you need direct access to the map instance, use the `getMap` method:

```tsx
const map = mapRef.current?.getMap()
if (map) {
  // Access map directly
  // Be careful to check for null/undefined
  if (map.isStyleLoaded()) {
    // Do something that requires style to be loaded
  }
}
```

### 3. Convenience Methods

The API includes convenience methods for common operations:

```tsx
// Fly to a location
mapRef.current?.flyTo(-122.4, 37.8, 14)
```

## Best Practices

1. **Prefer `withMap` over `getMap`** when possible for safer code.
2. **Handle map loading state** appropriately, especially for operations that require the map to be fully loaded.
3. **Use TypeScript** to get full benefits of type checking.
4. **Consider memoizing callbacks** that use map operations for better performance.

## Extending the API

You can extend the `MapboxMapRef` interface with your own methods in your application:

```tsx
// In your application code
import { MapboxMapRef } from "@repo/map"

interface ExtendedMapRef extends MapboxMapRef {
  addCustomLayer: (id: string, data: GeoJSON.FeatureCollection) => void
}

// Then in your component
const mapRef = useRef<ExtendedMapRef>(null)

// Implement your extended functionality
useImperativeHandle(mapRef, () => ({
  ...baseMapRef.current, // Spread the base map ref methods
  addCustomLayer: (id, data) => {
    baseMapRef.current?.withMap((map) => {
      // Add your custom layer implementation
    })
  },
}))
```
