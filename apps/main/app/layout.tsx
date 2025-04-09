import type { Metadata } from "next"
import {
  Inter_Tight,
  Inter,
  Lexend,
  Nokora,
  Roboto,
  Montserrat,
  Open_Sans,
  Poppins,
  Nunito,
  Rubik,
  Source_Sans_3,
  Work_Sans,
  Public_Sans,
  DM_Sans,
} from "next/font/google"
import { ThemeRegistry } from "@repo/ui/themes/ThemeRegistry"
import { TranslationProvider } from "@repo/i18n"
import { MapProvider } from "@repo/map"
import "./globals.css"
import "./fonts.css" // Import Adobe Fonts

// Font configuration
// To try a different font, change the ACTIVE_FONT value
const ACTIVE_FONT = "akzidenzNextPro"

// Define font instances
const interTight = Inter_Tight({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
  variable: "--font-inter-tight",
})

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
  variable: "--font-inter",
})

const lexend = Lexend({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
  variable: "--font-lexend",
})

const nokora = Nokora({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "700"],
  variable: "--font-nokora",
})

const roboto = Roboto({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
})

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
  variable: "--font-montserrat",
})

const openSans = Open_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
  variable: "--font-open-sans",
})

const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
  variable: "--font-poppins",
})

const nunito = Nunito({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
  variable: "--font-nunito",
})

const rubik = Rubik({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
  variable: "--font-rubik",
})

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
  variable: "--font-source-sans",
})

const workSans = Work_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
  variable: "--font-work-sans",
})

const publicSans = Public_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
  variable: "--font-public-sans",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
  variable: "--font-dm-sans",
})
// Mapping of font names to font instances
const fontMap = {
  interTight,
  inter,
  lexend,
  nokora,
  roboto,
  montserrat,
  openSans,
  poppins,
  nunito,
  rubik,
  sourceSans,
  workSans,
  publicSans,
  dmSans,
  // Adobe fonts
  akzidenzNextPro: {
    className: "",
    variable: "--font-akzidenz-grotesk-next-pro",
    weights: ["400", "500", "700"],
  },
  neueHaasDisplay: {
    className: "",
    variable: "--font-neue-haas-grotesk-display",
    weights: ["400", "500", "700"],
  },
  aktivGrotesk: {
    className: "",
    variable: "--font-aktiv-grotesk",
    weights: ["400", "500", "700"],
  },
  acuminPro: {
    className: "",
    variable: "--font-acumin-pro",
    weights: ["400", "500", "700"],
  },
  neueHaasText: {
    className: "",
    variable: "--font-neue-haas-grotesk-text",
    weights: ["400", "500", "700"],
  },
  neueHaasUnica: {
    className: "",
    variable: "--font-neue-haas-unica",
    weights: ["400", "500", "700"],
  },
  tradeGothicNext: {
    className: "",
    variable: "--font-trade-gothic-next",
    weights: ["400", "700"],
  },
  peridotVariable: {
    className: "",
    variable: "--font-peridot-pe-variable",
    weights: ["400", "500", "700"],
  },
  ttCommonsPro: {
    className: "",
    variable: "--font-tt-commons-pro",
    weights: ["400", "500", "700"],
  },
  arialNova: {
    className: "",
    variable: "--font-arial-nova",
    weights: ["400", "700"],
  },
  swiss721: {
    className: "",
    variable: "--font-swiss-721-bt",
    weights: ["400", "700"],
  },
  swiss721No2: {
    className: "",
    variable: "--font-swiss-721-bt-no2",
    weights: ["400", "700"],
  },
  universNextPro: {
    className: "",
    variable: "--font-univers-next-pro",
    weights: ["400", "500", "700"],
  },
}

// Mapping of font variable names to CSS font family names
const fontFamilyMap = {
  interTight: "Inter Tight",
  inter: "Inter",
  lexend: "Lexend",
  nokora: "Nokora",
  roboto: "Roboto",
  montserrat: "Montserrat",
  openSans: "Open Sans",
  poppins: "Poppins",
  nunito: "Nunito",
  rubik: "Rubik",
  sourceSans: "Source Sans 3",
  workSans: "Work Sans",
  publicSans: "Public Sans",
  dmSans: "DM Sans",
  // Adobe fonts
  akzidenzNextPro: "akzidenz-grotesk-next-pro",
  aktivGrotesk: "aktiv-grotesk",
  acuminPro: "acumin-pro",
  neueHaasDisplay: "neue-haas-grotesk-display",
  neueHaasText: "neue-haas-grotesk-text",
  neueHaasUnica: "neue-haas-unica",
  tradeGothicNext: "trade-gothic-next",
  peridotVariable: "peridot-pe-variable",
  ttCommonsPro: "tt-commons-pro",
  arialNova: "arial-nova",
  swiss721: "swiss-721-bt",
  swiss721No2: "swiss-721-bt-no2",
  universNextPro: "univers-next-pro",
}

// Get the active font
const activeFont = fontMap[ACTIVE_FONT as keyof typeof fontMap]

// The font family name to update in the theme file when changing fonts
console.log(`
===== FONT SYSTEM =====
Active font: ${ACTIVE_FONT}
Font family: "${fontFamilyMap[ACTIVE_FONT as keyof typeof fontFamilyMap]}"

To try a different font, change the ACTIVE_FONT constant in apps/main/app/layout.tsx
Available options: ${Object.keys(fontMap).join(", ")}
=====================
`)

// Define a common type for font configurations
type FontConfig = {
  className: string
  variable: string
  weights?: string[]
}

// Create a function to extract font weights data
const getFontWeights = (font: typeof ACTIVE_FONT) => {
  const fontConfig = fontMap[font as keyof typeof fontMap] as FontConfig
  const weights = fontConfig.weights || ["400", "500", "700"]
  return {
    light: Number(weights.find((w: string) => parseInt(w) < 400) || "300"),
    regular: 400,
    medium: Number(
      weights.find((w: string) => parseInt(w) > 400 && parseInt(w) < 700) ||
        "500",
    ),
    bold: Number(weights.find((w: string) => parseInt(w) >= 700) || "700"),
  }
}

export const metadata: Metadata = {
  title: "COEQWAL",
  description: "Alternative California water solutions",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Generate a className string with all font variables for easier swapping
  const fontClasses = Object.values(fontMap)
    .map((font) => font.variable)
    .join(" ")

  // For Adobe fonts, we don't need the className on body, the CSS variables are enough
  const isAdobeFont = ACTIVE_FONT.startsWith("adobe")

  // Get font weights for the active font
  const fontWeights = getFontWeights(ACTIVE_FONT)

  return (
    <html lang="en" className={fontClasses}>
      <body className={!isAdobeFont ? activeFont.className : ""}>
        <TranslationProvider initialLocale="en">
          <ThemeRegistry
            fontFamily={
              fontFamilyMap[ACTIVE_FONT as keyof typeof fontFamilyMap]
            }
            fontWeights={fontWeights}
          >
            <MapProvider>{children}</MapProvider>
          </ThemeRegistry>
        </TranslationProvider>
      </body>
    </html>
  )
}
