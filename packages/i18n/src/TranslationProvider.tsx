"use client"

import React, { createContext, useState, useContext, useEffect } from "react"

type Locale = "en" | "es"

interface TranslationContextProps {
  locale: Locale
  messages: Record<string, any> // Use a generic object for messages
  setLocale: (locale: Locale) => void
}

const TranslationContext = createContext<TranslationContextProps>({
  locale: "en",
  messages: {},
  setLocale: () => {},
})

export function TranslationProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [locale, setLocale] = useState<Locale>("en")
  const [messages, setMessages] = useState<Record<string, any>>({})

  // Fetch chosen locale on locale change
  useEffect(() => {
    async function fetchTranslations() {
      try {
        const file = locale === "en" ? "english" : "spanish"
        const response = await fetch(`/locales/${file}.json`)
        if (!response.ok) {
          throw new Error(`Could not load locale file for "${locale}"`)
        }
        const data = await response.json()
        setMessages(data)
      } catch (error) {
        console.error("Error fetching translations:", error)
      }
    }

    fetchTranslations()
  }, [locale])

  return (
    <TranslationContext.Provider value={{ locale, messages, setLocale }}>
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
