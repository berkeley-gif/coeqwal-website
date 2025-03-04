"use client"
import React, { useState, useEffect } from "react"
import { UiLocaleProvider } from "@repo/ui/context/UiLocaleContext"
import { TranslationProvider } from "@repo/i18n"
import ThemeRegistry from "@repo/ui/themes/ThemeRegistry"

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode
}) {
  // Start with no language detected => show skeleton
  const [locale, setLocale] = useState<"en" | "es" | null>(null)

  useEffect(() => {
    const userLang = navigator.language.slice(0, 2)
    // Only accept 'en' or 'es'; default to 'en' if unknown
    setLocale(userLang === "es" ? "es" : "en")
  }, [])

  // Until we know the language, render a skeleton or placeholder.
  // This matches the server-rendered HTML (which also shows skeleton).
  if (locale === null) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        Loading…
      </div>
    )
  }

  return (
    // The UI context also depends on this top-level state
    <UiLocaleProvider externalLocale={locale} externalSetLocale={setLocale}>
      {/*
        Pass forcedLocale to TranslationProvider
        so main text & UI share the same "locale"
      */}
      <TranslationProvider forcedLocale={locale} onChangeLocale={setLocale}>
        <ThemeRegistry>{children}</ThemeRegistry>
      </TranslationProvider>
    </UiLocaleProvider>
  )
}
