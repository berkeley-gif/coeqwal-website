import type { Metadata } from "next"
import { ThemeRegistry } from "@repo/ui/themes/ThemeRegistry"
import { TranslationProvider } from "@repo/i18n"

export const metadata: Metadata = {
  title: "Storyline Management",
  description: "Storyline Management Application",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <TranslationProvider initialLocale="en">
          <ThemeRegistry>{children}</ThemeRegistry>
        </TranslationProvider>
      </body>
    </html>
  )
}
