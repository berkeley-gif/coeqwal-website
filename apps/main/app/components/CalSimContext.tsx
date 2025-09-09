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
}

const CalSimContext = createContext<CalSimContextType | undefined>(undefined)

export function CalSimProvider({ children }: { children: ReactNode }) {
  const [isCalSimVisible, setIsCalSimVisible] = useState(false)
  const [showBasins, setShowBasins] = useState(false)

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
      value={{ isCalSimVisible, toggleCalSim, showBasins, toggleBasins }}
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
