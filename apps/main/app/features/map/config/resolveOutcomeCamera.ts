/**
 * Pure function that determines the camera action for a given outcome + map mode.
 *
 * Priority: cameraBounds > cameraPreset > mode-specific default.
 *
 * Used by both the reactive camera in useOutcomeVisualization (learn/explore)
 * and the inline camera in TierAnimationSection (get-started) so the
 * resolution logic lives in exactly one place.
 */

import { getOutcomeConfig } from "./outcomeLayerRegistry"
import { CALIFORNIA_CENTERED_VIEW } from "./cameraPresets"
import { EXPLORE_BOUNDS } from "../MapInstance"
import type { MapMode } from "../store"

interface Padding {
  top: number
  bottom: number
  left: number
  right: number
}

export type CameraAction =
  | {
      type: "fitBounds"
      bounds: [[number, number], [number, number]]
      padding: Padding
      maxZoom: number
      duration: number
    }
  | {
      type: "easeTo"
      center: { lng: number; lat: number }
      zoom: number
      padding: Padding
      duration: number
    }

/**
 * Resolve the camera action for an outcome selection.
 *
 * @param outcomeCode  Outcome short code (e.g. "CWS_DEL")
 * @param mapMode      Current map mode
 * @param padding      Mode-specific padding (e.g. explore left-panel offset)
 * @param duration     Animation duration in ms (default 1000)
 */
export function resolveOutcomeCamera(
  outcomeCode: string,
  mapMode: MapMode,
  padding: Padding = { top: 0, bottom: 0, left: 0, right: 0 },
  duration = 1000,
): CameraAction {
  const config = getOutcomeConfig(outcomeCode)

  if (config?.cameraBounds) {
    return {
      type: "fitBounds",
      bounds: config.cameraBounds,
      padding: {
        ...padding,
        top: padding.top + 24,
        bottom: padding.bottom + 24,
      },
      maxZoom: 9,
      duration,
    }
  }

  if (config?.cameraPreset) {
    return {
      type: "easeTo",
      center: {
        lng: config.cameraPreset.longitude,
        lat: config.cameraPreset.latitude,
      },
      zoom: config.cameraPreset.zoom,
      padding,
      duration,
    }
  }

  if (mapMode === "explore") {
    return {
      type: "fitBounds",
      bounds: EXPLORE_BOUNDS,
      padding,
      maxZoom: 10,
      duration,
    }
  }

  return {
    type: "easeTo",
    center: {
      lng: CALIFORNIA_CENTERED_VIEW.longitude,
      lat: CALIFORNIA_CENTERED_VIEW.latitude,
    },
    zoom: CALIFORNIA_CENTERED_VIEW.zoom,
    padding,
    duration,
  }
}
