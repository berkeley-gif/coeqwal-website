/**
 * Map Module
 */

// Core
export { default as CaliforniaMapPanel } from "./CaliforniaMapPanel"
export { CALIFORNIA_VIEW, CENTRAL_VALLEY_VIEW, DELTA_VIEW } from "./store"

// Store (Zustand-based state management)
export * from "./store"

// Layers
export { default as BasinsLayer } from "./layers/BasinsLayer"
export { default as RiversLayer } from "./layers/RiversLayer"
export { default as BasinInflowArrows } from "./layers/BasinInflowArrows"

// Markers
export { default as HotspotMarkers } from "./markers/HotspotMarkers"
export { default as AnimatedMarker } from "./markers/AnimatedMarker"

// Overlays
export { default as MapOverlayPanels } from "./overlays/MapOverlayPanels"
export { default as ScrollTooltip } from "./overlays/ScrollTooltip"
export { DeltaInfoPanel } from "./overlays/DeltaInfoPanel"
export { GeocodingPanel } from "./overlays/GeocodingPanel"
export { Section, StickySection } from "./overlays/Section"

// Choreography constants (still used by DeltaInfoPanel)
export * from "./choreography/scrollChoreographyConstants"

// Hooks
export { useMapLayers } from "./hooks/useMapLayers"
