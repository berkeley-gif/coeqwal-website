"use client"

interface LogoProps {
  width?: number
  height?: number
}

/**
 * COEQWAL Logo Component
 *
 * Renders the COEQWAL logo as an image.
 *
 * WCAG 2.0 AA Compliance:
 * - WCAG 1.1.1: Alt text provided for non-decorative image
 */
export function Logo({ width = 200 }: LogoProps) {
  // WCAG 1.1.1: Alt text required - DO NOT REMOVE
  return <img src="/images/coeqwal_logo_color.svg" width={width} alt="COEQWAL" />
}
