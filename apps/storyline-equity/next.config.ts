import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "export",
  transpilePackages: ["@repo/motion", "@repo/scrollytelling", "@repo/ui"],
  images: {
    unoptimized: true,
  },
}

export default nextConfig
