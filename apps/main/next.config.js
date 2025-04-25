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
    "@repo/eslint-config",
    "@repo/typescript-config"
  ],
  images: {
    unoptimized: true  // Required for static export
  }
}

export default nextConfig