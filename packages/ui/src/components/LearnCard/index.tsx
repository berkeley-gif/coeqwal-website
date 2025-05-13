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
  width: "429px",
  height: cardType === "resource" ? "380px" : "320px",
  wordWrap: "break-word",
  backgroundColor: "#fff",
  backgroundClip: "border-box",
  border: "1px solid #fff",
  borderRadius: 0,
  transition: "transform 0.2s, box-shadow 0.2s",
  "&:hover": {
    transform: "translateY(-5px)",
    boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
    cursor: "pointer",
  },
}))

const CardImageWrapper = styled(Box)({
  height: "220px",
  overflow: "hidden",
  position: "relative",
})

const CardImage = styled("img")({
  width: "100%",
  height: "100%",
  objectFit: "cover",
})

const StyledButton = styled(Button)(({ theme }) => ({
  textDecoration: "none",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  cursor: "pointer",
  borderRadius: "50rem",
  padding: "0.5em 1em",
  fontSize: "1.4rem",
  lineHeight: 1.5,
  transition:
    "color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out",
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
        return "EXPLORE"
      case "article":
        return "READ MORE"
      case "video":
        return "WATCH"
      default:
        return "DISCOVER"
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
      {image && (
        <CardImageWrapper>
          <CardImage src={image} alt={title} />
        </CardImageWrapper>
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
          variant="body2"
          sx={{
            flexGrow: 1,
            mb: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
          }}
        >
          {content}
        </Typography>

        <StyledButton
          variant="outlined"
          sx={{
            alignSelf: "flex-start",
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

        {type && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              bgcolor: buttonColor,
              color: "white",
              px: 2,
              py: 0.5,
            }}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Box>
        )}
      </CardContent>
    </StyledCard>
  )
}

export default LearnCard
