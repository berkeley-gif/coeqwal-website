import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter'
import ThemeRegistry from '@repo/ui/themes/ThemeRegistry';
import type { Metadata } from "next"
import "./globals.css";

export const metadata: Metadata = {
  title: "COEQWAL",
  description: "Find alternative California water solutions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider>
          <ThemeRegistry>
            {children}
          </ThemeRegistry>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
