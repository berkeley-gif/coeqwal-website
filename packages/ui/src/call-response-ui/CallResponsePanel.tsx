import { ReactNode } from "react"
import { Box } from "../mui-components"
import { motion } from "@repo/motion"
import type { SxProps, Theme } from "@mui/material"
import { HighlightedText } from "./HighlightedText"

export interface CallResponsePanelProps {
  /** Unique ID for the panel */
  id: string
  /** Which side to display the panel */
  side: "left" | "right"
  /** Panel variant - 'call' for questions/statements, 'response' for answers */
  variant: "call" | "response"
  /** Content to display */
  children: ReactNode
  /** Whether the panel should be visible (triggers animation) */
  isVisible: boolean
  /** Optional delay for staggered animations (in seconds) */
  delay?: number
  /** Custom styles to apply */
  sx?: SxProps<Theme>
  /** Disable the highlight effect (useful when using custom backgrounds) */
  disableHighlight?: boolean
}

/**
 * CallResponsePanel - A conversational UI panel
 *
 * Used to create left-right conversational flows where:
 * - 'call' variant panels appear on the left (questions/statements)
 * - 'response' variant panels appear on the right (answers/explanations)
 *
 * Animation: Panels slide up from 100vh below with opacity fade
 */
export function CallResponsePanel({
  id,
  side,
  variant, // eslint-disable-line @typescript-eslint/no-unused-vars
  children,
  isVisible,
  delay = 0,
  sx = {},
  disableHighlight = false,
}: CallResponsePanelProps) {
  return (
    <Box
      id={id}
      sx={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: side === "left" ? "flex-start" : "flex-end",
        pointerEvents: "none",
        px: { xs: 3, sm: 4, md: 6 },
      }}
    >
      <motion.div
        initial={{ marginTop: "100vh" }}
        animate={{ marginTop: isVisible ? 0 : "100vh" }}
        transition={{
          type: "spring",
          stiffness: 40,
          damping: 30,
          duration: 1.8,
          ...(delay ? { delay } : {}),
        }}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: side === "left" ? "flex-start" : "flex-end",
        }}
      >
        <Box
          sx={{
            width: { xs: "100%", sm: "420px", md: "460px" },
            maxWidth: "100%",
            padding: 0,
            pointerEvents: "auto",
            display: "flex",
            flexDirection: "column",
            gap: { xs: 2, sm: 2.5, md: 3 },
            backgroundColor: "transparent",
            backdropFilter: "none",
            borderRadius: 0,
            boxShadow: "none",
            border: "none",
            // Enhanced typography with per-line highlighting
            // Single place to control line spacing for all Typography components
            "& .MuiTypography-root": {
              lineHeight: 1.6,
            },
            "& .MuiTypography-h6": {
              fontSize: { xs: "1.25rem", sm: "1.375rem", md: "1.5rem" },
              fontWeight: 500,
              color: (theme) =>
                side === "right"
                  ? theme.palette.grey[900]
                  : theme.palette.common.white,
            },
            "& .MuiTypography-body1": {
              fontSize: { xs: "1.0625rem", sm: "1.125rem", md: "1.1875rem" },
              fontWeight: 400,
              color: (theme) =>
                side === "right"
                  ? theme.palette.grey[900]
                  : theme.palette.common.white,
            },
            "& .MuiTypography-overline": {
              fontSize: { xs: "0.7rem", sm: "0.75rem" },
              fontWeight: 700,
              letterSpacing: "0.12em",
              color: (theme) =>
                side === "right"
                  ? theme.palette.grey[900]
                  : theme.palette.common.white,
            },
            ...sx,
          }}
        >
          {disableHighlight ? (
            children
          ) : (
            <HighlightedText
              highlightColor={side === "right" ? "#FFFFFF" : "#090c10"}
              gapSize={0.25}
              sx={{ width: "100%" }}
            >
              {children}
            </HighlightedText>
          )}
        </Box>
      </motion.div>
    </Box>
  )
}
