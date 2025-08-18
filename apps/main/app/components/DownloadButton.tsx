"use client"

import React from "react"
import { Button } from "@repo/ui/mui"
import { icons } from "@repo/ui/mui"

const { Download } = icons

interface DownloadButtonProps {
  fileId: string
  filename: string
  disabled?: boolean
}

export default function DownloadButton({
  fileId,
  filename,
  disabled = false,
}: DownloadButtonProps) {
  // Use Lambda function for download
  const lambdaUrl = `https://x66ckhp067.execute-api.us-west-2.amazonaws.com/default/coeqwalPresignDownload?id=${fileId}`

  return (
    <Button
      variant="contained"
      color="primary"
      component="a"
      href={disabled || !fileId ? undefined : lambdaUrl}
      disabled={disabled}
      startIcon={<Download />}
      sx={{
        mt: 2,
        textTransform: "none",
        textDecoration: "none",
        "&:hover": {
          textDecoration: "none",
        },
      }}
    >
      Download {filename}
    </Button>
  )
}
