import type { Metadata } from "next"
import { Lato } from "next/font/google"
import { ThemeRegistry } from "@repo/ui/themes/ThemeRegistry"
import { TranslationProvider } from "@repo/i18n"
import { MapProvider } from "@repo/map"
import "./globals.css"

const lato = Lato({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "700"],
})

export const metadata: Metadata = {
  title: "COEQWAL",
  description: "Alternative California water solutions",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${lato.className}`}>
        <TranslationProvider initialLocale="en">
          <ThemeRegistry>
            <MapProvider>{children}</MapProvider>
          </ThemeRegistry>
        </TranslationProvider>
      </body>
    </html>
  )
}
