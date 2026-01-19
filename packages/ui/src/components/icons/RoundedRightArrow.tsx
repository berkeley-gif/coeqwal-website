/**
 * RoundedRightArrow - SVG arrow icon pointing right
 */

import React from "react"

export interface RoundedRightArrowProps extends React.SVGProps<SVGSVGElement> {
  color?: string
}

export function RoundedRightArrow({
  color = "currentColor",
  ...svgProps
}: RoundedRightArrowProps) {
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
      {/* Triangular arrowhead with rounded corners pointing right */}
      <path
        d="M36 24 
           Q 35 21 30 18
           Q 25 14 20 10
           Q 16 8 16 12
           L 16 36
           Q 16 40 20 38
           Q 25 34 30 30
           Q 35 27 36 24 Z"
        fill={color}
      />
    </svg>
  )
}
