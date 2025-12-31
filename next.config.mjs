/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exclude pdfjs-dist from server-side bundle (Turbopack compatible)
  serverExternalPackages: ['pdfjs-dist'],
  // Turbopack configuration
  turbopack: {
    // Additional Turbopack config if needed
  },
};

export default nextConfig;

