"use client"

import React, { useEffect, useRef, useCallback, useState } from "react"
import { Box, Typography, List, ListItem, Chip, useTheme } from "@mui/material"
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
  const theme = useTheme()

  // Create a map to store refs for each theme item
  const themeRefs = useRef<Record<string, HTMLDivElement | null>>({})
  // Main content container ref
  const contentRef = useRef<HTMLDivElement | null>(null)
  // Track if this is the first mount
  const initialMountRef = useRef<boolean>(true)
  // Track previous selectedOperation to detect actual changes
  const [prevSelectedOperation, setPrevSelectedOperation] = useState<
    string | undefined
  >(undefined)

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

  // Set up ref callback to store theme elements in the ref map
  const setThemeRef = useCallback((el: HTMLDivElement | null, id: string) => {
    themeRefs.current[id] = el
  }, [])

  // Effect to scroll to the selected theme when the drawer opens
  useEffect(() => {
    // If it's the initial mount, we don't want to scroll - this is when opening from the tab rail
    if (initialMountRef.current) {
      initialMountRef.current = false
      setPrevSelectedOperation(selectedOperation)
      return
    }

    // Only scroll if selectedOperation has actually changed - this happens from Tell Me More button clicks
    if (selectedOperation !== prevSelectedOperation) {
      setPrevSelectedOperation(selectedOperation)

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
      }
    }
  }, [selectedOperation])

  return (
    <ContentWrapper title="Scenario Themes" onClose={onClose}>
      <Typography variant="body1" sx={theme.mixins.drawerContent.contentText}>
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
                ...(theme.mixins.drawerContent.itemBox as any),
                ...(item.id === selectedOperation &&
                  theme.mixins.drawerContent.selectedItemBox),
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
                  sx={{ mb: 1, ...theme.mixins.drawerContent.secondaryText }}
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
                      sx={theme.mixins.drawerContent.chip}
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
