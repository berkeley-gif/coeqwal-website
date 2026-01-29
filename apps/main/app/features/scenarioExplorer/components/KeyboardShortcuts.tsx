"use client"

/**
 * KeyboardShortcuts - Global keyboard shortcuts handler with help modal
 *
 * Provides global keyboard shortcuts for the scenario explorer:
 * - / : Focus search input
 * - ? : Show keyboard shortcuts help
 * - Alt+C : Clear scenario selections
 * - Escape : Close help modal
 *
 * WCAG 2.1.1: All shortcuts are keyboard-accessible and don't interfere with
 * native browser shortcuts or assistive technology.
 */

import { useCallback, useEffect, useState } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { MobileModal } from "@repo/ui"
import { useScenarioExplorerStore } from "../store"

interface ShortcutItem {
  keys: string[]
  description: string
}

const SHORTCUTS: ShortcutItem[] = [
  { keys: ["/"], description: "Focus search" },
  { keys: ["?"], description: "Show keyboard shortcuts" },
  { keys: ["Alt", "G"], description: "Toggle glossary" },
  { keys: ["Alt", "C"], description: "Clear selected scenarios" },
  { keys: ["Escape"], description: "Close dialogs and panels" },
]

/**
 * Keyboard shortcuts handler component
 * Renders nothing visible except when the help modal is open
 */
export function KeyboardShortcuts() {
  const theme = useTheme()
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const { clearScenarios, selectedScenarios } = useScenarioExplorerStore()

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in text inputs/textareas
      // Allow shortcuts on checkboxes/radio buttons since they only use Space
      const target = e.target as HTMLInputElement
      const isTextInput =
        (target.tagName === "INPUT" &&
          !["checkbox", "radio", "button", "submit"].includes(target.type)) ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable

      // Escape is handled by MobileModal when help is open
      if (e.key === "Escape" && isHelpOpen) {
        return // Let MobileModal handle it
      }

      // Don't intercept other keys when in text inputs
      if (isTextInput) return

      // / - Focus search
      if (e.key === "/") {
        e.preventDefault()
        const searchInput = document.getElementById("scenario-search-input")
        if (searchInput) {
          searchInput.focus()
        }
        return
      }

      // ? - Show help (Shift+/ on US keyboards)
      if (e.key === "?") {
        e.preventDefault()
        setIsHelpOpen(true)
        return
      }

      // Alt+C - Clear selections (use e.code for Mac compatibility where Alt produces special chars)
      if (e.altKey && e.code === "KeyC") {
        e.preventDefault()
        if (selectedScenarios.length > 0) {
          clearScenarios()
        }
        return
      }
    },
    [isHelpOpen, clearScenarios, selectedScenarios.length],
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  return (
    <MobileModal
      open={isHelpOpen}
      onClose={() => setIsHelpOpen(false)}
      title="Keyboard Shortcuts"
      titleId="keyboard-shortcuts-title"
      maxWidth={400}
    >
      {/* Shortcuts list */}
      <Box component="dl" sx={{ m: 0 }}>
        {SHORTCUTS.map((shortcut, index) => (
          <Box
            key={index}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              py: theme.space.component.md,
              borderBottom:
                index < SHORTCUTS.length - 1 ? theme.border.light : "none",
            }}
          >
            <Typography component="dd" variant="storyBody" sx={{ m: 0 }}>
              {shortcut.description}
            </Typography>
            <Box
              component="dt"
              sx={{
                display: "flex",
                gap: theme.space.gap.xs,
                m: 0,
              }}
            >
              {shortcut.keys.map((key, keyIndex) => (
                <Typography
                  key={keyIndex}
                  variant="caption"
                  component="kbd"
                  fontWeight="medium"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 28,
                    height: 28,
                    px: theme.space.component.sm,
                    backgroundColor: theme.palette.grey[100],
                    border: `1px solid ${theme.palette.grey[300]}`,
                    borderRadius: theme.borderRadius.sm,
                    boxShadow: `0 1px 0 ${theme.palette.grey[400]}`,
                  }}
                >
                  {key}
                </Typography>
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </MobileModal>
  )
}

export default KeyboardShortcuts
