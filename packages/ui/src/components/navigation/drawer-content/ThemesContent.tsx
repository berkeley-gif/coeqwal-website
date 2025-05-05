"use client"

import React, { useEffect, useRef, useCallback } from "react"
import { Box, Typography, List, ListItem, Chip } from "@mui/material"
import { ContentWrapper } from "./ContentWrapper"

export interface ThemesContentProps {
  /** Function called when the close button is clicked */
  onClose: () => void
  /** Selected operation ID passed from the drawer store */
  selectedOperation?: string
}

/**
 * Content component for the Scenario Themes tab in the MultiDrawer
 */
export function ThemesContent({
  onClose,
  selectedOperation,
}: ThemesContentProps) {
  // Create a map to store refs for each theme item
  const themeRefs = useRef<Record<string, HTMLDivElement | null>>({})
  // Main content container ref
  const contentRef = useRef<HTMLDivElement | null>(null)

  const [themes] = React.useState([
    {
      id: "remove-tucps",
      name: "Temporary emergency measures (TUCP's)",
      description:
        "Temporary Urgency Change Petitions (TUCPs) allow water‑right holders to temporarily (up to 180 days) modify the terms of their permits or licenses during urgent conditions such as extreme drought.",
      tags: ["drought", "policy", "flows", "salinity"],
    },
    {
      id: "limit-groundwater",
      name: "Limiting groundwater pumping",
      description:
        "Operations focused on limiting groundwater pumping across different regions and evaluating impacts on agriculture and water availability.",
      tags: ["groundwater", "agriculture", "drinking water", "sustainability"],
    },
    {
      id: "change-stream-flows",
      name: "Varying stream flows",
      description:
        "Adjusting stream flow requirements to balance environmental needs with water availability for other uses.",
      tags: ["environment", "water quality", "river flows"],
    },
    {
      id: "prioritize-drinking-water",
      name: "Prioritizing community drinking water",
      description:
        "Optimizing water operations to ensure drinking water access for all communities, especially those historically underserved.",
      tags: ["equity", "community", "drinking water", "urban water"],
    },
    {
      id: "balance-delta-uses",
      name: "Balancing water uses in the Delta",
      description:
        "Exploring different approaches to managing Delta water export and outflow requirements, with impacts on multiple stakeholders.",
      tags: ["equity", "community", "environment", "water quality", "delta"],
    },
    {
      id: "new-infrastructure",
      name: "Adding new water infrastructure",
      description:
        "Evaluating potential benefits and impacts of new infrastructure projects like the Delta conveyance tunnel.",
      tags: ["infrastructure", "sustainability", "water storage", "conveyance"],
    },
  ])

  // Find the selected theme if an operation ID was provided
  const selectedTheme = selectedOperation
    ? themes.find((theme) => theme.id === selectedOperation)
    : undefined

  // Set up ref callback to store theme elements in the ref map
  const setThemeRef = useCallback((el: HTMLDivElement | null, id: string) => {
    themeRefs.current[id] = el
  }, [])

  // Effect to scroll to the selected theme when the drawer opens
  useEffect(() => {
    if (selectedOperation && themeRefs.current[selectedOperation]) {
      // Get the element to scroll to
      const element = themeRefs.current[selectedOperation]

      // Add a small delay to ensure the drawer is fully open
      setTimeout(() => {
        if (element) {
          // Scroll the element into view with a smooth animation
          element.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      }, 300)
    } else {
      // If no selectedOperation, scroll to top
      setTimeout(() => {
        // Find the parent scrollable container
        let element = document.querySelector(".drawer-content-wrapper")
        if (element && element instanceof HTMLElement) {
          // Use smooth scrolling instead of instant jump
          element.scrollTo({
            top: 0,
            behavior: "smooth",
          })
        }
      }, 300)
    }
  }, [selectedOperation])

  return (
    <ContentWrapper
      title="Scenario Themes"
      onClose={onClose}
      bgColor="rgb(87, 137, 154)" /* #57899A */
    >
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 3, lineHeight: 1.4 }}
      >
        We have organized the alternative scenarios we are running on CalSim
        into themes. In a technical sense, themes are clusters of multiple water
        operation settings that can be applied and varied.
      </Typography>

      <Box ref={contentRef} sx={{ width: "100%" }}>
        <List sx={{ width: "100%", p: 0 }}>
          {themes.map((item) => (
            <ListItem
              key={item.id}
              component="div"
              ref={(el) => setThemeRef(el as HTMLDivElement, item.id)}
              id={`theme-${item.id}`}
              sx={{
                mb: 1.5,
                p: 1.5,
                borderRadius: 1,
                bgcolor:
                  item.id === selectedOperation
                    ? "rgba(0, 0, 0, 0.08)"
                    : "rgba(0, 0, 0, 0.02)",
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor: "rgba(0, 0, 0, 0.05)",
                },
                // Highlight the selected theme
                ...(item.id === selectedOperation && {
                  boxShadow: "0 0 0 2px rgba(255, 255, 255, 0.4)",
                }),
              }}
            >
              <Box sx={{ flexGrow: 1 }}>
                <Typography
                  variant="subtitle1"
                  component="div"
                  sx={{ fontWeight: 500, mb: 0.5 }}
                >
                  {item.name}
                </Typography>
                <Typography
                  variant="body1"
                  component="div"
                  color="text.secondary"
                  sx={{ mb: 1, lineHeight: 1.4 }}
                >
                  {item.description}
                </Typography>
                <Box>
                  {item.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      variant="outlined"
                      sx={{ color: "white", mr: 0.5, mb: 0.5 }}
                    />
                  ))}
                </Box>
              </Box>
            </ListItem>
          ))}
        </List>
      </Box>
    </ContentWrapper>
  )
}

export default ThemesContent
