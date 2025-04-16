"use client"

import React, { useMemo, ReactNode } from "react"
import { Typography, useTheme } from "@repo/ui/mui"
import { useQuestionBuilderHelpers } from "../hooks/useQuestionBuilderHelpers"
import { ColoredText } from "./ui"
import { useTranslation } from "@repo/i18n"

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

// QuestionSummary component props
interface QuestionSummaryProps {
  wasScrolled?: boolean // Keeping prop for backward compatibility but not using it
}

const QuestionSummary: React.FC<QuestionSummaryProps> = (
  {
    // wasScrolled is ignored
  },
) => {
  const theme = useTheme()
  const { t, locale } = useTranslation()
  const containerRef = React.useRef<HTMLDivElement>(null)
  const textRef = React.useRef<HTMLElement>(null)
  const [fontSize, setFontSize] = React.useState("4.8rem")
  const [isOverflowing, setIsOverflowing] = React.useState(false)

  const {
    state: {
      swapped,
      includeClimate,
      selectedClimate,
      selectedOperations,
      outcomesBySection,
      operationDirections,
    },
    getOperationShortText,
    shouldUseDo,
    formatOutcomeText,
  } = useQuestionBuilderHelpers()

  // Calculate font size based on number of selections
  const calculatedFontSize = useMemo(() => {
    // Count total selections
    const operationsCount = selectedOperations.length
    const outcomesCount = Object.values(outcomesBySection).reduce(
      (count, section) => count + (section ? section.length : 0),
      0,
    )

    const totalSelections = operationsCount + outcomesCount

    // Default large size
    if (totalSelections <= 1) return "4.8rem"

    // Medium size
    if (totalSelections <= 3) return "4.2rem"

    // Medium-small size
    if (totalSelections <= 5) return "3.6rem"

    // Small size
    if (totalSelections <= 7) return "3.2rem"

    // Extra small size
    return "2.8rem"
  }, [selectedOperations, outcomesBySection])

  // Expensive calculation for the summary text
  const summary = useMemo(() => {
    // TranslatedQuestion component to handle React elements in translations
    const TranslatedQuestion = ({
      translationKey,
      values,
    }: {
      translationKey: string
      values: Record<string, ReactNode>
    }) => {
      const template = t(translationKey)

      // Split the template on placeholder patterns
      const parts = template.split(/{{(.*?)}}/g)

      return (
        <>
          {parts.map((part, i) => {
            // Even indices are plain text, odd indices are placeholder keys
            if (i % 2 === 0) {
              return <React.Fragment key={`text-${i}`}>{part}</React.Fragment>
            } else {
              // Return the corresponding React node for the placeholder key
              return (
                <React.Fragment key={`placeholder-${i}`}>
                  {values[part] || ""}
                </React.Fragment>
              )
            }
          })}
        </>
      )
    }

    // OPERATIONS FORMATTING LOGIC

    // Helper function to generate operations part
    const getOperationsPart = () => {
      if (selectedOperations.length === 0) {
        return (
          <ColoredText color={theme.palette.pop.main}>
            {t("questionBuilder.defaultTerms.decisions")}
          </ColoredText>
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
            {getOperationShortText(op)}
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
            ? `conveyance tunnel (${conveyanceSubtypes[0]})`
            : `conveyance tunnel (${conveyanceSubtypes.join(", ")})`

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
          <ColoredText color={theme.palette.pop.main}>
            {t("questionBuilder.defaultTerms.decisions")}
          </ColoredText>
        )
      }

      // Join operations with "and"
      return formattedOperations.reduce((result, op, index) => {
        if (index === 0) return op

        // If this is the last item and there are more than 2 total items, use ", and"
        if (
          index === formattedOperations.length - 1 &&
          formattedOperations.length > 2
        ) {
          return (
            <>
              {result}, {t("questionBuilder.connectors.and")} {op}
            </>
          )
        }

        // If there are more than 2 items and this isn't the last one, use comma
        if (formattedOperations.length > 2) {
          return (
            <>
              {result}, {op}
            </>
          )
        }

        // Default case (2 items): use simple "and"
        return (
          <>
            {result} {t("questionBuilder.connectors.and")} {op}
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

        // If this is the last item and there are more than 2 total items, use ", and"
        if (
          index === formattedElements.length - 1 &&
          formattedElements.length > 2
        ) {
          return (
            <>
              {result}, {t("questionBuilder.connectors.and")} {element}
            </>
          )
        }

        // If there are more than 2 items and this isn't the last one, use comma
        if (formattedElements.length > 2) {
          return (
            <>
              {result}, {element}
            </>
          )
        }

        // Default case (2 items): use simple "and"
        return (
          <>
            {result} {t("questionBuilder.connectors.and")} {element}
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

        // If this is the last item and there are more than 2 total items, use ", and"
        if (
          index === formattedRegions.length - 1 &&
          formattedRegions.length > 2
        ) {
          return (
            <>
              {result}, {t("questionBuilder.connectors.and")} {region}
            </>
          )
        }

        // If there are more than 2 items and this isn't the last one, use comma
        if (formattedRegions.length > 2) {
          return (
            <>
              {result}, {region}
            </>
          )
        }

        // Default case (2 items): use simple "and"
        return (
          <>
            {result} {t("questionBuilder.connectors.and")} {region}
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
              {prev} {t("questionBuilder.connectors.and")} {curr}
            </>
          )
        })
      }

      // Add "and" prefix if there are other selections
      if (hasOtherSelections) {
        return (
          <>
            {t("questionBuilder.connectors.and")} {result}
          </>
        )
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
                  {t("questionBuilder.connectors.increase")}
                </ColoredText>{" "}
                {increaseTypeOutcomes[0]}
              </>
            )
          } else {
            increaseTypeGroup = (
              <>
                <ColoredText color={theme.palette.cool.main}>
                  {t("questionBuilder.connectors.increase")}
                </ColoredText>{" "}
                {increaseTypeOutcomes.reduce((prev, curr, idx) => (
                  <>
                    {prev}
                    {idx > 0 && idx === increaseTypeOutcomes.length - 1
                      ? ` ${t("questionBuilder.connectors.and")} `
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
                  {t("questionBuilder.connectors.decrease")}
                </ColoredText>{" "}
                {decreaseTypeOutcomes[0]}
              </>
            )
          } else {
            decreaseTypeGroup = (
              <>
                <ColoredText color={theme.palette.cool.main}>
                  {t("questionBuilder.connectors.decrease")}
                </ColoredText>{" "}
                {decreaseTypeOutcomes.reduce((prev, curr, idx) => (
                  <>
                    {prev}
                    {idx > 0 && idx === decreaseTypeOutcomes.length - 1
                      ? ` ${t("questionBuilder.connectors.and")} `
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
              {increaseTypeGroup} {t("questionBuilder.connectors.and")}{" "}
              {decreaseTypeGroup}
            </>
          )
        } else if (increaseTypeGroup) {
          typePart = increaseTypeGroup
        } else if (decreaseTypeGroup) {
          typePart = decreaseTypeGroup
        }

        // Combine the metric groups
        let metricPart = null
        if (increaseMetricOutcomes.length > 0) {
          if (increaseMetricOutcomes.length === 1) {
            metricPart = increaseMetricOutcomes[0]
          } else {
            metricPart = (
              <>
                {increaseMetricOutcomes.reduce((prev, curr, idx) => (
                  <>
                    {prev}
                    {idx > 0 && idx === increaseMetricOutcomes.length - 1
                      ? ` ${t("questionBuilder.connectors.and")} `
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
            decreaseMetricGroup = decreaseMetricOutcomes[0]
          } else {
            decreaseMetricGroup = (
              <>
                {decreaseMetricOutcomes.reduce((prev, curr, idx) => (
                  <>
                    {prev}
                    {idx > 0 && idx === decreaseMetricOutcomes.length - 1
                      ? ` ${t("questionBuilder.connectors.and")} `
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

        // Combine increase and decrease metric parts if both exist
        if (metricPart && decreaseMetricGroup) {
          metricPart = (
            <>
              {metricPart} {t("questionBuilder.connectors.and")}{" "}
              {decreaseMetricGroup}
            </>
          )
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
            <ColoredText color={theme.palette.cool.main}>
              {t("questionBuilder.defaultTerms.waterAvailability")}
            </ColoredText>
          )
        }

        // Join with " and " between sections (no "and" before region)
        return parts.reduce(
          (prev, curr, idx) => {
            // Don't add "and" before the region part (it always starts with "in")
            const needsConnector = idx > 0 && curr.type !== "region"

            // Last item with more than 2 parts (excluding region which doesn't need a connector)
            const isLastItem = idx === parts.length - 1
            const totalPartsWithConnectors = parts.filter(
              (p) => p.type !== "region",
            ).length
            const useCurlyAnd =
              isLastItem && totalPartsWithConnectors > 1 && needsConnector

            // If it's the region or first item, no connector needed
            if (!needsConnector) {
              return (
                <>
                  {prev} {curr.content}
                </>
              )
            }

            // If there are more than 2 parts needing connectors
            if (totalPartsWithConnectors > 2) {
              if (useCurlyAnd) {
                return (
                  <>
                    {prev}, {t("questionBuilder.connectors.and")} {curr.content}
                  </>
                )
              }
              return (
                <>
                  {prev}, {curr.content}
                </>
              )
            }

            // Default: use simple "and"
            return (
              <>
                {prev} {t("questionBuilder.connectors.and")} {curr.content}
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
        // First handle type and Delta outflow together
        if (formattedType || deltaOutflow) {
          if (formattedType && deltaOutflow) {
            result = (
              <>
                {formattedType} {t("questionBuilder.connectors.and")} {deltaOutflow}
              </>
            )
          } else if (formattedType) {
            result = formattedType
          } else {
            result = deltaOutflow
          }

          // Add region if present (regions always come after type+deltaOutflow)
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
            result = <>{t("questionBuilder.defaultTerms.outcomes")}</>
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

        // Default to "outcomes" if nothing is selected
        if (!result) {
          result = (
            <ColoredText color={theme.palette.cool.main}>
              {t("questionBuilder.defaultTerms.waterAvailability")}
            </ColoredText>
          )
        }

        return result
      }
    }

    const operationsPart = getOperationsPart()
    const outcomePart = getOutcomesPart()

    // Find the climate label for the selected climate ID
    const getClimateLabel = () => {
      // Use the translated label for the selected climate ID
      return t(`questionBuilder.climateSelector.options.${selectedClimate}`)
    }

    // Change question structure based on number of operations
    if (swapped) {
      // Determine if we need singular or plural form of "scenario"
      const scenarioText =
        selectedOperations.length === 1
          ? t("questionBuilder.scenarioSingular")
          : t("questionBuilder.scenarioPlural")
          
      // Check if any outcomes are selected
      const hasOutcomes = Object.values(outcomesBySection).some(
        section => section && section.length > 0
      )

      // Create inline custom component
      const createCustomSwappedFormat = () => {
        if (locale === 'es') {
          return (
            <>
              Para {outcomePart}, ¿qué {operationsPart} podríamos considerar?
            </>
          )
        } else {
          return (
            <>
              For {outcomePart}, which {operationsPart} could we consider?
            </>
          )
        }
      }

      // Use custom format if outcomes are selected, otherwise use translation
      if (hasOutcomes) {
        return createCustomSwappedFormat()
      }

      return (
        <TranslatedQuestion
          translationKey="questionBuilder.swappedFormat"
          values={{
            outcome: outcomePart,
            operation: operationsPart,
            scenarioText: scenarioText,
          }}
        />
      )
    } else {
      // Special case for Delta conveyance - always use "does" regardless of how many capacities
      const onlyDeltaConveyance =
        selectedOperations.every(
          (op) => op === "delta-conveyance" || op.startsWith("dct-"),
        ) && selectedOperations.some((op) => op.startsWith("dct-"))

      // Check if we need to add "a" before "Delta conveyance tunnel"
      const needsArticle = onlyDeltaConveyance

      // Use t function to determine correct verb based on plurality
      const verb = shouldUseDo()
        ? t("questionBuilder.pluralVerb")
        : t("questionBuilder.singularVerb")

      const formatString = includeClimate
        ? "questionBuilder.questionFormatWithClimate"
        : "questionBuilder.questionFormat"

      // Create the operation element with conditional article
      const operation = (
        <React.Fragment key="operation">
          {needsArticle && locale === "en" && "a "}
          {operationsPart}
        </React.Fragment>
      )

      // Create element for outcome with wrapped span for nowrap styling
      const outcome = <span key="outcome">{outcomePart}</span>

      // Create the climate element with green highlighting
      const climate = (
        <ColoredText color={theme.palette.climate.main}>
          {getClimateLabel()}
        </ColoredText>
      )

      return (
        <TranslatedQuestion
          translationKey={formatString}
          values={{
            verb,
            operation,
            outcome,
            climate,
          }}
        />
      )
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
    getOperationShortText,
    shouldUseDo,
    formatOutcomeText,
    t,
    locale,
  ])

  // Update font size based on text overflow using ResizeObserver
  React.useEffect(() => {
    if (!containerRef.current || !textRef.current) return

    // Create a function to check for overflow
    const checkForOverflow = () => {
      if (!containerRef.current || !textRef.current) return

      // Reset to maximum size to get true width measurement
      textRef.current.style.fontSize = "4.8rem"

      // Get measurements
      const containerWidth = containerRef.current.clientWidth - 60 // More padding buffer
      const textWidth = textRef.current.scrollWidth

      const currentlyOverflowing = textWidth > containerWidth
      setIsOverflowing(currentlyOverflowing)

      // If overflowing, calculate the right size
      if (currentlyOverflowing) {
        const ratio = containerWidth / textWidth
        // More conservative buffer for safety (0.9 instead of 0.95)
        const newSize = Math.max(2.2, 4.8 * ratio * 0.9)
        setFontSize(`${newSize}rem`)
      } else {
        // No overflow, use maximum size
        setFontSize("4.8rem")
      }
    }

    // Use ResizeObserver for more reliable size detection
    const resizeObserver = new ResizeObserver(() => {
      // Add a small delay to ensure DOM is ready
      setTimeout(checkForOverflow, 100) // Longer delay for more reliable measurements
    })

    // Observe both container and text element
    resizeObserver.observe(containerRef.current)
    resizeObserver.observe(textRef.current)

    // Run once immediately after mounting
    setTimeout(checkForOverflow, 100)

    // Also run again after a longer delay to ensure accurate measurements
    setTimeout(checkForOverflow, 500)

    // Clean up observer
    return () => {
      resizeObserver.disconnect()
    }
  }, [summary])

  // Container styles now use fixed values instead of conditional wasScrolled styles
  return (
    <div
      style={{
        backgroundColor: "transparent",
        width: "100%",
        position: "relative",
        zIndex: 1000,
        padding: 0,
        maxWidth: "none !important",
      }}
    >
      <Typography
        variant="h2"
        ref={textRef}
        sx={(theme) => ({
          mt: theme.spacing(4),
          mb: 0,
          lineHeight: theme.typography.h2.lineHeight,
          textAlign: "center",
          fontWeight: 500,
          width: "100%",
          margin: "0 auto",
          fontSize: calculatedFontSize, // Using the calculated font size
          backgroundColor: "white",
          paddingTop: "72px",
          paddingBottom: "32px",
          paddingLeft: "0",
          paddingRight: "0",
          boxShadow: "none",
          transition: "font-size 0.75s ease-in-out",
          maxWidth: "none !important",
        })}
      >
        {summary}
      </Typography>
    </div>
  )
}

export default QuestionSummary
