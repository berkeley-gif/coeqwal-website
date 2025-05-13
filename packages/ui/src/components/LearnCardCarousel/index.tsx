import React from "react"
import { Box, Typography, IconButton } from "@mui/material"
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

const CarouselTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
}))

const CarouselControls = styled(Box)({
  display: "flex",
  gap: "8px",
})

const CarouselTrack = styled(Box)({
  display: "flex",
  overflowX: "auto",
  scrollBehavior: "smooth",
  scrollbarWidth: "none", // Hide scrollbar for Firefox
  msOverflowStyle: "none", // Hide scrollbar for IE/Edge
  "&::-webkit-scrollbar": {
    display: "none", // Hide scrollbar for Chrome/Safari
  },
  padding: "10px 0", // Add padding to show shadow
})

const CarouselItem = styled(Box)({
  padding: "0 10px",
  flexShrink: 0,
})

const LearnCardCarousel: React.FC<LearnCardCarouselProps> = ({
  title,
  cards,
  onCardClick,
}) => {
  const trackRef = React.useRef<HTMLDivElement>(null)

  const scrollLeft = () => {
    if (trackRef.current) {
      trackRef.current.scrollBy({ left: -450, behavior: "smooth" })
    }
  }

  const scrollRight = () => {
    if (trackRef.current) {
      trackRef.current.scrollBy({ left: 450, behavior: "smooth" })
    }
  }

  return (
    <CarouselContainer>
      {title && (
        <CarouselHeader>
          <CarouselTitle variant="h5">{title}</CarouselTitle>
          <CarouselControls>
            <IconButton onClick={scrollLeft} size="small">
              <ArrowBackIosNewIcon />
            </IconButton>
            <IconButton onClick={scrollRight} size="small">
              <ArrowForwardIosIcon />
            </IconButton>
          </CarouselControls>
        </CarouselHeader>
      )}

      <CarouselTrack ref={trackRef}>
        {cards.map((card, index) => (
          <CarouselItem key={index}>
            <LearnCard
              {...card}
              onClick={() => onCardClick && onCardClick(index)}
            />
          </CarouselItem>
        ))}
      </CarouselTrack>
    </CarouselContainer>
  )
}

export default LearnCardCarousel
