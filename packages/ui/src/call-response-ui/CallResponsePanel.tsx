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
 * CallResponsePanel, a conversational UI panel
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
            maxWidth: { xs: "100%", sm: "480px", md: "520px" }, // Larger, more readable width
            padding: (theme) => ({
              xs: theme.spacing(3),
              sm: theme.spacing(4),
              md: theme.spacing(5),
            }),
            pointerEvents: "auto",
            display: "flex",
            flexDirection: "column",
            gap: { xs: 2, sm: 2.5, md: 3 }, // Generous spacing between elements
            backgroundColor:
              variant === "call"
                ? "rgba(255, 255, 255, 0.95)" // Cleaner white with slight transparency
                : (theme) => `${theme.palette.brand.sky}`,
            backdropFilter: "blur(12px)", // Subtle glass effect
            borderRadius: 0, // No border radius to match IntroSection design
            boxShadow: (theme) =>
              variant === "call"
                ? "0 8px 32px rgba(58, 69, 116, 0.08)" // Subtle shadow for depth
                : "0 8px 32px rgba(58, 69, 116, 0.12)", // Slightly stronger for response
            border: (theme) =>
              variant === "call"
                ? `1px solid ${theme.palette.grey[200]}` // Subtle border for definition
                : "none",
            // Enhanced typography styling that applies to children
            "& .MuiTypography-h6": {
              fontFamily: (theme) => theme.typography.h3.fontFamily,
              fontSize: { xs: "1.25rem", sm: "1.375rem", md: "1.5rem" },
              fontWeight: 500,
              lineHeight: 1.4,
              color: (theme) => theme.palette.blue.darkest,
            },
            "& .MuiTypography-body1": {
              fontSize: { xs: "1rem", sm: "1.0625rem", md: "1.125rem" },
              lineHeight: 1.7,
              color: (theme) =>
                variant === "call"
                  ? theme.palette.text.primary
                  : theme.palette.blue.darkest,
            },
            "& .MuiTypography-overline": {
              fontSize: { xs: "0.7rem", sm: "0.75rem" },
              fontWeight: 700,
              letterSpacing: "0.12em",
              color: (theme) =>
                variant === "call"
                  ? theme.palette.blue.dark
                  : theme.palette.blue.darkest,
              opacity: 0.8,
            },
            ...sx,
          }}
        >
          {children}
        </Box>
      </motion.div>
    </Box>
  )
}
