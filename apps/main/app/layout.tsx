import type { Metadata } from "next"
import "./globals.css"
import React from "react"
import ClientProviders from "./ClientProviders"

export const metadata: Metadata = {
  title: "COEQWAL",
  description: "Find alternative California water solutions",
}

// No "use client" at the top: This is a SERVER component.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {/* 
          Insert a nested client component that will handle useState,
          contexts, or any other client-only logic.
        */}
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  )
}
