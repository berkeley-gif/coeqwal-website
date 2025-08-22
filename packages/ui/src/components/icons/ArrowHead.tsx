"use client"

import type { SVGProps } from "react"

export interface ArrowHeadProps extends SVGProps<SVGSVGElement> {
  size?: number | string
  color?: string
}

// Right-pointing triangular arrow with visually rounded corners
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
      <path
        d="M12 8 L12 40 L40 24 Z"
        stroke={color}
        strokeWidth={16}
        strokeLinejoin="round"
        fill="none"
      />
      {/* Inner fill to keep arrow solid while preserving rounded outline */}
      <polygon points="14,12 14,36 36,24" fill={color} />
    </svg>
  )
}

export default ArrowHead
