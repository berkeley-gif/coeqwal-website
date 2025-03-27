import { useTheme } from "@mui/material/styles"
import { useMediaQuery } from "@mui/material"
import { paragraphMapViews } from "../../lib/mapViews"

// This hook only returns the breakpoint key
export function useBreakpointKey() {
  const theme = useTheme()
  const isXl = useMediaQuery(theme.breakpoints.up("xl"))
  const isLg = useMediaQuery(theme.breakpoints.only("lg"))
  const isMd = useMediaQuery(theme.breakpoints.only("md"))
  const isSm = useMediaQuery(theme.breakpoints.only("sm"))
  // xs is anything smaller

  if (isXl) return "xl"
  if (isLg) return "lg"
  if (isMd) return "md"
  if (isSm) return "sm"
  return "xs" // Default to smallest
}

// This function is NOT a hook - just returns data for a given key and paragraph
export function getMapViewForParagraph(
  paragraphIndex: number,
  breakpointKey: "xs" | "sm" | "md" | "lg" | "xl",
) {
  return paragraphMapViews[paragraphIndex][breakpointKey]
}

// Combine functionality but still respect hook rules
export default function useResponsiveMapView(paragraphIndex: number) {
  const breakpointKey = useBreakpointKey()
  return paragraphMapViews[paragraphIndex][breakpointKey]
}
