"use client"

import { Box, Typography } from "@mui/material"
import { BasePanel, BasePanelProps } from "./index"

interface HeroPanelProps extends BasePanelProps {
  title: string
  content: string
  backgroundImage?: string
  children?: React.ReactNode
}

export function HeroPanel({
  title,
  content,
  backgroundImage,
  children,
  ...panelProps
}: HeroPanelProps) {
  return (
    <BasePanel
      fullHeight={true}
      paddingVariant="wide"
      {...panelProps}
      sx={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
        display: "flex",
        justifyContent: "center",
        overflow: "hidden",
        ...panelProps.sx,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          maxWidth: "770px",
          textAlign: "left",
          position: "relative",
          zIndex: 1,
        }}
      >
        <Typography variant="h1" gutterBottom>
          {title}
        </Typography>

        <Typography variant="body1">{content}</Typography>

        {children}
      </Box>
    </BasePanel>
  )
}
