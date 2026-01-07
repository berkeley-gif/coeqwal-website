/**
 * CallResponsePanel - Animated overlay panel for scrollytelling
 *
 * Displays call-and-response content panels that animate in from the sides.
 * Used in the Learn section for step-by-step explanations.
 */

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
  /** Custom styles to apply to the inner content box */
  sx?: SxProps<Theme>
  /** Disable the highlight effect (useful when using custom backgrounds) */
  disableHighlight?: boolean
  /** Minimum height of the outer container (default: "100vh") */
  minHeight?: string
  /** Vertical alignment of content (default: "center") */
  alignItems?: "center" | "flex-start" | "flex-end"
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
  disableHighlight = true,
  minHeight = "100vh",
  alignItems = "center",
}: CallResponsePanelProps) {
  return (
    <Box
      id={id}
      sx={{
        position: "relative",
        minHeight,
        display: "flex",
        alignItems,
        justifyContent: side === "left" ? "flex-start" : "flex-end",
        pointerEvents: "none",
        // Responsive horizontal padding using page.x tokens (24px / 48px)
        px: (theme: Theme) => theme.space.page.x,
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
          pointerEvents: isVisible ? "auto" : "none",
        }}
      >
        <Box
          sx={{
            // Responsive panel width - narrower on smaller screens to leave room for map
            width: {
              xs: "100%",
              sm: "340px",
              md: "380px",
              lg: "420px",
              xl: "460px",
            },
            maxWidth: "100%",
            padding: 0,
            pointerEvents: isVisible ? "auto" : "none",
            display: "flex",
            flexDirection: "column",
            // Responsive gap using panel.xs tokens (16px / 20px / 24px)
            gap: (theme: Theme) => theme.space.card.xs,
            backgroundColor: "transparent",
            backdropFilter: "none",
            borderRadius: 0,
            boxShadow: "none",
            border: "none",
            "& .MuiTypography-root": {
              color: (theme: Theme) =>
                side === "right" ? theme.palette.grey[900] : "#faf8f5",
              // Left side uses storyBody variant properties for narrative readability
              ...(side === "left" && {
                fontFamily: (theme: Theme) => theme.typography.fontFamily,
                fontWeight: (theme: Theme) =>
                  theme.typography.storyBody.fontWeight,
                fontSize: (theme: Theme) => theme.typography.storyBody.fontSize,
                lineHeight: (theme: Theme) =>
                  theme.typography.storyBody.lineHeight,
              }),
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
