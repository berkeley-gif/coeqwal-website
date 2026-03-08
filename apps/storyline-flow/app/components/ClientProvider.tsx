"use client"

import { MapProvider } from "@repo/map"

export function ClientProvider({ children }: { children: React.ReactNode }) {
  return <MapProvider>{children}</MapProvider>
}
