"use client"

interface LogoProps {
  width?: number
  height?: number
  /** Logo color variant: "color" for dark backgrounds, "white" for light background, "transparent" for transparent background */
  variant?: "color" | "white" | "transparent"
}

/**
 * COEQWAL Logo Component
 *
 * Renders the COEQWAL logo as an image.
 *
 * WCAG 2.0 AA Compliance:
 * - WCAG 1.1.1: Alt text provided for non-decorative image
 */

function getImgSrc(variant: 'color' | 'white' | 'transparent') {
  switch (variant) {
    case 'white':
      return "/images/coeqwal_logo_white.svg"
      break;
    case 'transparent':
      return "/images/coeqwal_logo_color_transparent.png"
      break;
    default:
      return "/images/coeqwal_logo_color.svg"
  }
}
export function Logo({ width = 150, variant = "color" }: LogoProps) {
  const src = getImgSrc(variant);
  // Drop shadow for white variant to improve visibility on light backgrounds
  const style: React.CSSProperties =
    variant === "white"
      ? { filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))" }
      : {}

  // WCAG 1.1.1: Alt text required - DO NOT REMOVE
  return <img src={src} width={width} alt="COEQWAL" style={style} />
}
