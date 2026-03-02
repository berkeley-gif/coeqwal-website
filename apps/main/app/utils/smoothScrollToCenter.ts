/**
 * Smoothly scrolls the viewport to vertically center an element.
 *
 * Uses a custom RAF animation instead of scrollIntoView({ behavior: "smooth" })
 * because the native API offers no control over duration or easing curve.
 *
 * @param elementId - The id of the element to center in the viewport.
 * @param duration  - Animation duration in milliseconds (default 1100ms).
 */
export function smoothScrollToCenter(elementId: string, duration = 1100): void {
  const el = document.getElementById(elementId)
  if (!el) return

  const rect = el.getBoundingClientRect()
  const targetY = Math.max(
    0,
    window.scrollY + rect.top + rect.height / 2 - window.innerHeight / 2,
  )

  const startY = window.scrollY
  const distance = targetY - startY
  const start = performance.now()

  // Ease-out quart: fast start, sharp deceleration near the end.
  const ease = (t: number) => 1 - Math.pow(1 - t, 4)

  const step = (now: number) => {
    const progress = Math.min((now - start) / duration, 1)
    window.scrollTo(0, startY + distance * ease(progress))
    if (progress < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}
