import { Box, useTheme } from "@repo/ui/mui"

interface BlueThemeBackgroundProps {
  zIndex?: number
}

export function BlueThemeBackground({ zIndex }: BlueThemeBackgroundProps) {
  const theme = useTheme()

  return (
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
        zIndex: zIndex || theme.zIndex.introBackgroundImages,
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
          "0%": { opacity: 0.3, transform: "scale(1) rotate(0deg)" },
          "100%": { opacity: 0.7, transform: "scale(1.1) rotate(2deg)" },
        },
      }}
    />
  )
}