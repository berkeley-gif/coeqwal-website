import type { Metadata } from "next"
import { ThemeRegistry } from "@repo/ui/themes/ThemeRegistry"
import { TranslationProvider } from "@repo/i18n"
import { FontLoader } from "./components/helpers/FontLoader"
import { ClientProvider } from "./components/ClientProvider"

export const metadata: Metadata = {
  title: "How equity shapes California water",
  description: "A small scrollytelling demo built with @repo/scrollytelling.",
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
          <ThemeRegistry>
            <ClientProvider>{children}</ClientProvider>
          </ThemeRegistry>
        </TranslationProvider>
      </body>
    </html>
  )
}
