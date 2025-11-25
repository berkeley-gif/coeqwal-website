/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // Enable static export
  
  // Transpile workspace packages for optimal dev experience
  transpilePackages: [
    "@repo/map",
    "@repo/state",
    "@repo/viz",
    "@repo/ui",
    "@repo/motion",
    "@repo/i18n",
  ],
  
  images: {
    unoptimized: true, // Required for static export
  },
}

export default nextConfig
