import { createTheme } from "@mui/material/styles";
import { Geist, Inter } from "next/font/google";

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const baseTheme = createTheme();

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
      main: "#dc004e",
    },
    text: {
      primary: "#fff",
      secondary: "#fff",
    },
    divider: "#e0e0e0",
    background: {
      default: "#4384cf",
      paper: "#fff",
    },
  },
  typography: {
    htmlFontSize: 16,
    fontFamily: `${inter.style.fontFamily}, Arial, sans-serif`,
    fontSize: 16,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    h1: {
      fontSize: "clamp(2rem, 5vw, 5rem)",
      fontWeight: 600,
      lineHeight: 1,
      letterSpacing: "-0.01562em",
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
      fontSize: "2rem",
      fontWeight: 400,
      lineHeight: 1.167,
      letterSpacing: "0em",
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
      fontSize: "1.25rem",
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: "0.00938em",
    },
    body2: {
      fontSize: "1rem",
      fontWeight: 400,
      lineHeight: 1.43,
      letterSpacing: "0.01071em",
    },
    button: {
      fontSize: "1rem",
      fontWeight: 500,
      lineHeight: 1.75,
      textTransform: "uppercase",
    },
    caption: {
      fontSize: "0.809rem",
      fontWeight: 400,
      lineHeight: 1.66,
      letterSpacing: "0.03333em",
    },
  },
  shape: {
    borderRadius: 4,
  },
  zIndex: {
    appBar: 1100,
    drawer: 1200,
    modal: 1300,
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
      defaultProps: {
        variant: "outlined",
        size: "large",
        color: "inherit",
      },
      styleOverrides: {
        root: ({ theme }) => ({
          textTransform: "none",
          border: theme.border.primary,
          backgroundColor: theme.background.transparent,
          borderRadius: theme.shape.borderRadius * 6,
        }),
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          width: "100%",
          height: "100vh",
          maxWidth: "none",
          margin: 0,
          padding: "clamp(2rem, 10vw, 10rem)",
          paddingTop: "calc(clamp(2rem, 10vw, 10rem) + 64px)",
          ...(() => {
            const paddingValue = "clamp(2rem, 10vw, 10rem)";
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
            };
          })(),
        },
      },
    },
  },
});

theme.border = {
  primary: "1px solid white",
} as const;

theme.background = {
  transparent: "transparent",
} as const;

// TypeScript declarations for our custom theme properties
declare module "@mui/material/styles" {
  interface Theme {
    border: {
      primary: string;
    };
    background: {
      transparent: string;
    };
  }
  interface ThemeOptions {
    border?: {
      primary?: string;
    };
    background?: {
      transparent?: string;
    };
  }
}

export default theme;
