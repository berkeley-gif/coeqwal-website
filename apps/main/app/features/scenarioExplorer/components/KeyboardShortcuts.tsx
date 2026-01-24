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

import { useCallback, useEffect, useState, useRef } from "react"
import {
  Box,
  Typography,
  Portal,
  ClickAwayListener,
  IconButton,
  CloseIcon,
  Fade,
  useTheme,
} from "@repo/ui/mui"
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
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Focus close button when modal opens for accessibility
  useEffect(() => {
    if (isHelpOpen && closeButtonRef.current) {
      closeButtonRef.current.focus()
    }
  }, [isHelpOpen])

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

      // Escape always works (to close modals)
      if (e.key === "Escape") {
        if (isHelpOpen) {
          e.preventDefault()
          setIsHelpOpen(false)
        }
        return
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

  if (!isHelpOpen) return null

  return (
    <Portal>
      {/* Backdrop */}
      <Fade in={isHelpOpen}>
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: theme.zIndex.modal,
          }}
          onClick={() => setIsHelpOpen(false)}
        />
      </Fade>

      {/* Modal content */}
      <ClickAwayListener onClickAway={() => setIsHelpOpen(false)}>
        <Box
          role="dialog"
          aria-modal="true"
          aria-labelledby="keyboard-shortcuts-title"
          sx={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            maxWidth: "90vw",
            backgroundColor: theme.palette.background.paper,
            borderRadius: theme.borderRadius.lg,
            boxShadow: theme.shadow.lg,
            p: theme.space.section.md,
            zIndex: theme.zIndex.modal + 1,
            outline: "none",
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: theme.space.component.md,
            }}
          >
            <Typography
              id="keyboard-shortcuts-title"
              variant="h6"
              component="h2"
            >
              Keyboard Shortcuts
            </Typography>
            <IconButton
              ref={closeButtonRef}
              onClick={() => setIsHelpOpen(false)}
              size="small"
              aria-label="Close keyboard shortcuts"
            >
              <CloseIcon />
            </IconButton>
          </Box>

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
        </Box>
      </ClickAwayListener>
    </Portal>
  )
}

export default KeyboardShortcuts
