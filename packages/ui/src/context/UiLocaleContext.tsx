// React context that stores locale in state

"use client"

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react"

type Locale = "en" | "es" // Expandable!

interface UiLocaleContextType {
  locale: Locale
  setLocale: (loc: Locale) => void
}

// Props for your UiLocaleProvider to accept from the main app
interface UiLocaleProviderProps {
  children: React.ReactNode
  externalLocale: Locale
  externalSetLocale: (loc: Locale) => void
}

const UiLocaleContext = createContext<UiLocaleContextType>({
  locale: "en",
  setLocale: () => {},
})

export function UiLocaleProvider({
  children,
  externalLocale,
  externalSetLocale,
}: UiLocaleProviderProps) {
  // local state to manage the UI's locale
  const [locale, setLocale] = useState<Locale>(externalLocale)

  // If the main app's locale changes, sync it
  useEffect(() => {
    setLocale(externalLocale)
  }, [externalLocale])

  function handleSetLocale(newLocale: Locale) {
    externalSetLocale(newLocale)
    setLocale(newLocale)
  }

  return (
    <UiLocaleContext.Provider value={{
      locale,
      setLocale: handleSetLocale,
    }}>
      {children}
    </UiLocaleContext.Provider>
  )
}

export function useUiLocale() {
  return useContext(UiLocaleContext)
}
