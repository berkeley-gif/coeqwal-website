"use client"

/**
 * SearchBar - Strategy search input for Scenario Explorer
 *
 * Wrapper around CompactSearchBar that connects to the scenario explorer store.
 */

import React from "react"
import { CompactSearchBar } from "@repo/ui"
import { useScenarioExplorerStore } from "../store"

interface SearchBarProps {
  placeholder?: string
  rightContent?: React.ReactNode
  /** Whether to show a label above the search input */
  showLabel?: boolean
}

/**
 * Search bar connected to the scenario explorer store
 */
export default function SearchBar({
  placeholder = "Search scenarios...",
  rightContent,
  showLabel = true,
}: SearchBarProps) {
  const { searchQuery, setSearchQuery } = useScenarioExplorerStore()

  return (
    <CompactSearchBar
      value={searchQuery}
      onChange={setSearchQuery}
      placeholder={placeholder}
      rightContent={rightContent}
      showLabel={showLabel}
      label="Search"
      inputId="scenario-search-input"
      ariaLabel="Search scenarios"
    />
  )
}
