/**
 * storyTheme - Theme variant for Storybook documentation
 *
 * Extends the base theme with font variations for component showcasing.
 */

import { createTheme } from "@mui/material/styles"
import baseTheme from "./theme"

const themeValues = {
  fontFamily: {
    primary:
      '"akzidenz-grotesk-next-pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    inter:
      '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    neueHaasDisplay:
      '"neue-haas-grotesk-display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    neueHaasText:
      '"neue-haas-grotesk-text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    sentinel: '"sentinel", Georgia, "Times New Roman", Times, serif',
    sofiaPro:
      '"sofia-pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    // TEST FONT - Tiempos Headline
    tiemposHeadline:
      '"Tiempos Headline", Georgia, "Times New Roman", Times, serif',
    // TEST FONT - Tiempos Text
    tiemposText: '"Tiempos Text", Georgia, "Times New Roman", Times, serif',
    // TEST FONT - Tiempos Subhead
    ingeborgTrial: '"Ingeborg Trial", Georgia, "Times New Roman", Times, serif',
    // Acumin Pro from Adobe fonts
    acuminPro:
      '"acumin-pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    // Calluna from Adobe fonts
    calluna: '"calluna", Georgia, "Times New Roman", Times, serif',
    // New test fonts
    crimsonText: '"Crimson Text", Georgia, "Times New Roman", Times, serif',
    charter: '"charter-bt-pro", Georgia, "Times New Roman", Times, serif',
    georgia: 'Georgia, "Times New Roman", Times, serif',
  },
}

//TODO: remove the fontfamily settings to keep up with the main theme
const storyTheme = createTheme({
  ...baseTheme,
  typography: {
    ...baseTheme.typography,
    fontFamily: themeValues.fontFamily.ingeborgTrial,
    body1: {
      ...baseTheme.typography.body1,
      fontSize: "0.875rem", // xs default
      lineHeight: 1.5,
      color: "#f2f0ef",
      "@media (min-width: 1200px)": {
        fontSize: "1.2rem",
      },
      "@media (min-width: 1536px)": {
        fontSize: "1.5rem",
      },
    },
    h2: {
      ...baseTheme.typography.h2,
      fontFamily: themeValues.fontFamily.ingeborgTrial,
      color: "#f2f0ef",
      "@media (min-width: 1200px)": {
        fontSize: "3.35rem",
      },
      "@media (min-width: 1536px)": {
        fontSize: "4.8rem",
      },
    },
    h3: {
      ...baseTheme.typography.h3,
      fontFamily: themeValues.fontFamily.ingeborgTrial,
      color: "#f2f0ef",
      "@media (min-width: 1200px)": {
        fontSize: "1.8rem",
      },
      "@media (min-width: 1536px)": {
        fontSize: "2.778rem",
      },
    },
    h4: {
      ...baseTheme.typography.h4,
      fontFamily: themeValues.fontFamily.ingeborgTrial,
      color: "#f2f0ef",
      "@media (min-width: 1200px)": {
        fontSize: "1.6rem",
      },
      "@media (min-width: 1536px)": {
        fontSize: "1.8rem",
      },
    },
    body2: {
      ...baseTheme.typography.body2,
      fontSize: "1rem",
      color: "rgba(242, 240, 239, 0.7)",
      letterSpacing: "normal",
      lineHeight: 1.5,
    },
    caption: {
      ...baseTheme.typography.caption,
      color: "rgba(242, 240, 239, 0.7)",
      lineHeight: 1,
    },
  },
  components: {
    ...baseTheme.components,
    MuiCssBaseline: {
      styleOverrides: `
        @import url("https://use.typekit.net/rxm7kha.css");
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");
        @import url("https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;600;700&display=swap");
        
        /* Tiempos Headline Font - All Weights */
        @font-face {
          font-family: 'Tiempos Headline';
          src: url('/fonts/test-tiempos-headline-light.woff2') format('woff2');
          font-weight: 300;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'Tiempos Headline';
          src: url('/fonts/test-tiempos-headline-regular.woff2') format('woff2');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'Tiempos Headline';
          src: url('/fonts/test-tiempos-headline-medium.woff2') format('woff2');
          font-weight: 500;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'Tiempos Headline';
          src: url('/fonts/test-tiempos-headline-semibold.woff2') format('woff2');
          font-weight: 600;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'Tiempos Headline';
          src: url('/fonts/test-tiempos-headline-bold.woff2') format('woff2');
          font-weight: 700;
          font-style: normal;
          font-display: swap;
        }
        
        /* Tiempos Text Font - All Weights */
        @font-face {
          font-family: 'Tiempos Text';
          src: url('/fonts/test-tiempos-text-regular.woff2') format('woff2');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'Tiempos Text';
          src: url('/fonts/test-tiempos-text-medium.woff2') format('woff2');
          font-weight: 500;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'Tiempos Text';
          src: url('/fonts/test-tiempos-text-semibold.woff2') format('woff2');
          font-weight: 600;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'Tiempos Text';
          src: url('/fonts/test-tiempos-text-bold.woff2') format('woff2');
          font-weight: 700;
          font-style: normal;
          font-display: swap;
        }
        
        /* Crimson Text Font */
        @font-face {
          font-family: 'Crimson Text';
          src: url('https://fonts.gstatic.com/s/crimsontext/v19/wlp2gwHKFkZgtmSR3NB0oRJfbwhT.woff2') format('woff2');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'Crimson Text';
          src: url('https://fonts.gstatic.com/s/crimsontext/v19/wlppgwHKFkZgtmSR3NB0oRJX1C1GA9c.woff2') format('woff2');
          font-weight: 600;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'Crimson Text';
          src: url('https://fonts.gstatic.com/s/crimsontext/v19/wlppgwHKFkZgtmSR3NB0oRJX1C1GA9c.woff2') format('woff2');
          font-weight: 700;
          font-style: normal;
          font-display: swap;
        }


        /* Ingeborg Trial Font Family */
        @font-face {
          font-family: 'Ingeborg Trial';
          src: url('/fonts/IngeborgTrial-Bold.otf') format('opentype');
          font-weight: 700;
          font-style: normal;
          font-display: swap;
        }
        
        *, *::before, *::after {
          box-sizing: border-box;
        }
        html, body, * {
          margin: 0;
          padding: 0;
          letter-spacing: normal;
          hyphens: none;
          -ms-hyphens: none;
          -webkit-hyphens: none;
        }
        html, body {
          margin: 0;
          padding: 0;
          height: 100%;
          font-family: ${themeValues.fontFamily.primary};
        }
        body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          font-family: ${themeValues.fontFamily.primary};
        }

      `,
    },
    MuiTypography: {
      styleOverrides: {
        gutterBottom: {
          marginBottom: "1rem",
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          color: "#f2f0ef",
          height: 5,
        },
        thumb: {
          height: 15,
          width: 15,
        },
        valueLabel: {
          backgroundColor: "var(--primary-color)",
          color: "var(--text-color)",
          fontSize: "1rem",
        },
        mark: {
          backgroundColor: "var(--text-color)", // Mark color
          height: 6,
          width: 6,
          borderRadius: "50%",
        },
        markLabel: {
          color: "var(--text-color)", // Mark label color
          fontSize: "0.9rem",
        },
      },
    },
  },
})

export default storyTheme
