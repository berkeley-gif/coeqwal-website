/**
 * Salmon, a side-profile silhouette of a Chinook (king) salmon. The
 * iconic features are emphasised: a long fusiform body, a deeply forked
 * tail with spots on both lobes (the Chinook field mark), a single
 * triangular dorsal fin, the small adipose fin between the dorsal and
 * the tail (the salmonid signature), a pelvic fin on the belly, and a
 * pronounced hooked lower jaw (kype) at the snout. Faces right.
 */

import type { SVGProps } from "react"
import { useTheme } from "../../mui-components"

export interface SalmonProps extends SVGProps<SVGSVGElement> {
  /** Icon size as CSS value. Defaults to "1.1em". */
  size?: number | string
  /** Stroke and fill color. Defaults to "currentColor". */
  color?: string
  /** Outline stroke width. Defaults to theme.strokeWidth.accent. */
  strokeWidth?: number
  /** Opacity of the body fill (0-1). Defaults to 0.22. */
  fillOpacity?: number
}

export function Salmon({
  size = "1.1em",
  color = "currentColor",
  strokeWidth,
  fillOpacity = 0.22,
  ...svgProps
}: SalmonProps) {
  const theme = useTheme()
  const resolvedStrokeWidth = strokeWidth ?? theme.strokeWidth.accent

  // Body + deeply forked tail + pronounced kype (hooked lower jaw).
  // The kype protrudes forward past the upper jaw - the visual cue
  // that immediately reads as a Chinook.
  const bodyPath =
    "M22 10.5 C22.5 9 21.5 8 19 7.5 C14 7 9 7.2 5.5 8.3 L4.5 9 L1 3.5 L4 12 L1 20.5 L4.5 14.7 C9 16.6 14 17 18 16.7 C19.5 16.5 20.5 16 21 15 C22 13.5 23 12 23.5 11 L23.3 10.6 L22.5 10.7 Z"

  // Single triangular dorsal fin set forward of centre.
  const dorsalFin = "M9 7.2 L11 2.5 L13.5 7.2 Z"

  // Adipose fin, the small fleshy bump between dorsal and tail that
  // separates salmonids from generic fish silhouettes.
  const adiposeFin = "M5.5 8.3 L6.5 6.6 L7.5 8.3 Z"

  // Pelvic fin on the belly.
  const pelvicFin = "M9.5 16.8 L10.8 18.7 L12 17 Z"

  // Gill arc behind the head.
  const gillArc = "M18.5 8.5 Q17.5 12 18.5 14.5"

  // Lateral line down the body.
  const lateralLine = "M5 12 L18 12"

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
      <path d={bodyPath} fill="currentColor" opacity={fillOpacity} />
      <path
        d={bodyPath}
        fill="none"
        stroke="currentColor"
        strokeWidth={resolvedStrokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={dorsalFin}
        fill="currentColor"
        opacity={fillOpacity}
        stroke="currentColor"
        strokeWidth={resolvedStrokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={adiposeFin}
        fill="currentColor"
        opacity={fillOpacity}
        stroke="currentColor"
        strokeWidth={resolvedStrokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={pelvicFin}
        fill="currentColor"
        opacity={fillOpacity}
        stroke="currentColor"
        strokeWidth={resolvedStrokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={gillArc}
        fill="none"
        stroke="currentColor"
        strokeWidth={resolvedStrokeWidth}
        strokeLinecap="round"
        opacity={0.55}
      />
      <path
        d={lateralLine}
        fill="none"
        stroke="currentColor"
        strokeWidth={resolvedStrokeWidth}
        strokeLinecap="round"
        opacity={0.35}
      />
      {/* Spots on the tail (both lobes) - Chinook field mark */}
      <circle cx="2.2" cy="6" r="0.55" fill="currentColor" />
      <circle cx="3.2" cy="8" r="0.55" fill="currentColor" />
      <circle cx="2.2" cy="18" r="0.55" fill="currentColor" />
      <circle cx="3.2" cy="16" r="0.55" fill="currentColor" />
      <circle cx="20" cy="9.7" r="0.85" fill="currentColor" />
    </svg>
  )
}

export default Salmon
