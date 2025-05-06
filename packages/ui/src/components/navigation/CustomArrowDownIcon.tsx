"use client"

import React from "react"
import { SvgIcon, SvgIconProps } from "@mui/material"

/**
 * Custom arrow icon pointing downward
 * Used for the Search scenarios button
 */
export function CustomArrowDownIcon(props: SvgIconProps) {
  return (
    <SvgIcon
      {...props}
      sx={{
        ml: 0.5,
        fontSize: "1.25rem",
        transition: "transform 0.2s",
        ...(props.sx || {}),
      }}
      viewBox="0 0 24 24"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 16.5L4.5 9L6 7.5L12 13.5L18 7.5L19.5 9L12 16.5Z"
        fill="currentColor"
      />
    </SvgIcon>
  )
}

export default CustomArrowDownIcon
