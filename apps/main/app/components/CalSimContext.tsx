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
}

const CalSimContext = createContext<CalSimContextType | undefined>(undefined)

export function CalSimProvider({ children }: { children: ReactNode }) {
  const [isCalSimVisible, setIsCalSimVisible] = useState(false)

  const toggleCalSim = useCallback(() => {
    setIsCalSimVisible((prev) => !prev)
  }, [])

  return (
    <CalSimContext.Provider value={{ isCalSimVisible, toggleCalSim }}>
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
