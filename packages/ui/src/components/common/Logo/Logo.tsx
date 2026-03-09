import { LogoColor } from "./LogoColor"
import { LogoLight } from "./LogoLight"

interface LogoProps {
  width?: number
  /** Logo color variant */
  variant?: "color" | "light"
  className?: string
}

/**
 * COEQWAL Logo Component
 *
 * Renders the COEQWAL logo as an inline SVG.
 * The logo is bundled with the ui package.
 *
 * WCAG 2.0 AA Compliance:
 * - WCAG 1.1.1: SVG is decorative (aria-hidden) by default.
 *   The parent element (button/link) should provide the accessible name.
 *   Example: <button aria-label="COEQWAL home"><Logo /></button>
 */
export function Logo({ width = 150, variant = "color", className }: LogoProps) {
  const isLight = variant === "light"
  const SvgComponent = isLight ? LogoLight : LogoColor

  return (
    <span
      style={
        isLight
          ? { filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))" }
          : undefined
      }
    >
      <SvgComponent width={width} className={className} />
    </span>
  )
}
