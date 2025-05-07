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
    <ContentWrapper title="Learn About California Water" onClose={onClose}>
      <Typography variant="body1" sx={theme.mixins.drawerContent.contentText}>
        Explore these topics to learn more about California&apos;s water system
        and management.
      </Typography>

      <List sx={{ width: "100%", p: 0 }}>
        {learnTopics.map((topic, index) => (
          <ListItem
            key={index}
            component="div"
            sx={theme.mixins.drawerContent.itemBox}
          >
            <Box sx={{ display: "flex", alignItems: "flex-start" }}>
              <BookIcon sx={theme.mixins.drawerContent.icon} />
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
                  sx: theme.mixins.drawerContent.secondaryText,
                }}
              />
            </Box>
          </ListItem>
        ))}
      </List>

      <Box sx={theme.mixins.drawerContent.infoBox}>
        <Typography
          variant="subtitle2"
          sx={theme.mixins.drawerContent.headingText}
        >
          Why learn about water?
        </Typography>
        <Typography variant="body1" sx={theme.mixins.drawerContent.bodyText}>
          Understanding California&apos;s water system helps you make more
          informed choices when exploring water management scenarios.
        </Typography>
      </Box>
    </ContentWrapper>
  )
}

export default LearnContent
