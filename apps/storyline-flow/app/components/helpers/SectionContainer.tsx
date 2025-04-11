import { Box, BoxProps } from "@repo/ui/mui"
import { ReactNode } from "react"

export interface SectionContainerProps extends BoxProps {
  children: ReactNode
  id: string
}

//TODO: modularize this animation to be reusable
function SectionContainer({ children, id }: SectionContainerProps) {
  return (
    <Box style={{ width: "100%", height: "100%", zIndex: 1 }} id={id}>
      {children}
    </Box>
  )
}

export default SectionContainer
