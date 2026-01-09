"use client"

/**
 * NavDropdown - Dropdown menu for navigation items
 *
 * Renders a button that opens a dropdown menu with configurable options.
 * Supports outline and text variants.
 *
 * WCAG 2.0 AA Compliance:
 * - WCAG 2.4.7: Focus-visible styles on button and menu items
 * - WCAG 4.1.2: aria-expanded, aria-haspopup for menu state
 */

import React, { useState, useId } from "react"
import { Button, Menu, MenuItem } from "@mui/material"
import { useTheme } from "@mui/material/styles"
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown"

export interface NavDropdownOption {
  key: string
  label: string
  onClick: () => void
  /** Whether this option represents the current page/site */
  active?: boolean
}

export interface NavDropdownProps {
  label: string
  options: NavDropdownOption[]
  variant?: "text" | "standard"
  disableRipple?: boolean
  sx?: React.ComponentProps<typeof Button>["sx"]
}

export function NavDropdown({
  label,
  options,
  variant = "standard",
  disableRipple = false,
  sx,
}: NavDropdownProps) {
  const theme = useTheme()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const isOpen = Boolean(anchorEl)
  const menuId = useId()

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleOptionClick = (option: NavDropdownOption) => {
    option.onClick()
    handleClose()
  }

  const buttonStyle = {
    ...theme.typography.body2,
    lineHeight: 1.1,
    height: theme.spacing(4.5), // 36px to match other header buttons
    minHeight: theme.spacing(4.5),
    fontWeight: theme.typography.fontWeightMedium,
    color: theme.palette.text.primary,
  }

  return (
    <>
      <Button
        variant={variant}
        disableRipple={disableRipple}
        onClick={handleClick}
        endIcon={<ArrowDropDownIcon />}
        // WCAG 4.1.2: ARIA attributes for menu state - DO NOT REMOVE
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={isOpen ? menuId : undefined}
        sx={{
          ...buttonStyle,
          // WCAG 2.4.7: Focus visible indicator - DO NOT REMOVE
          "&:focus-visible": {
            outline: "2px solid currentColor",
            outlineOffset: 2,
          },
          ...sx,
        }}
      >
        {label}
      </Button>
      <Menu
        id={menuId}
        anchorEl={anchorEl}
        open={isOpen}
        onClose={handleClose}
        // WCAG: MUI Menu automatically handles role="menu" and keyboard navigation
        sx={{
          zIndex: (theme) => theme.zIndex.dropdown,
          "& .MuiPaper-root": {
            backgroundColor: (theme) => theme.palette.background.paper,
            borderRadius: (theme) => theme.borderRadius.md,
            mt: (theme) => theme.space.component.sm,
            minWidth: "200px",
            boxShadow: (theme) => theme.shadow.md,
            border: (theme) => `1px solid ${theme.palette.action.hover}`,
          },
        }}
      >
        {options.map((option) => (
          <MenuItem
            key={option.key}
            onClick={() => handleOptionClick(option)}
            aria-current={option.active ? "page" : undefined}
            sx={(theme) => ({
              ...theme.typography.button,
              color: theme.palette.blue.darkest,
              py: theme.space.component.md,
              px: theme.space.component.lg,
              // Active state: background fill + heavier weight
              ...(option.active && {
                backgroundColor: theme.palette.action.hover,
                fontWeight: 700,
              }),
              "&:hover": {
                backgroundColor: theme.palette.action.hover,
                color: theme.palette.blue.darkest,
              },
              // WCAG 2.4.7: Focus visible indicator - DO NOT REMOVE
              "&:focus-visible": {
                backgroundColor: theme.palette.action.hover,
                outline: "none",
              },
            })}
          >
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
