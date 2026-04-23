/**
 * Root layout - pass-through shell.
 * HTML structure, providers, and theme are handled by
 * app/[locale]/layout.tsx which sets lang dynamically
 * based on the active locale.
 */
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "COEQWAL",
  description: "Alternative California water management scenarios",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}