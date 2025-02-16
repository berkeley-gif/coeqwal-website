import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter"
import ThemeRegistry from "@repo/ui/themes/ThemeRegistry"
import type { Metadata } from "next"
import { TranslationProvider } from "@repo/i18n"

import "./globals.css"

export const metadata: Metadata = {
  title: "COEQWAL",
  description: "Find alternative California water solutions",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = "en"

  return (
    <html lang={locale}>
      <body>
        <AppRouterCacheProvider>
          <TranslationProvider>
            <ThemeRegistry>{children}</ThemeRegistry>
          </TranslationProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}
