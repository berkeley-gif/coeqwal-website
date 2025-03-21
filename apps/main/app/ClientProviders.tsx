// wrappers for client-side components
// so that layout.tsx doesn't need to be a client component
// and can use SSR

"use client"
import React, { useState, useEffect } from "react"
import { TranslationProvider } from "@repo/i18n"
import ThemeRegistry from "@repo/ui/themes/ThemeRegistry"
import { MapProvider } from "./context/MapContext"

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode
}) {
  const [clientReady, setClientReady] = useState(false)

  useEffect(() => {
    setClientReady(true)
  }, [])

  if (!clientReady) {
    // Render a skeleton or placeholder while the client is not ready
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--primary-background-color)",
        }}
      />
    )
  }

  return (
    <TranslationProvider>
      <ThemeRegistry>
        <MapProvider>{children}</MapProvider>
      </ThemeRegistry>
    </TranslationProvider>
  )
}
