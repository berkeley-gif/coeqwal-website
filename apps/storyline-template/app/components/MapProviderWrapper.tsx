"use client"

import { MapProvider } from "@repo/map"
import { ReactNode } from "react"

export function MapProviderClientWrapper({
  children,
}: {
  children: ReactNode
}) {
  return <MapProvider>{children}</MapProvider>
}

export default MapProviderClientWrapper
