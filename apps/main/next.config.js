/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove swcMinify as it's no longer recognized in Next.js 15
  transpilePackages: [
    "@repo/map",
    "@repo/state",
    "@repo/viz",
    "@repo/ui",
    "@repo/motion",
    "@repo/i18n",
    "@repo/eslint-config",
    "@repo/typescript-config"
  ]
}

export default nextConfig