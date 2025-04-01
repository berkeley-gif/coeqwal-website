"use client"

import React from "react"
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  FormControlLabel,
  Checkbox,
  useTheme,
  ExpandMoreIcon,
  Tooltip,
  IconButton,
  ArrowCircleUpIcon,
  ArrowCircleDownIcon,
} from "@repo/ui/mui"
import { useQuestionBuilderHelpers } from "../hooks/useQuestionBuilderHelpers"

// Define type for nested options
type OptionType =
  | string
  | {
      id: string
      label: string
      subtypes?: Array<{
        id: string
        label: string
      }>
    }

// Define props for the SectionAccordion component
interface SectionAccordionProps {
  title: string
  options: OptionType[]
  selectedOptions: string[]
  onOptionChange: (option: string, checked: boolean, subtype?: boolean) => void
  section?: string // Optional section identifier
  noParentCheckbox?: string[] // Optional array of parent IDs that should not have checkboxes
  isOperations?: boolean // Whether this is the operations section
  noDirectionControls?: string[] // Optional array of option IDs that should not have direction controls
}

const SectionAccordion: React.FC<SectionAccordionProps> = ({
  title,
  options,
  selectedOptions,
  onOptionChange,
  section,
  noParentCheckbox = [],
  isOperations = false,
  noDirectionControls = [],
}) => {
  const theme = useTheme()
  const {
    isInvalidCombination,
    getInvalidCombinationMessage,
    state: { swapped, operationDirections },
    handleOperationDirectionChange,
  } = useQuestionBuilderHelpers()

  // Styles for accordion components
  const accordionStyles = {
    mb: 1,
    "&:before": { display: "none" },
    boxShadow: "none",
    border: "1px solid rgba(0, 0, 0, 0.12)",
    borderRadius: `${theme.borderRadius.card}px !important`,
    overflow: "hidden",
    backgroundColor: theme.palette.common.white,
  }

  const accordionSummaryStyles = {
    padding: theme.spacing(1, 2),
    "& .MuiAccordionSummary-content": {
      margin: theme.spacing(0.5, 0),
    },
    backgroundColor: theme.palette.common.white,
  }

  const accordionDetailsStyles = {
    padding: theme.spacing(0, 2, 2, 2),
    backgroundColor: theme.palette.common.white,
    marginTop: "-0.4rem",
  }

  // Styles for nested options
  const nestedOptionStyles = {
    ml: 3,
    mt: 0.5,
  }

  // Label styles
  const parentLabelStyles = {
    fontWeight: "medium",
    fontSize: theme.typography.body2.fontSize,
  }

  // Arrow button styles
  const arrowButtonStyles = {
    padding: 0.25,
    marginRight: 0,
  }

  const activeArrowStyle = {
    color: theme.palette.pop.main,
    // Add a subtle glow effect
    filter: "drop-shadow(0px 0px 2px rgba(255, 87, 51, 0.5))",
  }

  const inactiveArrowStyle = {
    color: "rgba(0, 0, 0, 0.26)",
  }

  // Calculate left padding to align with accordion title
  // Account for expand icon width (24px) + some spacing
  const checkboxLeftPadding = theme.spacing(1.5)

  // Function to render direction arrows for operations in swapped mode
  const renderDirectionControls = (
    optionId: string,
    optionLabel: string,
    isSubtype?: boolean,
  ) => {
    const isSelected = selectedOptions.includes(optionId)
    const currentDirection = operationDirections[optionId] || "increase"

    return (
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <IconButton
          size="medium"
          onClick={() => {
            // If not selected, select it with increase direction
            if (!isSelected) {
              onOptionChange(optionId, true, isSubtype)
              handleOperationDirectionChange(optionId, "increase")
            }
            // If selected and already "increase", deselect it
            else if (currentDirection === "increase") {
              onOptionChange(optionId, false, isSubtype)
            }
            // If selected but not "increase", change direction to increase
            else {
              handleOperationDirectionChange(optionId, "increase")
            }
          }}
          sx={{
            ...arrowButtonStyles,
            ...(isSelected && currentDirection === "increase"
              ? activeArrowStyle
              : inactiveArrowStyle),
          }}
        >
          <ArrowCircleUpIcon fontSize="medium" />
        </IconButton>

        <IconButton
          size="medium"
          onClick={() => {
            // If not selected, select it with decrease direction
            if (!isSelected) {
              onOptionChange(optionId, true, isSubtype)
              handleOperationDirectionChange(optionId, "decrease")
            }
            // If selected and already "decrease", deselect it
            else if (currentDirection === "decrease") {
              onOptionChange(optionId, false, isSubtype)
            }
            // If selected but not "decrease", change direction to decrease
            else {
              handleOperationDirectionChange(optionId, "decrease")
            }
          }}
          sx={{
            ...arrowButtonStyles,
            ...(isSelected && currentDirection === "decrease"
              ? activeArrowStyle
              : inactiveArrowStyle),
          }}
        >
          <ArrowCircleDownIcon fontSize="medium" />
        </IconButton>

        <Typography variant="body2" sx={{ marginLeft: theme.spacing(1) }}>
          {optionLabel}
        </Typography>
      </Box>
    )
  }

  // Function to render a checkbox with potential tooltip
  const renderCheckbox = (
    optionId: string,
    optionLabel: string,
    isSubtype?: boolean,
  ) => {
    // If in swapped mode and this is outcomes section, show direction arrows
    // unless this option is in the noDirectionControls list
    if (swapped && isOperations && !noDirectionControls.includes(optionId)) {
      return renderDirectionControls(optionId, optionLabel, isSubtype)
    }

    // Check if this option should be disabled
    const isDisabled = section ? isInvalidCombination(section, optionId) : false

    const tooltipMessage = isDisabled
      ? getInvalidCombinationMessage(section || "", optionId)
      : ""

    const checkbox = (
      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={selectedOptions.includes(optionId)}
            onChange={(e) =>
              onOptionChange(optionId, e.target.checked, isSubtype)
            }
            disabled={isDisabled}
            sx={{
              color: theme.palette.text.primary,
              "&.Mui-checked": {
                color: theme.palette.text.primary,
              },
              "&.Mui-disabled": {
                color: "rgba(0, 0, 0, 0.26)",
              },
            }}
          />
        }
        label={<Typography variant="body2">{optionLabel}</Typography>}
        sx={{
          alignItems: "flex-start",
          "& .MuiCheckbox-root": {
            padding: theme.spacing(0.5),
            paddingTop: theme.spacing(0.75),
            marginRight: theme.spacing(1),
          },
        }}
      />
    )

    // Wrap with tooltip if disabled
    return isDisabled ? (
      <Tooltip title={tooltipMessage} arrow placement="right">
        <span>{checkbox}</span>
      </Tooltip>
    ) : (
      checkbox
    )
  }

  return (
    <Accordion sx={accordionStyles}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls={`${title.toLowerCase().replace(/\s+/g, "-")}-content`}
        id={`${title.toLowerCase().replace(/\s+/g, "-")}-header`}
        sx={accordionSummaryStyles}
      >
        <Typography variant="body2" sx={{ fontWeight: "medium" }}>
          {title}
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={accordionDetailsStyles}>
        <Box
          component="ul"
          sx={{ listStyle: "none", pl: checkboxLeftPadding, m: 0 }}
        >
          {options.map((option, index) => {
            // Handle string options (backwards compatibility)
            if (typeof option === "string") {
              return (
                <Box component="li" key={index} sx={{ mb: 0.5 }}>
                  {renderCheckbox(option, option)}
                </Box>
              )
            }

            // Handle object options with potential subtypes
            const optionObj = option as {
              id: string
              label: string
              subtypes?: Array<{
                id: string
                label: string
              }>
            }

            const hasSubtypes =
              optionObj.subtypes && optionObj.subtypes.length > 0
            const hideCheckbox = noParentCheckbox.includes(optionObj.id)

            return (
              <Box component="li" key={optionObj.id}>
                {/* Parent option */}
                <Box sx={{ mb: 0.5 }}>
                  {hideCheckbox ? (
                    <Typography
                      variant="body2"
                      sx={{
                        ...parentLabelStyles,
                        ml: 0, // Align with other options since we have padding on the ul
                        mb: 0.5,
                      }}
                    >
                      {optionObj.label}
                    </Typography>
                  ) : (
                    renderCheckbox(optionObj.id, optionObj.label)
                  )}
                </Box>

                {/* Subtypes - always shown when parent accordion is open */}
                {hasSubtypes && (
                  <Box sx={nestedOptionStyles}>
                    {optionObj.subtypes?.map((subtype) => (
                      <Box key={subtype.id} sx={{ mb: 0.5 }}>
                        {renderCheckbox(subtype.id, subtype.label, true)}
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            )
          })}
        </Box>
      </AccordionDetails>
    </Accordion>
  )
}

export default React.memo(SectionAccordion)
