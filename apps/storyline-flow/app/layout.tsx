import type { Metadata } from "next"
import { ThemeRegistry } from "@repo/ui/themes/ThemeRegistry"
import { TranslationProvider } from "@repo/i18n"
import { FontLoader } from "./components/helpers/FontLoader"
import ClientDynamicMapProvider from "./components/ClientDynamicMapProvider"

export const metadata: Metadata = {
  title: "How Water Moves through California",
  description: "We have transformed the way how water moves through California",
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
          <ThemeRegistry theme="story">
            <ClientDynamicMapProvider>{children}</ClientDynamicMapProvider>
          </ThemeRegistry>
        </TranslationProvider>
      </body>
    </html>
  )
}
