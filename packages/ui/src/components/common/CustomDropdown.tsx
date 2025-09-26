"use client"

import {
  Box,
  Select,
  MenuItem,
  FormControl,
  InputBase,
  SelectChangeEvent,
  useTheme,
} from "../.."

export interface CustomDropdownProps {
  value: string
  onChange: (event: SelectChangeEvent<string>) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
  onOptionHover?: (value: string) => void
  onOptionLeave?: () => void
  disabled?: boolean
  disabledValues?: string[]
}

export function CustomDropdown({
  value,
  onChange,
  options,
  placeholder = "Select an option...",
  onOptionHover,
  onOptionLeave,
  disabled = false,
  disabledValues = [],
}: CustomDropdownProps) {
  const theme = useTheme()

  const dropdownStyles = {
    container: {
      position: "relative",
      flex: 1,
    },
    select: {
      cursor: "pointer",
      fontSize: theme.typography.body2.fontSize,
      "& .MuiSelect-select": {
        fontSize: theme.typography.body2.fontSize,
      },
    },
    input: {
      fontSize: theme.typography.body2.fontSize,
      cursor: "pointer",
      "& .MuiInputBase-input": {
        borderRadius: 0,
        backgroundColor: "transparent",
        border: "none",
        padding: `0px ${theme.spacing(4)} 0px 0`,
        borderBottom: "none",
        cursor: "pointer",
        fontSize: theme.typography.body2.fontSize,
      },
      "& .MuiSelect-select": {
        cursor: "pointer",
      },
    },
    underline: {
      position: "absolute",
      bottom: 0,
      left: 0,
      width: `calc(100% - ${theme.spacing(4)})`,
      borderBottom: theme.border.thin,
      transition: "all 0.2s ease",
      pointerEvents: "none",
    },
    triangle: {
      position: "absolute",
      right: theme.spacing(1),
      top: "50%",
      transform: "translateY(-140%)",
      width: theme.spacing(2),
      height: "12px",
      cursor: "pointer",
      pointerEvents: "none",
    },
  }

  return (
    <Box sx={dropdownStyles.container}>
      <FormControl sx={{ width: "100%" }}>
        <Select
          value={value}
          onChange={onChange}
          displayEmpty
          disabled={disabled}
          IconComponent={() => null}
          renderValue={(selected) => {
            if (!selected) {
              return (
                <span
                  style={{
                    color: theme.palette.text.secondary,
                    fontStyle: "italic",
                  }}
                >
                  {placeholder}
                </span>
              )
            }
            const option = options.find((opt) => opt.value === selected)
            return option?.label || selected
          }}
          sx={dropdownStyles.select}
          input={<InputBase sx={dropdownStyles.input} />}
          MenuProps={{
            autoFocus: false,
            disableAutoFocusItem: true,
            PaperProps: {
              sx: {
                "& .MuiMenuItem-root": {
                  fontSize: theme.typography.body2.fontSize,
                },
                "& .MuiMenuItem-root.already-added": {
                  color: theme.palette.grey[900],
                  backgroundColor: theme.palette.action.disabledBackground,
                  "&:hover": {
                    backgroundColor: theme.palette.action.disabledBackground,
                  },
                  "&::after": {
                    content: '" (added)"',
                    fontSize: theme.typography.caption.fontSize,
                    marginLeft: theme.spacing(1),
                    color: theme.palette.grey[900],
                  },
                },
              },
            },
          }}
          SelectDisplayProps={{
            style: { cursor: "pointer" },
          }}
        >
          {options.map((option) => {
            const isAlreadyAdded = disabledValues.includes(option.value)
            return (
              <MenuItem
                key={option.value}
                value={option.value}
                disabled={isAlreadyAdded}
                className={isAlreadyAdded ? "already-added" : ""}
                onMouseEnter={() =>
                  !isAlreadyAdded && onOptionHover?.(option.value)
                }
                onMouseLeave={onOptionLeave}
              >
                {option.label}
              </MenuItem>
            )
          })}
        </Select>
      </FormControl>

      {/* Underline element */}
      <Box sx={dropdownStyles.underline} />

      {/* Custom triangle */}
      <Box sx={dropdownStyles.triangle}>
        <svg
          viewBox="0 0 16 12"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: "100%", height: "100%" }}
        >
          <path
            d="M3 2 Q2 2 2 3 Q2 3.5 2.5 4 L7 10 Q8 11 8 11 Q8 11 9 10 L13.5 4 Q14 3.5 14 3 Q14 2 13 2 Z"
            fill={theme.palette.blue.bright}
            stroke="none"
          />
        </svg>
      </Box>
    </Box>
  )
}
