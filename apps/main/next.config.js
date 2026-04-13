import path from "path"
import { fileURLToPath } from "url"
import createNextIntlPlugin from "next-intl/plugin" 

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const withNextIntl = createNextIntlPlugin("./i18n/request.ts")

/** @type {import("next").NextConfig} */
const nextConfig = {
  output: "export",

  transpilePackages: [
    "@repo/map",
    "@repo/state",
    "@repo/viz",
    "@repo/ui",
    "@repo/motion",
    "@repo/scrollytelling",
    "@repo/i18n",
    "@repo/data",
  ],

  images: {
    unoptimized: true,
  },

  // Turbopack loader rules (Next 15.3+)
  turbopack: {
    rules: {
      "*.geojson": {
        loaders: [path.join(__dirname, "geojson-loader.cjs")],
        as: "*.js",
      },
    },
  },

  experimental: {
    optimizePackageImports: ["@mui/icons-material", "@mui/material", "d3"],
  },

  // Webpack rule (used when you run with --webpack, and for non-turbo tooling paths)
  webpack: (config) => {
    config.module.rules.push({
      test: /\.geojson$/,
      type: "json",
    })
    return config
  },
}

export default withNextIntl(nextConfig)
