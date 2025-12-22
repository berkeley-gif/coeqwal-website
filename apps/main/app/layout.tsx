import type { Metadata } from "next"
import { ThemeRegistry } from "@repo/ui/themes/ThemeRegistry"
import { TranslationProvider } from "@repo/i18n"
import { FontLoader } from "./components/FontLoader"

export const metadata: Metadata = {
  title: "COEQWAL",
  description: "Alternative California water management scenarios",
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
          <ThemeRegistry>{children}</ThemeRegistry>
        </TranslationProvider>
      </body>
    </html>
  )
}
