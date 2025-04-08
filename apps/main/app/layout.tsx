import type { Metadata } from "next"
import {
  Inter_Tight,
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
} from "next/font/google"
import { ThemeRegistry } from "@repo/ui/themes/ThemeRegistry"
import { TranslationProvider } from "@repo/i18n"
import { MapProvider } from "@repo/map"
import "./globals.css"

// Font configuration
// To try a different font, change the ACTIVE_FONT value
const ACTIVE_FONT = "interTight" // Options: interTight, lexend, nokora, roboto, montserrat, openSans, poppins, nunito, rubik, sourceSans, workSans

// Define font instances
const interTight = Inter_Tight({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
  variable: "--font-inter-tight",
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

// Mapping of font names to font instances
const fontMap = {
  interTight,
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
}

// Mapping of font variable names to CSS font family names
const fontFamilyMap = {
  interTight: "Inter Tight",
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

  return (
    <html lang="en" className={fontClasses}>
      <body className={`${activeFont.className}`}>
        <TranslationProvider initialLocale="en">
          <ThemeRegistry
            fontFamily={
              fontFamilyMap[ACTIVE_FONT as keyof typeof fontFamilyMap]
            }
          >
            <MapProvider>{children}</MapProvider>
          </ThemeRegistry>
        </TranslationProvider>
      </body>
    </html>
  )
}
