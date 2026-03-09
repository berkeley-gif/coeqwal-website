"use client"

/**
 * NavDropdown - Dropdown menu for navigation items
 *
 * Renders a button that opens a dropdown menu with configurable options.
 * Supports outline and text variants.
 *
 * WCAG 2.0 AA Compliance:
 * - WCAG 1.4.1: Active state uses bold + background (not color alone)
 * - WCAG 2.1.1: Full keyboard support (arrow keys, Enter, Escape)
 * - WCAG 2.4.3: Focus returns to trigger button when menu closes
 * - WCAG 2.4.7: Focus-visible styles on button and menu items
 * - WCAG 2.4.8: aria-current="page" on active menu items
 * - WCAG 4.1.2: aria-expanded, aria-haspopup, aria-controls for menu state
 */

import React, { useState, useId, useRef } from "react"
import { Button, Menu, MenuItem } from "@mui/material"
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown"

export interface NavDropdownOption {
  key: string
  label: string
  onClick: () => void
  /** Whether this option represents the current page/site */
  active?: boolean
  /** Whether this option is disabled (non-interactive) */
  disabled?: boolean
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
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const isOpen = Boolean(anchorEl)
  const menuId = useId()

  // WCAG 2.4.3: Ref for focus return when menu closes
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
    // WCAG 2.4.3: Return focus to trigger button when menu closes
    setTimeout(() => buttonRef.current?.focus(), 0)
  }

  const handleOptionClick = (option: NavDropdownOption) => {
    option.onClick()
    handleClose()
  }

  return (
    <>
      <Button
        ref={buttonRef}
        variant={variant}
        disableRipple={disableRipple}
        onClick={handleClick}
        endIcon={<ArrowDropDownIcon />}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={isOpen ? menuId : undefined}
        sx={{
          // WCAG 2.4.7: Focus visible indicator
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
            disabled={option.disabled}
            aria-current={option.active ? "page" : undefined}
            sx={(theme) => ({
              ...theme.typography.button,
              color: theme.palette.blue.darkest,
              py: theme.space.component.md,
              px: theme.space.component.lg,
              // WCAG 1.4.1: Active state uses background + bold (not color alone)
              ...(option.active && {
                backgroundColor: theme.palette.action.hover,
                fontWeight: theme.typography.fontWeightBold,
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
