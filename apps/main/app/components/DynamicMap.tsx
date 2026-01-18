"use client"

import dynamic from "next/dynamic"

// Dynamic import with ssr: false to reduce initial bundle size
// Map is client-only and loads after hydration
const PersistentMapWrapper = dynamic(
  () => import("../features/map/PersistentMapWrapper"),
  { ssr: false, loading: () => null }
)

export function DynamicMap() {
  return <PersistentMapWrapper />
}
