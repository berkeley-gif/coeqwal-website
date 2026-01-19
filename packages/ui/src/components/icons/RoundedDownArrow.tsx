/**
 * RoundedDownArrow - SVG arrow icon pointing down
 */

import React from "react"

export interface RoundedDownArrowProps extends React.SVGProps<SVGSVGElement> {
  color?: string
}

export function RoundedDownArrow({
  color = "currentColor",
  ...svgProps
}: RoundedDownArrowProps) {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      focusable="false"
      {...svgProps}
    >
      {/* Triangular arrowhead with rounded corners */}
      <path
        d="M24 36 
           Q 21 35 18 30
           Q 14 25 10 20
           Q 8 16 12 16
           L 36 16
           Q 40 16 38 20
           Q 34 25 30 30
           Q 27 35 24 36 Z"
        fill={color}
      />
    </svg>
  )
}
