"use client"

/**
 * useTourKeyboardNav - Wires the tour's navigation keys while a tour is
 * running: Escape closes, ArrowRight advances, ArrowLeft goes back.
 *
 * Key presses are ignored when focus is inside a text field (input,
 * textarea, or contenteditable) so typing in a search box does not
 * steer the tour. Tab containment is handled separately by
 * `useTourFocusManagement`.
 */

import { useEffect } from "react"
import type { TourTool } from "../registry"

interface UseTourKeyboardNavParams {
  tourTool: TourTool | null
  onNext: () => void
  onBack: () => void
  onClose: () => void
}

export function useTourKeyboardNav({
  tourTool,
  onNext,
  onBack,
  onClose,
}: UseTourKeyboardNavParams): void {
  useEffect(() => {
    if (!tourTool) return
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return
      }
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        onNext()
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        onBack()
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [tourTool, onClose, onNext, onBack])
}
