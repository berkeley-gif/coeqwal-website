"use client"

import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import { RefObject } from "react"
import { ViewState, MapboxMapRef, MapState } from "./types"

// TODO: Add proper cleanup

// We'll store the map instance outside the store for direct access
// This avoids issues with read-only properties
let mapInstance: MapboxMapRef | null = null

// Note: Zustand v5 syntax
export const useMapStore = create<MapState>()(
  immer(
    () =>
      ({
        // Initial state
        mapRef: null,
        viewState: {
          longitude: -126.037,
          latitude: 37.962,
          zoom: 5.83,
          bearing: 0,
          pitch: 0,
        },
      }) as MapState,
  ),
)

// Actions
export const mapActions = {
  setMapRef: (ref: RefObject<MapboxMapRef>) =>
    useMapStore.setState({ mapRef: ref }),

  // Register the actual map instance for direct access
  registerMapInstance: (instance: MapboxMapRef) => {
    mapInstance = instance
  },

  setViewState: (viewState: ViewState) =>
    useMapStore.setState((state) => {
      state.viewState = viewState
    }),

  flyTo: (
    longitude: number,
    latitude: number,
    zoom: number,
    pitch?: number,
    bearing?: number,
    duration?: number,
  ) => {
    // First try the directly registered instance
    if (mapInstance) {
      const map = mapInstance.getMap()
      map.flyTo({
        center: [longitude, latitude],
        zoom,
        pitch,
        bearing,
        duration,
      })
    }
    // Fall back to the ref if necessary
    else {
      const { mapRef } = useMapStore.getState()
      if (mapRef?.current) {
        const map = mapRef.current.getMap()
        map.flyTo({
          center: [longitude, latitude],
          zoom,
          pitch,
          bearing,
          duration,
        })
      }
    }

    // Update our state
    useMapStore.setState((state) => {
      state.viewState = {
        ...state.viewState,
        longitude,
        latitude,
        zoom,
        ...(pitch !== undefined ? { pitch } : {}),
        ...(bearing !== undefined ? { bearing } : {}),
      }
    })
  },
}
