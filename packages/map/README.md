# @repo/map

A unified Map API for COEQWAL applications providing easy state sharing and full access to Mapbox functionality.

## Features

- **Context-based API**: Share map state across components easily
- **Full Map Access**: Direct access to all Mapbox GL methods
- **Convenience Methods**: Common operations like `flyTo`, `addLayer`, etc.
- **TypeScript Support**: Full type definitions for better developer experience

## Quick Start Guide

This guide shows how to set up and use the Mapbox-based map in a monorepo structure, using the included context and components for integration into your Next.js or React apps.

---

## 1. Project Structure

• The `packages/map` directory contains the core map functionality (MapboxMap base component, context provider, and hooks).  
• The `apps/main` directory (or your chosen app folder) consumes the map package and renders the map on a page.

Example key files and their roles:

- `packages/map/src/MapboxMap.tsx`: The main MapboxMap component that manages the raw Mapbox GL map instance.
- `packages/map/context/MapContext.tsx`: Provides the `MapProvider` and `useMap` hook.
- `apps/main/app/page.tsx`: Example Next.js page that demonstrates usage of the map.
- `apps/main/app/components/MapContainer.tsx`: A convenient wrapper for the map with test features.

---

## 2. Installation & Setup

In your project’s root folder, ensure dependencies are installed by running:

```bash
pnpm install
```

(Or your preferred package manager command.)

Then, wrap your application with the `MapProvider` so other components can access the map context:

```tsx
import React from "react"
import { MapProvider } from "@repo/map"

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

---

## 3. Creating a Map Container

Use the provided `Map` component (`MapboxMap`) inside a container that sets up the token, style, etc. You can optionally sync an external ref to share the instance. For instance:

```tsx
import React, { useEffect, useCallback } from "react"
import { Box } from "@mui/material"
import { Map, useMap } from "@repo/map"
import type { MapboxMapRef } from "@repo/map"

interface MapContainerProps {
  uncontrolledRef?: React.RefObject<MapboxMapRef | null>
}

export default function MapContainer({ uncontrolledRef }: MapContainerProps) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""
  const { mapRef } = useMap() // from our context

  const refToUse = mapRef

  // Example: direct flyTo test button
  const testFlyTo = useCallback(() => {
    if (refToUse.current) {
      refToUse.current.flyTo(-121.5, 38.05, 10)
    }
    if (uncontrolledRef && refToUse.current) {
      uncontrolledRef.current = refToUse.current
    }
  }, [refToUse, uncontrolledRef])

  useEffect(() => {
    if (uncontrolledRef && refToUse.current) {
      uncontrolledRef.current = refToUse.current
    }
  }, [uncontrolledRef, refToUse])

  return (
    <Box sx={{ width: "100%", height: "100%", position: "relative" }}>
      <Map
        mapboxToken={mapboxToken}
        mapStyle="mapbox://styles/digijill/cl122pj52001415qofin7bb1c"
        initialViewState={{
          longitude: -122.4,
          latitude: 37.8,
          zoom: 8,
          bearing: 0,
          pitch: 0,
        }}
        style={{ width: "100%", height: "100%" }}
      />
    </Box>
  )
}
```

---

## 4. Using the Map in a Page

In your Next.js page (e.g., `app/page.tsx`), you can either control the map’s view state locally or let it manage its own. Below is a pair of examples:

### Uncontrolled Map (Ref-based)

```tsx
"use client"
import React, { useRef } from "react"
import { Button } from "@mui/material"
import MapContainer from "./components/MapContainer"
import type { MapboxMapRef } from "@repo/map"

export default function Home() {
  const uncontrolledRef = useRef<MapboxMapRef | null>(null)
  const handleFlyTo = () => {
    if (uncontrolledRef.current) {
      uncontrolledRef.current.flyTo(-120, 37, 7)
    }
  }

  return (
    <>
      <Button onClick={handleFlyTo}>Fly Uncontrolled</Button>
      <MapContainer uncontrolledRef={uncontrolledRef} />
    </>
  )
}
```

### Controlled Map (State-based)

```tsx
"use client"
import React, { useState } from "react"
import { Button } from "@mui/material"
import { useMap, ViewState } from "@repo/map"
import MapContainer from "./components/MapContainer"

export default function Home() {
  const { mapRef } = useMap()
  const [viewState, setViewState] = useState<ViewState>({
    longitude: -119,
    latitude: 36,
    zoom: 5,
    bearing: 0,
    pitch: 0,
  })

  const handleFlyTo = () => {
    if (mapRef.current) {
      // calls the underlying Mapbox "flyTo"
      mapRef.current.flyTo(-121.5, 38.05, 10, 0, 0, 2000)
    }
  }

  return (
    <>
      <Button onClick={handleFlyTo}>Fly Controlled</Button>
      <MapContainer />
    </>
  )
}
```

---

## 5. Advanced Transitions

The map supports custom transitions (duration, easing, pitch, bearing) via the optional `transition` parameter. In the main app, you can see an example like:

```tsx
<Button
  variant="outlined"
  size="small"
  onClick={() =>
    mapRef.current?.flyTo(
      -121.5,
      38.05,
      10,
      undefined,
      undefined,
      undefined,
      MapTransitions.SMOOOTH, // custom transition
    )
  }
>
  Smooth
</Button>
```

`MapTransitions` is a collection of presets that define duration, easing, pitch, bearing, etc. You can create your own or directly pass your own `TransitionOptions` object.

---

## 6. Working with Mapbox GL Features

If you need lower-level access to methods like `addLayer`, `addSource`, or raw map events, you have two approaches:

1. Call `withMap` on the reference:

   ```ts
   mapRef.current?.withMap((map) => {
     map.addLayer({
       /* layer definition */
     })
   })
   ```

2. Use the `withMap` function from the `useMap` hook:
   ```ts
   const { withMap } = useMap()
   withMap((mapInstance) => {
     mapInstance.addLayer({
       /* layer definition */
     })
   })
   ```

Both let you work with the Mapbox GL instance once it’s loaded.

---

## 7. Summary

By combining `MapProvider`, the `Map` component, and hooks like `useMap`, you can easily integrate a Mapbox-powered map into your Next.js or React application. You have full flexibility over camera control (controlled vs. uncontrolled), transitions, and raw map features.

This setup is well-suited for monorepos, allowing you to maintain reusable components in a `packages/map` folder while consuming them cleanly in multiple apps like `apps/main`.

## TypeScript Support

This package provides full TypeScript definitions. Types for the mapbox-gl API are
imported directly from the mapbox-gl package, which provides its own type definitions
starting from v2.0.

Version Compatibility:

- Compatible with react-map-gl v8.x
- Compatible with mapbox-gl v3.x
- No need for @types/mapbox-gl (mapbox-gl includes its own types)
