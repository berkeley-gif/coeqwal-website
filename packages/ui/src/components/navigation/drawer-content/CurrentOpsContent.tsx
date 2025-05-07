"use client"

import { Box, Typography, useTheme } from "@mui/material"
import { ContentWrapper } from "./ContentWrapper"

export interface CurrentOpsContentProps {
  /** Function called when the close button is clicked */
  onClose: () => void
  /** Selected section ID passed from the drawer store */
  selectedSection?: string
}

/**
 * Content component for the Current Operations tab in the MultiDrawer
 */
export function CurrentOpsContent({ onClose }: CurrentOpsContentProps) {
  const theme = useTheme()

  return (
    <ContentWrapper title="Current Operations" onClose={onClose}>
      <Box sx={theme.mixins.drawerContent.infoBox}>
        <Typography
          variant="subtitle2"
          sx={theme.mixins.drawerContent.headingText}
        >
          What are current operations?
        </Typography>
        <Typography variant="body1" sx={theme.mixins.drawerContent.bodyText}>
          The current operations scenario illustrates how water has been managed
          in recent years. It also serves as a reference point to compare
          against alternative scenarios in which changes in operations are
          implemented.
        </Typography>
      </Box>
    </ContentWrapper>
  )
}

export default CurrentOpsContent
