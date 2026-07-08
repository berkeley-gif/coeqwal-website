"use client"

/**
 * MetricExplainers - the three explainer accordions under the chart card:
 * what the metric is, how to read the current chart, and why the page does
 * not split climate change from operations. Copy is ported from the team's
 * design prototype (registry + interpretiveText); this component only lays it
 * out.
 */

import React from "react"
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  ExpandMoreIcon,
  Typography,
  useTheme,
} from "@repo/ui/mui"
import { useDataSlice } from "../../../../store"
import { getVariable } from "../config/variableRegistry"
import { howToReadText, WHY_NO_BREAKDOWN } from "../hooks/interpretiveText"

export default function MetricExplainers() {
  const theme = useTheme()
  const { selectedVariableId, view, distKind } = useDataSlice()
  const variable = getVariable(selectedVariableId)
  if (!variable) return null

  const items: { key: string; title: string; body: React.ReactNode }[] = [
    {
      key: "what",
      title: "What is this metric?",
      body: (
        <>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {variable.plain}
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.grey[600] }}>
            <strong>Technical:</strong> {variable.tech} Units:{" "}
            {variable.unitLabel}.
          </Typography>
        </>
      ),
    },
    {
      key: "read",
      title: "How do I read this chart?",
      body: (
        <Typography variant="body2">{howToReadText(view, distKind)}</Typography>
      ),
    },
    {
      key: "why",
      title: "Why is there no climate-vs-operations breakdown here?",
      body: <Typography variant="body2">{WHY_NO_BREAKDOWN}</Typography>,
    },
  ]

  return (
    <Box sx={{ mt: 2 }}>
      {items.map((item) => (
        <Accordion
          key={item.key}
          disableGutters
          elevation={0}
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            mb: 1,
            "&:before": { display: "none" },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon fontSize="small" />}
            sx={{ minHeight: 0, "& .MuiAccordionSummary-content": { my: 1 } }}
          >
            <Typography variant="subtitle2">{item.title}</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>{item.body}</AccordionDetails>
        </Accordion>
      ))}
    </Box>
  )
}
