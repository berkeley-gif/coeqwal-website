/**
 * salmon category icon
 */

import type { SVGProps } from "react"

export interface SalmonProps extends SVGProps<SVGSVGElement> {
  /** Icon size as CSS value. Defaults to "1.1em". */
  size?: number | string
  /** Fill color. Defaults to "currentColor". */
  color?: string
}

export function Salmon({
  size = "1.1em",
  color = "currentColor",
  ...svgProps
}: SalmonProps) {

  const bodyPath =
    "M22 12 C22 11 20 9.5 14 9 C11 9 8 9.3 5.5 10 L1 5 L4 12 L1 19 L5.5 14 C8 14.7 11 15 14 15 C20 14.5 22 13 22 12 Z"

  // Single triangular dorsal fin on the back.
  const dorsalFin = "M8 9.3 L11 5.5 L14 9 Z"

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      focusable="false"
      style={{ color }}
      {...svgProps}
    >
      <path d={bodyPath} fill="currentColor" />
      <path d={dorsalFin} fill="currentColor" />
    </svg>
  )
}

export default Salmon
