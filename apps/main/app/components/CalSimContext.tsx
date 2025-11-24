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
  showRivers: boolean
  toggleRivers: () => void
  setShowRivers: (show: boolean) => void
  riversAnimationProgress: number
  setRiversAnimationProgress: (progress: number) => void
  showInflowArrows: boolean
  toggleInflowArrows: () => void
  inflowArrowsOpacity: number
  setInflowArrowsOpacity: (opacity: number) => void
  isPanelsExpanded: boolean
  setIsPanelsExpanded: (expanded: boolean) => void
  isPanelsVisible: boolean
  setIsPanelsVisible: (visible: boolean) => void
  selectedOutcome: string | null
  setSelectedOutcome: (outcome: string | null) => void
  geocoderMarker: [number, number] | null
  setGeocoderMarker: (position: [number, number] | null) => void
  activePanel: string | null
  setActivePanel: (panelId: string | null) => void
}

const CalSimContext = createContext<CalSimContextType | undefined>(undefined)

export function CalSimProvider({ children }: { children: ReactNode }) {
  const [isCalSimVisible, setIsCalSimVisible] = useState(false)
  const [showBasins, setShowBasins] = useState(false)
  const [showRivers, _setShowRivers] = useState(false)
  const [riversAnimationProgress, setRiversAnimationProgress] = useState(0)
  const [showInflowArrows, setShowInflowArrows] = useState(false)
  const [inflowArrowsOpacity, setInflowArrowsOpacity] = useState(0)
  const [isPanelsExpanded, setIsPanelsExpanded] = useState(false)
  const [isPanelsVisible, setIsPanelsVisible] = useState(false)
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null)
  const [geocoderMarker, setGeocoderMarker] = useState<[number, number] | null>(
    null,
  )
  const [activePanel, _setActivePanel] = useState<string | null>(null)
  
  // Wrapper with logging
  const setShowRivers = useCallback((show: boolean) => {
    console.log('🌊 CalSimContext setShowRivers called:', show, 'Current:', showRivers)
    console.trace('Call stack:')
    _setShowRivers(show)
  }, [showRivers])
  
  const setActivePanel = useCallback((panelId: string | null) => {
    console.log('📍 CalSimContext setActivePanel called:', panelId)
    _setActivePanel(panelId)
  }, [])

  const toggleCalSim = useCallback(() => {
    setIsCalSimVisible((prev) => !prev)
  }, [])

  const toggleBasins = useCallback(() => {
    setShowBasins((prev) => !prev)
  }, [])

  const toggleRivers = useCallback(() => {
    setShowRivers((prev) => !prev)
  }, [])

  const toggleInflowArrows = useCallback(() => {
    setShowInflowArrows((prev) => !prev)
  }, [])

  return (
    <CalSimContext.Provider
      value={{
        isCalSimVisible,
        toggleCalSim,
        showBasins,
        toggleBasins,
        showRivers,
        toggleRivers,
        setShowRivers,
        riversAnimationProgress,
        setRiversAnimationProgress,
        showInflowArrows,
        toggleInflowArrows,
        inflowArrowsOpacity,
        setInflowArrowsOpacity,
        isPanelsExpanded,
        setIsPanelsExpanded,
        isPanelsVisible,
        setIsPanelsVisible,
        selectedOutcome,
        setSelectedOutcome,
        geocoderMarker,
        setGeocoderMarker,
        activePanel,
        setActivePanel,
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
