import { TwoColumnPanel, ScrollToButton } from "@repo/ui"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { useTranslation } from "@repo/i18n"
import { motion } from "@repo/motion"

interface HomePanelProps {
  id?: string
  scrollToId?: string // scroll target for the scroll button
}

export default function HomePanel({
  id = "home",
  scrollToId = "content-panels",
}: HomePanelProps) {
  const theme = useTheme()
  const { t } = useTranslation()

  return (
    <Box
      sx={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: `
            radial-gradient(circle at 25% 67%, rgba(42, 82, 135, 0.8) 0%, rgba(26, 54, 93, 0.9) 50%, rgba(15, 30, 60, 1) 100%),
            linear-gradient(45deg, rgba(42, 82, 135, 0.1) 0%, rgba(100, 164, 214, 0.1) 100%)
          `,
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: `
              radial-gradient(circle at 25% 67%, rgba(100, 164, 214, 0.4) 0%, transparent 60%),
              radial-gradient(circle at 75% 30%, rgba(146, 193, 213, 0.2) 0%, transparent 40%)
            `,
            animation: "shimmer 8s ease-in-out infinite alternate",
          },
          "@keyframes shimmer": {
            "0%": {
              opacity: 0.3,
              transform: "scale(1) rotate(0deg)",
            },
            "100%": {
              opacity: 0.7,
              transform: "scale(1.1) rotate(2deg)",
            },
          },
        }}
      />

      {/* Wave pattern of circular images */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "33.33vh", // Top third of viewport
          zIndex: theme.zIndex.introBackgroundImages,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        {Array.from({ length: 16 }, (_, i) => {
          // Wave pattern across the width
          const xPosition = (i / 15) * 100 // Distribute evenly across width (0% to 100%)
          const waveHeight = Math.sin((i / 15) * Math.PI * 3) * 15 + 50 // Sine wave with 3 cycles, amplitude 15%, center at 50%
          const imageNumber = (i % 16) + 1 // Cycle through images 1-16
          const size = 60 + Math.sin((i / 15) * Math.PI * 2) * 20 // Varying sizes 40-80px

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: -50 }}
              animate={{
                opacity: 0.8, // Fade in once to 80% and stay there
                y: [0, -10, 0, -5], // Bobbing motion
                rotate: [0, 5, -5, 0], // Rocking motion
              }}
              transition={{
                opacity: { delay: i * 0.1, duration: 0.8, ease: "easeOut" }, // Fade in once
                y: {
                  delay: i * 0.1 + 0.8,
                  duration: 4,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                }, // Bobbing
                rotate: {
                  delay: i * 0.1 + 0.8,
                  duration: 4,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                }, // Rocking
              }}
              style={{
                position: "absolute",
                left: `${xPosition}%`,
                top: `${waveHeight}%`,
                transform: "translate(-50%, -50%)",
                zIndex: 1,
              }}
            >
              <Box
                component="img"
                src={`/images/circular-crops/${imageNumber}.png`}
                alt={`Circular crop ${imageNumber}`}
                sx={{
                  width: `${size}px`,
                  height: `${size}px`,
                  borderRadius: "50%",
                  opacity: 0.8,
                  filter: "brightness(1.1) contrast(1.1)",
                  boxShadow: "0 4px 20px rgba(42, 82, 135, 0.3)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "scale(1.1)",
                    opacity: 1,
                  },
                }}
              />
            </motion.div>
          )
        })}
      </Box>

      {/* Text content */}
      <TwoColumnPanel
        id={id}
        fullHeight={true}
        fullWidth={true}
        backgroundColor="transparent"
        includeHeaderSpacing={true}
        contentColumn="left"
        contentAlignment={{
          justifyContent: { xs: "flex-end", md: "flex-end", lg: "center" },
          alignItems: "flex-start",
        }}
        sx={{
          position: "relative",
        }}
        leftContent={
          <Box
            sx={{
              maxWidth: "50vw",
              textAlign: "left",
              zIndex: theme.zIndex.introText,
              position: "absolute",
              top: "66.67vh", // Position at 2/3 down the viewport height
              left: 0,
              transform: "translateY(-50%)",
            }}
          >
            {/* Text animation */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 2, // Text fade in
                duration: 1.5,
                ease: "easeOut",
              }}
            >
              <Typography
                variant="h1"
                component="h1"
                sx={{
                  mb: (theme) => theme.layout.spacing.md,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  lineHeight: 1.2,
                  fontSize: "4.8rem",
                  color: "white",
                }}
              >
                {t("heroPanel.title")}
              </Typography>
            </motion.div>

            {/* Arrow positioned at text block midpoint */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-start",
                mt: (theme) => theme.layout.spacing.xl,
              }}
            >
              <ScrollToButton
                scrollToId={scrollToId}
                color="white" // White arrow on dark background
              />
            </Box>
          </Box>
        }
      />
    </Box>
  )
}
