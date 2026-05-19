"use client"

import React, { forwardRef, useCallback, useMemo } from "react"
import {
  Box,
  Checkbox,
  Typography,
  useTheme,
  type SxProps,
  type Theme,
} from "@repo/ui/mui"
import { TooltipCloseButton } from "@repo/ui"
import {
  OUTCOME_CODE_ORDER,
  OUTCOME_REGIONAL_VARIANTS,
  NOD_SOD_OUTCOME_CODES,
  getOutcomeName,
  type OutcomeCode,
} from "../../../../../content/outcomes"

export interface OutcomeChooserPanelProps {
  title: string
  closeAriaLabel: string
  selectedCodes: readonly string[]
  onToggle: (code: string) => void
  onSetSelected: (codes: string[]) => void
  onClose: () => void
  sx?: SxProps<Theme>
}

/**
 * 220px outcome checkbox overlay shared by radar (axes) and resilience (rows).
 */
const OutcomeChooserPanel = forwardRef<HTMLElement, OutcomeChooserPanelProps>(
  function OutcomeChooserPanel(
    {
      title,
      closeAriaLabel,
      selectedCodes,
      onToggle,
      onSetSelected,
      onClose,
      sx,
    },
    ref,
  ) {
    const theme = useTheme()
    const selectedSet = useMemo(() => new Set(selectedCodes), [selectedCodes])

    const allKeySelected = OUTCOME_CODE_ORDER.every((c) => selectedSet.has(c))
    const someKeySelected =
      !allKeySelected && OUTCOME_CODE_ORDER.some((c) => selectedSet.has(c))

    const allRegionalSelected = NOD_SOD_OUTCOME_CODES.every((c) =>
      selectedSet.has(c),
    )
    const someRegionalSelected =
      !allRegionalSelected &&
      NOD_SOD_OUTCOME_CODES.some((c) => selectedSet.has(c))

    const toggleGroup = useCallback(
      (codes: readonly string[], allOn: boolean) => {
        if (allOn) {
          onSetSelected(selectedCodes.filter((c) => !codes.includes(c)))
        } else {
          const merged = [...selectedCodes]
          for (const c of codes) {
            if (!merged.includes(c)) merged.push(c)
          }
          onSetSelected(merged)
        }
      },
      [selectedCodes, onSetSelected],
    )

    const withRegional = useMemo(
      () =>
        OUTCOME_CODE_ORDER.filter(
          (c) => OUTCOME_REGIONAL_VARIANTS[c as OutcomeCode] != null,
        ),
      [],
    )
    const withoutRegional = useMemo(
      () =>
        OUTCOME_CODE_ORDER.filter(
          (c) => OUTCOME_REGIONAL_VARIANTS[c as OutcomeCode] == null,
        ),
      [],
    )

    const checkboxSx = useMemo(
      () => ({ padding: 0, margin: 0, transform: "scale(0.8)" }),
      [],
    )

    return (
      <Box
        ref={ref}
        sx={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: 220,
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            overflow: "hidden",
            borderRight: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.paper,
            py: 1.5,
            px: 1,
          },
          ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
        ]}
      >
        <Box sx={{ position: "relative", flexShrink: 0 }}>
          <TooltipCloseButton onClick={onClose} ariaLabel={closeAriaLabel} />
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              fontSize: "0.7rem",
              letterSpacing: "0.04em",
              color: "text.primary",
              mb: 1,
              display: "block",
              pl: 0.5,
              pr: 5,
            }}
          >
            {title}
          </Typography>
        </Box>

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overflowX: "hidden",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "thin",
            scrollbarColor: (t) =>
              `${t.palette.grey[400]} ${t.palette.grey[100]}`,
            "&::-webkit-scrollbar": { width: 8 },
            "&::-webkit-scrollbar-track": {
              backgroundColor: (t) => t.palette.grey[100],
              borderRadius: 4,
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: (t) => t.palette.grey[400],
              borderRadius: 4,
              border: "2px solid transparent",
              backgroundClip: "padding-box",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              backgroundColor: (t) => t.palette.grey[500],
            },
          }}
        >
          <ChooserRow
            label="All key outcomes"
            checked={allKeySelected}
            indeterminate={someKeySelected}
            bold
            onClick={() => toggleGroup(OUTCOME_CODE_ORDER, allKeySelected)}
            sx={checkboxSx}
          />
          <ChooserRow
            label="All regional outcomes"
            checked={allRegionalSelected}
            indeterminate={someRegionalSelected}
            bold
            onClick={() =>
              toggleGroup(NOD_SOD_OUTCOME_CODES, allRegionalSelected)
            }
            sx={checkboxSx}
          />

          <Box
            sx={{ borderBottom: `1px solid ${theme.palette.divider}`, my: 1 }}
          />

          {withRegional.map((code) => {
            const variants = OUTCOME_REGIONAL_VARIANTS[code as OutcomeCode]!
            return (
              <Box key={code} sx={{ mb: 0.75 }}>
                <ChooserRow
                  label={getOutcomeName(code)}
                  checked={selectedSet.has(code)}
                  bold
                  onClick={() => onToggle(code)}
                  sx={checkboxSx}
                />
                {variants.map((vCode) => (
                  <ChooserRow
                    key={vCode}
                    label={
                      vCode.startsWith("NOD")
                        ? "North of Delta"
                        : "South of Delta"
                    }
                    checked={selectedSet.has(vCode)}
                    indent
                    onClick={() => onToggle(vCode)}
                    sx={checkboxSx}
                  />
                ))}
              </Box>
            )
          })}

          <Box
            sx={{ borderBottom: `1px solid ${theme.palette.divider}`, my: 1 }}
          />

          {withoutRegional.map((code) => (
            <ChooserRow
              key={code}
              label={getOutcomeName(code)}
              checked={selectedSet.has(code)}
              bold
              onClick={() => onToggle(code)}
              sx={checkboxSx}
            />
          ))}
        </Box>
      </Box>
    )
  },
)

export default OutcomeChooserPanel

function ChooserRow({
  label,
  checked,
  indeterminate,
  bold,
  indent,
  onClick,
  sx,
}: {
  label: string
  checked: boolean
  indeterminate?: boolean
  bold?: boolean
  indent?: boolean
  onClick: () => void
  sx: Record<string, unknown>
}) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        width: "100%",
        border: "none",
        background: "none",
        cursor: "pointer",
        py: 0.35,
        pl: indent ? 2.5 : 0.5,
        pr: 0.5,
        borderRadius: 0.5,
        "&:hover": { bgcolor: "action.hover" },
      }}
    >
      <Checkbox
        size="small"
        checked={checked}
        indeterminate={indeterminate}
        tabIndex={-1}
        sx={sx}
      />
      <Typography
        variant="caption"
        sx={{
          fontWeight: bold ? 500 : 400,
          fontSize: "0.72rem",
          lineHeight: 1.3,
          textAlign: "left",
        }}
      >
        {label}
      </Typography>
    </Box>
  )
}
