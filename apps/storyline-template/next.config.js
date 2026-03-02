/** @type {import('next').NextConfig} */
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
  ],

  images: {
    unoptimized: true,
  },
}

export default nextConfig
