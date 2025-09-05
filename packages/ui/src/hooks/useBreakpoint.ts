import { useTheme, useMediaQuery } from "@mui/material"

export type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl"

export function useBreakpoint(): Breakpoint {
  const theme = useTheme()

  const isXs = useMediaQuery(theme.breakpoints.down("sm"))
  const isSm = useMediaQuery(theme.breakpoints.only("sm"))
  const isMd = useMediaQuery(theme.breakpoints.only("md"))
  const isLg = useMediaQuery(theme.breakpoints.only("lg"))
  const isXl = useMediaQuery(theme.breakpoints.up("xl"))

  //TODO: add mapviewstate for different breakpoints, then we remove these changes
  if (isXs) return "lg" //return "xs"
  if (isSm) return "lg" //return "sm"
  if (isMd) return "lg" //return "md"
  if (isLg) return "lg"
  if (isXl) return "xl"

  return "xl" // Default to "xl" if no match
}
