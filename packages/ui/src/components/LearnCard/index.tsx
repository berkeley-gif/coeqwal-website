import React, { useMemo } from "react"
import { Card, CardContent, Typography, Box, Button } from "@mui/material"
import { styled } from "@mui/material/styles"

export interface LearnCardProps {
  title: string
  content: string
  image?: string
  type?: "resource" | "article" | "video"
  onClick?: () => void
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
  width: "100%", // Make card take full width of parent
  height: "380px", // Consistent height for all cards
  wordWrap: "break-word",
  backgroundColor: "transparent", // Changed from #fff to transparent
  backgroundClip: "border-box",
  border: "1px solid rgba(255, 255, 255, 0.6)", // Changed from #fff to semi-transparent white
  borderRadius: "8px", // Added 8px border radius
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
  objectPosition: "center", // Center the image
})

// Updated button style to match HeaderHome
const StyledButton = styled(Button)(() => ({
  textTransform: "none",
  borderRadius: "50rem", // Rounded pill
  boxShadow: "none",
  padding: "6px 16px",
  minWidth: 64,
  lineHeight: 1.75,
  fontSize: "0.95rem",
  fontWeight: 500,
  height: "36px", // Fixed height to match HeaderHome
  minHeight: "36px", // Min height to match HeaderHome
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
}) => {
  // Determine button text based on card type
  const getButtonText = () => {
    // Always return "Explore" for all card types
    return "Explore"
  }

  // Determine button color based on card type
  const getButtonColor = () => {
    return getCardColor(type)
  }

  const buttonColor = getButtonColor()

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
          title={title} // Show full title on hover
          sx={{ color: "#fff" }} // Make title text white
        >
          {truncatedTitle}
        </Typography>

        <Typography
          variant="body1"
          sx={{
            flexGrow: 1,
            mb: 3,
            color: "#fff", // Make content text white
          }}
          title={content} // Show full content on hover
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
              color: "#fff", // Changed from buttonColor to white
              borderColor: "#fff", // Changed from buttonColor to white
              pointerEvents: "auto",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.2)", // Semi-transparent white on hover
                color: "#fff", // Keep text white on hover
                borderColor: "#fff", // Keep border white on hover
              },
            }}
            onClick={(e) => {
              e.stopPropagation() // Prevent card onClick from triggering
              if (onClick) onClick()
            }}
          >
            {getButtonText()}
          </StyledButton>
        </Box>
      </CardContent>
    </StyledCard>
  )
}

export default LearnCard
