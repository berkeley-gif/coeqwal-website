"use client"

/**
 * MobileNotSupported - Mobile view for content that can't be accessed on mobile
 */

import { Box, Typography, Button, useTheme } from "@repo/ui/mui"

export interface MobileNotSupportedProps {
  /** Message shown to the visitor. Defaults to the COEQWAL tools copy. */
  message?: string
  /** href for the call-to-action button. Defaults to "/". */
  buttonHref?: string
  /** Label for the call-to-action button. Defaults to "Go to the homepage". */
  buttonLabel?: string
}

export function MobileNotSupported({
  message = "Due to the nature of the tools, this section of COEQWAL is best used on a tablet, desktop or laptop computer",
  buttonHref = "/",
  buttonLabel = "Go to the homepage",
}: MobileNotSupportedProps = {}) {
  const theme = useTheme()

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        p: 4,
        textAlign: "center",
        gap: 2,
        backgroundColor: theme.palette.brand.sky,
        justifyContent: "center" /* Horizontal centering */,
        alignItems: "center" /* Vertical centering */,
      }}
    >
      <Typography variant="body1">{message}</Typography>
      <Button variant="contained" href={buttonHref}>
        {buttonLabel}
      </Button>
    </Box>
  )
}
