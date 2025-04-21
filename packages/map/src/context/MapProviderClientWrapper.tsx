"use client"

import { MapProvider } from "./MapContext"
import type { ReactNode } from "react"

export function MapProviderClientWrapper({
  children,
}: {
  children: ReactNode
}) {
  return <MapProvider>{children}</MapProvider>
}
