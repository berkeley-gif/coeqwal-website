/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Enable static export
  transpilePackages: [
    "@repo/map",
    "@repo/state",
    "@repo/viz",
    "@repo/ui",
    "@repo/motion",
    "@repo/i18n",
    "@repo/data",
    "@repo/eslint-config",
    "@repo/typescript-config"
  ],
  images: {
    unoptimized: true  // Required for static export
  },
  // Webpack configuration for .geojson files (only used in production builds until Turbopack is ready for production)
  webpack: (config) => {
    config.module.rules.push({
      test: /\.geojson$/,
      type: 'json'
    })
    return config
  }
}

export default nextConfig