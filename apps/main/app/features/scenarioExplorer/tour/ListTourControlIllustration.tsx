"use client"

import React from "react"
import {
  Box,
  Checkbox,
  IconButton,
  InputBase,
  Typography,
  icons,
  useTheme,
} from "@repo/ui/mui"
import { ToggleSortButton } from "@repo/ui"
import ToggleChip from "../components/ToggleChip"
import { HydroclimateChooser } from "../../scenarios/components"

/**
 * ListTourControlIllustration. Single illustration component whose
 * `variant` decides which control sample is rendered inside a shared
 * panel frame. Used by the list tour to show the actual chip / button /
 * input referenced in each step's body copy, so the user can recognize
 * the control before scanning for it in the page.
 *
 * Framing matches `ListTourBarIllustration` / `ListTourMapLegend`:
 * warm off-white panel (`#faf8f5`, same as unhighlighted scenario
 * rows), hairline divider border, compact uppercase eyebrow.
 *
 * Samples are visual-only. Click handlers are no-ops so the illustration
 * never mutates app state.
 */
export type ListTourControlVariant =
  | "search"
  | "chips"
  | "sortButton"
  | "checkbox"
  | "hydroclimate"

interface ListTourControlIllustrationProps {
  variant: ListTourControlVariant
}

const NOOP = () => {}

export default function ListTourControlIllustration({
  variant,
}: ListTourControlIllustrationProps) {
  const theme = useTheme()

  const eyebrowSx = {
    display: "block",
    color: theme.palette.grey[700],
    fontSize: "0.6875rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    lineHeight: 1,
    textAlign: "center" as const,
  }

  const captionSx = {
    display: "block",
    color: theme.palette.grey[700],
    fontSize: "0.6875rem",
    fontWeight: 500,
    lineHeight: 1.2,
    textAlign: "center" as const,
  }

  const { eyebrow, sample } = (() => {
    switch (variant) {
      case "search": {
        return {
          eyebrow: "Search field",
          sample: (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                width: 220,
                maxWidth: "100%",
                border: `1px solid ${theme.palette.grey[300]}`,
                borderRadius: 1,
                px: 1,
                py: 0.25,
                backgroundColor: theme.palette.background.paper,
              }}
            >
              <InputBase
                value="delta"
                readOnly
                inputProps={{ "aria-label": "Search scenarios sample" }}
                sx={{
                  flex: 1,
                  fontSize: "0.8125rem",
                  "& .MuiInputBase-input": {
                    py: 0.25,
                    px: 0,
                  },
                }}
              />
              <IconButton
                size="small"
                disableRipple
                tabIndex={-1}
                aria-hidden
                sx={{ p: 0.25, pointerEvents: "none" }}
              >
                <icons.Close sx={{ fontSize: "0.875rem" }} />
              </IconButton>
            </Box>
          ),
        }
      }
      case "chips": {
        return {
          eyebrow: "Toggle chips",
          sample: (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              <ToggleChip label="definitions" active onClick={NOOP} />
              <ToggleChip label="key operations" active={false} onClick={NOOP} />
              <ToggleChip label="selected only" active={false} onClick={NOOP} />
            </Box>
          ),
        }
      }
      case "sortButton": {
        const stateSx = {
          display: "flex",
          flexDirection: "column" as const,
          alignItems: "center",
          gap: 0.5,
        }
        return {
          eyebrow: "Sort button",
          sample: (
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
                gap: 2,
              }}
            >
              <Box sx={stateSx}>
                <ToggleSortButton sortState={null} onToggle={NOOP} />
                <Typography component="span" sx={captionSx}>
                  Off
                </Typography>
              </Box>
              <Box sx={stateSx}>
                <ToggleSortButton sortState="asc" onToggle={NOOP} />
                <Typography component="span" sx={captionSx}>
                  Ascending
                </Typography>
              </Box>
              <Box sx={stateSx}>
                <ToggleSortButton sortState="desc" onToggle={NOOP} />
                <Typography component="span" sx={captionSx}>
                  Descending
                </Typography>
              </Box>
            </Box>
          ),
        }
      }
      case "checkbox": {
        const stateSx = {
          display: "flex",
          flexDirection: "column" as const,
          alignItems: "center",
          gap: 0.25,
        }
        return {
          eyebrow: "Checkbox",
          sample: (
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
                gap: 3,
              }}
            >
              <Box sx={stateSx}>
                <Checkbox
                  size="small"
                  checked={false}
                  disableRipple
                  tabIndex={-1}
                  inputProps={{ "aria-label": "Unchecked sample" }}
                  sx={{ p: 0 }}
                />
                <Typography component="span" sx={captionSx}>
                  Off
                </Typography>
              </Box>
              <Box sx={stateSx}>
                <Checkbox
                  size="small"
                  checked
                  disableRipple
                  tabIndex={-1}
                  inputProps={{ "aria-label": "Checked sample" }}
                  sx={{ p: 0 }}
                />
                <Typography component="span" sx={captionSx}>
                  Selected
                </Typography>
              </Box>
            </Box>
          ),
        }
      }
      case "hydroclimate": {
        return {
          eyebrow: "Hydroclimate chooser",
          sample: (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                // Illustration only; disable clicks so hovering the
                // sample never mutates the live chooser's value.
                pointerEvents: "none",
              }}
            >
              <HydroclimateChooser
                layout="horizontal"
                showTitle={false}
                showLabels={false}
                hideDisabled
                iconSize="28px"
                iconFontSize="1rem"
                value="historical"
                onChange={NOOP}
              />
            </Box>
          ),
        }
      }
    }
  })()

  return (
    <Box
      component="figure"
      sx={{
        m: 0,
        p: 1.5,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1.5,
        bgcolor: "#faf8f5",
        display: "flex",
        flexDirection: "column",
        gap: 1,
      }}
    >
      <Typography component="span" sx={eyebrowSx}>
        {eyebrow}
      </Typography>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 56,
        }}
      >
        {sample}
      </Box>
    </Box>
  )
}
