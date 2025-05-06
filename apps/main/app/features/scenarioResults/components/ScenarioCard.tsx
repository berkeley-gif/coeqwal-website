"use client"

import React, { useState, useEffect } from "react"
import {
  Typography,
  useTheme,
  Box,
  ToggleButtonGroup,
  ToggleButton,
} from "@repo/ui/mui"
import { Card } from "@repo/ui"
import { DecileBarChart, LineChart } from "@repo/viz"
import type { LineChartData } from "@repo/viz"

// // Define types for monthly data
// interface MonthlyData {
//   [key: string]: number
// }

interface ScenarioCardProps {
  title?: string
  scenarioNumber: number
  data?: string | null
  metricType?: string
  expanded?: boolean
}

type ChartType = "bar" | "line"

const ScenarioCard: React.FC<ScenarioCardProps> = ({
  title,
  scenarioNumber,
  data,
  metricType = "INFLOW",
  expanded = false,
}) => {
  const theme = useTheme()
  const [chartType, setChartType] = useState<ChartType>("line")
  const [monthlyData, setMonthlyData] = useState<LineChartData | null>(null)

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
      INFLOW: "Reservoir Inflows",
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
      metricType === "INFLOW" ||
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

  // Handle chart type change
  const handleChartTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newType: ChartType | null,
  ) => {
    if (newType !== null) {
      setChartType(newType)
    }
  }

  // Fetch monthly data for line chart if needed
  useEffect(() => {
    if (chartType === "line" && !monthlyData) {
      // Hardcoded data as fallback in case fetch fails
      const fallbackData = {
        overall: {
          "1": 34.36,
          "2": 36.74,
          "3": 42.7,
          "4": 38.95,
          "5": 39.95,
          "6": 25.25,
          "7": 11.59,
          "8": 6.34,
          "9": 5.28,
          "10": 6.18,
          "11": 8.67,
          "12": 22.41,
        },
        dry: {
          "1": 35.54,
          "2": 37.86,
          "3": 45.35,
          "4": 41.87,
          "5": 43.38,
          "6": 27.59,
          "7": 12.51,
          "8": 6.71,
          "9": 5.53,
          "10": 6.46,
          "11": 9.16,
          "12": 23.29,
        },
        wet: {
          "1": 34.36,
          "2": 36.74,
          "3": 42.7,
          "4": 38.95,
          "5": 39.95,
          "6": 25.25,
          "7": 11.59,
          "8": 6.34,
          "9": 5.28,
          "10": 6.18,
          "11": 8.67,
          "12": 22.41,
        },
      }

      // Try to fetch from multiple possible locations
      Promise.any([
        fetch("/monthly_data.json").then((r) => r.json()),
        fetch("/scenario_data/s9999_inflows/_aggregates.json").then((r) =>
          r.json(),
        ),
        fetch(
          "/apps/main/public/scenario_data/s9999_inflows/_aggregates.json",
        ).then((r) => r.json()),
      ])
        .then((data) => {
          console.log("Loaded monthly data:", data)
          // Check if data has the right structure, otherwise transform it
          if (data.all && data.all.monthly_mean) {
            setMonthlyData(data.all.monthly_mean)
          } else {
            console.warn("Using fallback monthly data structure")
            setMonthlyData(fallbackData)
          }
        })
        .catch((error) => {
          console.error("Error fetching monthly data:", error)
          // Use hardcoded fallback data
          console.log("Using fallback monthly data")
          setMonthlyData(fallbackData)
        })
    }
  }, [chartType, monthlyData])

  return (
    <Card
      sx={{
        height: expanded ? "450px" : "400px",
        width: "100%",
        display: "flex",
        flexDirection: expanded ? "row" : "column",
        alignItems: "flex-start",
        p: (theme) => theme.cards.spacing.padding,
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
        <Typography
          variant="h6"
          sx={{
            mb: 1,
            fontSize: (theme) => theme.cards.typography.cardTitle.fontSize,
            lineHeight: (theme) => theme.cards.typography.cardTitle.lineHeight,
            fontWeight: (theme) => theme.cards.typography.cardTitle.fontWeight,
          }}
        >
          {title || `Scenario ${scenarioNumber}`}
        </Typography>

        {/* Chart type selector */}
        <ToggleButtonGroup
          value={chartType}
          exclusive
          onChange={handleChartTypeChange}
          size="small"
          sx={{ mt: 1, mb: 1 }}
        >
          <ToggleButton value="bar" aria-label="bar chart">
            Bar
          </ToggleButton>
          <ToggleButton value="line" aria-label="line chart">
            Line
          </ToggleButton>
        </ToggleButtonGroup>

        {expanded && (
          <Typography
            variant="body2"
            sx={{
              mt: 2,
              color: "text.secondary",
              fontSize: (theme) => theme.cards.typography.body.fontSize,
              lineHeight: (theme) => theme.cards.typography.body.lineHeight,
              fontWeight: (theme) => theme.cards.typography.body.fontWeight,
            }}
          >
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
          {chartType === "bar" ? (
            <DecileBarChart
              data={parsedData}
              title={expanded ? "" : formattedMetricName}
              yAxisLabel={metricUnits}
              colorScheme="blues"
              responsive={true}
              showValues={expanded ? true : false}
              height={400}
            />
          ) : monthlyData ? (
            <LineChart
              data={monthlyData}
              title={expanded ? "" : "Reservoir Inflows"}
              yAxisLabel={metricUnits}
              responsive={true}
              height={400}
            />
          ) : (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              <Typography>Loading monthly data...</Typography>
            </Box>
          )}
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
