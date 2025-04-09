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
      {/* Add Adobe Fonts directly using Script component */}
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
              h=d.documentElement,t=setTimeout(function(){h.className=h.className.replace(/\bwf-loading\b/g,"")+" wf-inactive"; checkAndLoadFallback();},config.scriptTimeout),tk=d.createElement("script"),f=false,s=d.getElementsByTagName("script")[0],a;h.className+=" wf-loading";tk.src='https://use.typekit.net/'+config.kitId+'.js';tk.async=true;tk.onload=tk.onreadystatechange=function(){a=this.readyState;if(f||a&&a!="complete"&&a!="loaded")return;f=true;clearTimeout(t);try{Typekit.load(config)}catch(e){checkAndLoadFallback();}};s.parentNode.insertBefore(tk,s);
              
              // Fallback function to load the font via CSS if the main method fails
              function checkAndLoadFallback() {
                console.log("Checking if fonts need fallback loading");
                setTimeout(function() {
                  if (document.documentElement.className.indexOf('wf-inactive') !== -1 || 
                      document.documentElement.className.indexOf('wf-active') === -1) {
                    console.log("Loading fonts via fallback CSS method");
                    var link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = 'https://use.typekit.net/rxm7kha.css';
                    document.head.appendChild(link);
                  }
                }, 3500);
              }
            })(document);
          `,
        }}
      />
      {/* Add debugging script to check font loading */}
      <Script
        id="font-debug"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            // Wait for document to be ready
            document.addEventListener('DOMContentLoaded', function() {
              // Check after a delay to make sure fonts have had time to load
              setTimeout(function() {
                console.log("Font debugging:");
                console.log("- Body font-family:", getComputedStyle(document.body).fontFamily);
                console.log("- Is font loaded:", document.fonts.check("1em akzidenz-grotesk-next-pro"));
                console.log("- Document classes:", document.documentElement.className);
                
                // Check if all fonts are loaded
                document.fonts.ready.then(function() {
                  console.log("All fonts loaded according to Font Loading API");
                }).catch(function(err) {
                  console.error("Font loading error:", err);
                });
              }, 2000);
            });
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
