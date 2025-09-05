"use client"

import { Box, Theme } from "@repo/ui/mui"

type ResponsiveHeightValue =
  | number
  | string
  | {
      xs?: number | string
      sm?: number | string
      md?: number | string
      lg?: number | string
      xl?: number | string
    }

type ResponsiveHeight =
  | ResponsiveHeightValue
  | ((theme: Theme) => ResponsiveHeightValue)

export interface SpacerProps {
  height?: ResponsiveHeight
}

export function Spacer({ height = 64 }: SpacerProps) {
  return (
    <Box
      sx={(theme) => {
        const resolvedHeight =
          typeof height === "function" ? height(theme) : height

        const style =
          typeof resolvedHeight === "object" && resolvedHeight !== null
            ? { height: resolvedHeight }
            : {
                height:
                  typeof resolvedHeight === "number"
                    ? `${resolvedHeight}px`
                    : resolvedHeight,
              }

        return { width: "100%", ...style }
      }}
    />
  )
}

export default Spacer
