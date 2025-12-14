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
        // Responsive horizontal padding - minimal to maximize map space
        px: { xs: 1.5, sm: 2, md: 3, lg: 4, xl: 6 },
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
            gap: { xs: 2, sm: 2.5, md: 3 },
            backgroundColor: "transparent",
            backdropFilter: "none",
            borderRadius: 0,
            boxShadow: "none",
            border: "none",
            "& .MuiTypography-root": {
              color: (theme) =>
                side === "right" ? theme.palette.grey[900] : "#faf8f5",
              fontFamily:
                side === "left"
                  ? '"neue-haas-grotesk-text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
                  : undefined,
              fontWeight: side === "left" ? 400 : undefined,
              fontSize: side === "left" ? "1.25rem" : undefined, // 20px
              lineHeight: side === "left" ? 1.8 : undefined, // maintains ~36px line-height
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
