"use client"

import { Grid, GridProps, Typography } from "@mui/material"
import { BasePanel, type BasePanelProps } from "./BasePanel"

interface TwoColumnPanelProps extends BasePanelProps {
  leftContent?: React.ReactNode
  rightContent?: React.ReactNode
  leftTitle?: string
  rightTitle?: string
  reversed?: boolean
  columnProps?: {
    left?: GridProps
    right?: GridProps
  }
  includeHeaderSpacing?: boolean
}

export function TwoColumnPanel({
  leftContent,
  rightContent,
  leftTitle,
  rightTitle,
  reversed = false,
  columnProps = {},
  includeHeaderSpacing = true,
  ...panelProps
}: TwoColumnPanelProps) {
  return (
    <BasePanel
      paddingVariant="wide"
      includeHeaderSpacing={includeHeaderSpacing}
      {...panelProps}
    >
      <Grid container spacing={4}>
        <Grid
          sx={{
            gridColumn: { xs: "1 / -1", md: "span 6" },
            order: { xs: 1, md: reversed ? 2 : 1 },
          }}
          {...columnProps.left}
        >
          {leftTitle && (
            <Typography variant="h2" gutterBottom>
              {leftTitle}
            </Typography>
          )}
          {leftContent}
        </Grid>
        <Grid
          sx={{
            gridColumn: { xs: "1 / -1", md: "span 6" },
            order: { xs: 2, md: reversed ? 1 : 2 },
          }}
          {...columnProps.right}
        >
          {rightTitle && <Typography variant="h2">{rightTitle}</Typography>}
          {rightContent}
        </Grid>
      </Grid>
    </BasePanel>
  )
}
