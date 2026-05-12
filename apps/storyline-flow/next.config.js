import path from "path"

const geojsonLoaderPath = path.resolve(process.cwd(), "./geojson-loader.cjs")

/** @type {import("next").NextConfig} */
const nextConfig = {
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
    },
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
