"use client"

import { useRef } from "react"
import { Box, useTheme, alpha } from "@repo/ui/mui"
import { useMapMode } from "../../map/store"
import TierAnimationSection from "./animation/TierAnimationSection"
import {
  WelcomePanel,
  WaterIssuesPanel,
  HydroclimateFuturesPanel,
  KeyOutcomesPanel,
  DataInDepthPanel,
  InterpretingOutcomesPanel,
  ChooseScenariosPanel,
  BeforeYouBeginPanel,
} from "./panels"

/** Height (in pixels) of the soft fade between the dark wash and the
 *  transparent map panel window, applied at the bottom of the pre-map
 *  wrapper and the top of the post-map wrapper. The wash colour/opacity
 *  itself comes from `theme.background.modalBackdrop(Opacity)` */
const DARK_WASH_FADE_PX = 160

export default function GetStartedView() {
  const theme = useTheme()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const mapMode = useMapMode()
  const mapActive = mapMode === "get-started"

  const exploreBg = theme.palette.tabPanels.explore

  // Dark wash tint used on both sides of the map panel. Opacity is
  // the single theme token (`modalBackdropOpacity`) so it can be
  // re-tuned in one place
  const darkWash = alpha(
    theme.palette.common.black,
    theme.background.modalBackdropOpacity,
  )

  return (
    <Box
      ref={scrollContainerRef}
      sx={{
        position: "relative",
        pointerEvents: "none",
        backgroundColor: mapActive ? "transparent" : exploreBg,
      }}
    >
      {/* Pre-map dark wash: modal-style black backdrop (opacity from
          theme.background.modalBackdropOpacity) behind panels 1-4 that
          dims the persistent map. The bottom DARK_WASH_FADE_PX fades
          to transparent so the map is fully revealed by the time we
          reach Panel 5. */}
      <Box
        sx={{
          backgroundImage: `linear-gradient(to bottom, ${darkWash} 0, ${darkWash} calc(100% - ${DARK_WASH_FADE_PX}px), transparent 100%)`,
        }}
      >
        <WelcomePanel />
        <WaterIssuesPanel />
        <HydroclimateFuturesPanel />
        <KeyOutcomesPanel />
      </Box>

      {/* Map panel (TierAnimationSection): thin outer frame + rounded shell.
          Radius applied around (not inside) the pinned map overlay so the
          tier animation's own 100vh geometry is preserved. */}
      <Box
        sx={{
          pointerEvents: "auto",
          px: theme.layout.panel.insetX,
          py: theme.layout.panel.insetY,
        }}
      >
        <Box
          sx={{
            borderRadius: theme.layout.panel.radius,
            overflow: "hidden",
          }}
        >
          <TierAnimationSection />
        </Box>
      </Box>

      {/* Post-map dark wash: modal-style black backdrop (opacity from
          theme.background.modalBackdropOpacity) behind panels 6-9 that
          fades in from transparent over the top DARK_WASH_FADE_PX, so
          the map smoothly re-darkens after Panel 5 instead of being
          cut off by a hard seam. */}
      <Box
        sx={{
          backgroundImage: `linear-gradient(to bottom, transparent 0, ${darkWash} ${DARK_WASH_FADE_PX}px)`,
        }}
      >
        <DataInDepthPanel />
        <InterpretingOutcomesPanel />
        <ChooseScenariosPanel />
        <BeforeYouBeginPanel />
      </Box>
    </Box>
  )
}
