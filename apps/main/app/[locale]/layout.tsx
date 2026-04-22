/**
 * Root layout - Application root with providers
 * Sets up theme, translations, and font loading for the entire app.
 */
import { StrictMode, Suspense } from "react"
import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"
import { NextIntlClientProvider } from "next-intl"
import { notFound } from "next/navigation"
import { ThemeRegistry } from "@repo/ui/themes/ThemeRegistry"
import { DataProvider } from "@repo/data/providers"
import { PanelTuner } from "@repo/ui"
import { LocaleDetector } from "../components/localeDetector"
import { FontLoader } from "../components/FontLoader"
import { ActiveThemePanel } from "../components/ActiveThemePanel"
import { locales, type Locale } from "../../i18n.config"


export const metadata: Metadata = {
  title: "COEQWAL",
  description: "Alternative California water management scenarios",
}

interface RootLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function RootLayout({ children, params }: RootLayoutProps) {
  const { locale } = await params
  setRequestLocale(locale)

  if (!locales.includes(locale as Locale)) {
    notFound()
  }

  const messages = (await import(`../../messages/${locale}.json`)).default

  return (
    <html lang={locale} style={{ position: "relative" }}>
      <body style={{ position: "relative" }}>
        <StrictMode>
          <FontLoader kitId="rxm7kha" />
          <NextIntlClientProvider locale={locale} messages={messages}>
            <DataProvider>
              <ThemeRegistry>
                <Suspense fallback={null}>
                  <ActiveThemePanel />
                </Suspense>
                <LocaleDetector />
                {children}
                <PanelTuner />
              </ThemeRegistry>
            </DataProvider>
          </NextIntlClientProvider>
        </StrictMode>
      </body>
    </html>
  )
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}