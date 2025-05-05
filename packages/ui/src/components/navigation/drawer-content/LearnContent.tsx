"use client"

import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  useTheme,
} from "@mui/material"
import { ContentWrapper } from "./ContentWrapper"
import BookIcon from "@mui/icons-material/Book"

export interface LearnContentProps {
  /** Function called when the close button is clicked */
  onClose: () => void
  /** Selected section ID passed from the drawer store */
  selectedSection?: string
}

/**
 * Content component for the Learn tab in the MultiDrawer
 */
export function LearnContent({ onClose }: LearnContentProps) {
  const theme = useTheme()

  // Sample learn topics - replace with your actual topics
  const learnTopics = [
    {
      title: "How water moves through California",
      description:
        "An overview of the natural movement of water across the state.",
    },
    {
      title: "How water is managed in California",
      description:
        "Governance, policies, and institutions manage and route our water resources.",
    },
    {
      title: "CalSim",
      description: "Understanding the CalSim water modeling.",
    },
    {
      title: "Equity in California Water",
      description:
        "Exploring equitable access, distribution, and impacts of water in California.",
    },
  ]

  return (
    <ContentWrapper
      title="Learn About California Water"
      onClose={onClose}
      bgColor="rgb(128, 175, 196)" /* #80AFC4 */
    >
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 3, lineHeight: 1.4 }}
      >
        Explore these topics to learn more about California&apos;s water system
        and management.
      </Typography>

      <List sx={{ width: "100%", p: 0 }}>
        {learnTopics.map((topic, index) => (
          <ListItem
            key={index}
            component="div"
            sx={{
              mb: 1.5,
              p: 1.5,
              borderRadius: 1,
              bgcolor: "rgba(0, 0, 0, 0.02)",
              cursor: "pointer",
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: "rgba(0, 0, 0, 0.08)",
                transform: "translateX(4px)",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "flex-start" }}>
              <BookIcon
                sx={{
                  mr: 1.5,
                  mt: 0.5,
                  color: theme.palette.primary.main,
                  opacity: 0.7,
                }}
              />
              <ListItemText
                primary={
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 500, mb: 0.5 }}
                  >
                    {topic.title}
                  </Typography>
                }
                secondary={topic.description}
                secondaryTypographyProps={{
                  variant: "body1",
                  sx: { lineHeight: 1.4 },
                }}
              />
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
          Why learn about water?
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mt: 1, lineHeight: 1.4 }}
        >
          Understanding California&apos;s water system helps you make more
          informed choices when exploring water management scenarios.
        </Typography>
      </Box>
    </ContentWrapper>
  )
}

export default LearnContent
