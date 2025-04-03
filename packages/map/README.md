# @repo/map

A unified Map API for COEQWAL applications providing easy state sharing and full access to Mapbox functionality.

## Features

- **Context-based API**: Share map state across components easily
- **Full Map Access**: Direct access to all Mapbox GL methods
- **Convenience Methods**: Common operations like `flyTo`, `addLayer`, etc.
- **TypeScript Support**: Full type definitions for better developer experience

## Quick Start Guide

```jsx
import { Map, MapProvider, useMap } from "@repo/map"

// In your parent component:
function MapApplication() {
  return (
    <MapProvider>
      <Map
        mapboxToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""}
        viewState={{
          longitude: -122.4,
          latitude: 37.8,
          zoom: 10,
          pitch: 0,
          bearing: 0,
        }}
        mapStyle="mapbox://styles/mapbox/streets-v11"
      />
      <MapControls />
    </MapProvider>
  )
}

// In any child component:
function MapControls() {
  const { flyTo, setPaintProperty, viewState } = useMap()

  return (
    <div>
      <div>Current zoom: {viewState.zoom.toFixed(2)}</div>
      <button onClick={() => flyTo(-122.4, 37.8, 12)}>Fly to SF</button>
      <button
        onClick={() => setPaintProperty("water", "fill-color", "#0080ff")}
      >
        Change Water Color
      </button>
    </div>
  )
}
```

## Core API Components

### MapProvider

Establishes the context for map state sharing across components.

```jsx
<MapProvider>
  <Map mapboxToken={token} />
  <YourComponents />
</MapProvider>
```

### Map Component

The main map component that displays the map and connects to the context.

```jsx
<Map
  mapboxToken={token} // Required: Mapbox access token
  viewState={viewState} // Optional: Initial view state
  onViewStateChange={setViewState} // Optional: View state change handler
  mapStyle="mapbox://styles/..." // Optional: Map style URL
/>
```

### useMap Hook

Access the map functionality from any component within the MapProvider:

```jsx
const {
  // View state
  viewState, // Current map view (longitude, latitude, zoom, etc.)
  setViewState, // Update the view state

  // Direct map methods
  withMap, // Safe access to map instance

  // Convenience methods
  flyTo, // Navigate to a location
  addLayer, // Add a map layer
  removeLayer, // Remove a map layer
  addSource, // Add a data source
  removeSource, // Remove a data source
  setPaintProperty, // Set layer paint property
  setLayoutProperty, // Set layer layout property
} = useMap()
```

## Direct Map Access with withMap

When you need to use Mapbox GL methods not covered by convenience functions:

```jsx
const { withMap } = useMap()

// Add a heatmap layer
withMap((map) => {
  if (!map.getSource("earthquakes")) {
    map.addSource("earthquakes", {
      type: "geojson",
      data: "https://example.com/earthquakes.geojson",
    })
  }

  if (!map.getLayer("earthquakes-heat")) {
    map.addLayer({
      id: "earthquakes-heat",
      type: "heatmap",
      source: "earthquakes",
      paint: {
        "heatmap-weight": [
          "interpolate",
          ["linear"],
          ["get", "mag"],
          0,
          0,
          6,
          1,
        ],
        "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 9, 3],
        "heatmap-color": [
          "interpolate",
          ["linear"],
          ["heatmap-density"],
          0,
          "rgba(0,0,255,0)",
          0.2,
          "rgb(0,0,255)",
          0.4,
          "rgb(0,255,255)",
          0.6,
          "rgb(0,255,0)",
          0.8,
          "rgb(255,255,0)",
          1,
          "rgb(255,0,0)",
        ],
        "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 2, 9, 20],
        "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 7, 1, 9, 0],
      },
    })
  }
})
```

## Warning: Avoid Direct mapboxgl Imports

Please avoid using a direct import of mapboxgl:

```jsx
// DON'T DO THIS:
import mapboxgl from "mapbox-gl"
```

Instead, use the `withMap` method from useMap for safe access:

```jsx
// DO THIS:
const { withMap } = useMap()

withMap((map) => {
  // Safe access to map instance
})
```

## Best Practices

1. **Always use MapProvider at the root** of components using the map
2. **Prefer useMap convenience methods** when available
3. **Use withMap for advanced cases** requiring direct map access
4. **Keep map state within context** for consistent application state
5. **Set mapStyle at initialization** for best performance

## TypeScript Support

This package provides full TypeScript definitions. Types for the mapbox-gl API are
imported directly from the mapbox-gl package, which provides its own type definitions
starting from v2.0.
