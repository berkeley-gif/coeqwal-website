"use client"

/**
 * MobileModal - Reusable mobile modal component
 *
 * A centered, full-screen modal with backdrop for mobile views.
 * Used by FloatingGlossaryPanel, TierTooltipPortal, and KeyboardShortcuts.
 *
 * Features:
 * - Portal rendering for clean DOM isolation
 * - Fade animation for smooth transitions
 * - Semi-transparent backdrop with click-to-close
 * - Built-in ESC key handling
 * - Proper ARIA attributes for accessibility
 * - Scrollable content area
 *
 * WCAG Compliance:
 * - 2.1.1: Keyboard operable (ESC to close)
 * - 2.4.3: Focus management (close button receives focus)
 * - 4.1.2: role="dialog", aria-modal, aria-labelledby
 */

import { useCallback, useEffect, useRef } from "react"
import {
  Box,
  Portal,
  Fade,
  IconButton,
  CloseIcon,
  useTheme,
} from "../../mui-components"

export interface MobileModalProps {
  /** Whether the modal is open */
  open: boolean
  /** Callback when the modal should close */
  onClose: () => void
  /** Modal content */
  children: React.ReactNode
  /** Optional title displayed in the header */
  title?: React.ReactNode
  /** ID for aria-labelledby (auto-generated if title is provided) */
  titleId?: string
  /** Maximum width of the modal (default: 500) */
  maxWidth?: string | number
  /** Maximum height of the modal (default: "80vh") */
  maxHeight?: string
  /** Whether to show the close button (default: true) */
  showCloseButton?: boolean
  /** Whether clicking the backdrop closes the modal (default: true) */
  closeOnBackdropClick?: boolean
  /** Whether pressing ESC closes the modal (default: true) */
  closeOnEscape?: boolean
  /** z-index for the modal (default: theme.zIndex.modal) */
  zIndex?: number
  /** ARIA label for the content region (enables focusable scrolling) */
  contentAriaLabel?: string
}

/**
 * Mobile modal component with backdrop and centered content
 */
export function MobileModal({
  open,
  onClose,
  children,
  title,
  titleId: providedTitleId,
  maxWidth = 500,
  maxHeight = "80vh",
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  zIndex: providedZIndex,
  contentAriaLabel,
}: MobileModalProps) {
  const theme = useTheme()
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Generate title ID if not provided
  const titleId = providedTitleId || (title ? "mobile-modal-title" : undefined)
  const zIndex = providedZIndex ?? theme.zIndex.modal

  // WCAG 2.1.1: Handle ESC key to close modal
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === "Escape" && open) {
        e.preventDefault()
        onClose()
      }
    },
    [closeOnEscape, open, onClose],
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  // WCAG 2.4.3: Focus close button when modal opens
  useEffect(() => {
    if (open && showCloseButton && closeButtonRef.current) {
      // Small delay to allow animation to start
      setTimeout(() => {
        closeButtonRef.current?.focus()
      }, 100)
    }
  }, [open, showCloseButton])

  const handleBackdropClick = () => {
    if (closeOnBackdropClick) {
      onClose()
    }
  }

  if (!open) return null

  return (
    <Portal>
      {/* Backdrop */}
      <Fade in={open}>
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex,
          }}
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
      </Fade>

      {/* Modal content */}
      <Fade in={open}>
        <Box
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          sx={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "calc(100vw - 32px)",
            maxWidth,
            maxHeight,
            backgroundColor: theme.palette.background.paper,
            borderRadius: theme.borderRadius.md,
            boxShadow: theme.shadow.lg,
            zIndex: zIndex + 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            outline: "none",
          }}
        >
          {/* Header (only if title or close button) */}
          {(title || showCloseButton) && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: title ? "space-between" : "flex-end",
                p: theme.space.section.sm,
                borderBottom: title
                  ? `1px solid ${theme.palette.divider}`
                  : "none",
                flexShrink: 0,
              }}
            >
              {title && (
                <Box
                  id={titleId}
                  component="h2"
                  sx={{
                    m: 0,
                    typography: "h6",
                  }}
                >
                  {title}
                </Box>
              )}
              {showCloseButton && (
                <IconButton
                  ref={closeButtonRef}
                  onClick={onClose}
                  size="small"
                  aria-label="Close"
                  sx={
                    !title
                      ? {
                          position: "absolute",
                          top: theme.space.component.sm,
                          right: theme.space.component.sm,
                        }
                      : undefined
                  }
                >
                  <CloseIcon />
                </IconButton>
              )}
            </Box>
          )}

          {/* Content area - focusable for keyboard scrolling when contentAriaLabel is provided */}
          <Box
            tabIndex={contentAriaLabel ? 0 : undefined}
            role={contentAriaLabel ? "region" : undefined}
            aria-label={contentAriaLabel}
            sx={{
              flex: 1,
              overflowY: "auto",
              p: theme.space.section.sm,
              // WCAG 2.4.7: Focus visible styles for scrollable region
              ...(contentAriaLabel && {
                "&:focus-visible": {
                  outline: `2px solid ${theme.palette.blue.bright}`,
                  outlineOffset: "-2px",
                },
              }),
            }}
          >
            {children}
          </Box>
        </Box>
      </Fade>
    </Portal>
  )
}

export default MobileModal
