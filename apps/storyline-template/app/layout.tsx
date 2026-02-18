import type { Metadata } from "next"
import { ThemeRegistry } from "@repo/ui/themes/ThemeRegistry"
import { TranslationProvider } from "@repo/i18n"
import { FontLoader } from "./components/helpers/FontLoader"
import ClientDynamicMapProvider from "./components/ClientDynamicMapProvider"

export const metadata: Metadata = {
  title: "Storyline Template",
  description: "Copy this app to start a new COEQWAL storyline",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <FontLoader kitId="rxm7kha" />
        <TranslationProvider initialLocale="en">
          <ThemeRegistry theme="story">
            <ClientDynamicMapProvider>{children}</ClientDynamicMapProvider>
          </ThemeRegistry>
        </TranslationProvider>
      </body>
    </html>
  )
}
