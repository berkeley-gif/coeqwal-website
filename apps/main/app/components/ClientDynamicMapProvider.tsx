"use client"

import dynamic from "next/dynamic"
import { ReactNode } from "react"

// Import MapProvider dynamically with SSR disabled
const MapProviderWithNoSSR = dynamic(
  () => import("./MapProviderWrapper"),
  { ssr: false }
)

export default function ClientDynamicMapProvider({ 
  children 
}: { 
  children: ReactNode 
}) {
  return <MapProviderWithNoSSR>{children}</MapProviderWithNoSSR>
} 