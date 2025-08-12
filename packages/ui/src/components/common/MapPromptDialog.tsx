"use client"

import { Box, Typography } from "../../mui-components"
import { ReactNode } from "react"

interface MapPromptDialogProps {
  /** Whether the dialog is visible */
  isVisible: boolean
  /** Main title of the dialog */
  title: string
  /** Subtitle/instruction text */
  subtitle: string
  /** Optional additional content (like progress indicators) */
  children?: ReactNode
  /** Optional action buttons or links */
  actions?: ReactNode
}

/**
 * Reusable map prompt dialog component for map interactions.
 * Used for drawing custom regions, selecting delivery areas, etc.
 * Styled according to the theme's mapPromptDialog specs.
 */
export default function MapPromptDialog({
  isVisible,
  title,
  subtitle,
  children,
  actions,
}: MapPromptDialogProps) {
  if (!isVisible) return null

  return (
    <Box
      sx={(theme) => ({
        position: "absolute",
        top: theme.mapPromptDialog.position.top,
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: theme.mapPromptDialog.backgroundColor,
        color: theme.mapPromptDialog.textColor,
        padding: theme.mapPromptDialog.padding,
        borderRadius: theme.mapPromptDialog.borderRadius,
        zIndex: theme.mapPromptDialog.zIndex,
        textAlign: "center",
        pointerEvents: "auto",
        minWidth: theme.mapPromptDialog.minWidth,
        boxShadow: theme.mapPromptDialog.boxShadow,
      })}
    >
      {/* Title */}
      <Typography
        variant="body1"
        sx={(theme) => ({
          fontSize: theme.mapPromptDialog.typography.title.fontSize,
          fontWeight: theme.mapPromptDialog.typography.title.fontWeight,
          mb: theme.mapPromptDialog.typography.title.marginBottom,
        })}
      >
        {title}
      </Typography>

      {/* Subtitle/Instructions */}
      <Typography
        variant="body2"
        sx={(theme) => ({
          fontSize: theme.mapPromptDialog.typography.subtitle.fontSize,
          opacity: theme.mapPromptDialog.typography.subtitle.opacity,
          mb:
            children || actions
              ? theme.mapPromptDialog.typography.subtitle.marginBottom
              : 0,
        })}
      >
        {subtitle}
      </Typography>

      {/* Optional additional content */}
      {children}

      {/* Optional actions */}
      {actions}
    </Box>
  )
}
