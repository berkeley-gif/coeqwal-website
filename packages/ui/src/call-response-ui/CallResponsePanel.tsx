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
}

/**
 * CallResponsePanel, a conversational UI panel
 *
 * Used to create left-right conversational flows where:
 * - 'call' variant panels appear on the left (questions/statements)
 * - 'response' variant panels appear on the right (answers/explanations)
 */
export function CallResponsePanel({
  id,
  side,
  variant, // eslint-disable-line @typescript-eslint/no-unused-vars
  children,
  isVisible,
  delay = 0,
  sx = {},
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
        px: { xs: 3, sm: 4, md: 6 }, // Responsive horizontal padding
      }}
    >
      <motion.div
        initial={{ marginTop: "100vh", opacity: 0 }}
        animate={{
          marginTop: isVisible ? 0 : "100vh",
          opacity: isVisible ? 1 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 40,
          damping: 30,
          duration: 1.8,
          ...(delay ? { delay } : {}),
          opacity: {
            duration: 0.6,
            ...(delay ? { delay } : {}),
            ease: "easeOut",
          },
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
              lineHeight: 2,
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
              fontSize: { xs: "1.125rem", sm: "1.1875rem", md: "1.25rem" },
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
          <HighlightedText
            highlightColor={side === "right" ? "#FFFFFF" : "#3A4574"}
            gapSize={0.25}
            sx={{ width: "100%" }}
        >
          {children}
          </HighlightedText>
        </Box>
      </motion.div>
    </Box>
  )
}
