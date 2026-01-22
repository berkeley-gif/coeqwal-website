import type { Metadata } from "next"
import { ThemeRegistry } from "@repo/ui/themes/ThemeRegistry"
import { TranslationProvider } from "@repo/i18n"
import { FontLoader } from "./components/helpers/FontLoader"
import ClientDynamicMapProvider from "./components/ClientDynamicMapProvider"

export const metadata: Metadata = {
  title: "How Climate Change Affects California's Water",
  description:
    "We need better planning to adapt to the changing climate in California",
}

//theme caused the bugs
//TODO: check out client dynamic map
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
          <ThemeRegistry>
            <ClientDynamicMapProvider>{children}</ClientDynamicMapProvider>
          </ThemeRegistry>
        </TranslationProvider>
      </body>
    </html>
  )
}
