"use client"

import React, { useMemo, ReactNode, useCallback } from "react"
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

  // Memoize helper functions used within the summary
  const createColoredText = useCallback((text: string) => {
    return <ColoredText color={theme.palette.cool.main}>{text}</ColoredText>
  }, [theme.palette.cool.main])

  // Memoize formatTypeSection to prevent recreation on each render
  const formatTypeSection = useCallback((typeSelections: string[]) => {
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
  }, [createColoredText, formatOutcomeText, t])

  // Memoize formatRegionSection to prevent recreation on each render
  const formatRegionSection = useCallback((regionSelections: string[]) => {
    if (regionSelections.length === 0) return null

    // Create formatted elements for each region
    const formattedElements = regionSelections.map((regionId) =>
      createColoredText(formatOutcomeText(regionId, "region")),
    )

    // Join all elements with "and"
    if (formattedElements.length === 1) {
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
  }, [createColoredText, formatOutcomeText, t])

  // Memoize the operations part generation
  const getOperationsPart = useCallback(() => {
    if (selectedOperations.length === 0) return null

    // Format operations with proper conjunctions
    const operationElements = selectedOperations.map((opId) => {
      const directionModifier = operationDirections[opId] || "increase"
      return (
        <span key={opId}>
          <ColoredText color={theme.palette.primary.main}>
            {getOperationShortText(opId, directionModifier)}
          </ColoredText>
        </span>
      )
    })

    // Join operations with "and" or "or" based on context
    if (operationElements.length === 1) {
      return operationElements[0]
    }

    return operationElements.reduce((result, element, index) => {
      if (index === 0) return element

      // If this is the last item and there are more than 2 total items, use ", and"
      if (
        index === operationElements.length - 1 &&
        operationElements.length > 2
      ) {
        return (
          <>
            {result}, {t("questionBuilder.connectors.and")} {element}
          </>
        )
      }

      // If there are more than 2 items and this isn't the last one, use comma
      if (operationElements.length > 2) {
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
  }, [selectedOperations, operationDirections, theme.palette.primary.main, getOperationShortText, t])

  // Memoize climate part generation
  const getClimatePart = useCallback(() => {
    if (!includeClimate || !selectedClimate) return null

    return (
      <ColoredText color={theme.palette.success.main}>
        {t(`questionBuilder.climate.${selectedClimate}`)}
      </ColoredText>
    )
  }, [includeClimate, selectedClimate, theme.palette.success.main, t])
  
  // Memoize the summary JSX using the memoized helper functions
  const summary = useMemo(() => {
    // Get all types from the outcomes state
    const typeSelections = outcomesBySection.type || []
    const regionSelections = outcomesBySection.region || []
    
    // Format each section with memoized helper functions
    const typesSection = formatTypeSection(typeSelections)
    const regionsSection = formatRegionSection(regionSelections)
    const operationsPart = getOperationsPart()
    const outcomesText = swapped ? operationsPart : (typesSection || regionsSection)
    const operationsText = swapped ? (typesSection || regionsSection) : operationsPart
    
    // Get climate part
    const climatePart = getClimatePart()

    // Handle operation conjugation (do/does)
    const doText = swapped
      ? shouldUseDo(outcomesBySection.type || [], outcomesBySection.region || [])
        ? t("questionBuilder.do")
        : t("questionBuilder.does")
      : shouldUseDo(selectedOperations)
        ? t("questionBuilder.do")
        : t("questionBuilder.does")
    
    // Debug info for the summary text
    console.log("Re-computing question summary text")

    // Create the full question text
    const questionParts = []
    
    // First part: What would happen to X
    if (swapped && outcomesText) {
      questionParts.push(
        <>
          {t("questionBuilder.whatWouldHappen")} {outcomesText}
        </>
      )
    } 
    // First part: How would X 
    else if (!swapped && outcomesText) {
      questionParts.push(
        <>
          {t("questionBuilder.howWould")} {outcomesText}
        </>
      )
    }

    // Second part: if we X
    if (operationsText) {
      questionParts.push(
        <>
          {t("questionBuilder.if")} {operationsText}
        </>
      )
    }

    // Climate part (if included)
    if (climatePart) {
      questionParts.push(
        <>
          {t("questionBuilder.with")} {climatePart}
        </>
      )
    }

    // Join all parts with spaces and add question mark
    return (
      <Typography variant="h4" sx={{ fontSize: dynamicFontSize }}>
        {questionParts.length > 0 
          ? questionParts.reduce((prev, curr, i) => (
              <>
                {prev} {curr}
              </>
            ))
          : t("questionBuilder.selectOptionsPrompt")}
        {questionParts.length > 0 ? "?" : ""}
      </Typography>
    )
  }, [
    outcomesBySection,
    swapped,
    selectedOperations,
    includeClimate,
    selectedClimate,
    formatTypeSection,
    formatRegionSection,
    getOperationsPart,
    getClimatePart,
    shouldUseDo,
    dynamicFontSize,
    t
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
