"use client"

import React from "react"
import { Typography, useTheme, Box } from "@repo/ui/mui"
import { Card } from "@repo/ui"
import { DecileBarChart } from "@repo/viz"

interface ScenarioCardProps {
  title?: string
  scenarioNumber: number
  data?: string | null
  metricType?: string
  expanded?: boolean
}

const ScenarioCard: React.FC<ScenarioCardProps> = ({
  title,
  scenarioNumber,
  data,
  metricType = "DELTA_OUTFLOW",
  expanded = false,
}) => {
  const theme = useTheme()

  // Parse the JSON data if available
  const parsedData = React.useMemo(() => {
    if (!data) return null
    try {
      return JSON.parse(data)
    } catch (error) {
      console.error("Error parsing scenario data:", error)
      return null
    }
  }, [data])

  // Format metric name for display
  const formattedMetricName = React.useMemo(() => {
    if (!metricType) return "Delta Outflow"

    // Human-readable names
    const specialMetricNames: Record<string, string> = {
      DELTA_OUTFLOW: "Delta Outflow",
      EXPORTS: "Delta Exports",
      SOD_URBAN: "South-of-Delta Urban",
      NOD_URBAN: "North-of-Delta Urban",
      SOD_AG: "South-of-Delta Agriculture",
      NOD_AG: "North-of-Delta Agriculture",
      NOD_INFLOW: "North-of-Delta Inflow",
      SJR_FLOW: "San Joaquin River Flow",
      SAC_FLOW: "Sacramento River Flow",
      X2: "Delta X2 Position",
      SWP_DEL: "SWP Deliveries",
      CVP_DEL: "CVP Deliveries",
    }

    // Return the special name if available
    if (metricType in specialMetricNames) {
      return specialMetricNames[metricType]
    }

    // Otherwise, replace underscores with spaces and title case
    return metricType
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ")
  }, [metricType])

  // Get appropriate units based on metric type
  const metricUnits = React.useMemo(() => {
    if (metricType === "X2") return "km"

    if (
      metricType?.includes("STORAGE") ||
      metricType?.includes("RESERVOIR") ||
      metricType?.includes("DEL") ||
      metricType?.includes("DELIVERY")
    ) {
      return "TAF"
    }

    // Default for flows
    return "CFS"
  }, [metricType])

  return (
    <Card
      sx={{
        height: expanded ? "450px" : "350px",
        width: "100%",
        display: "flex",
        flexDirection: expanded ? "row" : "column",
        alignItems: "flex-start",
        p: theme.spacing(2),
        pt: theme.spacing(4),
        transition: "all 0.3s ease-in-out",
        "&:hover": {
          transform: expanded ? "none" : "translateY(-4px)",
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
        },
        overflow: "auto",
        position: "relative",
      }}
    >
      <Box
        sx={{
          width: expanded ? "30%" : "100%",
          pr: expanded ? 3 : 0,
          borderRight: expanded ? `1px solid ${theme.palette.divider}` : "none",
          height: expanded ? "auto" : "auto",
        }}
      >
        <Typography variant="h6" sx={{ mb: 1 }}>
          {title || `Scenario ${scenarioNumber}`}
        </Typography>
        {expanded && (
          <Typography variant="body2" sx={{ mt: 2, color: "text.secondary" }}>
            {metricType
              ? `Displaying: ${formattedMetricName}`
              : "No metric selected"}
          </Typography>
        )}
      </Box>

      {parsedData ? (
        <Box
          sx={{
            width: expanded ? "70%" : "100%",
            height: expanded ? "400px" : "280px",
            mt: expanded ? 0 : 1,
            overflow: "hidden",
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <DecileBarChart
            data={parsedData}
            title={expanded ? "" : formattedMetricName}
            yAxisLabel={metricUnits}
            colorScheme="blues"
            responsive={true}
            showValues={expanded ? true : false}
            height={expanded ? 400 : 250}
          />
        </Box>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "180px",
            width: expanded ? "70%" : "100%",
          }}
        >
          <Typography variant="body1" color="textSecondary" align="center">
            No data available for {formattedMetricName}
          </Typography>
          <Typography
            variant="body2"
            color="textSecondary"
            align="center"
            sx={{ mt: 1 }}
          >
            Try selecting a different metric
          </Typography>
        </Box>
      )}
    </Card>
  )
}

export default ScenarioCard
