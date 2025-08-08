"use client"

import { Box } from "@repo/ui/mui"

type ResponsiveHeight =
  | number
  | string
  | {
      xs?: number | string
      sm?: number | string
      md?: number | string
      lg?: number | string
      xl?: number | string
    }

export interface SpacerProps {
  height?: ResponsiveHeight
}

export function Spacer({ height = 64 }: SpacerProps) {
  const style =
    typeof height === "object"
      ? { height }
      : { height: typeof height === "number" ? `${height}px` : height }

  return <Box sx={{ width: "100%", ...style }} />
}

export default Spacer
