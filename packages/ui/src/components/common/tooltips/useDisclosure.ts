"use client"

/**
 * useDisclosure - Open/close state for tooltips and popovers.
 *
 * Works controlled (pass `open`) or uncontrolled (pass `defaultOpen`), and wires
 * the opt-in close-on-scroll and close-on-Escape effects that tooltip
 * components kept re-implementing. Returns the usual onOpen/onClose/onToggle.
 */

import { useCallback, useEffect, useState } from "react"

export interface UseDisclosureOptions {
  /** Controlled open value. When provided, internal state is not used */
  open?: boolean
  /** Initial open value when uncontrolled. Defaults to false */
  defaultOpen?: boolean
  /** Notified on every open/close transition (required for controlled use) */
  onOpenChange?: (open: boolean) => void
  /** Close when the user scrolls anywhere (default: false) */
  closeOnScroll?: boolean
  /** Close when the user presses Escape (default: false) */
  closeOnEscape?: boolean
}

export interface UseDisclosureResult {
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  onToggle: () => void
  setOpen: (open: boolean) => void
}

export function useDisclosure({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  closeOnScroll = false,
  closeOnEscape = false,
}: UseDisclosureOptions = {}): UseDisclosureResult {
  const isControlled = controlledOpen !== undefined
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next)
      onOpenChange?.(next)
    },
    [isControlled, onOpenChange],
  )

  const onOpen = useCallback(() => setOpen(true), [setOpen])
  const onClose = useCallback(() => setOpen(false), [setOpen])
  const onToggle = useCallback(() => setOpen(!isOpen), [setOpen, isOpen])

  useEffect(() => {
    if (!isOpen || !closeOnScroll) return
    // Capture phase so scrolls on any nested container also dismiss.
    const handleScroll = () => onClose()
    window.addEventListener("scroll", handleScroll, true)
    return () => window.removeEventListener("scroll", handleScroll, true)
  }, [isOpen, closeOnScroll, onClose])

  useEffect(() => {
    if (!isOpen || !closeOnEscape) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, closeOnEscape, onClose])

  return { isOpen, onOpen, onClose, onToggle, setOpen }
}
