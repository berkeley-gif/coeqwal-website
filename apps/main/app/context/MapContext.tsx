import React, { createContext, useContext, useState, ReactNode } from 'react'

interface ViewState {
  latitude: number
  longitude: number
  zoom: number
}

interface MapContextProps {
  viewState: ViewState
  setViewState: React.Dispatch<React.SetStateAction<ViewState>>
}

const MapContext = createContext<MapContextProps | undefined>(undefined)

export const MapProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [viewState, setViewState] = useState<ViewState>({
    latitude: 37.8,
    longitude: -122.4,
    zoom: 8,
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
    throw new Error('useMap must be used within a MapProvider')
  }
  return context
}
