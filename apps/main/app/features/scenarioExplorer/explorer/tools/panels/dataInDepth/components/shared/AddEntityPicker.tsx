"use client"

/**
 * AddEntityPicker - a grouped select plus an "Add" button for pulling an extra
 * entity into a section (a CWS demand unit today, other entity types as
 * sections grow). The parent owns the selected value and the add handler, so
 * this stays purely presentational.
 */

import React from "react"
import { Box, Button, useTheme, AddIcon } from "@repo/ui/mui"
import { CompactSelect } from "@repo/ui"

export interface AddEntityPickerGroup {
  label: string
  options: { value: string; label: string }[]
}

export function AddEntityPicker({
  value,
  onChange,
  groups,
  onAdd,
  placeholder = "add an entity",
  addLabel = "Add",
  disabled = false,
  isModal = false,
  minWidth = 220,
  maxMenuHeight = 400,
  selectAriaLabel = "Select entity to add",
}: {
  value: string
  onChange: (value: string) => void
  groups: AddEntityPickerGroup[]
  onAdd: () => void
  placeholder?: string
  addLabel?: string
  /** Disable the select, for example while its options are still loading. */
  disabled?: boolean
  /** Raise menu z-index when rendered inside a modal. */
  isModal?: boolean
  minWidth?: number
  maxMenuHeight?: number
  selectAriaLabel?: string
}) {
  const theme = useTheme()

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: theme.space.gap.sm,
      }}
    >
      <CompactSelect
        value={value}
        onChange={onChange}
        groups={groups}
        placeholder={placeholder}
        disabled={disabled}
        minWidth={minWidth}
        maxMenuHeight={maxMenuHeight}
        aria-label={selectAriaLabel}
        menuZIndex={isModal ? 9999 : undefined}
      />
      <Button
        variant="contained"
        size="small"
        disableElevation
        startIcon={<AddIcon sx={{ fontSize: 16 }} />}
        onClick={onAdd}
        disabled={!value}
        sx={{
          ...theme.typography.dashboard,
          textTransform: "none",
          color: theme.palette.common.white,
          backgroundColor: theme.palette.blue.dark,
          border: `1px solid ${theme.palette.blue.dark}`,
          px: theme.space.component.md,
          "&:hover": {
            backgroundColor: theme.palette.blue.darkest,
            borderColor: theme.palette.blue.darkest,
          },
          "&.Mui-disabled": {
            color: theme.palette.grey[400],
            backgroundColor: theme.palette.grey[100],
            borderColor: theme.palette.grey[200],
          },
        }}
      >
        {addLabel}
      </Button>
    </Box>
  )
}

export default AddEntityPicker
