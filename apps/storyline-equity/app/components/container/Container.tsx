"use client"

import { Box } from "@repo/ui/mui"
import { AnimatePresence, motion } from "@repo/motion"
import RiverNetworkSegmented from "../../../public/graphics/river_network_segmented.svg"
import StateBoundary from "./graphics/StateBoundary"

const MotionBox = motion.create(Box)

interface ContainerProps {
  elementId?: string
  isVisible: boolean
}

export default function Container({
  elementId,
  isVisible,
}: ContainerProps) {
  return (
    <AnimatePresence initial={false} mode="wait">
      {isVisible ? (
        <MotionBox
          id={elementId}
          key="river-network-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          sx={{
            position: "fixed",
            top: 0,
            right: 0,
            width: "35%",
            height: "100%",
            zIndex: 0,
            pointerEvents: "none",
            backgroundColor: "#172a48",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
              >
                  <svg width='100%' height='100%'>
                    <StateBoundary />
                  </svg>

                  {/* The SVG is used as a background element, so we set aria-hidden and focusable to ensure it doesn't interfere with screen readers or keyboard navigation 
          <Box
            component={RiverNetworkSegmented}
            aria-hidden="true"
            focusable="false"
            sx={{
              width: "100%",
              height: "100%",
              display: "block",
              userSelect: "none",
              pointerEvents: "none",
            }}
                  />
                  */}
        </MotionBox>
      ) : null}
    </AnimatePresence>
  )
}
