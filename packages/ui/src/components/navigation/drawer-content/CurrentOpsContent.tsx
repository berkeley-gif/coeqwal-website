"use client"

import { Box, Typography } from "@mui/material"
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
  return (
    <ContentWrapper
      title="Current Operations"
      onClose={onClose}
      bgColor="rgb(106, 155, 170)" /* #6A9BAA */
    >
      <Box
        sx={{ mt: 2, p: 2, bgcolor: "rgba(0, 0, 0, 0.03)", borderRadius: 1 }}
      >
        <Typography
          variant="subtitle2"
          color="primary"
          sx={{ fontWeight: "bold" }}
        >
          What are current operations?
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mt: 1, lineHeight: 1.4 }}
        >
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
