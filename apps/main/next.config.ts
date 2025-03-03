/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Ensures Next.js generates static files for Amplify
  distDir: "out", // Forces Next.js to output to "out/"
  trailingSlash: true, // Ensures routing works correctly
  images: {
    unoptimized: true, // Prevents Next.js Image Optimization (Amplify doesn't support it)
  }
}

export default nextConfig
