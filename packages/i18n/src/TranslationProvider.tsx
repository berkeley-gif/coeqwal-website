"use client"

import React, { createContext, useState, useContext, useEffect } from "react"

type Locale = "en" | "es"
type NestedMessages = { [key: string]: string | NestedMessages }

interface TranslationContextProps {
  locale: Locale
  messages: NestedMessages
  setLocale: (locale: Locale) => void
}

interface TranslationProviderProps {
  children: React.ReactNode
  onChangeLocale?: (locale: Locale) => void
}

const TranslationContext = createContext<TranslationContextProps>({
  locale: "en",
  messages: {},
  setLocale: () => {},
})

export function TranslationProvider({
  children,
  onChangeLocale,
}: TranslationProviderProps) {
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window !== "undefined" && localStorage) {
      const storedLocale = localStorage.getItem("USER_LOCALE")
      if (storedLocale === "en" || storedLocale === "es") {
        return storedLocale as Locale
      }
      const userLang = navigator.language.slice(0, 2)
      return userLang === "es" ? "es" : "en"
    }
    // Default to 'en' if localStorage is not available (e.g., during SSR)
    return "en"
  })

  const [messages, setMessages] = useState<NestedMessages>({})

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage) {
      localStorage.setItem("USER_LOCALE", locale)
    }
  }, [locale])

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

  function handleSetLocale(newLocale: Locale) {
    setLocale(newLocale)
    onChangeLocale?.(newLocale)
  }

  return (
    <TranslationContext.Provider
      value={{
        locale,
        messages,
        setLocale: handleSetLocale,
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
