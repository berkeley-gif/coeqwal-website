"use client"

import React, { useMemo, useState } from "react"
import {
  Box,
  Typography,
  useTheme,
  TextField,
  Button,
  SearchIcon,
  MenuItem,
} from "@repo/ui/mui"
import { Card } from "@repo/ui"
import { useQuestionBuilderHelpers } from "../hooks/useQuestionBuilderHelpers"
import { ColoredText } from "./ui"

// TODO: define formatting rules as a configuration object
// const FORMATTING_RULES = {
//   typePrepositions: {
//     deliveries: "to",
//     flows: "to",
//     storage: "for",
//     groundwater levels: "for",
//   },
//   properNouns: [
//     "California",
//     "Delta",
//     "Sacramento",
//     "San Joaquin",
//     "Central Valley",
//     "Bay Area",
//     "Northern",
//     "Southern",
//     "Eastern",
//     "Western",
//   ],
//   specialCases: {
//     "The Delta": "the Delta",
//     "All regions": "all regions",
//   },
// }

// Check if a text is a Delta outflow type
const isDeltaOutflow = (text: string) =>
  text.toLowerCase().includes("delta outflow")

const QuestionSummary: React.FC = () => {
  const theme = useTheme()
  const {
    state: {
      swapped,
      includeClimate,
      selectedClimate,
      selectedOperations,
      outcomesBySection,
      operationDirections,
    },
    formatOperationText,
    formatOutcomeText,
  } = useQuestionBuilderHelpers()

  // State for dropdown menus
  const [sortBy, setSort] = useState("lorem")
  const [chartType, setChartType] = useState("sed")
  // State to track if filters are shown or hidden
  const [showFilters, setShowFilters] = useState(false)

  // Function to toggle filters visibility
  const toggleFilters = () => {
    setShowFilters(!showFilters)
  }

  // Expensive calculation?
  const summary = useMemo(() => {
    // OPERATIONS FORMATTING LOGIC

    // Helper function to generate operations part
    const getOperationsPart = () => {
      if (selectedOperations.length === 0) {
        return (
          <ColoredText color={theme.palette.pop.main}>operations</ColoredText>
        )
      }

      // Group related subtypes together
      const flowReqSubtypes: string[] = []
      const conveyanceSubtypes: string[] = []
      const regularOptions: string[] = []

      // Categorize operations
      selectedOperations.forEach((op) => {
        if (op.startsWith("sjr-flow-reqs") || op.startsWith("sac-flow-reqs")) {
          // Extract the river name (e.g., "San Joaquin River" from "sjr-flow-reqs")
          const river = op.startsWith("sjr-")
            ? "San Joaquin River"
            : "Sacramento River"
          flowReqSubtypes.push(river)
        } else if (op.startsWith("dct-")) {
          // Extract the cfs value (e.g., "3000cfs" from "dct-3000cfs")
          const cfs = op.replace("dct-", "")
          conveyanceSubtypes.push(cfs)
        } else if (op !== "removing-flow-reqs" && op !== "delta-conveyance") {
          // Skip parent options if subtypes are selected
          regularOptions.push(op)
        }
      })

      // Check if parent option is selected but no subtypes are selected
      if (
        selectedOperations.includes("removing-flow-reqs") &&
        flowReqSubtypes.length === 0
      ) {
        regularOptions.push("removing-flow-reqs")
      }

      // Format each type of operation
      const formattedOperations: React.ReactNode[] = []

      // Regular operations don't need direction indicators - these come from outcome directions

      // Handle regular operations
      regularOptions.forEach((op) => {
        formattedOperations.push(
          <ColoredText key={op} color={theme.palette.pop.main}>
            {formatOperationText(op)}
          </ColoredText>,
        )
      })

      // Handle flow requirement subtypes
      if (flowReqSubtypes.length > 0) {
        const flowText =
          flowReqSubtypes.length === 1
            ? `removing ${flowReqSubtypes[0]} tributary flow requirements`
            : `removing ${flowReqSubtypes.join(" and ")} tributary flow requirements`

        formattedOperations.push(
          <ColoredText key="flow-reqs" color={theme.palette.pop.main}>
            {flowText}
          </ColoredText>,
        )
      }

      // Handle conveyance subtypes
      if (conveyanceSubtypes.length > 0) {
        const conveyanceText =
          conveyanceSubtypes.length === 1
            ? `Delta conveyance tunnel operating at ${conveyanceSubtypes[0]}`
            : `Delta conveyance tunnel operating at ${conveyanceSubtypes.join(" and ")}`

        formattedOperations.push(
          <ColoredText key="conveyance" color={theme.palette.pop.main}>
            {conveyanceText}
          </ColoredText>,
        )
      }

      // If exactly one operation, return it directly
      if (formattedOperations.length === 1) {
        return formattedOperations[0]
      }

      // Handle empty array case to prevent reduce error
      if (formattedOperations.length === 0) {
        return (
          <ColoredText color={theme.palette.pop.main}>operations</ColoredText>
        )
      }

      // Join operations with "and"
      return formattedOperations.reduce((result, op, index) => {
        if (index === 0) return op
        return (
          <>
            {result} and {op}
          </>
        )
      })
    }

    // OUTCOMES FORMATTING LOGIC - NEW IMPLEMENTATION

    // Helper function to create colored text elements
    const createColoredText = (text: string) => {
      return <ColoredText color={theme.palette.cool.main}>{text}</ColoredText>
    }

    // Format type selections - handle colored text and join with "and"
    const formatTypeSection = (typeSelections: string[]) => {
      // Filter out Delta outflow (handled separately)
      const filteredTypes = typeSelections.filter((t) => !isDeltaOutflow(t))

      if (filteredTypes.length === 0) return null

      // Create groups for regular types and delivery subtypes
      const regularTypes: string[] = []
      const deliverySubtypes: string[] = []

      // Categorize selections
      filteredTypes.forEach((type) => {
        if (type.endsWith("-deliveries")) {
          const parts = type.split("-")
          if (parts.length > 0 && parts[0]) {
            deliverySubtypes.push(parts[0])
          }
        } else {
          // Keep all other types including "deliveries" parent
          regularTypes.push(type)
        }
      })

      // Create formatted elements for each type
      const formattedElements: React.ReactNode[] = []

      // Handle regular types
      regularTypes.forEach((type) => {
        formattedElements.push(
          createColoredText(formatOutcomeText(type, "type")),
        )
      })

      // Handle delivery subtypes
      if (deliverySubtypes.length > 0) {
        // Get a safe list of subtypes (handling any potential undefined values)
        const safeSubtypes = deliverySubtypes.filter(Boolean)

        if (safeSubtypes.length > 0) {
          // Format subtypes text (e.g., "agricultural" or "agricultural and municipal")
          const subtypesText =
            safeSubtypes.length === 1
              ? safeSubtypes[0]
              : safeSubtypes.join(" and ")

          // Create the complete text (e.g., "agricultural deliveries")
          // For deliveries subtypes, use the first subtype for direction indicator
          formattedElements.push(
            createColoredText(`${subtypesText} deliveries`),
          )
        }
      }

      // Join all elements with "and"
      if (formattedElements.length === 0) {
        return null
      } else if (formattedElements.length === 1) {
        return formattedElements[0]
      }

      return formattedElements.reduce((result, element, index) => {
        if (index === 0) return element
        return (
          <>
            {result} and {element}
          </>
        )
      })
    }

    // Extract and format Delta outflow separately
    const formatDeltaOutflow = (typeSelections: string[]) => {
      const deltaOutflow = typeSelections.find((t) => isDeltaOutflow(t))
      if (!deltaOutflow) return null

      return createColoredText(formatOutcomeText(deltaOutflow, "type"))
    }

    // Format region selections - prefix with "in" and join with "and"
    const formatRegionSection = (regionSelections: string[]) => {
      if (regionSelections.length === 0) return null

      // Create elements with "in" prefix
      const formattedRegions = regionSelections.map((region) => {
        const text = formatOutcomeText(region, "region")

        // Check if this region should have "the" prefix
        const needsThePrefix =
          region === "Sacramento Valley" ||
          region === "Delta" ||
          region === "San Joaquin Valley"

        return (
          <>
            in{" "}
            <ColoredText color={theme.palette.cool.main}>
              {needsThePrefix ? "the " : ""}
              {text.slice(3)}{" "}
              {/* Remove "in " prefix since we add it explicitly */}
            </ColoredText>
          </>
        )
      })

      // Join with "and"
      if (formattedRegions.length === 1) return formattedRegions[0]

      return formattedRegions.reduce((result, region, index) => {
        if (index === 0) return region
        return (
          <>
            {result} and {region}
          </>
        )
      })
    }

    // Format metric selections - prefix with "and" if there are other selections
    const formatMetricSection = (
      metricSelections: string[],
      hasOtherSelections: boolean,
    ) => {
      if (metricSelections.length === 0) return null

      // Create colored text elements
      const formattedMetrics = metricSelections.map((metric) =>
        createColoredText(formatOutcomeText(metric, "metric")),
      )

      // Join with "and"
      let result
      if (formattedMetrics.length === 1) {
        result = formattedMetrics[0]
      } else {
        result = formattedMetrics.reduce((prev, curr, index) => {
          if (index === 0) return prev
          return (
            <>
              {prev} and {curr}
            </>
          )
        })
      }

      // Add "and" prefix if there are other selections
      if (hasOtherSelections) {
        return <>and {result}</>
      }

      return result
    }

    // Combine all sections into a coherent outcome text
    const getOutcomesPart = () => {
      // Extract selections by section
      const typeSelections = outcomesBySection.type || []
      const regionSelections = outcomesBySection.region || []
      const metricSelections = outcomesBySection.metric || []

      // In swapped mode, we'll regions separately and group types and metrics by direction
      if (swapped) {
        // Process regions first - these don't have directions
        let regionPart = null
        if (regionSelections.length > 0) {
          const formattedRegions = regionSelections.map((region) => {
            const text = formatOutcomeText(region, "region")
            const needsThePrefix =
              region === "Sacramento Valley" ||
              region === "Delta" ||
              region === "San Joaquin Valley"

            return (
              <ColoredText key={region} color={theme.palette.cool.main}>
                {needsThePrefix ? "the " : ""}
                {text.slice(3)}
              </ColoredText>
            )
          })

          // Join regions with commas and "and"
          if (formattedRegions.length === 1) {
            regionPart = formattedRegions[0]
          } else {
            regionPart = formattedRegions.reduce((prev, curr, idx) => (
              <>
                {prev}
                {idx > 0 && idx === formattedRegions.length - 1
                  ? " and "
                  : idx > 0
                    ? ", "
                    : ""}
                {curr}
              </>
            ))
          }

          // Add "in" prefix
          regionPart = <>in {regionPart}</>
        }

        // Create groups for increase and decrease for type outcomes
        const increaseTypeOutcomes: React.ReactNode[] = []
        const decreaseTypeOutcomes: React.ReactNode[] = []

        // Process type selections
        typeSelections.forEach((type) => {
          // Skip delivery subtypes and Delta outflow - they're handled separately
          if (isDeltaOutflow(type) || type.endsWith("-deliveries")) return

          // Get formatted text without direction
          const formattedText = formatOutcomeText(type, "type")

          // Add to the appropriate group based on direction
          if (type in operationDirections) {
            if (operationDirections[type] === "increase") {
              increaseTypeOutcomes.push(
                <ColoredText
                  key={`inc-${type}`}
                  color={theme.palette.cool.main}
                >
                  {formattedText}
                </ColoredText>,
              )
            } else {
              decreaseTypeOutcomes.push(
                <ColoredText
                  key={`dec-${type}`}
                  color={theme.palette.cool.main}
                >
                  {formattedText}
                </ColoredText>,
              )
            }
          }
        })

        // Process delivery subtypes
        const deliverySubtypes = typeSelections.filter((t) =>
          t.endsWith("-deliveries"),
        )

        // Group delivery subtypes by type (agricultural, municipal, etc.)
        const subtypesByPrefix: Record<string, string> = {}

        // Process each delivery subtype
        deliverySubtypes.forEach((type) => {
          const parts = type.split("-")
          if (parts.length > 0 && parts[0]) {
            const prefix = parts[0] // e.g., "agricultural"
            subtypesByPrefix[prefix] = type // Store the full ID for direction lookup
          }
        })

        // Add each prefix with its formatted text to the appropriate group
        Object.entries(subtypesByPrefix).forEach(([prefix, fullId]) => {
          const subtypeText = `${prefix} deliveries`

          // Add to the appropriate group based on direction
          if (fullId in operationDirections) {
            if (operationDirections[fullId] === "increase") {
              increaseTypeOutcomes.push(
                <ColoredText
                  key={`inc-${fullId}`}
                  color={theme.palette.cool.main}
                >
                  {subtypeText}
                </ColoredText>,
              )
            } else {
              decreaseTypeOutcomes.push(
                <ColoredText
                  key={`dec-${fullId}`}
                  color={theme.palette.cool.main}
                >
                  {subtypeText}
                </ColoredText>,
              )
            }
          }
        })

        // Process Delta outflow separately
        const deltaOutflow = typeSelections.find((t) => isDeltaOutflow(t))
        if (deltaOutflow) {
          const formattedText = formatOutcomeText(deltaOutflow, "type")

          if (deltaOutflow in operationDirections) {
            if (operationDirections[deltaOutflow] === "increase") {
              increaseTypeOutcomes.push(
                <ColoredText key={`inc-delta`} color={theme.palette.cool.main}>
                  {formattedText}
                </ColoredText>,
              )
            } else {
              decreaseTypeOutcomes.push(
                <ColoredText key={`dec-delta`} color={theme.palette.cool.main}>
                  {formattedText}
                </ColoredText>,
              )
            }
          }
        }

        // Create groups for increase and decrease for metric outcomes
        const increaseMetricOutcomes: React.ReactNode[] = []
        const decreaseMetricOutcomes: React.ReactNode[] = []

        // Process metric selections
        metricSelections.forEach((metric) => {
          const formattedText = formatOutcomeText(metric, "metric")

          if (metric in operationDirections) {
            if (operationDirections[metric] === "increase") {
              increaseMetricOutcomes.push(
                <ColoredText
                  key={`inc-${metric}`}
                  color={theme.palette.cool.main}
                >
                  {formattedText}
                </ColoredText>,
              )
            } else {
              decreaseMetricOutcomes.push(
                <ColoredText
                  key={`dec-${metric}`}
                  color={theme.palette.cool.main}
                >
                  {formattedText}
                </ColoredText>,
              )
            }
          }
        })

        // Format the increase type group
        let increaseTypeGroup = null
        if (increaseTypeOutcomes.length > 0) {
          if (increaseTypeOutcomes.length === 1) {
            increaseTypeGroup = (
              <>
                <ColoredText color={theme.palette.cool.main}>
                  increase
                </ColoredText>{" "}
                {increaseTypeOutcomes[0]}
              </>
            )
          } else {
            increaseTypeGroup = (
              <>
                <ColoredText color={theme.palette.cool.main}>
                  increase
                </ColoredText>{" "}
                {increaseTypeOutcomes.reduce((prev, curr, idx) => (
                  <>
                    {prev}
                    {idx > 0 && idx === increaseTypeOutcomes.length - 1
                      ? " and "
                      : idx > 0
                        ? ", "
                        : ""}
                    {curr}
                  </>
                ))}
              </>
            )
          }
        }

        // Format the decrease type group
        let decreaseTypeGroup = null
        if (decreaseTypeOutcomes.length > 0) {
          if (decreaseTypeOutcomes.length === 1) {
            decreaseTypeGroup = (
              <>
                <ColoredText color={theme.palette.cool.main}>
                  decrease
                </ColoredText>{" "}
                {decreaseTypeOutcomes[0]}
              </>
            )
          } else {
            decreaseTypeGroup = (
              <>
                <ColoredText color={theme.palette.cool.main}>
                  decrease
                </ColoredText>{" "}
                {decreaseTypeOutcomes.reduce((prev, curr, idx) => (
                  <>
                    {prev}
                    {idx > 0 && idx === decreaseTypeOutcomes.length - 1
                      ? " and "
                      : idx > 0
                        ? ", "
                        : ""}
                    {curr}
                  </>
                ))}
              </>
            )
          }
        }

        // Format the increase metric group
        let increaseMetricGroup = null
        if (increaseMetricOutcomes.length > 0) {
          if (increaseMetricOutcomes.length === 1) {
            increaseMetricGroup = (
              <>
                <ColoredText color={theme.palette.cool.main}>
                  increase
                </ColoredText>{" "}
                {increaseMetricOutcomes[0]}
              </>
            )
          } else {
            increaseMetricGroup = (
              <>
                <ColoredText color={theme.palette.cool.main}>
                  increase
                </ColoredText>{" "}
                {increaseMetricOutcomes.reduce((prev, curr, idx) => (
                  <>
                    {prev}
                    {idx > 0 && idx === increaseMetricOutcomes.length - 1
                      ? " and "
                      : idx > 0
                        ? ", "
                        : ""}
                    {curr}
                  </>
                ))}
              </>
            )
          }
        }

        // Format the decrease metric group
        let decreaseMetricGroup = null
        if (decreaseMetricOutcomes.length > 0) {
          if (decreaseMetricOutcomes.length === 1) {
            decreaseMetricGroup = (
              <>
                <ColoredText color={theme.palette.cool.main}>
                  decrease
                </ColoredText>{" "}
                {decreaseMetricOutcomes[0]}
              </>
            )
          } else {
            decreaseMetricGroup = (
              <>
                <ColoredText color={theme.palette.cool.main}>
                  decrease
                </ColoredText>{" "}
                {decreaseMetricOutcomes.reduce((prev, curr, idx) => (
                  <>
                    {prev}
                    {idx > 0 && idx === decreaseMetricOutcomes.length - 1
                      ? " and "
                      : idx > 0
                        ? ", "
                        : ""}
                    {curr}
                  </>
                ))}
              </>
            )
          }
        }

        // Combine the type groups
        let typePart = null
        if (increaseTypeGroup && decreaseTypeGroup) {
          typePart = (
            <>
              {increaseTypeGroup} and {decreaseTypeGroup}
            </>
          )
        } else if (increaseTypeGroup) {
          typePart = increaseTypeGroup
        } else if (decreaseTypeGroup) {
          typePart = decreaseTypeGroup
        }

        // Combine the metric groups
        let metricPart = null
        if (increaseMetricGroup && decreaseMetricGroup) {
          metricPart = (
            <>
              {increaseMetricGroup} and {decreaseMetricGroup}
            </>
          )
        } else if (increaseMetricGroup) {
          metricPart = increaseMetricGroup
        } else if (decreaseMetricGroup) {
          metricPart = decreaseMetricGroup
        }

        // Now build the final summary combining all three sections
        interface SummaryPart {
          content: React.ReactNode
          type: "type" | "region" | "metric"
        }

        const parts: SummaryPart[] = []

        // Add non-empty sections only with metadata
        if (typePart) parts.push({ content: typePart, type: "type" })
        if (regionPart) parts.push({ content: regionPart, type: "region" })
        if (metricPart) parts.push({ content: metricPart, type: "metric" })

        // If no selections, show default
        if (parts.length === 0) {
          return (
            <>
              change{" "}
              <ColoredText color={theme.palette.cool.main}>
                outcomes
              </ColoredText>
            </>
          )
        }

        // Join with " and " between sections (no "and" before region)
        return parts.reduce(
          (prev, curr, idx) => {
            // Don't add "and" before the region part (it already has "in" which flows naturally)
            const needsAnd = idx > 0 && curr.type !== "region"
            return (
              <>
                {prev}
                {needsAnd ? " and " : " "}
                {curr.content}
              </>
            )
          },
          <></>,
        )
      } else {
        // Standard mode - non-swapped
        // Proceed with original formatting logic

        // Format each section
        const formattedType = formatTypeSection(typeSelections)
        const formattedRegion = formatRegionSection(regionSelections)
        const deltaOutflow = formatDeltaOutflow(typeSelections)

        // Determine if we have any non-metric selections
        const hasNonMetricSelections = Boolean(formattedType || formattedRegion)

        // Format metrics (with "and" prefix if other selections exist)
        const formattedMetric = formatMetricSection(
          metricSelections,
          hasNonMetricSelections,
        )

        // Start combining the sections
        let result = null

        // Build result based on which sections are present
        if (formattedType) {
          result = formattedType

          // Add region if present
          if (formattedRegion) {
            result = (
              <>
                {result} {formattedRegion}
              </>
            )
          }
        } else if (formattedRegion) {
          // Start with region if no type
          if (metricSelections.length === 0) {
            // Add "outcomes" prefix if no metrics
            result = (
              <>
                <ColoredText color={theme.palette.cool.main}>
                  outcomes
                </ColoredText>{" "}
                {formattedRegion}
              </>
            )
          } else {
            result = formattedRegion
          }
        }

        // Add metrics if present
        if (formattedMetric) {
          if (result) {
            result = (
              <>
                {result} {formattedMetric}
              </>
            )
          } else {
            result = formattedMetric
          }
        }

        // Add Delta outflow at the end if it exists
        if (deltaOutflow) {
          if (result) {
            result = (
              <>
                {result} and {deltaOutflow}
              </>
            )
          } else {
            result = deltaOutflow
          }
        }

        // Default to "outcomes" if nothing is selected
        if (!result) {
          result = swapped ? (
            <ColoredText color={theme.palette.cool.main}>outcomes</ColoredText>
          ) : (
            <ColoredText color={theme.palette.cool.main}>outcomes</ColoredText>
          )
        }

        return result
      }
    }

    const operationsPart = getOperationsPart()
    const outcomePart = getOutcomesPart()

    const climatePart = includeClimate ? (
      <>
        {" "}
        under{" "}
        <ColoredText color={theme.palette.climate.main}>
          {selectedClimate}
        </ColoredText>
      </>
    ) : (
      ""
    )

    // Change question structure based on number of operations
    if (swapped) {
      // Determine if we need singular or plural form of "scenario"
      const scenarioText =
        selectedOperations.length === 1 ? "scenario" : "scenarios"

      return (
        <>
          To {outcomePart}, which {operationsPart} {scenarioText} could we
          consider{climatePart}?
        </>
      )
    } else {
      // Special case for Delta conveyance - always use "does" regardless of how many capacities
      const onlyDeltaConveyance =
        selectedOperations.every(
          (op) => op === "delta-conveyance" || op.startsWith("dct-"),
        ) && selectedOperations.some((op) => op.startsWith("dct-"))

      // Check if we need to add "a" before "Delta conveyance tunnel"
      const needsArticle = onlyDeltaConveyance

      // Use "does" if only one operation or if it's only Delta conveyance (any number of capacities)
      if (selectedOperations.length === 1 || onlyDeltaConveyance) {
        return (
          <>
            How does {needsArticle ? "a " : ""}
            {operationsPart} affect {outcomePart}
            {climatePart}?
          </>
        )
      } else if (selectedOperations.length > 1) {
        // Multiple operations
        return (
          <>
            How do {operationsPart} affect {outcomePart}
            {climatePart}?
          </>
        )
      } else {
        // No operations selected
        return (
          <>
            How do changes in {operationsPart} affect {outcomePart}
            {climatePart}?
          </>
        )
      }
    }
  }, [
    swapped,
    includeClimate,
    selectedClimate,
    selectedOperations,
    outcomesBySection,
    operationDirections,
    theme.palette.cool.main,
    theme.palette.pop.main,
    theme.palette.climate.main,
    formatOperationText,
    formatOutcomeText,
  ])

  // Container styles
  const containerStyles = {
    p: theme.spacing(2),
    position: "sticky",
    top: 0,
    zIndex: 1000,
    backgroundColor: theme.palette.common.white,
    borderBottom: `1px solid ${theme.palette.divider}`,
    width: "100%",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  }

  // Handle dropdown changes
  const handleSortChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSort(event.target.value)
  }

  const handleChartTypeChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setChartType(event.target.value)
  }

  // Handler for search button click - show filters and scroll to results
  const handleSearchClick = () => {
    // Toggle filters
    toggleFilters()

    // Get the scenario results element
    const element = document.getElementById("scenario-results")
    if (element) {
      // Use smooth scrolling
      // Increase offset to account for sticky header + QuestionSummary height
      const headerOffset = 280
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.scrollY - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      })
    }
  }

  // Sort options
  const sortOptions = [
    { value: "lorem", label: "Lorem ipsum" },
    { value: "dolor", label: "Dolor sit amet" },
    { value: "consectetur", label: "Consectetur adipiscing" },
    { value: "adipiscing", label: "Adipiscing elit" },
    { value: "eiusmod", label: "Eiusmod tempor" },
  ]

  // Chart type options
  const chartTypeOptions = [
    { value: "sed", label: "Sed do eiusmod" },
    { value: "tempor", label: "Tempor incididunt" },
    { value: "labore", label: "Labore et dolore" },
    { value: "magna", label: "Magna aliqua" },
    { value: "ut-enim", label: "Ut enim ad minim" },
    { value: "veniam", label: "Veniam quis nostrud" },
  ]

  return (
    <Box sx={containerStyles}>
      <Typography variant="h2" mt={8} mb={4}>
        {summary}
      </Typography>

      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        {!showFilters ? (
          // Pill-shaped search button when filters are hidden
          <Card sx={{ width: "auto" }}>
            <Button
              variant="contained"
              disableElevation
              onClick={handleSearchClick}
              startIcon={<SearchIcon />}
            >
              Search
            </Button>
          </Card>
        ) : (
          // Dropdown menus when filters are shown
          <Card sx={{ width: "auto" }}>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                alignItems: "center",
              }}
            >
              <TextField
                select
                label="Sort scenarios by"
                value={sortBy}
                onChange={handleSortChange}
                variant="outlined"
                size="small"
                sx={{
                  minWidth: 180,
                  backgroundColor: theme.palette.common.white,
                }}
              >
                {sortOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Chart type:"
                value={chartType}
                onChange={handleChartTypeChange}
                variant="outlined"
                size="small"
                sx={{
                  minWidth: 180,
                  backgroundColor: theme.palette.common.white,
                }}
              >
                {chartTypeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              <Button variant="outlined" size="small" onClick={toggleFilters}>
                Hide
              </Button>
            </Box>
          </Card>
        )}
      </Box>
    </Box>
  )
}

export default React.memo(QuestionSummary)
