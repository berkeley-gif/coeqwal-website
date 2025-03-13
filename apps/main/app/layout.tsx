import type { Metadata } from "next"
import "./globals.css"
import "@repo/ui/styles/fonts.css"
import React from "react"
import ClientProviders from "./ClientProviders"

// default, server-side metadata
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
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  )
}
