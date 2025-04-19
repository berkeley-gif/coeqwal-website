"use client"

import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import { RefObject } from "react"
import { ViewState, MapboxMapRef, MapState } from "./types"

// Note: Zustand v5 syntax
export const useMapStore = create<MapState>()(
  immer((set, get) => ({
    // Initial state
    mapRef: null,
    viewState: {
      longitude: -126.037,
      latitude: 37.962,
      zoom: 5.83,
      bearing: 0,
      pitch: 0,
    },
  })),
)

// Actions
export const mapActions = {
  setMapRef: (ref: RefObject<MapboxMapRef>) =>
    useMapStore.setState({ mapRef: ref }),

  setViewState: (viewState: ViewState) =>
    useMapStore.setState((state) => {
      state.viewState = viewState
    }),

  flyTo: (lng: number, lat: number, zoom: number) => {
    const { mapRef } = useMapStore.getState()
    if (mapRef?.current) {
      mapRef.current.flyTo(lng, lat, zoom)
    }
  },
}
