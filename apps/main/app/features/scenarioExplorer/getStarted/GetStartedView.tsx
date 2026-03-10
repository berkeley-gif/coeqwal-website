"use client"

import { Box, Typography, useTheme } from "@repo/ui/mui"
import { ContentPanel } from "@repo/ui"

const SECTIONS = [
  { title: "Welcome", body: "...use our tools..." },
  { title: "Scenarios" },
  { title: "Scenario scorecard" },
  { title: "Operations" },
  { title: "Tiers" },
] as const

export default function GetStartedView() {
  const theme = useTheme()

  const panelSx = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    pt: theme.space.panel.padding,
    px: theme.space.panel.padding,
  }

  return (
    <Box
      sx={{
        height: "100%",
        overflow: "auto",
        backgroundColor: theme.palette.tabPanels.explore,
      }}
    >
      {SECTIONS.map(({ title, body }) => (
        <ContentPanel key={title} sx={panelSx}>
          <Typography variant="h3" component="h2">
            {title}
          </Typography>
          {body && (
            <Typography variant="body1" sx={{ mt: theme.space.component.lg }}>
              {body}
            </Typography>
          )}
        </ContentPanel>
      ))}
    </Box>
  )
}
