import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Enable static export
  
  // Transpile workspace packages for optimal dev experience
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
    unoptimized: true  // Required for static export
  },
  
  // Turbopack configuration for .geojson files
  experimental: {
    turbo: {
      rules: {
        "*.geojson": {
          loaders: [path.join(__dirname, "geojson-loader.cjs")],
          as: "*.js",
        },
      },
    },
  },
}

export default nextConfig