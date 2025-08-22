"use client"

import React from "react"
import { Header as HeaderHome } from "@repo/ui"
import { useRouter } from "next/navigation"

/**
 * Main application header component
 */
export function Header() {
  const router = useRouter()

  // Handle data page navigation
  const handleDataClick = () => {
    router.push("/data")
  }

  // Handle tools dropdown clicks
  const handleToolsClick = (tool: "scenario-explorer" | "needs-search") => {
    if (tool === "scenario-explorer") {
      // TODO: Navigate to scenario data explorer
      console.log("Navigate to scenario data explorer")
    } else if (tool === "needs-search") {
      // TODO: Navigate to needs-based search
      console.log("Navigate to needs-based search")
    }
  }

  return (
    <HeaderHome onDataClick={handleDataClick} onToolsClick={handleToolsClick} />
  )
}
