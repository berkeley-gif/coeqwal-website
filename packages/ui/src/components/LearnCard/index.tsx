import React, { useMemo } from "react"
import { Card, CardContent, Typography, Box, Button } from "@mui/material"
import { styled } from "@mui/material/styles"

export interface LearnCardProps {
  title: string
  content: string
  image?: string
  type?: "resource" | "article" | "video"
  onClick?: () => void
  buttonText?: string
  buttonAction?: "read-more" | "view-on-map" | "explore" | "custom"
  onReadMore?: () => void
  onViewOnMap?: () => void
}

interface StyledCardProps {
  cardType?: "resource" | "article" | "video"
}

// Use shouldForwardProp to prevent cardType from being passed to the DOM
const StyledCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== "cardType",
})<StyledCardProps>(() => ({
  position: "relative",
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
  width: "100%",
  height: "380px", // Consistent height for all cards
  wordWrap: "break-word",
  backgroundColor: "transparent",
  backgroundClip: "border-box",
  border: "1px solid rgba(255, 255, 255, 0.6)",
  borderRadius: "8px",
  pointerEvents: "auto", // Ensure hover effects work
  transition: "transform 0.2s, box-shadow 0.2s",
  "&:hover": {
    transform: "translateY(-5px)",
    boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
    cursor: "pointer",
  },
}))

const CardImage = styled("img")({
  width: "100%",
  height: "100%",
  objectFit: "cover",
  objectPosition: "center",
})

// Updated button style to match header
const StyledButton = styled(Button)(() => ({
  textTransform: "none",
  borderRadius: "50rem",
  boxShadow: "none",
  padding: "6px 16px",
  minWidth: 64,
  lineHeight: 1.75,
  fontSize: "0.95rem",
  fontWeight: 500,
  height: "36px", // Fixed height to match header
  minHeight: "36px", // Min height to match header
}))

// Function to truncate text at word boundaries
const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text

  // Find the last space before maxLength
  const lastSpace = text.lastIndexOf(" ", maxLength)

  // If no space found, just truncate at maxLength
  if (lastSpace === -1) return text.substring(0, maxLength) + "..."

  // Return text truncated at the last space
  return text.substring(0, lastSpace) + "..."
}

// Get color based on card type
const getCardColor = (
  type: "resource" | "article" | "video" | undefined,
): string => {
  switch (type) {
    case "resource":
      return "#2f84ab"
    case "video":
      return "#005B6E" // Teal
    case "article":
      return "#3A3F79" // Purple
    default:
      return "#2f84ab"
  }
}

const LearnCard: React.FC<LearnCardProps> = ({
  title,
  content,
  image,
  type = "resource",
  onClick,
  buttonText,
  buttonAction = "explore",
  onReadMore,
  onViewOnMap,
}) => {
  // Determine button text based on card type and props
  const getButtonText = () => {
    if (buttonText) return buttonText

    switch (buttonAction) {
      case "read-more":
        return "Read more"
      case "view-on-map":
        return "View on map"
      case "explore":
      case "custom":
      default:
        return "Explore"
    }
  }

  // Handle button click based on action type
  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card onClick from triggering

    switch (buttonAction) {
      case "read-more":
        if (onReadMore) onReadMore()
        break
      case "view-on-map":
        if (onViewOnMap) onViewOnMap()
        break
      case "explore":
      case "custom":
      default:
        if (onClick) onClick()
        break
    }
  }

  // Calculate truncated text versions
  const truncatedTitle = useMemo(() => truncateText(title, 80), [title])
  const truncatedContent = useMemo(() => truncateText(content, 200), [content])

  // Get the background color for the image placeholder
  const bgColor = getCardColor(type)

  return (
    <StyledCard cardType={type} onClick={onClick}>
      {/* Always render an image container, with colored background if no image */}
      <Box
        sx={{
          height: "100px",
          minHeight: "100px",
          maxHeight: "100px",
          width: "100%",
          overflow: "hidden",
          position: "relative",
          backgroundColor: bgColor, // Use type-specific background color
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {image && <CardImage src={image} alt={title} />}
      </Box>
      <CardContent
        sx={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          padding: 3,
          backgroundColor: "transparent", // Ensure content background is also transparent
        }}
      >
        <Typography
          variant="h6"
          component="h3"
          gutterBottom
          title={title}
          sx={{ color: "#fff" }}
        >
          {truncatedTitle}
        </Typography>

        <Typography
          variant="body1"
          sx={{
            flexGrow: 1,
            mb: 3,
            color: "#fff",
          }}
          title={content}
        >
          {truncatedContent}
        </Typography>

        <Box
          sx={{ display: "flex", justifyContent: "flex-end", width: "100%" }}
        >
          <StyledButton
            variant="outlined"
            sx={{
              alignSelf: "flex-end",
              backgroundColor: "transparent",
              color: "#fff",
              borderColor: "#fff",
              pointerEvents: "auto",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                color: "#fff",
                borderColor: "#fff",
              },
            }}
            onClick={handleButtonClick}
          >
            {getButtonText()}
          </StyledButton>
        </Box>
      </CardContent>
    </StyledCard>
  )
}

export default LearnCard
