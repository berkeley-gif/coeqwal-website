import type { Metadata } from "next"
import Script from "next/script"
import { ThemeRegistry } from "@repo/ui/themes/ThemeRegistry"
import { TranslationProvider } from "@repo/i18n"
import { MapProvider } from "@repo/map"
import "./globals.css"
import "./fonts.css" // Import Adobe Fonts

// Font configuration
const FONT_FAMILY = "akzidenz-grotesk-next-pro"
const FONT_VARIABLE = "--font-akzidenz-grotesk-next-pro"

// Font weights for akzidenzNextPro
const fontWeights = {
  light: 300,
  regular: 400,
  medium: 500,
  bold: 700,
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
  return (
    <html lang="en" className={FONT_VARIABLE}>
      {/* Add Adobe Fonts using Typekit embed code */}
      <Script
        id="adobe-fonts"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(d) {
              var config = {
                kitId: 'rxm7kha',
                scriptTimeout: 3000,
                async: true
              },
              h=d.documentElement,t=setTimeout(function(){h.className=h.className.replace(/\bwf-loading\b/g,"")+" wf-inactive";},config.scriptTimeout),tk=d.createElement("script"),f=false,s=d.getElementsByTagName("script")[0],a;h.className+=" wf-loading";tk.src='https://use.typekit.net/'+config.kitId+'.js';tk.async=true;tk.onload=tk.onreadystatechange=function(){a=this.readyState;if(f||a&&a!="complete"&&a!="loaded")return;f=true;clearTimeout(t);try{Typekit.load(config)}catch(e){}};s.parentNode.insertBefore(tk,s);
            })(document);
          `,
        }}
      />
      <body>
        <TranslationProvider initialLocale="en">
          <ThemeRegistry fontFamily={FONT_FAMILY} fontWeights={fontWeights}>
            <MapProvider>{children}</MapProvider>
          </ThemeRegistry>
        </TranslationProvider>
      </body>
    </html>
  )
}
