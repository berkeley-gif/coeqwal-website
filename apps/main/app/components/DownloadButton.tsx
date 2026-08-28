"use client"

/**
 * DownloadButton - Button for file downloads
 *
 * Not-yet-styled button with download icon for data file downloads.
 */

import React from "react"
import { Button, ButtonProps, icons } from "@repo/ui/mui"

const { Download } = icons

interface DownloadButtonProps extends Omit<ButtonProps, "onClick" | "href"> {
  fileId: string
  filename: string
  downloadUrl?: string
  disabled?: boolean
  children?: React.ReactNode
  /** Anchor target, e.g. "_blank" to open in a new tab instead of navigating away. */
  target?: string
  /** Anchor rel; pair with target="_blank" (e.g. "noopener noreferrer"). */
  rel?: string
  /** Overrides the default download icon, e.g. for "view" links that open in a new tab. */
  icon?: React.ReactNode
}

export default function DownloadButton({
  fileId,
  filename,
  downloadUrl,
  disabled = false,
  children,
  variant = "contained",
  color = "primary",
  sx = {},
  target,
  rel,
  icon,
  ...props
}: DownloadButtonProps) {
  // Use the provided downloadUrl or fall back to the direct Lambda function
  const finalUrl =
    downloadUrl ||
    `https://x66ckhp067.execute-api.us-west-2.amazonaws.com/default/coeqwalPresignDownload?id=${fileId}`

  return (
    <Button
      variant={variant}
      color={color}
      component="a"
      href={disabled || !fileId ? undefined : finalUrl}
      target={target}
      rel={rel}
      disabled={disabled}
      startIcon={icon ?? <Download />}
      sx={{
        mt: 2, // theme.space.component.lg (16px)
        textTransform: "none",
        textDecoration: "none",
        "&:hover": {
          textDecoration: "none",
        },
        ...sx,
      }}
      {...props}
    >
      {children || `Download ${filename}`}
    </Button>
  )
}
