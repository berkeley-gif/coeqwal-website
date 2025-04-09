"use client"

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
} from "react"

/*
 * TranslationProvider is a context provider that manages the application's locale and translation messages.
 * It initializes the locale based on the user's preference stored in local storage or the browser's language settings (defaults to "en").
 * The provider fetches the appropriate translation JSON file based on the current locale and updates the context with the translations.
 * It also provides a function to change the locale (handleSetLocale), which updates the local state.
 * The useTranslation hook allows components to access the current locale, translation messages, and a function to change the locale.
 */

type Locale = "en" | "es"
type NestedMessages = { [key: string]: string | NestedMessages }

interface TranslationContextProps {
  locale: Locale
  messages: NestedMessages
  setLocale: (locale: Locale) => void
  isLoading: boolean
}

interface TranslationProviderProps {
  children: React.ReactNode
  initialLocale?: Locale
}

// Default empty translations for stable hydration
const defaultMessages: Record<Locale, NestedMessages> = {
  en: {},
  es: {},
}

const TranslationContext = createContext<TranslationContextProps>({
  locale: "en",
  messages: defaultMessages.en,
  setLocale: () => {},
  isLoading: true,
})

export function TranslationProvider({
  children,
  initialLocale = "en",
}: TranslationProviderProps) {
  // Always start with the provided initialLocale for SSR consistency
  const [locale, setLocale] = useState<Locale>(initialLocale)
  const [messages, setMessages] = useState<NestedMessages>(
    defaultMessages[initialLocale],
  )
  const [isLoading, setIsLoading] = useState(true)
  const cachedMessages = useRef<Record<Locale, NestedMessages>>({
    en: {},
    es: {},
  })

  // After initial mount, check if we have a stored locale preference in localStorage
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const stored = localStorage.getItem("USER_LOCALE")
      if (stored === "en" || stored === "es") {
        // Only update if different from current to avoid unnecessary renders
        if (stored !== locale) {
          setLocale(stored as Locale)
        }
      } else {
        // If no stored preference, check browser language
        const browserLang = navigator.language.slice(0, 2)
        const detectedLocale = browserLang === "es" ? "es" : "en"
        if (detectedLocale !== locale) {
          setLocale(detectedLocale)
        }
      }
    } catch (e) {
      console.error("Error accessing localStorage:", e)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array = run only once on mount

  // Save locale preference to localStorage
  useEffect(() => {
    if (locale && typeof window !== "undefined") {
      localStorage.setItem("USER_LOCALE", locale)
    }
  }, [locale])

  // Fetch translations when locale changes
  useEffect(() => {
    async function fetchTranslations() {
      try {
        // Check if we already have the translations for this locale
        if (Object.keys(cachedMessages.current[locale]).length > 0) {
          setMessages(cachedMessages.current[locale])
          setIsLoading(false)
          return
        }

        setIsLoading(true)

        // Fetch app-specific translations (from the public folder)
        const file = locale === "en" ? "english" : "spanish"
        const response = await fetch(`/locales/${file}.json`)
        if (!response.ok) {
          throw new Error(`Could not load app locale file for "${locale}"`)
        }
        const appTranslations = await response.json()

        cachedMessages.current[locale] = appTranslations
        setMessages(appTranslations)
      } catch (error) {
        console.error("Error loading translations:", error)
        // Fall back to empty translations but mark as loaded
        setMessages(defaultMessages[locale])
      } finally {
        setIsLoading(false)
      }
    }

    if (locale) {
      fetchTranslations()
    }
  }, [locale])

  function handleSetLocale(newLocale: Locale) {
    setLocale(newLocale)
  }

  return (
    <TranslationContext.Provider
      value={{
        locale,
        messages,
        setLocale: handleSetLocale,
        isLoading,
      }}
    >
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslation() {
  const { locale, messages, setLocale, isLoading } =
    useContext(TranslationContext)

  /**
   * Helper to traverse nested translation keys (e.g. "header.buttons.getData").
   * Returns empty string if not found.
   */
  function t<T = string>(key: string): T | string {
    // Split the key and walk the dictionary object
    const result = key.split(".").reduce<unknown>(
      (acc, cur) => {
        if (acc && typeof acc === "object") {
          return (acc as Record<string, unknown>)[cur]
        }
        return undefined
      },
      messages as Record<string, unknown>,
    )

    // For existing code expecting strings
    if (result === undefined) {
      return ""
    }

    // Return the value as is
    return result as T
  }

  return { locale, t, setLocale, isLoading, messages }
}
