import path from "path"
import type { NextConfig } from "next"

const geojsonLoaderPath = path.resolve(process.cwd(), "./geojson-loader.cjs")

const nextConfig: NextConfig = {
  output: "export",

  transpilePackages: [
    "@repo/map",
    "@repo/state",
    "@repo/viz",
    "@repo/ui",
    "@repo/motion",
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
        loaders: [geojsonLoaderPath],
        as: "*.js",
      },
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },

  // Webpack rule (used when you run with --webpack, and for non-turbo tooling paths)
  webpack: (config) => {
    const fileLoaderRule = config.module.rules.find(
      (rule: { test?: { test?: (value: string) => boolean } }) =>
        rule.test?.test?.(".svg"),
    )

    if (fileLoaderRule) {
      fileLoaderRule.exclude = /\.svg$/i
    }

    config.module.rules.push({
      test: /\.geojson$/,
      type: "json",
    })
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ["@svgr/webpack"],
    })
    return config
  },
}

export default nextConfig
