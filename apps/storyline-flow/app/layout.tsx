import { StrictMode } from "react"
import type { Metadata } from "next"
import { ThemeRegistry } from "@repo/ui/themes/ThemeRegistry"
import { TranslationProvider } from "@repo/i18n"
import { FontLoader } from "./components/helpers/FontLoader"
import ClientDynamicMapProvider from "./components/ClientDynamicMapProvider"

export const metadata: Metadata = {
  title: "How Water Moves through California",
  description: "We have transformed the way how water moves through California",
}

//TODO: update how the map is provided to be consistent with the main app?
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <StrictMode>
          <FontLoader kitId="rxm7kha" />
          <TranslationProvider initialLocale="en">
            <ThemeRegistry>
              <ClientDynamicMapProvider>{children}</ClientDynamicMapProvider>
            </ThemeRegistry>
          </TranslationProvider>
        </StrictMode>
      </body>
    </html>
  )
}
