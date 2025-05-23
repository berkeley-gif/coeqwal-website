"use client"

/**
 * @fileoverview OperationsSelector component for the question builder
 * @module OperationsSelector
 * @description This component allows users to select operations from a list of predefined options.
 * @param {Object} props - The component props
 * @param {string[]} props.selectedOperations - The currently selected operations
 * @param {Function} props.onOperationChange - The function to call when the operation selection changes
 * @param {boolean} props.swapped - Whether the operations are being swapped
 */

/**
 * OperationsSelector
 * Uses checkboxes for multi-selection
 * Organizes options into cards for clarity
 * Includes a search feature for operations
 * Uses colored bullets and capsules for visual distinction
 * Different text formats based on the "swapped" state
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react"
import {
  Typography,
  Box,
  useTheme,
  TextField,
  SearchIcon,
  Button,
} from "@repo/ui/mui"
import { Card, OperationCard } from "@repo/ui"
import { useQuestionBuilderHelpers } from "../hooks/useQuestionBuilderHelpers"
import { ColoredText } from "./ui"
import { useTranslation } from "@repo/i18n"
import { useDrawerStore } from "@repo/state"

interface OperationsSelectorProps {
  openThemesDrawer?: (operationId?: string) => void
}

// Organized palette for water operations with primary (dot) and secondary (title) colors
const WATER_PALETTE = {
  currentOperations: {
    primary: "#90B9BF", // Soft blue/gray
    secondary: "rgba(96, 125, 139, 0.85)",
  },
  emergencyMeasures: {
    primary: "#C3E68B", // Light green
    secondary: "rgba(33, 150, 243, 0.85)",
  },
  groundwaterManagement: {
    primary: "#FFC700", // Bright yellow
    secondary: "rgba(244, 67, 54, 0.85)",
  },
  streamFlowManagement: {
    primary: "#FF9C00", // Orange
    secondary: "rgba(76, 175, 80, 0.85)",
  },
  urbanWaterPriorities: {
    primary: "#CF9AAD", // Soft pink
    secondary: "rgba(156, 39, 176, 0.85)",
  },
  deltaBalance: {
    primary: "#A66484", // Purple
    secondary: "rgba(255, 152, 0, 0.85)",
  },
  infrastructure: {
    primary: "#D96E00", // Amber/brown
    secondary: "rgba(63, 81, 181, 0.85)",
  },
  climateAdaptation: {
    primary: "#00ACC1", // Teal - future water, adaptation
    secondary: "rgba(0, 172, 193, 0.85)",
  },
}

// TypeScript interfaces for operation cards
interface OperationSubOption {
  id: string
  label?: string
  term?: string
  switchedTerm?: string
  isSingular: boolean
}

interface OperationCard {
  id: string
  title?: string
  term?: string
  switchedTerm?: string
  bullet?: { color: string; size: number }
  titleColor?: string
  isSingular: boolean
  subOptions?: OperationSubOption[]
}

// Card data for the operation cards
export const OPERATION_CARDS = (): OperationCard[] => [
  {
    id: "current-operations",
    title: "Current operations",
    term: "current operations",
    switchedTerm: "current operations",
    bullet: { color: WATER_PALETTE.currentOperations.primary, size: 24 },
    titleColor: WATER_PALETTE.currentOperations.secondary,
    isSingular: false, // plural - use "do"
    subOptions: [
      {
        id: "use-as-comparison",
        label: "Use as comparison",
        term: "current operations",
        switchedTerm: "current operations",
        isSingular: false, // plural - use "do"
      },
    ],
  },
  // {
  //   id: "remove-tucps",
  //   title: "What if we removed temporary emergency measures (TUCP's)?",
  //   term: "removing emergency measures",
  //   bullet: { color: WATER_PALETTE.emergencyMeasures.primary, size: 24 },
  //   titleColor: WATER_PALETTE.emergencyMeasures.secondary,
  //   subOptions: [
  //     {
  //       id: "select-tucps",
  //       label: "Select",
  //       term: "removing TUCPs",
  //     },
  //   ],
  // },
  {
    id: "limit-groundwater",
    title: "What if we limited groundwater pumping?",
    term: "limiting groundwater pumping",
    switchedTerm: "groundwater limitation",
    bullet: { color: WATER_PALETTE.groundwaterManagement.primary, size: 24 },
    titleColor: WATER_PALETTE.groundwaterManagement.secondary,
    isSingular: true, // singular - use "does"
    subOptions: [
      {
        id: "sjv-only",
        label: "...in the San Joaquin Valley only",
        term: "limiting groundwater pumping",
        switchedTerm: "groundwater pumping",
        isSingular: true, // singular - use "does"
      },
      {
        id: "both-valleys",
        label: "...in both the Sacramento and San Joaquin Valleys",
        term: "valley-wide groundwater limits",
        switchedTerm: "valley-wide groundwater scenario",
        isSingular: false, // singular - use "does"
      },
      {
        id: "sjv-reduced-acreage",
        label: "...in the San Joaquin Valley and reduced agricultural acreage",
        term: "SJV groundwater & acreage limits",
        switchedTerm: "San Joaquin Valley groundwater & acreage",
        isSingular: false, // singular - use "does"
      },
      {
        id: "both-valleys-reduced-acreage",
        label:
          "...in both the Sacramento and San Joaquin Valleys with reduced agricultural acreage",
        term: "valley-wide groundwater & acreage limits",
        switchedTerm: "valley-wide groundwater & acreage",
        isSingular: false, // singular - use "does"
      },
    ],
  },
  {
    id: "change-stream-flows",
    title: "What if we changed how water flows in our streams?",
    term: "changing stream flows",
    bullet: { color: WATER_PALETTE.streamFlowManagement.primary, size: 24 },
    titleColor: WATER_PALETTE.streamFlowManagement.secondary,
    isSingular: true, // singular - use "does"
    subOptions: [
      {
        id: "no-environmental-flows",
        label: "...with no environmental flow requirements",
        term: "environmental flows",
        isSingular: false, // singular - use "does"
      },
      {
        id: "functional-flows-balance",
        label:
          "...with functional flows to balance water needs with ecosystem support",
        term: "environmental flows",
        isSingular: false, // singular - use "does"
      },
      {
        id: "functional-flows-reduced",
        label:
          "...with functional flows, reduced groundwater pumping, and reduced agricultural deliveries",
        term: "environmental flows",
        isSingular: false, // singular - use "does"
      },
      {
        id: "enhanced-functional-flows-salmon",
        label: "...with enhanced functional flows to support salmon",
        term: "environmental flows",
        isSingular: false, // singular - use "does"
      },
      {
        id: "enhanced-functional-flows-salmon-reduced",
        label:
          "...with enhanced functional flows to support salmon, reduced groundwater pumping, and reduced agricultural deliveries",
        term: "environmental flows",
        isSingular: false, // singular - use "does"
      },
    ],
  },
  {
    id: "prioritize-drinking-water",
    title: "What if we prioritized drinking water?",
    term: "prioritizing drinking water",
    bullet: { color: WATER_PALETTE.urbanWaterPriorities.primary, size: 24 },
    titleColor: WATER_PALETTE.urbanWaterPriorities.secondary,
    isSingular: true, // singular - use "does"
    subOptions: [
      {
        id: "adjust-urban-demand",
        label: "...by adjusting urban demand patterns",
        term: "drinking water",
        isSingular: true, // singular - use "does"
      },
      {
        id: "prioritize-impacted-communities",
        label:
          "...by prioritizing drinking water for the most impacted communities",
        term: "drinking water",
        isSingular: true, // singular - use "does"
      },
      {
        id: "prioritize-underserved-communities",
        label:
          "...by prioritizing drinking water for all historically-underserved communities",
        term: "drinking water",
        isSingular: true, // singular - use "does"
      },
      {
        id: "prioritize-all-communities",
        label: "...for all communities across the system",
        term: "drinking water",
        isSingular: true, // singular - use "does"
      },
    ],
  },
  {
    id: "balance-delta-uses",
    title: "What if we balanced water uses in the Delta?",
    term: "balancing Delta water uses",
    bullet: { color: WATER_PALETTE.deltaBalance.primary, size: 24 },
    titleColor: WATER_PALETTE.deltaBalance.secondary,
    isSingular: true, // singular - use "does"
    subOptions: [
      {
        id: "delta-outflows-tier1",
        label: "...by increasing Delta outflows",
        term: "Delta water uses",
        isSingular: true, // singular - use "does"
      },
      {
        id: "reduce-sacramento-valley-deliveries",
        label: "...by reducing Sacramento Valley deliveries",
        term: "Delta water uses",
        isSingular: true, // singular - use "does"
      },
      {
        id: "more-carryover-storage-shasta",
        label: "...by requiring more carryover storage in Shasta Reservoir",
        term: "Delta water uses",
        isSingular: true, // singular - use "does"
      },
      {
        id: "less-carryover-storage-shasta",
        label: "...by allowing less carryover storage in Shasta Reservoir",
        term: "Delta water uses",
        isSingular: true, // singular - use "does"
      },
      {
        id: "reduce-delta-exports-tier1",
        label: "...by reducing Delta exports",
        term: "Delta water uses",
        isSingular: true, // singular - use "does"
      },
    ],
  },
  {
    id: "new-infrastructure",
    title: "What if we added new water infrastructure?",
    term: "adding infrastructure",
    bullet: { color: WATER_PALETTE.infrastructure.primary, size: 24 },
    titleColor: WATER_PALETTE.infrastructure.secondary,
    isSingular: true, // singular - use "does"
    subOptions: [
      {
        id: "delta-conveyance-tunnel",
        label: "...Delta conveyance tunnel",
        term: "Delta infrastructure",
        isSingular: true, // singular - use "does"
      },
      {
        id: "delta-conveyance-reduced-groundwater",
        label:
          "...Delta conveyance tunnel with reduced groundwater pumping and deliveries",
        term: "Delta infrastructure",
        isSingular: true, // singular - use "does"
      },
      {
        id: "delta-conveyance-functional-flows",
        label: "...Delta conveyance with functional flows",
        term: "Delta infrastructure",
        isSingular: true, // singular - use "does"
      },
    ],
  },
]

// Also export a standalone version that doesn't require calling the function
// This helps avoid circular dependencies
export const OPERATION_CARD_DEFINITIONS: OperationCard[] = [
  {
    id: "current-operations",
    isSingular: false,
    switchedTerm: "current operations",
    subOptions: [
      {
        id: "use-as-comparison",
        isSingular: false,
        switchedTerm: "current operations",
      },
    ],
  },
  {
    id: "limit-groundwater",
    isSingular: true,
    switchedTerm: "groundwater limitation",
    term: "limiting groundwater pumping",
    subOptions: [
      {
        id: "sjv-only",
        isSingular: true,
        switchedTerm: "San Joaquin Valley groundwater",
        term: "SJV groundwater limits",
      },
      {
        id: "both-valleys",
        isSingular: false,
        switchedTerm: "valley-wide groundwater",
        term: "valley-wide groundwater limits",
      },
      {
        id: "sjv-reduced-acreage",
        isSingular: false,
        switchedTerm: "San Joaquin Valley groundwater & acreage",
        term: "SJV groundwater & acreage limits",
      },
      {
        id: "both-valleys-reduced-acreage",
        isSingular: false,
        switchedTerm: "valley-wide groundwater & acreage",
        term: "valley-wide groundwater & acreage limits",
      },
    ],
  },
  {
    id: "change-stream-flows",
    isSingular: true,
    subOptions: [
      { id: "no-environmental-flows", isSingular: false },
      { id: "functional-flows-balance", isSingular: false },
      { id: "functional-flows-reduced", isSingular: false },
      { id: "enhanced-functional-flows-salmon", isSingular: false },
      { id: "enhanced-functional-flows-salmon-reduced", isSingular: false },
    ],
  },
  {
    id: "prioritize-drinking-water",
    isSingular: true,
    subOptions: [
      { id: "adjust-urban-demand", isSingular: true },
      { id: "prioritize-impacted-communities", isSingular: true },
      { id: "prioritize-underserved-communities", isSingular: true },
      { id: "prioritize-all-communities", isSingular: true },
    ],
  },
  {
    id: "balance-delta-uses",
    isSingular: true,
    subOptions: [
      { id: "delta-outflows-tier1", isSingular: true },
      { id: "reduce-sacramento-valley-deliveries", isSingular: true },
      { id: "more-carryover-storage-shasta", isSingular: true },
      { id: "less-carryover-storage-shasta", isSingular: true },
      { id: "reduce-delta-exports-tier1", isSingular: true },
    ],
  },
  {
    id: "new-infrastructure",
    isSingular: true,
    subOptions: [
      { id: "delta-conveyance-tunnel", isSingular: true },
      { id: "delta-conveyance-reduced-groundwater", isSingular: true },
      { id: "delta-conveyance-functional-flows", isSingular: true },
    ],
  },
]

// Define the SubOption interface explicitly for the component
interface SubOption {
  id: string
  label: string
  selected: boolean
  term?: string
  switchedTerm?: string
  isSingular: boolean
}

const OperationsSelector: React.FC<OperationsSelectorProps> = ({
  openThemesDrawer,
}) => {
  const theme = useTheme()
  const { t } = useTranslation()
  const {
    state: { swapped, selectedOperations, isExploratoryMode },
    handleOperationChange,
    resetOperations,
    setExploratoryMode,
  } = useQuestionBuilderHelpers()

  const [searchTerm, setSearchTerm] = useState("")

  // Exit exploratory mode when interacting with this component
  const exitExploratoryMode = useCallback(() => {
    if (isExploratoryMode) {
      setExploratoryMode(false)
    }
  }, [isExploratoryMode, setExploratoryMode])

  // Update handlers to exit exploratory mode
  const handleOperationChangeWithExitMode = useCallback(
    (optionId: string, checked: boolean) => {
      exitExploratoryMode()
      handleOperationChange(optionId, checked)
    },
    [exitExploratoryMode, handleOperationChange],
  )

  const handleResetWithExitMode = useCallback(() => {
    exitExploratoryMode()
    resetOperations()
  }, [exitExploratoryMode, resetOperations])

  // Filter operations based on search term
  const filteredOperations = useMemo(() => {
    if (!searchTerm) return OPERATION_CARDS()

    const lowercaseSearch = searchTerm.toLowerCase()
    return OPERATION_CARDS().filter(
      (op) =>
        op.title?.toLowerCase().includes(lowercaseSearch) ||
        false ||
        op.subOptions?.some((sub) =>
          sub.label?.toLowerCase().includes(lowercaseSearch),
        ) ||
        false,
    )
  }, [searchTerm])

  // Prepare the operation cards with selected state
  const operationCardsWithState = useMemo(() => {
    return filteredOperations.map((op) => {
      const mainOptionSelected = selectedOperations.includes(op.id)

      const subOptionsWithState =
        op.subOptions?.map((sub) => ({
          ...sub,
          selected: selectedOperations.includes(sub.id),
        })) || []

      return {
        ...op,
        selected: mainOptionSelected,
        subOptions: subOptionsWithState,
      }
    })
  }, [filteredOperations, selectedOperations])

  // Handle main option change
  const handleMainOptionChange = (optionId: string, checked: boolean) => {
    handleOperationChangeWithExitMode(optionId, checked)
  }

  // Handle sub-option change
  const handleSubOptionChange = (subOptionId: string, checked: boolean) => {
    handleOperationChangeWithExitMode(subOptionId, checked)
  }

  // Handle info click
  const handleInfoClick = (operationId: string) => {
    // Get the drawer store
    const drawerStore = useDrawerStore.getState()

    // Special case for current-operations - open the glossary drawer
    if (operationId === "current-operations") {
      // Check if glossary drawer is already open
      if (drawerStore.activeTab === "glossary") {
        // Toggle behavior - close if already open
        drawerStore.closeDrawer()
      } else {
        // Use the dedicated method for opening the glossary panel
        drawerStore.openGlossaryPanel()
      }
      return
    }

    // For all other operations, use the themes drawer
    // Use the prop if available, otherwise fallback to the store
    if (openThemesDrawer) {
      openThemesDrawer(operationId)
    } else {
      // Always use the dedicated method which handles tab transitions correctly
      drawerStore.setDrawerContent({ selectedOperation: operationId })
      drawerStore.openDrawer("glossary")
    }
  }

  // Common styles
  const searchBoxStyles = {
    mb: 3,
    border: "1px solid rgba(0, 0, 0, 0.12)",
    borderRadius: `${theme.borderRadius.card}px`,
    overflow: "hidden",
    backgroundColor: theme.palette.common.white,
    padding: theme.spacing(1, 2),
    display: "flex",
    alignItems: "center",
    gap: 1,
    width: "100%",
  }

  const searchIconStyles = {
    fontSize: theme.typography.body1.fontSize,
  }

  const textFieldStyles = {
    ml: 2,
    "& .MuiOutlinedInput-root": {
      borderRadius: theme.borderRadius.pill,
      height: "40px",
      fontSize: theme.cards.typography.caption.fontSize,
    },
    "& .MuiOutlinedInput-input": {
      padding: theme.spacing(1, 2),
    },
    width: "300px",
  }

  // Let's ditch the custom scrollbar due to lag issues and use a better native scrollbar
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isScrollable, setIsScrollable] = useState(false)

  // Check if content is scrollable once when component loads and on window resize
  useEffect(() => {
    const checkScrollable = () => {
      const container = scrollContainerRef.current
      if (container) {
        const isCurrentlyScrollable =
          container.scrollHeight > container.clientHeight + 10 // 10px buffer

        // Only update state if the value has actually changed
        if (isCurrentlyScrollable !== isScrollable) {
          setIsScrollable(isCurrentlyScrollable)
        }
      }
    }

    // Initial check with delay to ensure layout is complete
    const timeoutId = setTimeout(checkScrollable, 200)

    // Recheck on window resize
    window.addEventListener("resize", checkScrollable)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener("resize", checkScrollable)
    }
    // Only re-run when the length of operations changes, not on every render
  }, [operationCardsWithState.length, isScrollable])

  // Prevent scroll propagation at the top/bottom boundaries
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current

    if (!scrollContainer) return

    const handleWheel = (e: WheelEvent) => {
      // Get current scroll position and dimensions
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer

      // More precise boundary detection
      const isAtTop = scrollTop <= 0
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1

      // Only prevent default when we've hit a boundary in the direction of scroll
      if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
        e.preventDefault()
        e.stopPropagation() // Also stop propagation for more reliable containment
      }
    }

    // Track touch movement for mobile
    let touchStartY: number | null = null

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches?.[0]) {
        touchStartY = e.touches[0].clientY
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartY === null || !scrollContainer || !e.touches?.[0]) return

      const touchY = e.touches[0].clientY
      const touchDeltaY = touchStartY - touchY

      // Get current scroll position and dimensions
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer

      // More precise boundary detection, adding a small buffer (1px)
      const isAtTop = scrollTop <= 0
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1

      // Detect scroll direction from touch movement and check boundaries
      // Positive touchDeltaY means scrolling down, negative means scrolling up
      if ((isAtTop && touchDeltaY < 0) || (isAtBottom && touchDeltaY > 0)) {
        e.preventDefault()
        e.stopPropagation() // Also stop propagation for more reliable containment
      }
    }

    // Add the event listeners with passive: false to allow preventDefault()
    scrollContainer.addEventListener("wheel", handleWheel, { passive: false })
    scrollContainer.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    })
    scrollContainer.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    })

    // Also prevent scroll on the parent container when we're at boundaries
    const preventParentScroll = (e: Event) => {
      // This helps ensure the parent doesn't scroll
      e.stopPropagation()
    }

    scrollContainer.addEventListener("scroll", preventParentScroll)

    return () => {
      scrollContainer.removeEventListener("wheel", handleWheel)
      scrollContainer.removeEventListener("touchstart", handleTouchStart)
      scrollContainer.removeEventListener("touchmove", handleTouchMove)
      scrollContainer.removeEventListener("scroll", preventParentScroll)
    }
    // No dependencies needed here as it only runs once and cleans up on unmount
  }, [])

  return (
    <Card
      sx={{
        pt: 0, // Remove top padding from card
        pb: 3, // Keep bottom padding
        px: 3, // Keep horizontal padding
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          mb: 3,
        }}
      >
        <Typography
          variant="h3"
          sx={{
            lineHeight: (theme) => theme.cards.typography.hero.lineHeight,
            fontWeight: (theme) => theme.cards.typography.hero.fontWeight,
          }}
        >
          {swapped ? (
            <>
              <ColoredText color={theme.palette.pop.main}>
                {t("questionBuilder.defaultTerms.decisions_sub")}
              </ColoredText>
            </>
          ) : (
            <>
              {/* Parse the title string and replace the decisions placeholder with the highlighted component */}
              {t("questionBuilder.operationsSelector.title")
                .split("{{decisions}}")
                .map((part, index, array) => (
                  <React.Fragment key={index}>
                    {part}
                    {index < array.length - 1 && (
                      <ColoredText color={theme.palette.pop.main}>
                        {t("questionBuilder.defaultTerms.decisions_sub")}
                      </ColoredText>
                    )}
                  </React.Fragment>
                ))}
            </>
          )}
        </Typography>

        {/* Clear Selection Button */}
        <Button
          variant="text"
          size="medium"
          onClick={handleResetWithExitMode}
          sx={{
            textTransform: "none",
            borderRadius: 0,
            minWidth: "150px",
            px: 1,
            py: 0.5,
            fontWeight: 400,
            color: "rgba(0, 0, 0, 0.42)",
            backgroundColor: "transparent",
            border: "none",
            "&:hover": {
              backgroundColor: "transparent",
              color: "rgba(0, 0, 0, 0.6)",
              textDecoration: "underline",
            },
          }}
        >
          {t("questionBuilder.ui.clearSelections")}
        </Button>
      </Box>

      {/* Search operations section */}
      <Box sx={searchBoxStyles}>
        <SearchIcon sx={searchIconStyles} />
        <Typography variant="subtitle1" sx={{ fontWeight: "medium" }}>
          {t("questionBuilder.operationsSelector.searchOperations")}
        </Typography>
        <TextField
          size="small"
          placeholder={t(
            "questionBuilder.operationsSelector.searchPlaceholder",
          )}
          sx={textFieldStyles}
          value={searchTerm}
          onChange={(e) => {
            e.stopPropagation()
            setSearchTerm(e.target.value)
          }}
          onClick={(e) => e.stopPropagation()}
          onFocus={(e) => e.stopPropagation()}
          // Add debounce to search input to reduce state updates
          inputProps={{
            spellCheck: false,
          }}
        />
      </Box>

      {/* Operation cards with custom scrolling */}
      <Box
        sx={{
          position: "relative",
          height: "60vh",
          mt: 1, // Reduced from mt: 3
          border: "1px solid rgba(0, 0, 0, 0.12)",
          borderRadius: "12px",
          p: 1,
          overflow: "hidden",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
        }}
      >
        {/* Simple scrollable box with stylish round scrollbar */}
        <Box
          ref={scrollContainerRef}
          sx={{
            width: "100%",
            height: "100%",
            overflowY: "auto",
            mt: 0, // Removed space for the header (was mt: 3)
            pr: 2,
            // High-performance scrollbar styling
            "&::-webkit-scrollbar": {
              width: "14px",
              backgroundColor: "transparent",
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "transparent",
              margin: theme.spacing(1),
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#00000030",
              border: "4px solid white",
              borderRadius: "24px",
            },
            // Firefox
            scrollbarWidth: "thin",
            scrollbarColor: "#00000030 transparent",
            // Add relative positioning for the scroll indicator
            position: "relative",
            "& > div:not(:last-child)": {
              marginBottom: (theme) => theme.cards.spacing.gap,
            },
          }}
        >
          {/* Subtle scroll indicator */}
          {isScrollable && (
            <Box
              sx={{
                position: "absolute",
                top: "0px",
                right: "25px", // Position to the left of the scrollbar
                background:
                  "linear-gradient(135deg, rgba(0, 0, 0, 0.03) 0%, rgba(0, 0, 0, 0.08) 100%)",
                color: "rgba(0, 0, 0, 0.7)",
                px: 1.5,
                py: 0.5,
                borderRadius: "0 0 4px 4px",
                zIndex: 1000,
                fontSize: "0.75rem",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: "4px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <span>SCROLL</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7 10L12 15L17 10"
                  stroke="rgba(0, 0, 0, 0.6)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Box>
          )}

          {operationCardsWithState.map((op) => (
            <OperationCard
              key={op.id}
              title={op.title || ""}
              bullet={op.bullet}
              titleColor={op.titleColor}
              subOptions={op.subOptions as SubOption[]}
              selected={op.selected}
              onMainOptionChange={(checked) =>
                handleMainOptionChange(op.id, checked)
              }
              onSubOptionChange={(subId, checked) =>
                handleSubOptionChange(subId, checked)
              }
              onInfoClick={() => handleInfoClick(op.id)}
            />
          ))}
        </Box>
      </Box>
    </Card>
  )
}

export default React.memo(OperationsSelector)
