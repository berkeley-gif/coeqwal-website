"use client"


interface LogoProps {
  width?: number
  height?: number
}

/**
 * COEQWAL Logo Component
 *
 * Renders the COEQWAL logo as an SVG.
 * Directly includes the SVG code from the original file
 * to ensure consistent rendering across different environments.
 */
export function Logo({ width = 200 }: LogoProps) {
  return <img src="/images/coeqwal_logo_color.svg" width={width} />
}
