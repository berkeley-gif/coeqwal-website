import type { Metadata } from "next"
import "./globals.css"
import React from "react"
import ClientProviders from "./ClientProviders"
import LanguageProvider from "./LanguageProvider"

export const metadata: Metadata = {
  title: "COEQWAL",
  description: "Alternative California water solutions",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <ClientProviders>
            {children}
          </ClientProviders>
        </LanguageProvider>
      </body>
    </html>
  )
}
