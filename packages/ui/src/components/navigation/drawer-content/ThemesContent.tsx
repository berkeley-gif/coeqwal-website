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
      name: "Drought Resilience",
      description:
        "Operations focused on drought resilience and water conservation",
      favorite: true,
      tags: ["drought", "conservation"],
    },
    {
      id: "2",
      name: "Environmental Protection",
      description: "Prioritizing ecological health and environmental flows",
      favorite: false,
      tags: ["environment", "ecology"],
    },
    {
      id: "3",
      name: "Agricultural Support",
      description: "Optimized for agricultural deliveries and food production",
      favorite: true,
      tags: ["agriculture", "food"],
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
        Save and manage themed scenarios that you can reapply later.
      </Typography>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
          Your Themes
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          sx={{ textTransform: "none" }}
        >
          New Theme
        </Button>
      </Box>

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

      <Box
        sx={{ mt: 3, p: 2, bgcolor: "rgba(0, 0, 0, 0.03)", borderRadius: 1 }}
      >
        <Typography
          variant="subtitle2"
          color="primary"
          sx={{ fontWeight: "bold" }}
        >
          What are scenario themes?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Themes are saved configurations of multiple water operation settings
          that can be quickly applied. Create themes for specific management
          goals or conditions.
        </Typography>
      </Box>
    </ContentWrapper>
  )
}

export default ThemesContent
