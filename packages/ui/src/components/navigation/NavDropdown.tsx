"use client"

import React, { useState } from "react"
import { Button, Menu, MenuItem } from "@mui/material"
import { useTheme } from "@mui/material/styles"
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown"

export interface NavDropdownOption {
  key: string
  label: string
  onClick: () => void
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
    lineHeight: 1.1,
    height: theme.spacing(4.5), // 36px to match other header buttons
    minHeight: theme.spacing(4.5),
    fontSize: "0.95rem",
    fontWeight: 500,
    color: theme.palette.text.primary,
  }

  return (
    <>
      <Button
        variant={variant}
        disableRipple={disableRipple}
        onClick={handleClick}
        endIcon={<ArrowDropDownIcon />}
        sx={{
          ...buttonStyle,
          ...sx,
        }}
      >
        {label}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={isOpen}
        onClose={handleClose}
        sx={{
          zIndex: (theme) => theme.zIndex.dropdown,
          "& .MuiPaper-root": {
            backgroundColor: (theme) => theme.palette.common.white,
            borderRadius: (theme) => theme.borderRadius.md,
            mt: 1,
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
            sx={{
              color: (theme) => theme.palette.blue.darkest,
              fontSize: (theme) => theme.typography.nav.fontSize,
              fontFamily: (theme) => theme.typography.fontFamily,
              py: (theme) => theme.spacing(1.5), // 12px padding
              px: (theme) => theme.spacing(2), // 16px padding
              "&:hover": {
                backgroundColor: (theme) => theme.palette.action.hover,
                color: (theme) => theme.palette.blue.darkest,
              },
            }}
          >
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
