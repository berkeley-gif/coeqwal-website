"use client"

import React from "react"
import { Typography, useTheme } from "@repo/ui/mui"
import { Card } from "@repo/ui"

interface ScenarioCardProps {
  title?: string
  scenarioNumber: number
  data?: string | null
}

const ScenarioCard: React.FC<ScenarioCardProps> = ({
  title,
  scenarioNumber,
  data,
}) => {
  const theme = useTheme()

  return (
    <Card
      sx={{
        height: "220px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        p: theme.spacing(2),
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
        },
      }}
    >
      <Typography variant="h6" gutterBottom>
        {title || `Scenario ${scenarioNumber}`}
      </Typography>

      {data ? (
        <pre
          style={{
            fontSize: "12px",
            width: "100%",
            overflow: "auto",
            textAlign: "left",
            marginTop: theme.spacing(2),
          }}
        >
          {data}
        </pre>
      ) : (
        <Typography variant="body2" color="textSecondary">
          Click to view details
        </Typography>
      )}
    </Card>
  )
}

export default ScenarioCard
