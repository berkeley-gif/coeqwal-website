import { createTheme } from "@mui/material/styles"
import { Inter, Figtree } from "next/font/google"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
})

const figtree = Figtree({
  subsets: ["latin"],
  display: "swap",
})

const baseTheme = createTheme()

const theme = createTheme({
  ...baseTheme,
  palette: {
    common: {
      black: "#000",
      white: "#fff",
    },
    primary: {
      main: "#1976d2",
      light: "#42a5f5",
      dark: "#1565c0",
    },
    secondary: {
      main: "#11273f",
    },
    interstitial: {
      main: "#154f89",
    },
    text: {
      primary: "#fff",
      secondary: "#11273f",
    },
    divider: "#e0e0e0",
    background: {
      default: "#4384cf",
      paper: "#fff",
    },
  },
  typography: {
    htmlFontSize: 16,
    fontFamily: `RM-Neue, ${figtree.style.fontFamily}, Arial, sans-serif`,
    fontSize: 16,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    h1: {
      fontFamily: `RM-Neue-SemiBold, ${figtree.style.fontFamily}, Arial, sans-serif`,
      fontSize: "clamp(2rem, 5vw, 5rem)",
      fontWeight: 600,
      lineHeight: 0.95,
      letterSpacing: "-0.01562rem",
      marginBottom: "3rem !important",
      [baseTheme.breakpoints.down("md")]: {
        lineHeight: 1.2,
        fontSize: "3.2rem",
      },
    },
    h2: {
      fontSize: "2.618rem",
      fontWeight: 300,
      lineHeight: 1.2,
      letterSpacing: "-0.00833em",
    },
    h3: {
      fontFamily: `${inter.style.fontFamily}, Arial, sans-serif`,
      fontSize: "2rem",
      fontWeight: 400,
      lineHeight: 1.167,
    },
    h4: {
      fontSize: "1.618rem",
      fontWeight: 400,
      lineHeight: 1.235,
      letterSpacing: "0.00735em",
    },
    h5: {
      fontSize: "1.25rem",
      fontWeight: 400,
      lineHeight: 1.334,
      letterSpacing: "0em",
    },
    h6: {
      fontSize: "1rem",
      fontWeight: 500,
      lineHeight: 1.6,
      letterSpacing: "0.0075em",
    },
    subtitle1: {
      fontWeight: 400,
      fontSize: "1rem",
      lineHeight: 1.75,
      letterSpacing: "0.00938rem",
    },
    subtitle2: {
      fontWeight: 500,
      fontSize: "0.875rem",
      lineHeight: 1.57,
      letterSpacing: "0.00714rem",
    },
    body1: {
      fontFamily: `RM-Neue-SemiBold, ${figtree.style.fontFamily}, Arial, sans-serif`,
      fontSize: "1.3333rem",
      fontWeight: 400,
      lineHeight: 1.6,
      marginBottom: "1.125rem",
      letterSpacing: "0.01071em",
    },
    body2: {
      fontFamily: `RM-Neue-SemiBold, ${figtree.style.fontFamily}, Arial, sans-serif`,
      fontSize: "1.3333rem",
      fontWeight: 400,
      lineHeight: 1.43,
      marginBottom: "1.125rem",
      letterSpacing: "0.01071em",
    },
    button: {
      fontSize: "1rem",
      fontWeight: 500,
      textTransform: "uppercase",
    },
    caption: {
      fontSize: "0.809rem",
      fontWeight: 400,
      lineHeight: 1.66,
      letterSpacing: "0.03333em",
    },
    listItem: {
      fontSize: "1.5rem",
      fontWeight: 400,
      lineHeight: 1.5,
    },
  },
  shape: {
    borderRadius: 4,
  },
  zIndex: {
    drawer: 1200,
    modal: 1300,
    appBar: 1400,
    tooltip: 1500,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.background.transparent,
          borderBottom: theme.border.primary,
          boxShadow: "none",
        }),
      },
    },
    MuiButton: {
      variants: [
        {
          props: { variant: "outlined" },
          style: {
            border: "1px solid",
            borderColor: "currentColor",
          },
        },
        {
          props: { variant: "pill" },
          style: {
            border: "1px solid",
            borderColor: "currentColor",
            borderRadius: "999px",
            paddingInline: "24px",
            textTransform: "none",
          },
        },
      ],
      defaultProps: {
        variant: "pill",
      },
      styleOverrides: {
        root: {
          margin: "0.25rem !important",
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          padding: "8px 16px",
        },
      },
    },
    MuiListItemText: {
      defaultProps: {
        primaryTypographyProps: {
          variant: "listItem",
        },
      },
      styleOverrides: {
        root: {
          marginBottom: 0,
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          width: "100%",
          minHeight: "100vh",
          maxWidth: "none",
          margin: 0,
          paddingLeft: "clamp(2rem, 10vw, 10rem)",
          paddingRight: "clamp(2rem, 10vw, 10rem)",
          pointerEvents: "none",
          ...(() => {
            const paddingValue = "clamp(2rem, 10vw, 10rem)"
            return {
              "@media (min-width: 600px)": {
                paddingLeft: paddingValue,
                paddingRight: paddingValue,
                maxWidth: "none",
              },
              "@media (min-width: 960px)": {
                paddingLeft: paddingValue,
                paddingRight: paddingValue,
                maxWidth: "none",
              },
              "@media (min-width: 1280px)": {
                paddingLeft: paddingValue,
                paddingRight: paddingValue,
                maxWidth: "none",
              },
            }
          })(),
        },
      },
    },
    MuiSvgIcon: {
      styleOverrides: {
        root: ({ theme }) => ({
          color: "inherit",
          fontSize: "inherit",
          transition: "color 0.2s ease-in-out",
          pointerEvents: "auto",

          "&:hover, &:focus": {
            color: theme.palette.primary.light,
          },
        }),
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          color: baseTheme.palette.text.secondary,
          width: 400,
          top: 65,
          height: "calc(100% - 65px)",
        },
      },
    },
  },
})

theme.border = {
  primary: "1px solid white",
} as const

theme.background = {
  transparent: "transparent",
} as const

// TYPESCRIPT CUSTOMIZATIONS

// Custom palette colors
declare module "@mui/material/styles" {
  interface Palette {
    interstitial: Palette["primary"]
  }
  interface PaletteOptions {
    interstitial?: PaletteOptions["primary"]
  }
}

// Custom button variants
declare module "@mui/material/Button" {
  interface ButtonPropsVariantOverrides {
    pill: true
  }
}

// Custom typography variants
declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    listItem: true
  }
}

// Custom theme properties
declare module "@mui/material/styles" {
  interface TypographyVariants {
    listItem: React.CSSProperties
  }

  interface TypographyVariantsOptions {
    listItem?: React.CSSProperties
  }

  interface Theme {
    border: {
      primary: string
    }
    background: {
      transparent: string
    }
  }
  interface ThemeOptions {
    border?: {
      primary?: string
    }
    background?: {
      transparent?: string
    }
  }
}

export default theme
