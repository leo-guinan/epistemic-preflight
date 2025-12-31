/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Exclude pdfjs-dist from server-side bundle
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('pdfjs-dist');
    }
    return config;
  },
};

export default nextConfig;

