// wrappers for client-side components

"use client"
import React from "react"
import { UiLocaleProvider } from "@repo/ui/context/UiLocaleContext"
import { TranslationProvider, useTranslation } from "@repo/i18n"
import ThemeRegistry from "@repo/ui/themes/ThemeRegistry"

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TranslationProvider>
      <LocaleProviderWrapper>
        <ThemeRegistry>{children}</ThemeRegistry>
      </LocaleProviderWrapper>
    </TranslationProvider>
  )
}

function LocaleProviderWrapper({ children }: { children: React.ReactNode }) {
  const { locale, setLocale } = useTranslation()

  return (
    <UiLocaleProvider externalLocale={locale} externalSetLocale={setLocale}>
      {children}
    </UiLocaleProvider>
  )
}
