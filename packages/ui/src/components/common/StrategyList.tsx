"use client"

import { Box, Typography, List, ListItem, Button, useTheme } from "../.."
import { SimpleCheckbox } from "./SimpleCheckbox"

export interface Strategy {
  value: string
  label: string
  description?: string
}

export interface StrategyListProps {
  strategies: Strategy[]
  visibleStrategies: Set<string>
  onStrategyHover?: (value: string) => void
  onStrategyLeave?: () => void
  onStrategyVisibilityChange: (strategyValue: string, checked: boolean) => void
  onRemoveStrategy: (strategyValue: string) => void
}

export function StrategyList({
  strategies,
  visibleStrategies,
  onStrategyHover,
  onStrategyLeave,
  onStrategyVisibilityChange,
  onRemoveStrategy,
}: StrategyListProps) {
  const theme = useTheme()

  const styles = {
    container: {
      paddingLeft: theme.spacing(2),
      mt: theme.spacing(6),
    },
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      pb: theme.spacing(1),
      borderBottom: theme.border.thin,
      mb: theme.spacing(1),
    },
    listItem: {
      px: 0,
      py: theme.spacing(0.5),
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      minHeight: theme.spacing(4),
      "&:hover": {
        backgroundColor: theme.palette.action.hover,
        "& .remove-button": {
          opacity: 1,
          visibility: "visible",
        },
      },
    },
    strategyLabel: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      minHeight: theme.spacing(3),
    },
    actionContainer: {
      display: "flex",
      alignItems: "center",
      minHeight: theme.spacing(3),
    },
    removeButtonContainer: {
      width: theme.spacing(3),
      height: theme.spacing(3),
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      mr: theme.spacing(15),
    },
    removeButton: {
      minWidth: theme.spacing(3),
      width: theme.spacing(3),
      height: theme.spacing(3),
      borderRadius: "50%",
      backgroundColor: theme.palette.grey[300],
      color: "white",
      p: 0,
      opacity: 0,
      visibility: "hidden",
      transition: "all 0.2s ease",
      boxShadow: "none",
      "&:hover": {
        backgroundColor: theme.palette.blue.bright,
        color: "white",
        boxShadow: "none",
      },
    },
    checkboxContainer: {
      mr: theme.spacing(1),
    },
  }

  if (strategies.length === 0) {
    return null
  }

  return (
    <Box sx={styles.container}>
      {/* Header row */}
      <Box sx={styles.header}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Strategy list
        </Typography>
        <Typography variant="subtitle2">Show</Typography>
      </Box>

      <List dense sx={{ pt: 0 }}>
        {strategies.map((strategy) => (
          <ListItem
            key={strategy.value}
            onMouseEnter={() => onStrategyHover?.(strategy.value)}
            onMouseLeave={onStrategyLeave}
            sx={styles.listItem}
          >
            <Box sx={styles.strategyLabel}>
              <Typography variant="body2" sx={{ lineHeight: 1.2 }}>
                {strategy.label}
              </Typography>
            </Box>
            <Box sx={styles.actionContainer}>
              <Box sx={styles.removeButtonContainer}>
                <Button
                  className="remove-button"
                  size="small"
                  onClick={() => onRemoveStrategy(strategy.value)}
                  sx={styles.removeButton}
                >
                  ×
                </Button>
              </Box>
              <Box sx={styles.checkboxContainer}>
                <SimpleCheckbox
                  checked={visibleStrategies.has(strategy.value)}
                  onChange={(checked) =>
                    onStrategyVisibilityChange(strategy.value, checked)
                  }
                  size={20}
                  checkedColor={theme.palette.blue.bright}
                  borderColor={
                    visibleStrategies.has(strategy.value)
                      ? theme.palette.blue.bright
                      : theme.palette.text.primary
                  }
                />
              </Box>
            </Box>
          </ListItem>
        ))}
      </List>
    </Box>
  )
}
