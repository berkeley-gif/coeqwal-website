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
import { useTranslation } from "@repo/i18n"

// Define type for nested options
interface OptionType {
  id: string
  label: string
  labelEs?: string
  titleEs?: string
  active?: boolean
  subtypes?: OptionType[]
}

// Define props for the SectionAccordion component
interface SectionAccordionProps {
  title: string
  titleEs?: string
  options: (OptionType | string)[]
  selectedOptions: string[]
  onOptionChange: (optionId: string, checked: boolean) => void
  section?: string // Optional section identifier
  noParentCheckbox?: string[] // Optional array of parent IDs that should not have checkboxes
  isOperations?: boolean // Whether this is the operations section
  noDirectionControls?: string[] // Optional array of option IDs that should not have direction controls
  isExpanded?: boolean // Controls whether the accordion is expanded
  onAccordionChange?: (isExpanded: boolean) => void // Called when expansion state changes
}

const SectionAccordion: React.FC<SectionAccordionProps> = ({
  title,
  titleEs,
  options,
  selectedOptions,
  onOptionChange,
  section,
  noParentCheckbox = [],
  isOperations = false,
  noDirectionControls = [],
  isExpanded,
  onAccordionChange,
}) => {
  const theme = useTheme()
  const { t, locale } = useTranslation()
  const {
    isInvalidCombination,
    getInvalidCombinationMessage,
    state: { swapped, operationDirections },
    handleOperationDirectionChange,
  } = useQuestionBuilderHelpers()

  // Helper function to get the translated label based on locale
  const getLocalizedLabel = (option: OptionType | string): string => {
    if (typeof option === "string") {
      return option
    }

    return locale === "es" && option.labelEs ? option.labelEs : option.label
  }

  // Helper function to get the translated title based on locale
  const getLocalizedTitle = (): string => {
    return locale === "es" && titleEs ? titleEs : title
  }

  // Check if all options in this section are inactive
  const allInactive = options.every(
    (option) => typeof option === "object" && option.active === false,
  )

  // Handle accordion expansion change
  const handleAccordionChange = (
    event: React.SyntheticEvent,
    expanded: boolean,
  ) => {
    if (onAccordionChange) {
      onAccordionChange(expanded)
    }
  }

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
    fontSize: theme.typography.subtitle1.fontSize,
  }

  // Arrow button styles
  const arrowButtonStyles = {
    padding: 0.25,
    marginRight: 0,
  }

  const activeArrowStyle = {
    color: theme.palette.pop.main,
    filter: "drop-shadow(0px 0px 2px rgba(255, 87, 51, 0.5))",
  }

  const inactiveArrowStyle = {
    color: "rgba(0, 0, 0, 0.26)",
  }

  // Calculate left padding to align with accordion title
  const checkboxLeftPadding = theme.spacing(1.5)

  // Function to render direction arrows for operations in swapped mode
  const renderDirectionControls = (
    optionId: string,
    option: OptionType | string,
    isActive: boolean = true,
  ) => {
    const isSelected = selectedOptions.includes(optionId)
    const currentDirection = operationDirections[optionId] || "increase"
    const optionLabel = getLocalizedLabel(option)

    return (
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <IconButton
          size="medium"
          onClick={() => {
            if (!isActive) return

            // If not selected, select it with increase direction
            if (!isSelected) {
              onOptionChange(optionId, true)
              handleOperationDirectionChange(optionId, "increase")
            }
            // If selected and already "increase", deselect it
            else if (currentDirection === "increase") {
              onOptionChange(optionId, false)
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
            opacity: isActive ? 1 : 0.5,
          }}
          disabled={!isActive}
        >
          <ArrowCircleUpIcon fontSize="medium" />
        </IconButton>

        <IconButton
          size="medium"
          onClick={() => {
            if (!isActive) return

            // If not selected, select it with decrease direction
            if (!isSelected) {
              onOptionChange(optionId, true)
              handleOperationDirectionChange(optionId, "decrease")
            }
            // If selected and already "decrease", deselect it
            else if (currentDirection === "decrease") {
              onOptionChange(optionId, false)
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
            opacity: isActive ? 1 : 0.5,
          }}
          disabled={!isActive}
        >
          <ArrowCircleDownIcon fontSize="medium" />
        </IconButton>

        <Typography
          variant="subtitle1"
          sx={{
            marginLeft: theme.spacing(1),
            color: isActive ? "text.primary" : "text.disabled",
            fontStyle: isActive ? "normal" : "italic",
          }}
        >
          {optionLabel}{" "}
          {!isActive && `(${t("questionBuilder.sectionAccordion.comingSoon")})`}
        </Typography>
      </Box>
    )
  }

  // Function to render a checkbox with potential tooltip
  const renderCheckbox = (
    optionId: string,
    option: OptionType | string,
    isActive: boolean = true,
    // isSubtype?: boolean,
  ) => {
    // If in swapped mode and this is operations section, show direction arrows
    // unless this option is in the noDirectionControls list
    if (swapped && isOperations && !noDirectionControls.includes(optionId)) {
      return renderDirectionControls(optionId, option, isActive)
    }

    const optionLabel = getLocalizedLabel(option)

    // Check if this option should be disabled
    const isDisabled =
      !isActive || (section ? isInvalidCombination(section, optionId) : false)

    const tooltipMessage = !isActive
      ? t("questionBuilder.sectionAccordion.comingSoon")
      : isDisabled
        ? getInvalidCombinationMessage(section || "", optionId)
        : ""

    const checkbox = (
      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={selectedOptions.includes(optionId)}
            onChange={(e) => onOptionChange(optionId, e.target.checked)}
            disabled={isDisabled}
            sx={{
              color: isActive
                ? theme.palette.text.primary
                : "rgba(0, 0, 0, 0.26)",
              "&.Mui-checked": {
                color: isActive
                  ? theme.palette.text.primary
                  : "rgba(0, 0, 0, 0.26)",
              },
              "&.Mui-disabled": {
                color: "rgba(0, 0, 0, 0.26)",
              },
            }}
          />
        }
        label={
          <Typography
            variant="subtitle1"
            sx={{
              color: isActive ? "text.primary" : "text.disabled",
              fontStyle: isActive ? "normal" : "italic",
            }}
          >
            {optionLabel}{" "}
            {!isActive &&
              `(${t("questionBuilder.sectionAccordion.comingSoon")})`}
          </Typography>
        }
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
    <Accordion
      sx={accordionStyles}
      expanded={isExpanded}
      onChange={handleAccordionChange}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls={`${title.toLowerCase().replace(/\s+/g, "-")}-content`}
        id={`${title.toLowerCase().replace(/\s+/g, "-")}-header`}
        sx={accordionSummaryStyles}
      >
        <Typography
          variant="subtitle1"
          sx={{
            color: allInactive ? "text.disabled" : "text.primary",
            fontWeight: "medium",
            fontStyle: allInactive ? "italic" : "normal",
          }}
        >
          {getLocalizedTitle()}{" "}
          {allInactive &&
            `(${t("questionBuilder.sectionAccordion.comingSoon")})`}
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={accordionDetailsStyles}>
        <Box
          component="ul"
          sx={{ listStyle: "none", pl: checkboxLeftPadding, m: 0 }}
        >
          {options.map((option, index) => {
            if (typeof option === "string") {
              // Handle legacy string options (assuming they're active)
              return (
                <Box component="li" key={index} sx={{ mb: 0.5 }}>
                  {renderCheckbox(option, option, true)}
                </Box>
              )
            } else {
              // Handle object options with active property
              const optionObj = option as OptionType
              const isActive = optionObj.active !== false // Default to true if not specified
              const hasSubtypes =
                optionObj.subtypes && optionObj.subtypes.length > 0
              const hideCheckbox = noParentCheckbox.includes(optionObj.id)

              return (
                <Box component="li" key={optionObj.id}>
                  {/* Parent option */}
                  <Box sx={{ mb: 0.5 }}>
                    {hideCheckbox ? (
                      <Typography
                        variant="subtitle1"
                        sx={{
                          ...parentLabelStyles,
                          ml: 0,
                          mb: 0.5,
                          color: isActive ? "text.primary" : "text.disabled",
                          fontStyle: isActive ? "normal" : "italic",
                        }}
                      >
                        {getLocalizedLabel(optionObj)}{" "}
                        {!isActive &&
                          `(${t("questionBuilder.sectionAccordion.comingSoon")})`}
                      </Typography>
                    ) : (
                      renderCheckbox(optionObj.id, optionObj, isActive)
                    )}
                  </Box>

                  {/* Subtypes - always shown when parent accordion is open */}
                  {hasSubtypes && (
                    <Box sx={nestedOptionStyles}>
                      {optionObj.subtypes?.map((subtype) => {
                        const isSubtypeActive =
                          subtype.active !== false && isActive
                        return (
                          <Box key={subtype.id} sx={{ mb: 0.5 }}>
                            {renderCheckbox(
                              subtype.id,
                              subtype,
                              isSubtypeActive,
                            )}
                          </Box>
                        )
                      })}
                    </Box>
                  )}
                </Box>
              )
            }
          })}
        </Box>
      </AccordionDetails>
    </Accordion>
  )
}

export default React.memo(SectionAccordion)
