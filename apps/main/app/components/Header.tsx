"use client"

import { useRouter } from "next/navigation"
import { Header as UIHeader } from "@repo/ui"

/**
 * Main application header with Next.js routing logic
 */
export function Header() {
  const router = useRouter()

  // Handle data page navigation
  const handleDataClick = () => {
    router.push("/data")
  }

  // Handle tools dropdown clicks
  // const handleToolsClick = (tool: "scenario-explorer" | "needs-search") => {
  //   if (tool === "scenario-explorer") {
  //     // TODO: Navigate to scenario data explorer
  //     console.log("Navigate to scenario data explorer")
  //   } else if (tool === "needs-search") {
  //     // TODO: Navigate to needs-based search
  //     console.log("Navigate to needs-based search")
  //   }
  // }

  return <UIHeader onDataClick={handleDataClick} />
}
