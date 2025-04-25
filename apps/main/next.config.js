/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
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
  // Enable all optimizations but keep SSR approach
  experimental: {
    serverActions: true,
  }
}

export default nextConfig