"use client"

import React, { useMemo, ReactNode } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { useQuestionBuilderHelpers } from "../hooks/useQuestionBuilderHelpers"
import { ColoredText } from "./ui"
import { useTranslation } from "@repo/i18n"
import { OPERATION_CARDS } from "./OperationsSelector"

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

// Check if a text is a Delta salinity type
const isDeltaSalinity = (text: string) =>
  text.toLowerCase().includes("delta salinity")

// Helper to check if a text is either Delta outflow or Delta salinity
const isDeltaOutcomeType = (text: string) =>
  isDeltaOutflow(text) || isDeltaSalinity(text)

// QuestionSummary component props
interface QuestionSummaryProps {
  wasScrolled?: boolean // Keeping prop for backward compatibility but not using it
}

// Define the expected operation card structure for type checking
interface OpCard {
  id: string;
  title: string;
  term: string;
  switchedTerm?: string;
  bullet: { color: string; size: number };
  titleColor: string;
  isSingular: boolean;
  subOptions: {
    id: string;
    label: string;
    term: string;
    switchedTerm?: string;
    isSingular: boolean;
  }[];
}

const QuestionSummary: React.FC<QuestionSummaryProps> = () => {
  const theme = useTheme()
  const { t, locale } = useTranslation()
  const textRef = React.useRef<HTMLElement>(null)

  const {
    state: {
      swapped,
      includeClimate,
      selectedClimate,
      selectedOperations,
      outcomesBySection,
      operationDirections,
      isExploratoryMode,
    },
    shouldUseDo,
    formatOutcomeText,
  } = useQuestionBuilderHelpers()

  // Calculate font size based on number of selections and exploratory mode
  // const calculatedFontSize = useMemo(() => {
  //   // If in exploratory mode, use smaller font
  //   if (isExploratoryMode) {
  //     return "2.2rem" // Smaller text for exploratory mode
  //   }

  //   // Count total selections
  //   const operationsCount = selectedOperations.length
  //   const outcomesCount = Object.values(outcomesBySection).reduce(
  //     (count, section) => count + (section ? section.length : 0),
  //     0,
  //   )

  //   const totalSelections = operationsCount + outcomesCount

  //   // Default large size
  //   if (totalSelections <= 1) return "4.8rem"

  //   // Medium size
  //   if (totalSelections <= 3) return "4.2rem"

  //   // Medium-small size
  //   if (totalSelections <= 5) return "3.6rem"

  //   // Small size
  //   if (totalSelections <= 7) return "3.2rem"

  //   // Extra small size
  //   return "2.8rem"
  // }, [selectedOperations, outcomesBySection, isExploratoryMode])

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

      // Get all operation cards for term lookup
      const operationCards = OPERATION_CARDS() as OpCard[]

      // Helper function to find term for an operation ID
      const getTermForOperation = (opId: string): string => {
        // First check main operation cards
        for (const card of operationCards) {
          if (card.id === opId) {
            // Use term appropriate for the current state
            return swapped && card.switchedTerm ? card.switchedTerm : (card.term || opId)
          }

          // Then check sub-options
          for (const subOp of card.subOptions) {
            if (subOp.id === opId) {
              // Use term appropriate for the current state
              return swapped && subOp.switchedTerm ? subOp.switchedTerm : (subOp.term || opId)
            }
          }
        }
        return opId // Fallback to ID if term not found
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

      // Handle regular operations
      regularOptions.forEach((op) => {
        // Get the term instead of using operation short text
        const termText = getTermForOperation(op)

        formattedOperations.push(
          <ColoredText key={op} color={theme.palette.pop.main}>
            {termText}
            {swapped ? ` ${t("questionBuilder.scenarioSingular")}` : ""}
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
            {swapped ? ` ${t("questionBuilder.scenarioSingular")}` : ""}
          </ColoredText>,
        )
      }

      // Handle conveyance subtypes
      if (conveyanceSubtypes.length > 0) {
        // Find and use the term for delta conveyance subtype if available
        const conveyanceText =
          conveyanceSubtypes.length === 1
            ? getTermForOperation(`dct-${conveyanceSubtypes[0]}`)
            : `conveyance tunnel (${conveyanceSubtypes.join(", ")})`

        formattedOperations.push(
          <ColoredText key="conveyance" color={theme.palette.pop.main}>
            {conveyanceText}
            {swapped ? ` ${t("questionBuilder.scenarioSingular")}` : ""}
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
      const filteredTypes = typeSelections.filter((t) => !isDeltaOutcomeType(t))

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

    // Extract and format Delta outcomes (outflow and salinity) separately
    const formatDeltaOutcomes = (typeSelections: string[]) => {
      // Find Delta outflow and Delta salinity
      const deltaOutflow = typeSelections.find((t) => isDeltaOutflow(t))
      const deltaSalinity = typeSelections.find((t) => isDeltaSalinity(t))

      // Return null if neither exists
      if (!deltaOutflow && !deltaSalinity) return null

      // Format each if they exist
      const formattedOutflow = deltaOutflow
        ? createColoredText(formatOutcomeText(deltaOutflow, "type"))
        : null
      const formattedSalinity = deltaSalinity
        ? createColoredText(formatOutcomeText(deltaSalinity, "type"))
        : null

      // Return based on which ones exist
      if (formattedOutflow && formattedSalinity) {
        // If both exist, join them with "and"
        return (
          <>
            {formattedOutflow} {t("questionBuilder.connectors.and")}{" "}
            {formattedSalinity}
          </>
        )
      } else {
        // Return whichever one exists
        return formattedOutflow || formattedSalinity
      }
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
        const affectTypeOutcomes: React.ReactNode[] = []

        // Process type selections
        typeSelections.forEach((type) => {
          // Skip delivery subtypes and Delta outflow - they're handled separately
          if (isDeltaOutcomeType(type) || type.endsWith("-deliveries")) return

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
          } else {
            // FALLBACK: If no direction is set (like when switching from unswapped to swapped),
            // create a neutral "affect" group
            affectTypeOutcomes.push(
              <ColoredText
                key={`affect-${type}`}
                color={theme.palette.cool.main}
              >
                {formattedText}
              </ColoredText>,
            )
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
          } else {
            // FALLBACK: If no direction is set, use the "affect" group
            affectTypeOutcomes.push(
              <ColoredText
                key={`affect-${fullId}`}
                color={theme.palette.cool.main}
              >
                {subtypeText}
              </ColoredText>,
            )
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
          } else {
            // FALLBACK: If no direction is set, use the "affect" group
            affectTypeOutcomes.push(
              <ColoredText key={`affect-delta`} color={theme.palette.cool.main}>
                {formattedText}
              </ColoredText>,
            )
          }
        }

        // Create groups for increase and decrease for metric outcomes
        const increaseMetricOutcomes: React.ReactNode[] = []
        const decreaseMetricOutcomes: React.ReactNode[] = []
        const affectMetricOutcomes: React.ReactNode[] = []

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
          } else {
            // FALLBACK: If no direction is set, use the "affect" group
            affectMetricOutcomes.push(
              <ColoredText
                key={`affect-${metric}`}
                color={theme.palette.cool.main}
              >
                {formattedText}
              </ColoredText>,
            )
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

        // Format the "affect" type group for outcomes with no direction
        let affectTypeGroup = null
        if (affectTypeOutcomes.length > 0) {
          if (affectTypeOutcomes.length === 1) {
            affectTypeGroup = (
              <>
                <ColoredText color={theme.palette.cool.main}>
                  {t("questionBuilder.connectors.affect")}
                </ColoredText>{" "}
                {affectTypeOutcomes[0]}
              </>
            )
          } else {
            affectTypeGroup = (
              <>
                <ColoredText color={theme.palette.cool.main}>
                  {t("questionBuilder.connectors.affect")}
                </ColoredText>{" "}
                {affectTypeOutcomes.reduce((prev, curr, idx) => (
                  <>
                    {prev}
                    {idx > 0 && idx === affectTypeOutcomes.length - 1
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
        if (increaseTypeGroup && decreaseTypeGroup && affectTypeGroup) {
          typePart = (
            <>
              {increaseTypeGroup} {t("questionBuilder.connectors.and")}{" "}
              {decreaseTypeGroup} {t("questionBuilder.connectors.and")}{" "}
              {affectTypeGroup}
            </>
          )
        } else if (increaseTypeGroup && decreaseTypeGroup) {
          typePart = (
            <>
              {increaseTypeGroup} {t("questionBuilder.connectors.and")}{" "}
              {decreaseTypeGroup}
            </>
          )
        } else if (increaseTypeGroup && affectTypeGroup) {
          typePart = (
            <>
              {increaseTypeGroup} {t("questionBuilder.connectors.and")}{" "}
              {affectTypeGroup}
            </>
          )
        } else if (decreaseTypeGroup && affectTypeGroup) {
          typePart = (
            <>
              {decreaseTypeGroup} {t("questionBuilder.connectors.and")}{" "}
              {affectTypeGroup}
            </>
          )
        } else if (increaseTypeGroup) {
          typePart = increaseTypeGroup
        } else if (decreaseTypeGroup) {
          typePart = decreaseTypeGroup
        } else if (affectTypeGroup) {
          typePart = affectTypeGroup
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

        // Format the affect metric group
        let affectMetricGroup = null
        if (affectMetricOutcomes.length > 0) {
          if (affectMetricOutcomes.length === 1) {
            affectMetricGroup = affectMetricOutcomes[0]
          } else {
            affectMetricGroup = (
              <>
                {affectMetricOutcomes.reduce((prev, curr, idx) => (
                  <>
                    {prev}
                    {idx > 0 && idx === affectMetricOutcomes.length - 1
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
        if (metricPart && decreaseMetricGroup && affectMetricGroup) {
          metricPart = (
            <>
              {metricPart} {t("questionBuilder.connectors.and")}{" "}
              {decreaseMetricGroup} {t("questionBuilder.connectors.and")}{" "}
              {affectMetricGroup}
            </>
          )
        } else if (metricPart && decreaseMetricGroup) {
          metricPart = (
            <>
              {metricPart} {t("questionBuilder.connectors.and")}{" "}
              {decreaseMetricGroup}
            </>
          )
        } else if (metricPart && affectMetricGroup) {
          metricPart = (
            <>
              {metricPart} {t("questionBuilder.connectors.and")}{" "}
              {affectMetricGroup}
            </>
          )
        } else if (decreaseMetricGroup && affectMetricGroup) {
          metricPart = (
            <>
              {decreaseMetricGroup} {t("questionBuilder.connectors.and")}{" "}
              {affectMetricGroup}
            </>
          )
        } else if (decreaseMetricGroup) {
          metricPart = decreaseMetricGroup
        } else if (affectMetricGroup) {
          metricPart = affectMetricGroup
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
        const deltaOutflow = formatDeltaOutcomes(typeSelections)

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
        // First handle regular types (without Delta outflow or salinity)
        if (formattedType) {
          result = formattedType

          // Add region if present (regions come after type)
          if (formattedRegion) {
            result = (
              <>
                {result} {formattedRegion}
              </>
            )
          }

          // Add Delta outcomes (outflow and/or salinity) at the end if they exist
          if (deltaOutflow) {
            result = (
              <>
                {result} {t("questionBuilder.connectors.and")} {deltaOutflow}
              </>
            )
          }
        } else if (deltaOutflow) {
          // If only Delta outcomes (no other types)
          result = deltaOutflow

          // Add region if present
          if (formattedRegion) {
            result = (
              <>
                {result} {formattedRegion}
              </>
            )
          }
        } else if (formattedRegion) {
          // Start with region if no type or Delta outflow
          // Always use water availability instead of outcomes
          result = (
            <>
              <ColoredText color={theme.palette.cool.main}>
                {t("questionBuilder.defaultTerms.waterAvailability")}
              </ColoredText>{" "}
              {formattedRegion}
            </>
          )
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

    // // Find the climate label for the selected climate ID
    // const getClimateLabel = () => {
    //   // Use the translated label for the selected climate ID
    //   return t(`questionBuilder.climateSelector.options.${selectedClimate}`)
    // }

    // Format multiple climate selections
    const formatClimateSelections = () => {
      if (!selectedClimate || selectedClimate.length === 0) {
        return null
      }

      // Convert array of climate IDs to array of ColoredText components with translated labels
      const formattedClimates = selectedClimate.map((id) => (
        <ColoredText key={id} color={theme.palette.climate.main}>
          {t(`questionBuilder.climateSelector.options.${id}`)}
        </ColoredText>
      ))

      // If only one climate, return it directly
      if (formattedClimates.length === 1) {
        return formattedClimates[0]
      }

      // For multiple climates, join with "or" using the same reducer pattern as operations
      return formattedClimates.reduce((result, climate, index) => {
        if (index === 0) return climate

        // For the last item in a list of 3+ items, use ", or"
        if (
          index === formattedClimates.length - 1 &&
          formattedClimates.length > 2
        ) {
          return (
            <>
              {result}, or {climate}
            </>
          )
        }

        // For middle items in a list of 3+ items, use commas
        if (formattedClimates.length > 2) {
          return (
            <>
              {result}, {climate}
            </>
          )
        }

        // For exactly 2 items, join with "or"
        return (
          <>
            {result} or {climate}
          </>
        )
      })
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
        (section) => section && section.length > 0,
      )

      // Create inline custom component
      const createCustomSwappedFormat = () => {
        // Create the climate element with green highlighting if climate is enabled
        const climateElement = includeClimate ? (
          <>
            {" "}
            {locale === "es" ? "con" : "with"} {formatClimateSelections()}
          </>
        ) : null

        // Check if we only have region selections (no type or metric selections)
        const onlyRegionSelected =
          (!outcomesBySection.type || outcomesBySection.type.length === 0) &&
          outcomesBySection.region &&
          outcomesBySection.region.length > 0 &&
          (!outcomesBySection.metric || outcomesBySection.metric.length === 0)

        // If only regions are selected, we need to include "change water availability"
        const outcomeContent = onlyRegionSelected ? (
          <>
            {locale === "es" ? "cambiar " : "change "}
            <ColoredText color={theme.palette.cool.main}>
              {t("questionBuilder.defaultTerms.waterAvailability")}
            </ColoredText>{" "}
            {outcomePart}
          </>
        ) : (
          outcomePart
        )

        if (locale === "es") {
          return (
            <>
              Para estos {outcomeContent}
              {climateElement}, ¿qué {operationsPart}
              podríamos probar?
            </>
          )
        } else {
          return (
            <>
              To {outcomeContent}
              {climateElement}, which {operationsPart} could we consider?
            </>
          )
        }
      }

      // Use custom format if outcomes are selected, otherwise use translation
      if (hasOutcomes) {
        return createCustomSwappedFormat()
      }

      // Create the climate element with green highlighting if climate is enabled
      const climateElement = includeClimate ? formatClimateSelections() : null

      // If no outcomes are selected, use the default format with climate if enabled
      if (includeClimate) {
        if (locale === "es") {
          return (
            <>
              Para estos {outcomePart} con {climateElement}, ¿qué{" "}
              {operationsPart}
              podríamos probar?
            </>
          )
        } else {
          return (
            <>
              To these {outcomePart} with {climateElement}, which{" "}
              {operationsPart} could we consider?
            </>
          )
        }
      }

      // Default format without climate
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
      const climate = formatClimateSelections()

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
    shouldUseDo,
    formatOutcomeText,
    t,
    locale,
  ])

  // Update font size based on text overflow using ResizeObserver
  React.useEffect(() => {
    // TODO:This is now handled by the calculatedFontSize memo value
    // The ResizeObserver may not be needed anymore since we calculate size based on selection count
    // We can remove this effect entirely or keep it for a transition period
    // No need to update fontSize state since it's not used anymore
  }, [summary])

  // Update container styles to be relative to exploratory mode
  return (
    <Box
      style={{
        backgroundColor: "transparent",
        width: "100%",
        position: "relative",
        zIndex: 1000,
        padding: 0,
        maxWidth: "none !important",
        display: "flex",
      }}
      sx={{
        mt: 6,
      }}
    >
      <Typography
        variant="h2"
        ref={textRef}
        sx={(theme) => ({
          mt: theme.spacing(6),
          mb: 0,
          lineHeight: theme.cards.typography.hero.lineHeight,
          textAlign: "center",
          fontWeight: 400,
          width: "100%",
          margin: "0 auto",
          backgroundColor: "white",
          paddingTop: isExploratoryMode ? "30px" : "40px",
          paddingBottom: isExploratoryMode ? "12px" : 0,
          paddingLeft: "5%",
          paddingRight: "5%",
          boxShadow: "none",
          transition: "font-size 0.75s ease-in-out, padding 0.75s ease-in-out",
          maxWidth: "none !important",
        })}
      >
        {summary}
      </Typography>
    </Box>
  )
}

export default QuestionSummary
