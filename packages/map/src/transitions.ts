import { MapTransitions } from "./types"
import type { CameraOptions, EasingOptions } from "mapbox-gl"

type TransitionOptions = {
  duration?: number
  easing?: (t: number) => number
  essential?: boolean
  [key: string]: unknown
}

/**
 * Creates flyTo options for a given view state and transition
 *
 * @param longitude Longitude
 * @param latitude Latitude
 * @param zoom Zoom level
 * @param transition Transition preset from MapTransitions or custom transition object
 * @param additionalOptions Additional options to pass to flyTo
 * @returns FlyTo options object
 */
export function createFlyToOptions(
  longitude: number,
  latitude: number,
  zoom: number,
  transition: TransitionOptions = MapTransitions.SMOOTH,
  additionalOptions: Record<string, unknown> = {},
): EasingOptions & CameraOptions {
  return {
    center: [longitude, latitude] as [number, number],
    zoom,
    duration: transition.duration,
    easing: transition.easing,
    essential: transition.essential,
    ...additionalOptions,
  }
}

/**
 * Creates context API flyTo options with the transitionOptions pattern
 *
 * @param longitude Longitude
 * @param latitude Latitude
 * @param zoom Zoom level
 * @param transition Transition preset from MapTransitions
 * @returns Options object for the context API flyTo method
 */
export function createFlyToContextOptions(
  longitude: number,
  latitude: number,
  zoom: number,
  transition: TransitionOptions = MapTransitions.SMOOTH,
) {
  return {
    longitude,
    latitude,
    zoom,
    transitionOptions: transition,
  }
}
