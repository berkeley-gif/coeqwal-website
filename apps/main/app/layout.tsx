import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter"
import ThemeRegistry from "@repo/ui/themes/ThemeRegistry"
import type { Metadata } from "next"
import { NextIntlClientProvider, getMessages } from '@repo/i18n'
import { notFound } from 'next/navigation'
import { ReactNode } from 'react'

import "./globals.css"

export const metadata: Metadata = {
  title: "COEQWAL",
  description: "Find alternative California water solutions",
}

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'es' }] // Ensure static pages for each locale
}

export default async function RootLayout({
  children,
  params: { locale },
}: Readonly<{
  children: React.ReactNode
  params: { locale: string }
}>) {
  const messages = await getMessages(locale, '@/locales'); // Load merged global + local translations
  if (!messages) notFound()

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AppRouterCacheProvider>
            <ThemeRegistry>{children}</ThemeRegistry>
          </AppRouterCacheProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
