"use client"

import { MapProvider } from "@repo/map"
import { ReactNode } from "react"

/**
 * Client Component wrapper for MapProvider
 *
 * This component exists to solve React Server Components (RSC) compatibility issues.
 * In Next.js, layout.tsx files are Server Components by default, but createContext
 * (used by MapProvider internally) requires client-side features.
 *
 * By wrapping MapProvider in this dedicated Client Component:
 * - We keep MapProvider on the client side where it can access browser APIs
 * - We avoid "createContext is not a function" errors in Server Components
 * - We maintain the server-rendering benefits of RSC for the rest of the app
 *
 * Usage:
 * ```tsx
 * // In a layout or other Server Component:
 * import { MapProviderClientWrapper } from "./components/MapProviderClientWrapper"
 *
 * export default function Layout({ children }) {
 *   return (
 *     <MapProviderClientWrapper>{children}</MapProviderClientWrapper>
 *   )
 * }
 * ```
 */
export function MapProviderClientWrapper({
  children,
}: {
  children: ReactNode
}) {
  return <MapProvider>{children}</MapProvider>
}

// Add default export for dynamic import
export default MapProviderClientWrapper
