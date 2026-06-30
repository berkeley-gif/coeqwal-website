"use client"

/**
 * useTourFocusManagement - Keeps keyboard focus sane while a tour runs,
 * so the card behaves like an accessible dialog. Three considerations:
 *
 *   1. Restore: remember whatever was focused when the tour opened, and
 *      return focus there when it closes.
 *   2. Autofocus: move focus to the Next button on each step so Enter
 *      and Tab start from a sensible place.
 *   3. Trap: keep Tab (and Shift+Tab) cycling within the card instead
 *      of escaping to the page behind the scrim.
 *
 * Owns the `cardRef` and `nextBtnRef` and returns them for the runner
 * to attach to the rendered card.
 */

import { useEffect, useRef } from "react"
import type { TourTool } from "../registry"

/** Delay before autofocus so the card is mounted and laid out first. */
const AUTOFOCUS_DELAY_MS = 50

export function useTourFocusManagement(
  tourTool: TourTool | null,
  tourStep: number,
): {
  cardRef: React.RefObject<HTMLDivElement | null>
  nextBtnRef: React.RefObject<HTMLButtonElement | null>
} {
  const cardRef = useRef<HTMLDivElement | null>(null)
  const nextBtnRef = useRef<HTMLButtonElement | null>(null)

  // 1. Restore focus to the element that had it when the tour opened.
  const triggerElRef = useRef<HTMLElement | null>(null)
  useEffect(() => {
    if (!tourTool) return
    triggerElRef.current = document.activeElement as HTMLElement | null
    return () => {
      triggerElRef.current?.focus?.()
    }
  }, [tourTool])

  // 2. Autofocus the Next button on entry and on each step change.
  useEffect(() => {
    if (!tourTool) return
    const timer = window.setTimeout(() => {
      nextBtnRef.current?.focus({ preventScroll: true })
    }, AUTOFOCUS_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [tourTool, tourStep])

  // 3. Trap Tab within the card.
  useEffect(() => {
    if (!tourTool) return
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return
      const card = cardRef.current
      if (!card) return
      const focusables = card.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      )
      if (focusables.length === 0) return
      const first = focusables.item(0)
      const last = focusables.item(focusables.length - 1)
      if (first == null || last == null) return
      const active = document.activeElement as HTMLElement | null
      if (e.shiftKey) {
        if (active === first || !card.contains(active)) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (active === last || !card.contains(active)) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [tourTool])

  return { cardRef, nextBtnRef }
}
