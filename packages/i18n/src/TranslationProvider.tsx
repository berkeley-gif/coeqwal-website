"use client"

import React, { createContext, useState, useContext, useEffect } from "react"

type Locale = "en" | "es"

type LocalTranslationSchema = {
  header: {
    buttons: {
      getData: string
      aboutCOEQWAL: string
    }
  }
};

// A minimal fallback
const fallbackMessages: LocalTranslationSchema = {
  header: {
    buttons: {
      getData: "",
      aboutCOEQWAL: ""
    }
  }
}

interface TranslationContextProps {
  locale: Locale
  messages: LocalTranslationSchema
  setLocale: (locale: Locale) => void
}

const TranslationContext = createContext<TranslationContextProps>({
  locale: "en",
  messages: fallbackMessages,
  setLocale: () => {}
})

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en")
  const [messages, setMessages] = useState<LocalTranslationSchema>(fallbackMessages)

  // Fetch chosen locale on locale change
  useEffect(() => {
    async function fetchTranslations() {
      try {
        const response = await fetch(`/locales/${locale}.json`)
        if (!response.ok) {
          throw new Error(`Could not load locale file for "${locale}"`)
        }
        const data = (await response.json()) as LocalTranslationSchema
        setMessages(data)
      } catch (error) {
        console.error("Error fetching translations:", error)
        // Provide a fallback or keep existing messages
        setMessages(fallbackMessages)
      }
    }

    fetchTranslations()
  }, [locale])

  return (
    <TranslationContext.Provider value={{ locale, messages, setLocale }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const { locale, messages, setLocale } = useContext(TranslationContext)

  /**
   * Helper to traverse translation keys (e.g. "header.buttons.getData").
   * Returns an empty string if not found or not a string.
   */
  function t(key: string): string {
    // Split the key and walk the dictionary object
    const result = key.split(".").reduce<unknown>((acc, cur) => {
      if (acc && typeof acc === "object") {
        return (acc as Record<string, unknown>)[cur]
      }
      return undefined
    }, messages as Record<string, unknown>)

    // Only return if the final value is a string
    return typeof result === "string" ? result : ""
  }

  return { locale, t, setLocale }
} 