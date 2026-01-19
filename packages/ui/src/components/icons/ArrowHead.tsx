/**
 * ArrowHead - Triangular arrow SVG icon with rounded corners
 */

import type { SVGProps } from "react"

export interface ArrowHeadProps extends SVGProps<SVGSVGElement> {
  size?: number | string
  color?: string
}

// Right-pointing triangular arrow with rounded corners
export function ArrowHead({
  size = "100%",
  color = "currentColor",
  ...svgProps
}: ArrowHeadProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      focusable="false"
      {...svgProps}
    >
      <path d="M12 8 L12 40 L40 24 Z" fill={color} />
    </svg>
  )
}

export default ArrowHead
