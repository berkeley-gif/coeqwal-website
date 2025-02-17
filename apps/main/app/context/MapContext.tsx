import React, { createContext, useContext, useState, ReactNode } from "react"

interface ViewState {
  latitude: number
  longitude: number
  zoom: number
  pitch: number
  bearing: number
}

interface MapContextProps {
  viewState: ViewState
  setViewState: React.Dispatch<React.SetStateAction<ViewState>>
}

const MapContext = createContext<MapContextProps | undefined>(undefined)

export const MapProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [viewState, setViewState] = useState<ViewState>({
    latitude: 37.46691547475763,
    longitude: -126.25665892967163,
    zoom: 5.36,
    pitch: 0,
    bearing: 0,
  })

  return (
    <MapContext.Provider value={{ viewState, setViewState }}>
      {children}
    </MapContext.Provider>
  )
}

export const useMap = () => {
  const context = useContext(MapContext)
  if (!context) {
    throw new Error("useMap must be used within a MapProvider")
  }
  return context
}
