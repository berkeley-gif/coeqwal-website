import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {import("next").NextConfig} */
const nextConfig = {
  output: "export",

  // Emit directory-style pages (explore/index.html, not explore.html) so the
  // static host serves the trailing-slash form of every URL. The host
  // redirects the slash-less form to the slash form and forwards query
  // strings, so both shapes of every deep link resolve. Before this,
  // /explore/, /learn/, /data/ and /about/ all returned 404 in production.
  trailingSlash: true,

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
    optimizePackageImports: [
      "@mui/icons-material",
      "@mui/material",
      "d3",
      "@repo/map",
      "@repo/viz"
    ],
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

export default nextConfig
