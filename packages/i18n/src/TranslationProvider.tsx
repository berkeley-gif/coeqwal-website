"use client"

import React, { createContext, useState, useContext, useEffect, useRef } from "react"

/**
 * TranslationProvider is a context provider that manages the application's locale and translation messages.
 * It initializes the locale based on the user's preference stored in local storage or the browser's language settings (defaults to "en").
 * The provider fetches the appropriate translation JSON file based on the current locale and updates the context with the translations.
 * It also provides a function to change the locale (handleSetLocale), which updates both the local state and the parent's state if an onChangeLocale function is in the parent.
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
}

const TranslationContext = createContext<TranslationContextProps>({
  locale: "en",
  messages: {},
  setLocale: () => {},
  isLoading: true
})

export function TranslationProvider({ children }: TranslationProviderProps) {
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window === 'undefined') return 'en'; // Default for SSR
    
    try {
      const stored = localStorage.getItem("USER_LOCALE");
      if (stored === "en" || stored === "es") return stored as Locale;
      
      const browserLang = navigator.language.slice(0, 2);
      return browserLang === "es" ? "es" : "en";
    } catch (e) {
      return 'en'; // Fallback if localStorage access fails
    }
  });
  
  const [messages, setMessages] = useState<NestedMessages>({});
  const [isLoading, setIsLoading] = useState(true);
  const cachedMessages = useRef<Record<Locale, NestedMessages>>({
    en: {},
    es: {}
  });

  useEffect(() => {
    if (locale && typeof window !== 'undefined') {
      localStorage.setItem("USER_LOCALE", locale);
    }
  }, [locale]);

  useEffect(() => {
    async function fetchTranslations() {
      try {
        // Check if we already have the translations for this locale
        if (Object.keys(cachedMessages.current[locale]).length > 0) {
          setMessages(cachedMessages.current[locale]);
          setIsLoading(false);
          return;
        }
        
        setIsLoading(true);
        const file = locale === "en" ? "english" : "spanish";
        const response = await fetch(`/locales/${file}.json`);
        if (!response.ok) {
          throw new Error(`Could not load locale file for "${locale}"`);
        }
        const data = await response.json();
        cachedMessages.current[locale] = data;
        setMessages(data);
      } catch (error) {
        console.error("Error fetching translations:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (locale) {
      fetchTranslations();
    }
  }, [locale]);

  console.log('Loaded translations for locale:', locale, messages);
  if (typeof messages.CaliforniaWaterPanel === 'object' && messages.CaliforniaWaterPanel !== null) {
    console.log('CaliforniaWaterPanel.paragraphs:', messages.CaliforniaWaterPanel.paragraphs);
  } else {
    console.log('CaliforniaWaterPanel is not an object or is null:', messages.CaliforniaWaterPanel);
  }

  function handleSetLocale(newLocale: Locale) {
    setLocale(newLocale)
  }

  return (
    <TranslationContext.Provider
      value={{
        locale,
        messages,
        setLocale: handleSetLocale,
        isLoading
      }}
    >
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslation() {
  const { locale, messages, setLocale, isLoading } = useContext(TranslationContext)

  /**
   * Helper to traverse nested translation keys (e.g. "header.buttons.getData").
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

  return { locale, t, setLocale, isLoading }
}
