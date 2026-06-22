"use client"

import dynamic from "next/dynamic"
import { Box, useTheme } from "@repo/ui/mui"
import { ErrorFallback } from "@repo/ui"
import { AnimatePresence, motion } from "@repo/motion"
import { ErrorBoundary } from "@repo/utils"

const PersistentMapWrapper = dynamic(
  () => import("./setup/PersistentMapWrapper"),
  { ssr: false, loading: () => null },
)

function MapErrorFallback() {
  const theme = useTheme()
  return (
    <Box
      sx={{
        position: "fixed",
        right: 0,
        top: 0,
        width: "40%",
        height: "100%",
        zIndex: 0,
        backgroundColor: theme.palette.grey[900],
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ErrorFallback
        title="Map unavailable"
        message="Map failed to load"
        textColor={theme.palette.common.white}
      />
    </Box>
  )
}

const MotionBox = motion.create(Box)

interface DynamicMapProps {
  isVisible: boolean
}

export default function DynamicMap({ isVisible }: DynamicMapProps) {
  return (
    <AnimatePresence initial={false} mode="wait">
      {isVisible ? (
        <MotionBox
          key="dynamic-map"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 0,
            pointerEvents: isVisible ? "auto" : "none",
          }}
        >
          <ErrorBoundary
            fallback={<MapErrorFallback />}
            onError={(error: Error) => console.error(error)}
          >
            <PersistentMapWrapper />
          </ErrorBoundary>
        </MotionBox>
      ) : null}
    </AnimatePresence>
  )
}
