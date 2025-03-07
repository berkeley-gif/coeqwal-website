"use client"
import React, { useState } from "react"
import { UiLocaleProvider } from "@repo/ui/context/UiLocaleContext"
import { TranslationProvider } from "@repo/i18n"
import ThemeRegistry from "@repo/ui/themes/ThemeRegistry"

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode
}) {
  // Main app's single source of truth
  const [locale, setLocale] = useState<"en" | "es">("en")

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
