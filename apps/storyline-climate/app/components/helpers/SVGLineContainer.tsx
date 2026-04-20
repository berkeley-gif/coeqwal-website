import { Box } from "@repo/ui/mui"
import React from "react"

interface SVGLineContainerProps {
  viewBox: string
  children: React.ReactNode
  preserveAspectRatio?: string
  zIndex?: number
}

function SVGLineContainer({
  viewBox,
  children,
  preserveAspectRatio = "none",
  zIndex,
}: SVGLineContainerProps) {
  return (
    <Box
      component="svg"
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio={preserveAspectRatio}
      className="svg-line-container"
      sx={zIndex !== undefined ? { zIndex } : undefined}
    >
      {children}
    </Box>
  )
}

export default SVGLineContainer
