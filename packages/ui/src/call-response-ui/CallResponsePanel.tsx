import { ReactNode } from "react"
import { Box } from "../mui-components"
import { motion } from "@repo/motion"
import type { SxProps, Theme } from "@mui/material"

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
 * CallResponsePanel - A conversational UI panel that attaches to viewport edges
 * 
 * Used to create left-right conversational flows where:
 * - 'call' variant panels appear on the left (questions/statements)
 * - 'response' variant panels appear on the right (answers/explanations)
 */
export function CallResponsePanel({
  id,
  side,
  variant,
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
        px: 2, // Horizontal padding for margin from viewport edge
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
            maxWidth: "420px",
            backdropFilter: "blur(10px)",
            padding: (theme) => theme.layout.spacing.lg,
            pointerEvents: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "15px",
            backgroundColor:
              variant === "call"
                ? "rgba(255, 255, 255, 0.95)"
                : (theme) => theme.palette.brand.sky,
            border:
              variant === "call"
                ? (theme) => `2px solid ${theme.palette.blue.darkest}`
                : undefined,
            borderRadius: (theme) => theme.borderRadius.card,
            ...sx,
          }}
        >
          {children}
        </Box>
      </motion.div>
    </Box>
  )
}

