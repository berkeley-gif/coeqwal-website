"use client"

import { Box, Typography, List, ListItem, useTheme } from "../.."
import { SectionHeader } from "./SectionHeader"

export interface StrategyDefinition {
  id: string
  label: string
  description: string
  iconPath: string
}

export interface StrategyDefinitionPanelProps {
  strategies: StrategyDefinition[]
  title?: string
}

export function StrategyDefinitionPanel({
  strategies,
  title = "Strategy",
}: StrategyDefinitionPanelProps) {
  const theme = useTheme()

  const styles = {
    list: {
      padding: 0,
      paddingLeft: theme.spacing(2), // Match SectionHeader indentation
    },
    listItem: {
      padding: 0,
      mb: theme.spacing(2),
      display: "flex",
      alignItems: "flex-start",
      gap: theme.spacing(2),
      cursor: "pointer",
      "&:hover": {
        "& .strategy-label": {
          color: theme.palette.blue.bright,
        },
      },
    },
    iconContainer: {
      width: "40px",
      height: "40px",
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      mt: theme.spacing(0.25),
    },
    content: {
      flex: 1,
    },
    label: {
      fontWeight: 500,
      lineHeight: 1.3,
      mb: theme.spacing(0.5),
    },
    description: {
      lineHeight: 1.4,
    },
  }

  return (
    <Box>
      <SectionHeader>{title}</SectionHeader>

      <List sx={styles.list}>
        {strategies.map((strategy) => (
          <ListItem key={strategy.id} sx={styles.listItem}>
            <Box sx={styles.iconContainer}>
              <img
                src={strategy.iconPath}
                alt=""
                style={{ width: "100%", height: "100%" }}
              />
            </Box>

            <Box sx={styles.content}>
              <Typography
                variant="body2"
                className="strategy-label"
                sx={styles.label}
              >
                {strategy.label}
              </Typography>
              <Typography variant="body2" sx={styles.description}>
                {strategy.description}
              </Typography>
            </Box>
          </ListItem>
        ))}
      </List>
    </Box>
  )
}
