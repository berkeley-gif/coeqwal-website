"use client"

/**
 * CalsimAreaLabels - place labels for the three CalSim extent layers shown
 * in Learn > CalSim model.
 *
 * The polygons themselves are native Mapbox layers faded by useMapLayers;
 * only the labels live here. HTML Markers instead of a Mapbox symbol layer
 * because the tilesets carry no name property, the export contractors are
 * 59 polygons (a symbol layer would label each one), and this keeps the
 * typography identical to the river labels.
 */

// External
import { memo } from "react"
import { Marker } from "@repo/map"
import { NavArrow } from "@repo/ui"

// Internal
import { FlatMapLabel } from "./RiversLayer"

/**
 * Hand-placed anchors, not computed centroids: the contributing-area and
 * water-budget-area centroids nearly coincide (~38.3°N), so labels would
 * stack. Tuned for CENTRAL_VALLEY_VIEW. Re-check if that camera changes.
 */
const CALSIM_AREA_LABELS = [
  {
    id: "water-budget-area",
    text: "Central Valley Model Area",
    lon: -120.6,
    lat: 39.6,
  },
  {
    id: "contributing-area",
    text: "Contributing Watershed Area",
    lon: -120.7,
    lat: 37.6,
  },
  {
    id: "export-contractors",
    text: "Water Export Area",
    lon: -117.2,
    lat: 34.9,
  },
] as const

// Invisible labels must not swallow clicks meant for the map underneath
const MARKER_STYLE = { pointerEvents: "none" } as const

// Label on top, arrow underneath at the label's left edge
const LABEL_STACK_STYLE = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  transition: "opacity 0.3s ease-out", // matches FlatMapLabel / river labels
} as const

// NavArrow only supports cardinal directions, so rotate a right-pointing
// arrow 135° here instead of widening the shared component's API.
// drop-shadow imitates the black halo the label text gets from its SVG stroke.
const POINTER_ARROW_STYLE = {
  display: "inline-flex",
  transform: "rotate(135deg)",
  color: "white",
  // Tucks the arrow under the text: the label SVG is 30px tall with its
  // baseline at y=20, leaving ~10px of empty space below the letters
  marginTop: -15,
  // Shifts the arrow so it sits just left of the first letter, not under it
  marginLeft: -20,
  filter: "drop-shadow(0 0 1px black) drop-shadow(0 0 1px black)",
} as const

interface CalsimAreaLabelsProps {
  visible: boolean
}

/**
 * memo: BaseLayers re-renders on every scroll tick of the rivers section
 * (riversProgress). These labels only depend on `visible`, so memo skips
 * those renders. Cheap insurance, not a measured bottleneck.
 */
const CalsimAreaLabels = memo(function CalsimAreaLabels({
  visible,
}: CalsimAreaLabelsProps) {
  // Markers stay mounted and fade via FlatMapLabel's CSS opacity transition,
  // same as the river labels. Unmounting would cut them off instantly.
  const labelOpacity = visible ? 1 : 0

  return (
    <>
      {CALSIM_AREA_LABELS.map((label) => (
        <Marker
          key={label.id}
          longitude={label.lon}
          latitude={label.lat}
          anchor="bottom-left" // the arrow tip sits on the coordinate
          style={MARKER_STYLE}
        >
          <div style={{ ...LABEL_STACK_STYLE, opacity: labelOpacity }}>
            <FlatMapLabel
              text={label.text}
              opacity={labelOpacity}
              textAnchor="start"
            />
            <span style={POINTER_ARROW_STYLE}>
              <NavArrow size="1.5rem" />
            </span>
          </div>
        </Marker>
      ))}
    </>
  )
})

export default CalsimAreaLabels
