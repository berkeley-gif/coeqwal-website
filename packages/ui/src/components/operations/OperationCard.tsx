"use client"

import React from "react"
import {
  Box,
  Card,
  Typography,
  Checkbox,
  IconButton,
  useTheme,
} from "@mui/material"
import VisibilityIcon from "@mui/icons-material/Visibility"

export interface SubOption {
  id: string
  label: string
  color?: string
  selected?: boolean
  disabled?: boolean
}

export interface OperationCardProps {
  title: string
  bullet?: {
    color: string
    size?: number
  }
  subOptions?: SubOption[]
  selected?: boolean
  onMainOptionChange?: (selected: boolean) => void
  onSubOptionChange?: (id: string, selected: boolean) => void
  onInfoClick?: () => void
}

/**
 * OperationCard component displays an operation with optional sub-options in a card format.
 *
 * Features:
 * - Colored bullet and title in the first row
 * - "Tell me more" button with visibility icon
 * - Optional capsules for sub-options with checkboxes
 */
export const OperationCard: React.FC<OperationCardProps> = ({
  title,
  bullet = { color: "#FF5722", size: 16 },
  subOptions = [],
  selected = false,
  onMainOptionChange,
  onSubOptionChange,
  onInfoClick,
}) => {
  const theme = useTheme()

  // Generate a series of pastel colors for the capsules
  const capsuleColors = [
    "rgba(33, 150, 243, 0.1)", // Light blue
    "rgba(76, 175, 80, 0.1)", // Light green
    "rgba(156, 39, 176, 0.1)", // Light purple
    "rgba(255, 152, 0, 0.1)", // Light orange
    "rgba(233, 30, 99, 0.1)", // Light pink
  ]

  return (
    <Card
      sx={{
        width: "100%",
        p: (theme) => theme.cards.spacing.padding,
        mb: (theme) => theme.cards.spacing.gap / 2,
        backgroundColor: "#FFFFFF",
        boxShadow: "none",
        border: "1px solid #E0E0E0",
        borderRadius: theme.spacing(1),
      }}
    >
      {/* First row with colored bullet, title and "Tell me more" button */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          mb: subOptions.length > 0 ? theme.spacing(2.5) : 0,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          {/* Colored bullet */}
          <Box
            sx={{
              width: bullet.size,
              height: bullet.size,
              borderRadius: "50%",
              bgcolor: bullet.color,
              mr: theme.spacing(2),
              flexShrink: 0,
            }}
          />

          {/* Title */}
          <Typography
            variant="h6"
            sx={{
              fontWeight: (theme) => theme.cards.typography.cardTitle.fontWeight,
              fontSize: (theme) => theme.cards.typography.cardTitle.fontSize,
              lineHeight: (theme) => theme.cards.typography.cardTitle.lineHeight,
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </Typography>
        </Box>

        {/* "Tell me more" button */}
        <Box
          onClick={onInfoClick}
          sx={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            color: "rgba(0, 0, 0, 0.42)",
            transition: "color 0.2s ease",
            marginLeft: (theme) => theme.cards.spacing.tellMoreIcon.marginLeft,
            "&:hover": {
              color: theme.palette.primary.main,
            },
          }}
        >
          <Typography
            variant="body2"
            sx={{
              mr: theme.spacing(0.5),
              fontSize: (theme) => theme.cards.typography.caption.fontSize,
              fontWeight: (theme) => theme.cards.typography.caption.fontWeight,
              opacity: 0.8,
            }}
          >
            Tell me more
          </Typography>
          <VisibilityIcon fontSize="small" sx={{ opacity: 0.8 }} />
        </Box>
      </Box>

      {/* Sub-options as capsules */}
      {subOptions.length > 0 && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: (theme) => theme.spacing(1.5),
          }}
        >
          {subOptions.map((option, index) => (
            <Box
              key={option.id}
              sx={{
                display: "flex",
                alignItems: "center",
                bgcolor:
                  option.color || capsuleColors[index % capsuleColors.length],
                borderRadius: theme.spacing(3),
                py: (theme) => theme.cards.spacing.capsule.py,
                px: (theme) => theme.cards.spacing.capsule.px,
                mr: (theme) => theme.cards.spacing.capsule.marginRight,
                mb: (theme) => theme.cards.spacing.capsule.marginBottom,
                width: "fit-content",
                maxWidth: "100%",
              }}
            >
              <Checkbox
                checked={option.selected}
                disabled={option.disabled}
                onChange={(e) =>
                  onSubOptionChange?.(option.id, e.target.checked)
                }
                size="small"
                sx={{
                  mr: theme.spacing(0.5),
                  p: theme.spacing(0.5),
                  "&.Mui-checked": {
                    color: theme.palette.primary.main,
                  },
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  fontWeight: (theme) => theme.cards.typography.caption.fontWeight,
                  fontSize: (theme) => theme.cards.typography.caption.fontSize,
                  lineHeight: (theme) => theme.cards.typography.caption.lineHeight,
                  letterSpacing: "0.01em",
                }}
              >
                {option.label}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Card>
  )
}

export default OperationCard
