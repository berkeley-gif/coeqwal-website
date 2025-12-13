import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {import('next').NextConfig} */
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

  images: { unoptimized: true },

  turbopack: {
    rules: {
      "*.geojson": {
        loaders: [path.join(__dirname, "geojson-loader.cjs")],
        as: "*.js",
      },
    },
  },

  experimental: {
    optimizePackageImports: ["@mui/icons-material", "@mui/material"],
  },

  webpack: (config) => {
    config.module.rules.push({
      test: /\.geojson$/,
      type: "json",
    });
    return config;
  },
};

export default nextConfig