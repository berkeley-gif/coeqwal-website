import React, { useRef, useState, useEffect, useCallback } from "react"
import {
  Box,
  Typography,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material"
import { styled } from "@mui/material/styles"
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew"
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos"
import LearnCard, { LearnCardProps } from "../LearnCard"

export interface LearnCardCarouselProps {
  title?: string
  cards: Omit<LearnCardProps, "onClick">[]
  onCardClick?: (index: number) => void
}

const CarouselContainer = styled(Box)(({ theme }) => ({
  position: "relative",
  width: "100%",
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(4),
}))

const CarouselHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: theme.spacing(2),
}))

const CarouselTitle = styled(Typography)(() => ({
  fontWeight: 500,
  color: "white",
}))

const CarouselControls = styled(Box)({
  display: "flex",
  gap: "8px",
})

const CarouselTrack = styled(Box)(({ theme }) => ({
  display: "flex",
  overflowX: "hidden",
  scrollBehavior: "smooth",
  paddingTop: "8px",
  paddingBottom: theme.spacing(1),
}))

// Constants for card sizing
const MAX_CARD_WIDTH = 429 // Maximum width in pixels
const CARD_GAP = 20 // Gap between cards in pixels
const CARDS_TO_SHOW_MD = 4 // Always show 4 cards on md screens
const CARDS_TO_SHOW_SM = 2 // Show 2 cards on small screens
const CARDS_TO_SHOW_XS = 1 // Show 1 card on extra small screens

const LearnCardCarousel: React.FC<LearnCardCarouselProps> = ({
  title,
  cards,
  onCardClick,
}) => {
  const theme = useTheme()
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"))
  const isSmUp = useMediaQuery(theme.breakpoints.up("sm"))

  const trackRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // State to track current position and card widths
  const [currentIndex, setCurrentIndex] = useState(0)
  const [cardWidth, setCardWidth] = useState(MAX_CARD_WIDTH)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  // Helper to update the scroll button states
  const updateScrollButtons = useCallback(
    (index: number, visibleCards: number) => {
      setCanScrollLeft(index > 0)
      setCanScrollRight(index + visibleCards < cards.length)
    },
    [cards.length],
  )

  // Calculate card width based on container size
  useEffect(() => {
    if (!containerRef.current) return

    const calculateCardWidth = () => {
      const containerWidth = containerRef.current?.clientWidth || 0

      // Determine how many cards to show based on screen size
      let cardsToShow = CARDS_TO_SHOW_XS
      if (isMdUp) cardsToShow = CARDS_TO_SHOW_MD
      else if (isSmUp) cardsToShow = CARDS_TO_SHOW_SM

      // Calculate total space needed for gaps
      const totalGapWidth = (cardsToShow - 1) * CARD_GAP

      // Calculate the width for each card
      const calculatedWidth = Math.floor(
        (containerWidth - totalGapWidth) / cardsToShow,
      )

      // Use calculated width, but cap at MAX_CARD_WIDTH
      const newWidth = Math.min(calculatedWidth, MAX_CARD_WIDTH)
      setCardWidth(newWidth)

      // Update scroll buttons
      updateScrollButtons(currentIndex, cardsToShow)
    }

    calculateCardWidth()
    window.addEventListener("resize", calculateCardWidth)

    return () => window.removeEventListener("resize", calculateCardWidth)
  }, [currentIndex, isMdUp, isSmUp, cards.length, updateScrollButtons])

  const scrollLeft = () => {
    if (!canScrollLeft) return

    // Move by one card
    const newIndex = Math.max(0, currentIndex - 1)
    setCurrentIndex(newIndex)

    if (trackRef.current) {
      trackRef.current.scrollTo({
        left: newIndex * (cardWidth + CARD_GAP),
        behavior: "smooth",
      })
    }

    // Get current visible cards count
    let visibleCards = CARDS_TO_SHOW_XS
    if (isMdUp) visibleCards = CARDS_TO_SHOW_MD
    else if (isSmUp) visibleCards = CARDS_TO_SHOW_SM

    updateScrollButtons(newIndex, visibleCards)
  }

  const scrollRight = () => {
    if (!canScrollRight) return

    // Get current visible cards count
    let visibleCards = CARDS_TO_SHOW_XS
    if (isMdUp) visibleCards = CARDS_TO_SHOW_MD
    else if (isSmUp) visibleCards = CARDS_TO_SHOW_SM

    // Move by one card
    const newIndex = Math.min(cards.length - visibleCards, currentIndex + 1)
    setCurrentIndex(newIndex)

    if (trackRef.current) {
      trackRef.current.scrollTo({
        left: newIndex * (cardWidth + CARD_GAP),
        behavior: "smooth",
      })
    }

    updateScrollButtons(newIndex, visibleCards)
  }

  return (
    <CarouselContainer ref={containerRef}>
      {title && (
        <CarouselHeader>
          <CarouselTitle variant="h5">{title}</CarouselTitle>
          <CarouselControls>
            <IconButton
              onClick={scrollLeft}
              size="small"
              sx={{ color: "white" }}
              disabled={!canScrollLeft}
            >
              <ArrowBackIosNewIcon />
            </IconButton>
            <IconButton
              onClick={scrollRight}
              size="small"
              sx={{ color: "white" }}
              disabled={!canScrollRight}
            >
              <ArrowForwardIosIcon />
            </IconButton>
          </CarouselControls>
        </CarouselHeader>
      )}

      <CarouselTrack ref={trackRef}>
        {cards.map((card, index) => (
          <Box
            key={index}
            sx={{
              width: `${cardWidth}px`,
              maxWidth: `${MAX_CARD_WIDTH}px`,
              flexShrink: 0,
              marginRight: `${CARD_GAP}px`,
            }}
          >
            <LearnCard
              {...card}
              onClick={() => onCardClick && onCardClick(index)}
            />
          </Box>
        ))}
      </CarouselTrack>
    </CarouselContainer>
  )
}

export default LearnCardCarousel
