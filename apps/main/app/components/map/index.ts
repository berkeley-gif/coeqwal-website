/**
 * Map Module
 */

// Core
export { default as CaliforniaMapPanel, CALIFORNIA_VIEW, CENTRAL_VALLEY_VIEW } from "./CaliforniaMapPanel"
export { CalSimProvider, useCalSimToggle } from "./CalSimContext"

// Layers
export { default as BasinsLayer } from "./layers/BasinsLayer"
export { default as RiversLayer } from "./layers/RiversLayer"
export { default as CalSimLayers } from "./layers/CalSimLayers"
export { default as BasinInflowArrows } from "./layers/BasinInflowArrows"

// Markers
export { default as HotspotMarkers } from "./markers/HotspotMarkers"
export { default as CalSimMarkers } from "./markers/CalSimMarkers"
export { default as AnimatedMarker } from "./markers/AnimatedMarker"

// Overlays
export { default as MapOverlayPanels } from "./overlays/MapOverlayPanels"
export { default as ScrollTooltip } from "./overlays/ScrollTooltip"
export { DeltaInfoPanel } from "./overlays/DeltaInfoPanel"
export { GeocodingPanel } from "./overlays/GeocodingPanel"

// Choreography
export { useLearnScrollChoreography } from "./choreography/useLearnScrollChoreography"
export { createLearnChoreographyConfig } from "./choreography/learnSectionChoreography"
export * from "./choreography/scrollChoreographyConstants"
export type { PanelLayerState } from "./choreography/useLearnScrollChoreography"

