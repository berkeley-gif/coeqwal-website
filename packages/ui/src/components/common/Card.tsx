"use client"

import React from "react"
import { Box, Paper, PaperProps, Typography, Divider } from "@mui/material"
import { styled, useTheme } from "@mui/material/styles"

export interface CardProps extends Omit<PaperProps, "color"> {
  children: React.ReactNode
  header?: React.ReactNode
  footer?: React.ReactNode
  actions?: React.ReactNode
  color?: "default" | "primary" | "secondary" | "pop"
  width?: string | number
  height?: string | number
}

export interface ScenarioCardProps extends Omit<CardProps, "children"> {
  topLine: string
  headline: string
  body: string | React.ReactNode
  bottomLine?: string | React.ReactNode
  dropdownContent?: React.ReactNode
}

// Helper component to create standardized lists for ScenarioCard bodies
export const ScenarioCardList: React.FC<{ items: string[] }> = ({ items }) => {
  const theme = useTheme()
  return (
    <Box component="div" sx={theme.mixins.scenarioCardList}>
      <ul>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </Box>
  )
}

const StyledCard = styled(Paper, {
  shouldForwardProp: (prop) =>
    prop !== "color" && prop !== "width" && prop !== "height",
})<{ color?: string; width?: string | number; height?: string | number }>(
  ({ theme, color = "default", width = "100%", height = "auto" }) => ({
    borderRadius: theme.borderRadius.card,
    backgroundColor: theme.palette.common.white,
    color: theme.palette.blue.darkest,
    fontFamily: theme.typography.fontFamily,
    width: width, // Width 100%, overrideable
    height: height, // Height auto, overrideable
    overflow: "hidden",
    transition: "none",
    border: theme.border.none,
    padding: theme.spacing(4),
    boxShadow: "none",

    // Color variants as accent borders
    ...(color === "primary" && {
      borderLeft: `4px solid ${theme.palette.primary.main}`,
    }),
    ...(color === "secondary" && {
      borderLeft: `4px solid ${theme.palette.secondary.main}`,
    }),
    ...(color === "pop" && {
      borderLeft: `4px solid ${theme.palette.accent.gold}`,
    }),
  }),
)

const CardHeader = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  paddingBottom: theme.spacing(2),
  borderBottom: theme.border.thin,
}))

const CardContent = styled(Box)({
  // No additional padding as it's handled by StyledCard
})

const CardFooter = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(3),
  paddingTop: theme.spacing(2),
  borderTop: theme.border.thin,
}))

const CardActions = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  display: "flex",
  justifyContent: "flex-end",
  gap: theme.spacing(1),
}))

/**
 * Card component that follows MUI v7 patterns
 * Uses Paper as base with custom styling for different card sections
 */
export function Card({
  children,
  elevation = 0,
  variant = "elevation",
  header,
  footer,
  actions,
  color = "default",
  width,
  height,
  sx,
  ...rest
}: CardProps) {
  return (
    <StyledCard
      elevation={elevation}
      variant={variant}
      color={color}
      width={width}
      height={height}
      sx={sx}
      {...rest}
    >
      {header && <CardHeader>{header}</CardHeader>}
      <CardContent>{children}</CardContent>
      {actions && <CardActions>{actions}</CardActions>}
      {footer && <CardFooter>{footer}</CardFooter>}
    </StyledCard>
  )
}

/**
 * Scenario Card component for displaying water scenario choices
 * Features: alt color small caps top line, sans serif headline, body text, optional bottom line with HR
 */
export function ScenarioCard({
  topLine,
  headline,
  body,
  bottomLine,
  dropdownContent,
  width,
  height,
  sx,
  ...rest
}: ScenarioCardProps) {
  return (
    <StyledCard width={width} height={height} sx={sx} {...rest}>
      <CardContent>
        {/* Top line */}
        <Typography
          variant="overline"
          sx={{
            color: (theme) => theme.palette.blue.medium,
            textTransform: "uppercase",
            letterSpacing: "0.75px",
            fontSize: "0.75rem",
            fontWeight: 500,
            display: "block",
            mb: 0.5,
          }}
        >
          {topLine}
        </Typography>

        {/* Headline */}
        <Typography
          variant="h4"
          sx={{
            color: (theme) => theme.palette.blue.darkest,
            fontFamily:
              '"neue-haas-grotesk-text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', // Use headline font
            fontWeight: 500,
            fontSize: "1.5rem", // 24px - slightly smaller than default h4
            lineHeight: 1.3,
            mb: 2,
          }}
        >
          {headline}
        </Typography>

        {/* Body text */}
        {typeof body === "string" ? (
          <Typography
            variant="body1"
            sx={{
              color: (theme) => theme.palette.blue.darkest,
              fontFamily: (theme) => theme.typography.fontFamily,
              fontSize: "1rem", // 16px - larger than body2
              lineHeight: 1.6,
              mb: bottomLine ? 3 : 0,
            }}
          >
            {body}
          </Typography>
        ) : (
          <Box
            sx={{
              color: (theme) => theme.palette.blue.darkest,
              fontFamily: (theme) => theme.typography.fontFamily,
              fontSize: "1rem",
              lineHeight: 1.6,
              mb: bottomLine ? 3 : 0,
              "& .MuiTypography-root": {
                color: (theme) => theme.palette.blue.darkest,
                fontFamily: (theme) => theme.typography.fontFamily,
              },
            }}
          >
            {body}
          </Box>
        )}

        {/* Optional bottom line with divider */}
        {bottomLine && (
          <>
            <Divider
              sx={{
                my: 2.5,
                borderColor: (theme) => theme.palette.grey[200],
                opacity: 0.6,
              }}
            />
            {typeof bottomLine === "string" ? (
              <Typography
                variant="body2"
                sx={{
                  color: (theme) => theme.palette.blue.medium,
                  fontFamily: (theme) => theme.typography.fontFamily,
                  fontWeight: 500,
                  fontSize: "0.95rem",
                }}
              >
                {bottomLine}
              </Typography>
            ) : (
              <Box
                sx={{
                  color: (theme) => theme.palette.blue.medium,
                  fontFamily: (theme) => theme.typography.fontFamily,
                  fontWeight: 500,
                  fontSize: "0.95rem",
                  "& .MuiTypography-root": {
                    color: (theme) => theme.palette.blue.medium,
                    fontFamily: (theme) => theme.typography.fontFamily,
                    fontWeight: 500,
                  },
                }}
              >
                {bottomLine}
              </Box>
            )}
          </>
        )}

        {/* Optional dropdown content with HR separator */}
        {dropdownContent && (
          <>
            <Divider sx={{ my: 2, borderColor: "text.secondary" }} />
            <Box
              sx={{
                color: (theme) => theme.palette.blue.darkest,
                fontFamily: (theme) => theme.typography.fontFamily,
                "& .MuiTypography-root": {
                  color: (theme) => theme.palette.blue.darkest,
                  fontFamily: (theme) => theme.typography.fontFamily,
                },
              }}
            >
              {dropdownContent}
            </Box>
          </>
        )}
      </CardContent>
    </StyledCard>
  )
}
