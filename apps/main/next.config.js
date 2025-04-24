/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    images: {
      unoptimized: true, // Disable image optimization to reduce build memory usage
    },
  }

export default nextConfig;
