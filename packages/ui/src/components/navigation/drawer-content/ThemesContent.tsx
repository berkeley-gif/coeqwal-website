"use client"

import React from "react"
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
  useTheme,
  IconButton,
} from "@mui/material"
import { ContentWrapper } from "./ContentWrapper"
import StarIcon from "@mui/icons-material/Star"
import StarBorderIcon from "@mui/icons-material/StarBorder"
import AddIcon from "@mui/icons-material/Add"

export interface ThemesContentProps {
  /** Function called when the close button is clicked */
  onClose: () => void
}

/**
 * Content component for the Scenario Themes tab in the MultiDrawer
 */
export function ThemesContent({ onClose }: ThemesContentProps) {
  const theme = useTheme()

  // Sample themes - replace with your actual themes data
  const [themes, setThemes] = React.useState([
    {
      id: "1",
      name: "Limiting groundwater pumping",
      description: "Operations focused on limiting groundwater pumping",
      favorite: true,
      tags: ["groundwater", "agriculture", "drinking water", "sustainability"],
    },
    {
      id: "2",
      name: "Varying stream flows",
      description: "Varying stream flow",
      favorite: false,
      tags: ["environment", "water quality"],
    },
    {
      id: "3",
      name: "Prioritizing community drinking water",
      description: "Optimizing for community drinking water",
      favorite: true,
      tags: ["equity", "community", "drinking water"],
    },
    {
      id: "4",
      name: "Balancing water uses in the Delta",
      description: "Balancing...",
      favorite: true,
      tags: ["equity", "community", "environment", "water quality"],
    },
    {
      id: "5",
      name: "Adding new water infrastructure",
      description: "Like the Delta conveyance tunnel...",
      favorite: true,
      tags: ["sustainability", "community", "environment", "water quality"],
    },
  ])

  // Toggle favorite status
  const toggleFavorite = (id: string) => {
    setThemes(
      themes.map((theme) =>
        theme.id === id ? { ...theme, favorite: !theme.favorite } : theme,
      ),
    )
  }

  return (
    <ContentWrapper
      title="Scenario Themes"
      onClose={onClose}
      bgColor="rgb(118, 178, 190)"
    >
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        We have organized the alternative scenarios we are running on CalSim
        into themes. In a technical sense, themes are clusters of multiple water
        operation settings that can be applied and varied.
      </Typography>

      <List sx={{ width: "100%", p: 0 }}>
        {themes.map((item) => (
          <ListItem
            key={item.id}
            component="div"
            sx={{
              mb: 1.5,
              p: 1.5,
              borderRadius: 1,
              bgcolor: "rgba(0, 0, 0, 0.02)",
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: "rgba(0, 0, 0, 0.05)",
              },
            }}
            secondaryAction={
              <IconButton
                edge="end"
                aria-label="favorite"
                onClick={() => toggleFavorite(item.id)}
                sx={{
                  color: item.favorite ? theme.palette.warning.main : "inherit",
                }}
              >
                {item.favorite ? <StarIcon /> : <StarBorderIcon />}
              </IconButton>
            }
          >
            <Box sx={{ flexGrow: 1, pr: 4 }}>
              <Typography
                variant="subtitle1"
                component="div"
                sx={{ fontWeight: 500, mb: 0.5 }}
              >
                {item.name}
              </Typography>
              <Typography
                variant="body2"
                component="div"
                color="text.secondary"
                sx={{ mb: 1 }}
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
                    sx={{ mr: 0.5, mb: 0.5 }}
                  />
                ))}
              </Box>
            </Box>
          </ListItem>
        ))}
      </List>
    </ContentWrapper>
  )
}

export default ThemesContent
