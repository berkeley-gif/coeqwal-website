"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react"

interface CalSimContextType {
  isCalSimVisible: boolean
  toggleCalSim: () => void
  showBasins: boolean
  toggleBasins: () => void
  isPanelsExpanded: boolean
  setIsPanelsExpanded: (expanded: boolean) => void
  isPanelsVisible: boolean
  setIsPanelsVisible: (visible: boolean) => void
  selectedOutcome: string | null
  setSelectedOutcome: (outcome: string | null) => void
  geocoderMarker: [number, number] | null
  setGeocoderMarker: (position: [number, number] | null) => void
}

const CalSimContext = createContext<CalSimContextType | undefined>(undefined)

export function CalSimProvider({ children }: { children: ReactNode }) {
  const [isCalSimVisible, setIsCalSimVisible] = useState(false)
  const [showBasins, setShowBasins] = useState(false)
  const [isPanelsExpanded, setIsPanelsExpanded] = useState(false)
  const [isPanelsVisible, setIsPanelsVisible] = useState(false)
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null)
  const [geocoderMarker, setGeocoderMarker] = useState<[number, number] | null>(null)

  const toggleCalSim = useCallback(() => {
    setIsCalSimVisible((prev) => {
      console.log(`CalSim toggle: ${prev} -> ${!prev}`)
      return !prev
    })
  }, [])

  const toggleBasins = useCallback(() => {
    setShowBasins((prev) => {
      console.log(`Basins toggle: ${prev} -> ${!prev}`)
      return !prev
    })
  }, [])

  return (
    <CalSimContext.Provider
      value={{
        isCalSimVisible,
        toggleCalSim,
        showBasins,
        toggleBasins,
        isPanelsExpanded,
        setIsPanelsExpanded,
        isPanelsVisible,
        setIsPanelsVisible,
        selectedOutcome,
        setSelectedOutcome,
        geocoderMarker,
        setGeocoderMarker,
      }}
    >
      {children}
    </CalSimContext.Provider>
  )
}

export function useCalSimToggle() {
  const context = useContext(CalSimContext)
  if (!context) {
    throw new Error("useCalSimToggle must be used within a CalSimProvider")
  }
  return context
}
