"use client"

import { MapProvider } from "@repo/map"
import { TabsProvider } from "../context/Tabs"

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <MapProvider>
      <TabsProvider>{children}</TabsProvider>
    </MapProvider>
  )
}
