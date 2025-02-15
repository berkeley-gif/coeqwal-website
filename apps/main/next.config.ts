import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  i18n: {
    locales: ['en', 'es'],
    defaultLocale: 'en'
  },
  transpilePackages: ["@repo/i18n"] // ensures NextJS compiles the shared 'next-intl' package
}

export default nextConfig
