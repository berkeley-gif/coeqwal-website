import React from "react"
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
})<StyledCardProps>(({ theme, cardType }) => ({
  position: "relative",
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
  width: "100%", // Make card take full width of parent
  height: "380px", // Consistent height for all cards
  wordWrap: "break-word",
  backgroundColor: "#fff",
  backgroundClip: "border-box",
  border: "1px solid #fff",
  borderRadius: "8px", // Added 8px border radius
  transition: "transform 0.2s, box-shadow 0.2s",
  "&:hover": {
    transform: "translateY(-5px)",
    boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
    cursor: "pointer",
  },
}))

const CardImageWrapper = styled(Box)({
  height: "220px", // Consistent height for all card images
  overflow: "hidden",
  position: "relative",
})

const CardImage = styled("img")({
  width: "100%",
  height: "100%",
  objectFit: "cover",
})

// Default empty image placeholder
const EmptyImagePlaceholder = styled(Box)({
  height: "220px", // Same height as the image wrapper
  backgroundColor: "#e0e0e0", // Light gray background
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
})

// Updated button style to match HeaderHome
const StyledButton = styled(Button)(({ theme }) => ({
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

const LearnCard: React.FC<LearnCardProps> = ({
  title,
  content,
  image,
  type = "resource",
  onClick,
}) => {
  // Determine button text based on card type
  const getButtonText = () => {
    switch (type) {
      case "resource":
        return "Explore"
      case "article":
        return "Read More"
      case "video":
        return "Watch"
      default:
        return "Discover"
    }
  }

  // Determine button color based on card type
  const getButtonColor = () => {
    switch (type) {
      case "resource":
        return "#1A3F6A" // Deep blue
      case "video":
        return "#005B6E" // Teal
      case "article":
        return "#3A3F79" // Purple
      default:
        return "#1A3F6A" // Default to blue
    }
  }

  const buttonColor = getButtonColor()

  return (
    <StyledCard cardType={type} onClick={onClick}>
      {/* Always render an image container, either with image or placeholder */}
      {image ? (
        <CardImageWrapper>
          <CardImage src={image} alt={title} />
        </CardImageWrapper>
      ) : (
        <EmptyImagePlaceholder />
      )}
      <CardContent
        sx={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          padding: 3,
        }}
      >
        <Typography variant="h6" component="h3" gutterBottom>
          {title}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            flexGrow: 1,
            mb: 3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
          }}
        >
          {content}
        </Typography>

        <Box
          sx={{ display: "flex", justifyContent: "flex-end", width: "100%" }}
        >
          <StyledButton
            variant="outlined"
            sx={{
              backgroundColor: "transparent",
              color: buttonColor,
              borderColor: buttonColor,
              "&:hover": {
                backgroundColor: buttonColor,
                color: "#fff",
              },
            }}
            onClick={(e) => {
              e.stopPropagation() // Prevent card onClick from triggering
              onClick && onClick()
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
