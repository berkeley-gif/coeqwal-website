"use client"

import React, { createContext, useState, useContext, useEffect } from "react"

type Locale = "en" | "es"

interface TranslationContextProps {
  locale: Locale
  messages: Record<string, any> // Use a generic object for messages
  setLocale: (locale: Locale) => void
}

// 1) Accept forcedLocale & an optional onChangeLocale
interface TranslationProviderProps {
  children: React.ReactNode
  forcedLocale: Locale
  onChangeLocale?: (locale: Locale) => void
}

const TranslationContext = createContext<TranslationContextProps>({
  locale: "en",
  messages: {},
  setLocale: () => {},
})

export function TranslationProvider({
  children,
  forcedLocale,
  onChangeLocale,
}: TranslationProviderProps) {
  const [messages, setMessages] = useState<Record<string, any>>({})

  // 2) On mount or forcedLocale change, fetch the appropriate JSON
  useEffect(() => {
    async function fetchTranslations() {
      try {
        const file = forcedLocale === "en" ? "english" : "spanish"
        const response = await fetch(`/locales/${file}.json`)
        if (!response.ok) {
          throw new Error(`Could not load locale file for "${forcedLocale}"`)
        }
        const data = await response.json()
        setMessages(data)
      } catch (error) {
        console.error("Error fetching translations:", error)
      }
    }

    fetchTranslations()
  }, [forcedLocale])

  // 3) This setLocale calls onChangeLocale if provided
  function setLocale(newLocale: Locale) {
    onChangeLocale?.(newLocale)
  }

  return (
    <TranslationContext.Provider
      value={{
        locale: forcedLocale, // no local state for locale
        messages, // updated whenever forcedLocale changes
        setLocale, // triggers parent's state
      }}
    >
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslation() {
  const { locale, messages, setLocale } = useContext(TranslationContext)

  /**
   * Helper to traverse translation keys (e.g. "header.buttons.getData").
   * Returns an empty string if not found or not a string.
   */
  function t(key: string): string {
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

    // Only return if the final value is a string
    return typeof result === "string" ? result : ""
  }

  return { locale, t, setLocale }
}
