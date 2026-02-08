"use client"

import dynamic from "next/dynamic"
import { Box, useTheme } from "@repo/ui/mui"
import { ErrorBoundary } from "@repo/utils"
import { ErrorFallback } from "@repo/ui"
import { mapActions } from "../features/map/store"

// Dynamic import with ssr: false to reduce initial bundle size
// Map is client-only and loads after hydration
const PersistentMapWrapper = dynamic(
  () => import("../features/map/PersistentMapWrapper"),
  { ssr: false, loading: () => null },
)

/**
 * MapErrorFallback - Positioned on the same layer as the persistent map
 *
 * The map uses position: fixed at zIndex.persistentMap to sit behind content.
 * The fallback uses the same positioning so it appears in the same layer,
 * visible through transparent panels just like the map would be.
 */
function MapErrorFallback() {
  const theme = useTheme()

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: theme.zIndex.persistentMap,
        backgroundColor: "rgb(42, 82, 135)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ErrorFallback
        title="Map couldn&rsquo;t load"
        message="This might be a temporary issue. Try refreshing the page."
        textColor={theme.palette.common.white}
      />
    </Box>
  )
}

/**
 * Handles map error by updating store state.
 * This allows other components (like Learn.tsx) to hide their loading spinners.
 */
function handleMapError(error: Error) {
  console.error("Map error:", error)
  mapActions.setMapError(true)
}

export function DynamicMap() {
  return (
    <ErrorBoundary fallback={<MapErrorFallback />} onError={handleMapError}>
      <PersistentMapWrapper />
    </ErrorBoundary>
  )
}
