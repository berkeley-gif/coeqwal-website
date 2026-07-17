/**
 * EnvironmentalRefuge, two filled water bands lifted from MUI's
 * `WavesIcon` (our environmental-river-flows glyph) under a single
 * filled heron-in-flight silhouette
 */

import type { SVGProps } from "react"

export interface EnvironmentalRefugeProps extends SVGProps<SVGSVGElement> {
  /** Icon size as CSS value. Defaults to "1.1em". */
  size?: number | string
  /** Fill color. Defaults to "currentColor". */
  color?: string
}

export function EnvironmentalRefuge({
  size = "1.1em",
  color = "currentColor",
  ...svgProps
}: EnvironmentalRefugeProps) {
  // Bottom two filled wave bands from `@mui/icons-material/Waves`.
  // The full Waves glyph has four bands. We keep just the bottom two
  // so the upper portion of the icon is free for the bird silhouette.
  const wavesPath =
    "M17 16.99c-1.35 0-2.2.42-2.95.8-.65.33-1.18.6-2.05.6-.9 0-1.4-.25-2.05-.6-.75-.38-1.57-.8-2.95-.8s-2.2.42-2.95.8c-.65.33-1.17.6-2.05.6v1.95c1.35 0 2.2-.42 2.95-.8.65-.33 1.17-.6 2.05-.6s1.4.25 2.05.6c.75.38 1.57.8 2.95.8s2.2-.42 2.95-.8c.65-.33 1.18-.6 2.05-.6.9 0 1.4.25 2.05.6.75.38 1.58.8 2.95.8v-1.95c-.9 0-1.4-.25-2.05-.6-.75-.38-1.6-.8-2.95-.8m0-4.45c-1.35 0-2.2.43-2.95.8-.65.32-1.18.6-2.05.6-.9 0-1.4-.25-2.05-.6-.75-.38-1.57-.8-2.95-.8s-2.2.43-2.95.8c-.65.32-1.17.6-2.05.6v1.95c1.35 0 2.2-.43 2.95-.8.65-.35 1.15-.6 2.05-.6s1.4.25 2.05.6c.75.38 1.57.8 2.95.8s2.2-.43 2.95-.8c.65-.35 1.15-.6 2.05-.6s1.4.25 2.05.6c.75.38 1.58.8 2.95.8v-1.95c-.9 0-1.4-.25-2.05-.6-.75-.38-1.6-.8-2.95-.8"

  // Filled heron silhouette: outstretched wings with a long thin neck
  // rising up between the wing peaks to a small head and a forward-
  // pointing beak. Goes clockwise from the left wing tip.
  const heronPath =
    "M2 7.5 C5 3 8 3 11 6 L11.9 5.6 C11.7 4 11.8 2 12.4 0.7 L12.5 0.4 L14.2 0.9 L13 1.3 C12.8 2.5 12.7 4.5 12.6 5.6 L12.7 6 C16 3 19 3 22 7.5 C19.5 6 17 6.5 14.2 8 C13.6 8.4 12.6 8.6 12 8.6 C11.4 8.6 10.4 8.4 9.8 8 C7 6.5 4.5 6 2 7.5 Z"

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
      <path d={wavesPath} fill="currentColor" />
      <path d={heronPath} fill="currentColor" />
    </svg>
  )
}

export default EnvironmentalRefuge
