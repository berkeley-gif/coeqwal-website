"use client"

/**
 * MobileNotSupported - Mobile view for content that can't be accessed on mobile
 */

import { Box, Typography, Button, useTheme } from "@repo/ui/mui"

export function MobileNotSupported() {
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
      <Typography variant="body1">
        Due to the nature of the tools, this section of COEQWAL is best used on
        a tablet, desktop or laptop computer
      </Typography>
      <Button variant="contained" href="/">
        Go to the homepage
      </Button>
    </Box>
  )
}
